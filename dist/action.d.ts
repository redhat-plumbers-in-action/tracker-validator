import { Octokit } from '@octokit/core';
import { PullRequestMetadata } from './schema/input';
declare function action(octokit: Octokit, owner: string, repo: string, prMetadata: PullRequestMetadata): Promise<string>;
export default action;
