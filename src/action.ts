import { debug, getInput } from '@actions/core';
import { z } from 'zod';

import { Bugzilla } from './bugzilla';
import { Octokit } from '@octokit/core';
import { PullRequestMetadata } from './schema/input';
import {
  getFailedMessage,
  getSuccessMessage,
  removeLabel,
  setLabels,
} from './util';

async function action(
  octokit: Octokit,
  owner: string,
  repo: string,
  prMetadata: PullRequestMetadata
): Promise<string> {
  const bzInstance = getInput('bugzilla-instance', { required: true });
  const bzAPIToken = getInput('bugzilla-api-token', { required: true });

  const bugzilla = new Bugzilla(bzInstance, bzAPIToken);
  debug(
    `Using Bugzilla '${bzInstance}', version: '${await bugzilla.api.version()}'`
  );

  const bzTracker = z.coerce.number().parse(getInput('bugzilla-tracker'));
  const bzTrackerURL = `${bzInstance}/show_bug.cgi?id=${bzTracker}`;
  const product = getInput('product');
  const component = getInput('component', { required: true });

  const bugDetails = await bugzilla.api
    .getBugs([bzTracker])
    .include(['id', 'summary', 'product', 'component', 'flags']);

  let message: string[] = [];
  let err: string[] = [];
  let labels: { add: string[]; remove: string[] } = { add: [], remove: [] };

  if (!Bugzilla.isMatchingProduct(product, bugDetails[0])) {
    labels.add.push('bz/invalid-product');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has product \`${bugDetails[0].product}\` but desired product is \`${product}\``
    );
  } else {
    removeLabel(octokit, owner, repo, prMetadata.number, 'bz/invalid-product');
    message.push(
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has set desired product: \`${product}\``
    );
  }

  if (!Bugzilla.isMatchingComponent(component, bugDetails[0])) {
    labels.add.push('bz/invalid-component');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has component \`${bugDetails[0].component[0]}\` but desired component is \`${component}\``
    );
  } else {
    removeLabel(
      octokit,
      owner,
      repo,
      prMetadata.number,
      'bz/invalid-component'
    );
    message.push(
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has set desired component: \`${component}\``
    );
  }

  if (!Bugzilla.isApproved(bugDetails[0].flags)) {
    labels.add.push('bz/unapproved');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has not been approved`
    );
  } else {
    removeLabel(octokit, owner, repo, prMetadata.number, 'bz/unapproved');
    message.push(
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has been approved`
    );
  }

  // TODO: Once validated update Tracker status and add comment/attachment with link to PR

  setLabels(octokit, owner, repo, prMetadata.number, labels.add);

  if (err.length > 0) {
    throw new Error(
      getFailedMessage(err) + '\n\n' + getSuccessMessage(message)
    );
  }

  return getSuccessMessage(message);
}

export default action;
