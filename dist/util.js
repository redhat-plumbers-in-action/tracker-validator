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
            title: 'Tracker Validation',
            summary: message,
        },
    });
}
export function getFailedMessage(error) {
    if (error.length === 0) {
        return '';
    }
    return '### Failed' + '\n\n' + error.join('\n');
}
export function getSuccessMessage(message) {
    if (message.length === 0) {
        return '';
    }
    return '### Success' + '\n\n' + message.join('\n');
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
//# sourceMappingURL=util.js.map