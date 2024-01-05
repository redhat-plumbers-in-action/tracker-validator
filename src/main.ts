import { getBooleanInput, getInput, setFailed, setOutput } from '@actions/core';
import { Endpoints } from '@octokit/types';
import { z } from 'zod';

import '@total-typescript/ts-reset';

import action from './action';
import { pullRequestMetadataSchema } from './schema/input';
import { getOctokit } from './octokit';
import { updateStatusCheck } from './util';
import { ValidationError } from './error';

const octokit = getOctokit(getInput('token', { required: true }));

const owner = z
  .string()
  .min(1)
  .parse(process.env.GITHUB_REPOSITORY?.split('/')[0]);
const repo = z
  .string()
  .min(1)
  .parse(process.env.GITHUB_REPOSITORY?.split('/')[1]);

const prMetadataUnsafe = JSON.parse(
  getInput('pr-metadata', { required: true })
);

const prMetadata = pullRequestMetadataSchema.parse(prMetadataUnsafe);
const commitSha = prMetadata.commits[prMetadata.commits.length - 1].sha;

const setStatus = getBooleanInput('set-status', { required: true });
let checkRunID:
  | Endpoints['POST /repos/{owner}/{repo}/check-runs']['response']['data']['id']
  | undefined;

if (setStatus) {
  checkRunID = (
    await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
      owner,
      repo,
      name: 'Tracker Validator',
      head_sha: commitSha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      output: {
        title: 'Tracker Validator',
        summary: 'Tracker validation in progress ...',
      },
    })
  ).data.id;
}

try {
  let message = await action(octokit, owner, repo, prMetadata);
  const statusTitle = getInput('status-title', { required: true });

  if (setStatus && checkRunID) {
    await updateStatusCheck(
      octokit,
      checkRunID,
      owner,
      repo,
      'completed' as unknown as undefined,
      'success',
      message
    );
  }

  if (statusTitle.length > 0) {
    message = `### ${statusTitle}\n\n${message}`;
  }
  setOutput('status', JSON.stringify(message, null, 2));
} catch (error) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
    message = JSON.stringify(error);
  }

  // set status output only if error was thrown by us
  if (error instanceof ValidationError) {
    setOutput('status', JSON.stringify(message));
  } else {
    setFailed(message);
  }

  if (setStatus && checkRunID) {
    await updateStatusCheck(
      octokit,
      checkRunID,
      owner,
      repo,
      'completed' as unknown as undefined,
      'failure',
      message
    );
  }
}
