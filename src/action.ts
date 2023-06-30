import { debug, getInput, warning } from '@actions/core';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/core';
import { z } from 'zod';

import { Bugzilla } from './bugzilla';
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

  const bzTracker = z.coerce.number().parse(getInput('tracker'));
  const bzTrackerURL = `${bzInstance}/show_bug.cgi?id=${bzTracker}`;
  const product = getInput('product');
  const component = getInput('component', { required: true });

  const bugDetails = await bugzilla.api
    .getBugs([bzTracker])
    .include(['id', 'summary', 'product', 'component', 'flags']);

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

  if (!Bugzilla.isMatchingProduct(product, bugDetails[0])) {
    labels.add.push('bz/invalid-product');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has product \`${bugDetails[0].product}\` but desired product is \`${product}\``
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
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has set desired product: \`${product}\``
    );
  }

  if (!Bugzilla.isMatchingComponent(component, bugDetails[0])) {
    labels.add.push('bz/invalid-component');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has component \`${bugDetails[0].component[0]}\` but desired component is \`${component}\``
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
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has set desired component: \`${component}\``
    );
  }

  if (!Bugzilla.isApproved(bugDetails[0].flags)) {
    labels.add.push('bz/unapproved');
    err.push(
      `🔴 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has not been approved`
    );
  } else {
    if (labelsFromPR.includes('bz/unapproved')) {
      removeLabel(octokit, owner, repo, prMetadata.number, 'bz/unapproved');
    }
    message.push(
      `🟢 Bugzilla tracker [#${bzTracker}](${bzTrackerURL}) has been approved`
    );
  }

  warning('Adding external bug ...');
  const jsonrpc = await fetch(`${bzInstance}/jsonrpc.cgi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bzAPIToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '1.0',
      method: 'ExternalBugs.add_external_bug',
      params: [
        {
          bug_ids: [2013411],
          external_bugs: [
            {
              ext_type_url: 'https://github.com/',
              ext_bz_bug_id: `${owner}/${repo}/pull/${prMetadata.number}`,
            },
          ],
        },
      ],
      id: 'identifier',
    }),
  });
  warning(`jsonrpc: ${JSON.stringify(jsonrpc)}`);

  // TODO: Update Bugzilla status to POST
  warning('Setting see_also ...');
  let response = await bugzilla.api.updateBug(bzTracker, {
    ids: [bzTracker],
    id_or_alias: bzTracker,
    status: 'POST',
  });

  warning(`see_also: ${JSON.stringify(response)}`);

  // TODO: Once validated update Tracker status and add/update comment in PR

  setLabels(octokit, owner, repo, prMetadata.number, labels.add);

  if (err.length > 0) {
    throw new Error(
      getFailedMessage(err) + '\n\n' + getSuccessMessage(message)
    );
  }

  return getSuccessMessage(message);
}

export default action;
