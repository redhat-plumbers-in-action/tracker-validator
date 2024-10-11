import { getBooleanInput, getInput, setFailed, setOutput } from '@actions/core';
import { context } from '@actions/github';
import '@total-typescript/ts-reset';
import action from './action';
import { pullRequestMetadataSchema } from './schema/input';
import { getOctokit } from './octokit';
import { updateStatusCheck } from './util';
import { ValidationError } from './error';
const octokit = getOctokit(getInput('token', { required: true }));
const prMetadataUnsafe = JSON.parse(getInput('pr-metadata', { required: true }));
const prMetadata = pullRequestMetadataSchema.parse(prMetadataUnsafe);
const commitSha = prMetadata.ref;
const setStatus = getBooleanInput('set-status', { required: true });
let checkRunID;
if (setStatus) {
    checkRunID = (await octokit.request('POST /repos/{owner}/{repo}/check-runs', Object.assign(Object.assign({}, context.repo), { name: 'Tracker Validator', head_sha: commitSha, status: 'in_progress', started_at: new Date().toISOString(), output: {
            title: 'Tracker Validator',
            summary: 'Tracker validation in progress ...',
        } }))).data.id;
}
const statusTitle = getInput('status-title', { required: true });
try {
    let message = await action(octokit, prMetadata);
    if (setStatus && checkRunID) {
        await updateStatusCheck(octokit, checkRunID, 'completed', 'success', message);
    }
    if (statusTitle.length > 0) {
        message = `### ${statusTitle}\n\n${message}`;
    }
    setOutput('status', JSON.stringify(message));
}
catch (error) {
    let message;
    if (error instanceof Error) {
        message = error.message;
    }
    else {
        message = JSON.stringify(error);
    }
    if (setStatus && checkRunID) {
        await updateStatusCheck(octokit, checkRunID, 'completed', 'failure', message);
    }
    if (statusTitle.length > 0) {
        message = `### ${statusTitle}\n\n${message}`;
    }
    // set status output only if error was thrown by us
    if (error instanceof ValidationError) {
        setOutput('status', JSON.stringify(message));
    }
    setFailed(message);
}
//# sourceMappingURL=main.js.map