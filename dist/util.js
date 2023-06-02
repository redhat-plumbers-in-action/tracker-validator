export async function updateStatusCheck(context, checkID, status, conclusion, message) {
    return context.octokit.checks.update(context.repo({
        check_run_id: checkID,
        status,
        completed_at: new Date().toISOString(),
        conclusion,
        output: {
            title: 'Tracker Validation',
            summary: message,
        },
    }));
}
//# sourceMappingURL=util.js.map