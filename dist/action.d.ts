import { CustomOctokit } from './octokit';
import { PullRequestMetadata } from './schema/input';
declare function action(octokit: CustomOctokit, owner: string, repo: string, prMetadata: PullRequestMetadata): Promise<string>;
export default action;
