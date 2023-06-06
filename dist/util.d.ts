import { Octokit } from '@octokit/core';
export declare function updateStatusCheck(octokit: Octokit, checkID: number, owner: string, repo: string, status: undefined, conclusion: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out' | undefined, message: string): Promise<void>;
