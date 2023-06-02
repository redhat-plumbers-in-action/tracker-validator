import { debug, getInput, setFailed } from '@actions/core';
import { z } from 'zod';
import { events } from './events';
import { Bugzilla } from './bugzilla';
import { pullRequestMetadataSchema } from './schema/input';
import { updateStatusCheck } from './util';
const action = (probot) => {
    try {
        probot.on(events.workflow_run, async (context) => {
            const prMetadataUnsafe = JSON.parse(getInput('pr-metadata', { required: true }));
            const bzInstance = getInput('bugzilla-instance', { required: true });
            const bzAPIToken = getInput('bugzilla-api-token', { required: true });
            const prMetadata = pullRequestMetadataSchema.parse(prMetadataUnsafe);
            const commitSha = prMetadata.commits[prMetadata.commits.length - 1].sha;
            // Initialize check run - check in progress
            // https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#create-a-check-run
            const checkRun = await context.octokit.checks.create(context.repo({
                name: 'Tracker Validation',
                head_sha: commitSha,
                status: 'in_progress',
                started_at: new Date().toISOString(),
                output: {
                    title: 'Tracker Validation',
                    summary: 'Tracker validation in progress',
                },
            }));
            const bugzilla = new Bugzilla(bzInstance, bzAPIToken);
            debug(`Using Bugzilla '${bzInstance}', version: '${await bugzilla.api.version()}'`);
            // TODO: improve error message
            const bzTracker = z.coerce.number().parse(getInput('bugzilla-tracker'));
            const product = getInput('product');
            const component = getInput('component', { required: true });
            let message = '';
            const bugDetails = await bugzilla.api
                .getBugs([bzTracker])
                .include(['id', 'summary', 'product', 'component', 'flags']);
            if (!Bugzilla.isMatchingProduct(product, bugDetails[0])) {
                // todo set label, set status, update summary comment
                const message = `Bugzilla tracker ${bzTracker} has product '${bugDetails[0].product}' but desired product is '${product}'`;
                updateStatusCheck(context, checkRun.data.id, 'completed', 'failure', message);
                setFailed(message);
            }
            message += `✅ Bugzilla tracker ${bzTracker} has set desired product: '${product}'\n`;
            if (!Bugzilla.isMatchingComponent(component, bugDetails[0])) {
                // todo set label, set status, update summary comment
                setFailed(`Bugzilla tracker ${bzTracker} has component '${bugDetails[0].component[0]}' but desired component is '${component}'`);
            }
            message += `✅ Bugzilla tracker ${bzTracker} has set desired component: '${component}'\n`;
            if (!Bugzilla.isApproved(bugDetails[0].flags)) {
                // todo set label, set status, update summary comment
                setFailed(`Bugzilla tracker ${bzTracker} has not been approved`);
            }
            message += `✅ Bugzilla tracker ${bzTracker} has been approved\n`;
            // check release
            // TODO: check release or at lease product RHEL 7, 8, 9, etc.
            // TODO: Once validated update Tracker status and add comment/attachment with link to PR
            // Update check run - check completed + conclusion
            // https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
            await updateStatusCheck(context, checkRun.data.id, 'completed', 'success', `# Tracker validation successful\n\n${message}`);
        });
    }
    catch (error) {
        throw error;
    }
};
export default action;
//# sourceMappingURL=action.js.map