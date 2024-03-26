import { CustomOctokit } from './octokit';
import { PullRequestMetadata } from './schema/input';
declare function action(octokit: CustomOctokit, prMetadata: PullRequestMetadata): Promise<string>;
export default action;
