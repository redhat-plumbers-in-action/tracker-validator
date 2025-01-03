import { debug, error, getInput, notice } from '@actions/core';
import { context } from '@actions/github';
import { z } from 'zod';

import { Bugzilla } from './bugzilla';
import { Config } from './config';
import { Controller, IssueDetails } from './controller';
import { Jira } from './jira';
import { CustomOctokit } from './octokit';

import { PullRequestMetadata } from './schema/input';
import {
  getFailedMessage,
  getSuccessMessage,
  getTipMessage,
  raise,
  removeLabel,
  setLabels,
  setTitle,
} from './util';

async function action(
  octokit: CustomOctokit,
  prMetadata: PullRequestMetadata
): Promise<string> {
  const trackerType = getInput('tracker-type', { required: true });
  const config = await Config.getConfig(octokit);

  let trackerController: Controller<Bugzilla | Jira>;

  switch (trackerType) {
    case 'bugzilla':
      const bzInstance = getInput('bugzilla-instance', { required: true });
      const bzAPIToken = getInput('bugzilla-api-token', { required: true });

      trackerController = new Controller(new Bugzilla(bzInstance, bzAPIToken));
      debug(
        `Using Bugzilla '${bzInstance}', version: '${await trackerController.adapter.getVersion()}'`
      );
      break;

    case 'jira':
      const jiraInstance = getInput('jira-instance', { required: true });
      const jiraAPIToken = getInput('jira-api-token', { required: true });

      trackerController = new Controller(new Jira(jiraInstance, jiraAPIToken));
      debug(
        `Using Jira '${jiraInstance}', version: '${await trackerController.adapter.getVersion()}'`
      );
      break;

    default:
      setLabels(octokit, prMetadata.number, [config.labels['missing-tracker']]);
      raise(
        `🔴 Missing tracker or Unknown tracker type; type: '${trackerType}'`
      );
  }

  let message: string[] = [];
  let err: string[] = [];
  let tip: string[] = [];
  let labels: { add: string[]; remove: string[] } = { add: [], remove: [] };

  const labelsFromPR = z
    .array(z.object({ name: z.string() }).transform(label => label.name))
    .parse(
      (
        await octokit.request(
          'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
          {
            ...context.repo,
            issue_number: prMetadata.number,
          }
        )
      ).data
    );

  const tracker = getInput('tracker', { required: true });

  let issueDetails: IssueDetails;

  try {
    issueDetails = await trackerController.adapter.getIssueDetails(tracker);

    if (labelsFromPR.includes(config.labels['missing-tracker'])) {
      removeLabel(octokit, prMetadata.number, config.labels['missing-tracker']);
    }
  } catch (e) {
    setLabels(octokit, prMetadata.number, [config.labels['missing-tracker']]);

    error(`getIssueDetails(${tracker}): ${e}`);
    raise(
      `🔴 Tracker '${tracker}' does not exist on ${trackerController.adapter.instance}`
    );
  }

  const titleResult = await setTitle(
    octokit,
    prMetadata.number,
    tracker,
    trackerType
  );
  notice(`🔤 ${titleResult}`);

  const isMatchingProduct = trackerController.adapter.isMatchingProduct(
    config.products
  );
  if (!isMatchingProduct) {
    labels.add.push(config.labels['invalid-product']);
    err.push(
      `🔴 Tracker ${trackerController.adapter.getMarkdownUrl()} has product \`${
        issueDetails.product
      }\` but desired product is one of \`${config.products}\``
    );
  } else {
    if (labelsFromPR.includes(config.labels['invalid-product'])) {
      removeLabel(octokit, prMetadata.number, config.labels['invalid-product']);
    }

    // Set base branch as label if it is not main or master (rhel-9.0.0, rhel-8.5.0, rhel-7.9, etc.)
    if (
      prMetadata.base != 'main' &&
      prMetadata.base != 'master' &&
      !labelsFromPR.includes(prMetadata.base)
    ) {
      labels.add.push(prMetadata.base);
    }

    message.push(
      `🟢 Tracker ${trackerController.adapter.getMarkdownUrl()} has set desired product: \`${
        issueDetails.product
      }\``
    );
  }

  const component = getInput('component', { required: true });

  const isMatchingComponent =
    trackerController.adapter.isMatchingComponent(component);
  if (!isMatchingComponent) {
    labels.add.push(config.labels['invalid-component']);
    err.push(
      `🔴 Tracker ${trackerController.adapter.getMarkdownUrl()} has component \`${
        issueDetails.component
      }\` but desired component is \`${component}\``
    );
  } else {
    if (labelsFromPR.includes(config.labels['invalid-component'])) {
      removeLabel(
        octokit,
        prMetadata.number,
        config.labels['invalid-component']
      );
    }
    message.push(
      `🟢 Tracker ${trackerController.adapter.getMarkdownUrl()} has set desired component: \`${component}\``
    );
  }

  if (!trackerController.adapter.isApproved()) {
    labels.add.push(config.labels.unapproved);
    err.push(
      `🔴 Tracker ${trackerController.adapter.getMarkdownUrl()} has not been approved`
    );
    tip.push(`🔵 ${trackerController.adapter.tips.approval}`);
  } else {
    if (labelsFromPR.includes(config.labels.unapproved)) {
      removeLabel(octokit, prMetadata.number, config.labels.unapproved);
    }
    message.push(
      `🟢 Tracker ${trackerController.adapter.getMarkdownUrl()} has been approved`
    );
  }

  const isSeveritySet = trackerController.adapter.isSeveritySet();
  if (
    !isSeveritySet &&
    trackerController.adapter.issueDetails?.type === 'Story'
  ) {
    message.push(
      `🟠 Tracker ${trackerController.adapter.getMarkdownUrl()} is missing severity, but it is of type Story`
    );
  } else if (!isSeveritySet) {
    labels.add.push(config.labels['missing-severity']);
    err.push(
      `🔴 Tracker ${trackerController.adapter.getMarkdownUrl()} is missing severity`
    );
  } else {
    if (labelsFromPR.includes(config.labels['missing-severity'])) {
      removeLabel(
        octokit,
        prMetadata.number,
        config.labels['missing-severity']
      );
    }
    message.push(
      `🟢 Tracker ${trackerController.adapter.getMarkdownUrl()} has set severity`
    );
  }

  if (isMatchingProduct && isMatchingComponent && isSeveritySet) {
    const linkMessage = await trackerController.adapter.addLink(
      'https://github.com/',
      `${context.repo.owner}/${context.repo.repo}/pull/${prMetadata.number}`
    );
    notice(`🔗 ${linkMessage}`);

    const stateMessage = await trackerController.adapter.changeState();
    notice(`🎺 ${stateMessage}`);
  }

  // TODO: Once validated update Tracker status and add/update comment in PR

  setLabels(octokit, prMetadata.number, labels.add);

  if (err.length > 0) {
    raise(
      getFailedMessage(err) +
        '\n\n' +
        getSuccessMessage(message) +
        '\n\n' +
        getTipMessage(tip)
    );
  }

  return getSuccessMessage(message);
}

export default action;
