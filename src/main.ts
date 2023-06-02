import { getInput, setFailed } from '@actions/core';

import '@total-typescript/ts-reset';

import action from './action';
import { Octokit } from '@octokit/core';
import { z } from 'zod';
import { pullRequestMetadataSchema } from './schema/input';
import { updateStatusCheck } from './util';

const octokit = new Octokit({
  auth: getInput('token', { required: true }),
});

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

const checkRunID = (
  await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
    owner,
    repo,
    name: 'Tracker Validation',
    head_sha: commitSha,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    output: {
      title: 'Tracker Validation',
      summary: 'Tracker validation in progress ...',
    },
  })
).data.id;

try {
  const message = await action(octokit, owner, repo, prMetadata);

  await updateStatusCheck(
    octokit,
    checkRunID,
    owner,
    repo,
    'completed' as unknown as undefined,
    'success',
    message
  );
} catch (error) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
    message = JSON.stringify(error);
  }

  setFailed(message);
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
