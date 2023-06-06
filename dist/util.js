// import { Endpoints } from '@octokit/types';
// Update check run - check completed + conclusion
// https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
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
//# sourceMappingURL=util.js.map