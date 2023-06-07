import { Octokit } from '@octokit/core';
export declare function updateStatusCheck(octokit: Octokit, checkID: number, owner: string, repo: string, status: undefined, conclusion: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out' | undefined, message: string): Promise<void>;
export declare function getFailedMessage(error: string[]): string;
export declare function getSuccessMessage(message: string[]): string;
export declare function setLabels(octokit: Octokit, owner: string, repo: string, issueNumber: number, labels: string[]): Promise<void>;
export declare function removeLabel(octokit: Octokit, owner: string, repo: string, issueNumber: number, label: string): Promise<void>;
