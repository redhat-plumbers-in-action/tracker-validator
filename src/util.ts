import { debug } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/core';

import { ValidationError } from './error';
// import { Endpoints } from '@octokit/types';

// Update check run - check completed + conclusion
// https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
// ! Allow specifying workflow run when creating a checkrun from a GitHub workflow
// !FIXME: Issue - https://github.com/orgs/community/discussions/14891#discussioncomment-6110666
// !FIXME: Issue - https://github.com/orgs/community/discussions/24616
export async function updateStatusCheck(
  octokit: Octokit,
  checkID: number,
  // https://github.com/octokit/types.ts/issues/283#issuecomment-1579239229
  // Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['status']
  status: undefined,
  // https://github.com/octokit/types.ts/issues/283#issuecomment-1579239229
  // Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['conclusion']
  conclusion:
    | 'action_required'
    | 'cancelled'
    | 'failure'
    | 'neutral'
    | 'success'
    | 'skipped'
    | 'stale'
    | 'timed_out'
    | undefined,
  message: string
) {
  await octokit.request(
    'PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}',
    {
      ...context.repo,
      check_run_id: checkID,
      status,
      completed_at: new Date().toISOString(),
      conclusion,
      output: {
        title: 'Tracker Validator',
        summary: message,
      },
    }
  );
}

export function getFailedMessage(error: string[]): string {
  if (error.length === 0) {
    return '';
  }

  return '#### Failed' + '\n\n' + error.join('\n');
}

export function getSuccessMessage(message: string[]): string {
  if (message.length === 0) {
    return '';
  }

  return '#### Success' + '\n\n' + message.join('\n');
}

export function getTipMessage(tip: string[]): string {
  if (tip.length === 0) {
    return '';
  }

  return '> [!TIP]' + '\n>\n' + tip.map(t => `> ${t}`).join('\n');
}

export async function setLabels(
  octokit: Octokit,
  issueNumber: number,
  labels: string[]
) {
  if (labels.length === 0) {
    debug('No labels to set');
    return;
  }

  await octokit.request(
    'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
    {
      ...context.repo,
      issue_number: issueNumber,
      labels,
    }
  );
}

export async function removeLabel(
  octokit: Octokit,
  issueNumber: number,
  label: string
) {
  await octokit.request(
    'DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}',
    {
      ...context.repo,
      issue_number: issueNumber,
      name: label,
    }
  );
}

export function raise(error: string): never {
  throw new ValidationError(error);
}

export async function getTitle(octokit: Octokit, issueNumber: number) {
  return (
    await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      ...context.repo,
      pull_number: issueNumber,
    })
  ).data.title;
}

export function isTrackerInTitle(title: string, tracker: string): boolean {
  const regexp = new RegExp(`^\\(${tracker}\\) .*$`, 'm');
  return regexp.test(title);
}

// Get current title without any old tracker references
export function getCurrentTitle(title: string): string {
  const onlyTitle = /^(\(\S+\)) (.*)$/m;

  const match = title.match(onlyTitle);
  return match ? match[2] : title;
}

export async function setTitle(
  octokit: Octokit,
  issueNumber: number,
  tracker: string,
  trackerType: 'bugzilla' | 'jira'
): Promise<string> {
  const currentTitle = await getTitle(octokit, issueNumber);

  const hash = trackerType === 'bugzilla' ? '#' : '';
  if (isTrackerInTitle(currentTitle, `${hash}${tracker}`)) {
    return `Title already contains tracker ${tracker}`;
  }

  const newTitle = `(${hash}${tracker}) ${getCurrentTitle(currentTitle)}`;

  await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
    ...context.repo,
    issue_number: issueNumber,
    title: newTitle,
  });

  return `Set title to '${newTitle}'`;
}
