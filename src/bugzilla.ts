import BugzillaAPI, { Bug, Flag } from 'bugzilla';

export type BugDetails = Omit<
  Pick<Bug, 'id' | 'component' | 'flags' | 'product' | 'summary'>,
  never
>;

export class Bugzilla {
  readonly api: BugzillaAPI;

  constructor(instance: string, apiToken: string) {
    this.api = new BugzillaAPI(instance, apiToken);
  }

  static isMatchingProduct(product: string, bug: BugDetails): boolean {
    // product matching is optional
    if (product === '') {
      return true;
    }

    return product === bug.product;
  }

  static isMatchingComponent(component: string, bug: BugDetails): boolean {
    return component === bug.component[0];
  }

  static isApproved(flags: Flag[] | undefined): boolean {
    if (!flags) {
      return false;
    }

    const approved = flags.find(
      flag => flag.name === 'release' && flag.status === '+'
    );
    return approved !== undefined;
  }
}
