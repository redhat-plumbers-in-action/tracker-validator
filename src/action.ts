import { debug, getInput, notice } from '@actions/core';
import { Octokit } from '@octokit/core';
import { z } from 'zod';

import { Bugzilla } from './bugzilla';
import { Controller } from './controller';
import { Jira } from './jira';
import { PullRequestMetadata } from './schema/input';
import {
  getFailedMessage,
  getSuccessMessage,
  raise,
  removeLabel,
  setLabels,
} from './util';

async function action(
  octokit: Octokit,
  owner: string,
  repo: string,
  prMetadata: PullRequestMetadata
): Promise<string> {
  const trackerType = getInput('tracker-type', { required: true });

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
      raise(`Unknown tracker type: '${trackerType}'`);
  }

  let message: string[] = [];
  let err: string[] = [];
  let labels: { add: string[]; remove: string[] } = { add: [], remove: [] };

  const labelsFromPR = z
    .array(z.object({ name: z.string() }).transform(label => label.name))
    .parse(
      (
        await octokit.request(
          'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
          {
            owner,
            repo,
            issue_number: prMetadata.number,
          }
        )
      ).data
    );

  const tracker = getInput('tracker', { required: true });

  const issueDetails = await trackerController.adapter.getIssueDetails(tracker);

  const product = getInput('product');

  if (!trackerController.adapter.isMatchingProduct(product)) {
    labels.add.push('bz/invalid-product');
    err.push(
      `🔴 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has product \`${
        issueDetails.product
      }\` but desired product is \`${product}\``
    );
  } else {
    if (labelsFromPR.includes('bz/invalid-product')) {
      removeLabel(
        octokit,
        owner,
        repo,
        prMetadata.number,
        'bz/invalid-product'
      );
    }
    message.push(
      `🟢 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has set desired product: \`${product}\``
    );
  }

  const component = getInput('component', { required: true });

  if (!trackerController.adapter.isMatchingComponent(component)) {
    labels.add.push('bz/invalid-component');
    err.push(
      `🔴 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has component \`${
        issueDetails.component
      }\` but desired component is \`${component}\``
    );
  } else {
    if (labelsFromPR.includes('bz/invalid-component')) {
      removeLabel(
        octokit,
        owner,
        repo,
        prMetadata.number,
        'bz/invalid-component'
      );
    }
    message.push(
      `🟢 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has set desired component: \`${component}\``
    );
  }

  if (!trackerController.adapter.isApproved()) {
    labels.add.push('bz/unapproved');
    err.push(
      `🔴 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has not been approved`
    );
  } else {
    if (labelsFromPR.includes('bz/unapproved')) {
      removeLabel(octokit, owner, repo, prMetadata.number, 'bz/unapproved');
    }
    message.push(
      `🟢 Bugzilla tracker ${trackerController.adapter.getMarkdownUrl()} has been approved`
    );
  }

  const linkMessage = await trackerController.adapter.addLink(
    'https://github.com/',
    `${owner}/${repo}/pull/${prMetadata.number}`
  );
  notice(`🔗 ${linkMessage}`);

  const stateMessage = await trackerController.adapter.changeState();
  notice(`🎺 ${stateMessage}`);

  // TODO: Once validated update Tracker status and add/update comment in PR

  setLabels(octokit, owner, repo, prMetadata.number, labels.add);

  if (err.length > 0) {
    raise(getFailedMessage(err) + '\n\n' + getSuccessMessage(message));
  }

  return getSuccessMessage(message);
}

export default action;
