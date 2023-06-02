import { beforeEach, describe, expect, test } from 'vitest';

import { BugDetails, Bugzilla } from '../src/bugzilla';
import { Flag } from 'bugzilla';

interface TestContext {
  bugzilla: Bugzilla;
}

describe('test basic Bugzilla API functions', () => {
  beforeEach<TestContext>(context => {
    const bugzillaToken = process.env['INPUT_BUGZILLA-API-TOKEN'] ?? '';
    const bugzillaInstance = process.env['INPUT_BUGZILLA-INSTANCE'] ?? '';

    context.bugzilla = new Bugzilla(bugzillaInstance, bugzillaToken);
  });

  test<TestContext>('Bugzilla API sanity check', async context => {
    const version = await context.bugzilla.api.version();

    expect(version).toBeDefined();
    expect(version).toEqual('5.0.4.rh87');

    const bzTracker = process.env['INPUT_BUGZILLA-TRACKER'] ?? '';
    const bug = await context.bugzilla.api
      .getBugs([bzTracker])
      .include(['id', 'summary', 'product', 'component', 'flags']);

    expect(bug).toBeDefined();
    expect(bug).toMatchInlineSnapshot('[]');
  });

  test('isMatchingProduct()', async () => {
    const bug: BugDetails = {
      component: ['systemd'],
      flags: [],
      id: 123456789,
      product: 'Red Hat Enterprise Linux 9',
      summary: 'RHEL 9 bug',
    };

    const product = process.env['INPUT_PRODUCT'] ?? '';
    const isMatching = Bugzilla.isMatchingProduct(product, bug);

    expect(isMatching).toBeTruthy();
  });

  test('isMatchingComponent()', () => {
    const bug: BugDetails = {
      component: ['systemd'],
      flags: [],
      id: 123456789,
      product: 'Fedora',
      summary: 'Fedora Bug',
    };

    const component = process.env['INPUT_COMPONENT'] ?? '';
    const isMatching = Bugzilla.isMatchingComponent(component, bug);

    expect(isMatching).toBeTruthy();
  });

  test('isApproved()', () => {
    let isApproved = Bugzilla.isApproved(undefined);

    expect(isApproved).toBeFalsy();

    let flags: Pick<Flag, 'name' | 'status'>[] = [
      { name: 'some_flag', status: '-' },
      { name: 'some_other_flag', status: '?' },
      { name: 'release', status: '+' },
    ];
    isApproved = Bugzilla.isApproved(flags as Flag[]);

    expect(isApproved).toBeTruthy();

    flags = [{ name: 'release', status: '?' }];
    isApproved = Bugzilla.isApproved(flags as Flag[]);

    expect(isApproved).toBeFalsy();
  });
});
