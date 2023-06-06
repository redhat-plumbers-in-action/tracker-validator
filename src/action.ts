import { debug, getInput, setFailed } from '@actions/core';
import { z } from 'zod';

import { Bugzilla } from './bugzilla';
import { Octokit } from '@octokit/core';
import { PullRequestMetadata } from './schema/input';

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

  // TODO: improve error message
  const bzTracker = z.coerce.number().parse(getInput('bugzilla-tracker'));
  const product = getInput('product');
  const component = getInput('component', { required: true });
  let message = '';

  const bugDetails = await bugzilla.api
    .getBugs([bzTracker])
    .include(['id', 'summary', 'product', 'component', 'flags']);

  if (!Bugzilla.isMatchingProduct(product, bugDetails[0])) {
    // todo set label, set status, update summary comment
    const err = `Bugzilla tracker ${bzTracker} has product '${bugDetails[0].product}' but desired product is '${product}'`;
    throw new Error(err);
  }
  message += `✅ Bugzilla tracker ${bzTracker} has set desired product: '${product}'\n`;

  if (!Bugzilla.isMatchingComponent(component, bugDetails[0])) {
    // todo set label, set status, update summary comment
    const err = `Bugzilla tracker ${bzTracker} has component '${bugDetails[0].component[0]}' but desired component is '${component}'`;
    throw new Error(err);
  }
  message += `✅ Bugzilla tracker ${bzTracker} has set desired component: '${component}'\n`;

  if (!Bugzilla.isApproved(bugDetails[0].flags)) {
    // todo set label, set status, update summary comment
    const err = `Bugzilla tracker ${bzTracker} has not been approved`;
    throw new Error(err);
  }
  message += `✅ Bugzilla tracker ${bzTracker} has been approved\n`;

  // check release
  // TODO: check release or at lease product RHEL 7, 8, 9, etc.
  // TODO: Once validated update Tracker status and add comment/attachment with link to PR

  return message;
}

export default action;
