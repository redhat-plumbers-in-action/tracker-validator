import { debug } from '@actions/core';
// import { Endpoints } from '@octokit/types';
// Update check run - check completed + conclusion
// https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
// ! Allow specifying workflow run when creating a checkrun from a GitHub workflow
// !FIXME: Issue - https://github.com/orgs/community/discussions/14891#discussioncomment-6110666
// !FIXME: Issue - https://github.com/orgs/community/discussions/24616
export async function updateStatusCheck(octokit, checkID, owner, repo, 
// https://github.com/octokit/types.ts/issues/283#issuecomment-1579239229
// Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['status']
status, 
// https://github.com/octokit/types.ts/issues/283#issuecomment-1579239229
// Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['conclusion']
conclusion, message) {
    await octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
        owner,
        repo,
        check_run_id: checkID,
        status,
        completed_at: new Date().toISOString(),
        conclusion,
        output: {
            title: 'Tracker Validator',
            summary: message,
        },
    });
}
export function getFailedMessage(error) {
    if (error.length === 0) {
        return '';
    }
    return '#### Failed' + '\n\n' + error.join('\n');
}
export function getSuccessMessage(message) {
    if (message.length === 0) {
        return '';
    }
    return '#### Success' + '\n\n' + message.join('\n');
}
export async function setLabels(octokit, owner, repo, issueNumber, labels) {
    if (labels.length === 0) {
        debug('No labels to set');
        return;
    }
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
        owner,
        repo,
        issue_number: issueNumber,
        labels,
    });
}
export async function removeLabel(octokit, owner, repo, issueNumber, label) {
    await octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
    });
}
export function raise(error) {
    throw new Error(error);
}
export async function getTitle(octokit, owner, repo, issueNumber) {
    return (await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner,
        repo,
        pull_number: issueNumber,
    })).data.title;
}
export function isTrackerInTitle(title, tracker) {
    const regexp = new RegExp(`^\\(${tracker}\\) .*$`, 'm');
    return regexp.test(title);
}
// Get current title without any old tracker references
export function getCurrentTitle(title) {
    const onlyTitle = /^(\(\S+\)) (.*)$/m;
    const match = title.match(onlyTitle);
    return match ? match[2] : title;
}
export async function setTitle(octokit, owner, repo, issueNumber, tracker, trackerType) {
    const currentTitle = await getTitle(octokit, owner, repo, issueNumber);
    const hash = trackerType === 'bugzilla' ? '#' : '';
    if (isTrackerInTitle(currentTitle, `${hash}${tracker}`)) {
        return `Title already contains tracker ${tracker}`;
    }
    const newTitle = `(${hash}${tracker}) ${getCurrentTitle(currentTitle)}`;
    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
        owner,
        repo,
        issue_number: issueNumber,
        title: newTitle,
    });
    return `Set title to '${newTitle}'`;
}
//# sourceMappingURL=util.js.map