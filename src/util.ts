import { Context } from 'probot';

import { events } from './events';

export async function updateStatusCheck(
  context: Context<(typeof events.workflow_run)[number]>,
  checkID: number,
  status: 'in_progress' | 'completed',
  conclusion:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'timed_out'
    | 'action_required',
  message: string
) {
  return context.octokit.checks.update(
    context.repo({
      check_run_id: checkID,
      status,
      completed_at: new Date().toISOString(),
      conclusion,
      output: {
        title: 'Tracker Validation',
        summary: message,
      },
    })
  );
}
