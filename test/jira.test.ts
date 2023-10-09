import { beforeEach, describe, expect, test } from 'vitest';

import { Jira } from '../src/jira';
import { Version2Client } from 'jira.js';
import { IssueDetails, Flag } from '../src/controller';

interface TestContext {
  jira: Jira;
}

const rhel10IssueID = 'RHEL-678';

describe('test Jira API', () => {
  beforeEach<TestContext>(context => {
    const jiraToken = process.env['INPUT_JIRA-API-TOKEN'] ?? '';
    const jiraInstance =
      process.env['INPUT_JIRA-INSTANCE'] ?? 'https://issues.redhat.com';

    context.jira = new Jira(jiraInstance, jiraToken);
  });

  test<TestContext>('public properties', context => {
    expect(context.jira.api).toBeInstanceOf(Version2Client);
    expect(context.jira.instance).toEqual('https://issues.redhat.com');
  });

  test<TestContext>('getIssueDetails()', async context => {
    let issueId = rhel10IssueID;
    let issue = await context.jira.getIssueDetails(issueId);

    expect(issue).toBeDefined();
    expect(issue).toMatchInlineSnapshot(`
      {
        "component": "systemd",
        "fixVersions": [],
        "id": "RHEL-678",
        "product": "rhel-10.0",
        "status": "New",
        "summary": "[spec] [RHEL 10] use during build generated systemd-user pam config like in Fedora",
      }
    `);
  });

  test<TestContext>('getVersion()', async context => {
    const version = await context.jira.getVersion();

    expect(version).toBeDefined();
    expect(version).toMatchInlineSnapshot('"9.4.2"');

    const issueId = rhel10IssueID;
    const issue = await context.jira.getIssueDetails(issueId);

    expect(issue).toBeDefined();
    expect(issue).toMatchInlineSnapshot(`
      {
        "component": "systemd",
        "fixVersions": [],
        "id": "RHEL-678",
        "product": "rhel-10.0",
        "status": "New",
        "summary": "[spec] [RHEL 10] use during build generated systemd-user pam config like in Fedora",
      }
    `);
  });

  test<TestContext>('getUrl()', context => {
    context.jira.issueDetails = {
      component: 'systemd',
      fixVersions: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'New',
    };

    expect(context.jira.getUrl()).toEqual(
      'https://issues.redhat.com/browse/123456789'
    );
  });

  test<TestContext>('getMarkdownUrl()', context => {
    context.jira.issueDetails = {
      component: 'systemd',
      fixVersions: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'New',
    };

    expect(context.jira.getMarkdownUrl()).toEqual(
      '[123456789](https://issues.redhat.com/browse/123456789)'
    );
  });

  test<TestContext>('isMatchingProduct()', context => {
    const issue: IssueDetails = {
      component: 'systemd',
      fixVersions: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'New',
    };
    context.jira.issueDetails = issue;

    const product = ['Red Hat Enterprise Linux 9'];
    const isMatching = context.jira.isMatchingProduct(product);

    expect(isMatching).toBeTruthy();
  });

  test<TestContext>('isMatchingComponent()', context => {
    const issue: IssueDetails = {
      component: 'systemd',
      fixVersions: [],
      id: '123456789',
      product: 'Fedora',
      summary: 'Fedora Bug',
      status: 'New',
    };
    context.jira.issueDetails = issue;

    const component = process.env['INPUT_COMPONENT'] ?? '';
    const isMatching = context.jira.isMatchingComponent(component);

    expect(isMatching).toBeTruthy();
  });

  // !FIXME: not implemented yet
  test.skip<TestContext>('isApproved()', context => {
    let flags: Flag[] = [
      { name: 'some_flag', status: '-' },
      { name: 'some_other_flag', status: '?' },
      { name: 'release', status: '+' },
    ];
    let issue: IssueDetails = {
      component: 'systemd',
      flags: flags,
      id: '123456789',
      product: 'Fedora',
      summary: 'Fedora Bug',
      status: 'New',
    };
    context.jira.issueDetails = issue;

    let isApproved = context.jira.isApproved();

    expect(isApproved).toBeTruthy();

    flags = [{ name: 'release', status: '?' }];
    context.jira.issueDetails.flags = flags;

    isApproved = context.jira.isApproved();

    expect(isApproved).toBeFalsy();
  });

  test.todo<TestContext>('changeState()', async context => {});
  test.todo<TestContext>('addLink()', async context => {});
});
