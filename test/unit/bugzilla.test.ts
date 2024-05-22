import { beforeEach, describe, expect, test } from 'vitest';

import { Bugzilla } from '../../src/bugzilla';
import BugzillaAPI from 'bugzilla';
import { IssueDetails, Flag } from '../../src/controller';

interface TestContext {
  bugzilla: Bugzilla;
}

describe('test Bugzilla API', () => {
  beforeEach<TestContext>(context => {
    const bugzillaToken = process.env['INPUT_BUGZILLA-API-TOKEN'] ?? '';
    const bugzillaInstance =
      process.env['INPUT_BUGZILLA-INSTANCE'] ??
      'https://bugzilla.stage.redhat.com';

    context.bugzilla = new Bugzilla(bugzillaInstance, bugzillaToken);
  });

  test<TestContext>('public properties', context => {
    expect(context.bugzilla.api).toBeInstanceOf(BugzillaAPI);
    expect(context.bugzilla.instance).toEqual(
      'https://bugzilla.stage.redhat.com'
    );
  });

  test.skipIf(!process.env['INPUT_BUGZILLA-API-TOKEN'])<TestContext>(
    'getIssueDetails()',
    async context => {
      const bzTracker = '2013411';
      const bug = await context.bugzilla.getIssueDetails(bzTracker);

      expect(bug).toBeDefined();
      expect(bug).toMatchInlineSnapshot(`
        {
          "component": "systemd",
          "flags": [
            {
              "name": "needinfo",
              "status": "?",
            },
            {
              "name": "qe_test_coverage",
              "status": "?",
            },
            {
              "name": "release",
              "status": "?",
            },
            {
              "name": "mirror",
              "status": "+",
            },
            {
              "name": "devel_ack",
              "status": "+",
            },
            {
              "name": "qa_ack",
              "status": "+",
            },
            {
              "name": "stale",
              "status": "?",
            },
          ],
          "id": "2013411",
          "product": "Red Hat Enterprise Linux 9",
          "status": "POST",
          "summary": "[test] source-git automation test bug",
        }
      `);
    }
  );

  test<TestContext>('getVersion()', async context => {
    const version = await context.bugzilla.getVersion();

    expect(version).toBeDefined();
    expect(version).toMatch(/\d+.\d+.\d+.rh\d+/);
  });

  test<TestContext>('getUrl()', context => {
    context.bugzilla.issueDetails = {
      component: 'systemd',
      flags: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'NEW',
    };

    expect(context.bugzilla.getUrl()).toEqual(
      'https://bugzilla.stage.redhat.com/show_bug.cgi?id=123456789'
    );
  });

  test<TestContext>('getMarkdownUrl()', context => {
    context.bugzilla.issueDetails = {
      component: 'systemd',
      flags: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'NEW',
    };

    expect(context.bugzilla.getMarkdownUrl()).toEqual(
      '[#123456789](https://bugzilla.stage.redhat.com/show_bug.cgi?id=123456789)'
    );
  });

  test<TestContext>('isMatchingProduct()', context => {
    const bug: IssueDetails = {
      component: 'systemd',
      flags: [],
      id: '123456789',
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
      status: 'NEW',
    };
    context.bugzilla.issueDetails = bug;

    const product = ['Red Hat Enterprise Linux 9'];
    const isMatching = context.bugzilla.isMatchingProduct(product);

    expect(isMatching).toBeTruthy();
  });

  test<TestContext>('isMatchingComponent()', context => {
    const bug: IssueDetails = {
      component: 'systemd',
      flags: [],
      id: '123456789',
      product: 'Fedora',
      summary: 'Fedora Bug',
      status: 'NEW',
    };
    context.bugzilla.issueDetails = bug;

    const component = process.env['INPUT_COMPONENT'] ?? '';
    const isMatching = context.bugzilla.isMatchingComponent(component);

    expect(isMatching).toBeTruthy();
  });

  test<TestContext>('isApproved()', context => {
    let flags: Flag[] = [
      { name: 'some_flag', status: '-' },
      { name: 'some_other_flag', status: '?' },
      { name: 'release', status: '+' },
    ];
    let bug: IssueDetails = {
      component: 'systemd',
      flags: flags,
      id: '123456789',
      product: 'Fedora',
      summary: 'Fedora Bug',
      status: 'NEW',
    };
    context.bugzilla.issueDetails = bug;

    let isApproved = context.bugzilla.isApproved();

    expect(isApproved).toBeTruthy();

    flags = [{ name: 'release', status: '?' }];
    context.bugzilla.issueDetails.flags = flags;

    isApproved = context.bugzilla.isApproved();

    expect(isApproved).toBeFalsy();
  });

  test.todo<TestContext>('changeState()', async context => {});
  test.todo<TestContext>('addLink()', async context => {});
});
