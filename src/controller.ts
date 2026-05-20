import BugzillaAPI from 'bugzilla';
import { Version3Client } from 'jira.js';

import { Bugzilla } from './bugzilla';
import { Jira } from './jira';
import type { IssueLink } from 'jira.js/dist/esm/types/version3/models';

export interface Adapter<T> {
  readonly api: T;
  readonly instance: string;
  readonly tips: Tips;

  readonly issueDetails: IssueDetails | undefined;

  getIssueDetails(id: string): Promise<IssueDetails>;

  getVersion(): Promise<string>;
  getUrl(issueId?: string): string;
  getMarkdownUrl(issueId?: string): string;
  isMatchingProduct(products: string[]): boolean;
  isSeveritySet(): boolean;
  isMatchingComponent(component: string): boolean;
  isApproved(): boolean;
  changeState(draft: boolean): Promise<string>;
  addLink(urlType: string, bugId: string): Promise<string>;
}

export type Tips = {
  approval: string;
};

export type IssueDetails = {
  id: string;
  type: string | undefined;
  product: string;
  component: string;
  summary: string;
  // Flags are Bugzilla specific
  flags?: Flag[];
  // FixVersions are Jira specific
  fixVersions?: string[];
  status: string;
  severity: string | undefined;
  issueLinks: IssueLink[];
};

export type Flag = {
  name: string;
  status: string;
};

export type SupportedControllers = Bugzilla | Jira;

export type SupportedAdapters<T extends SupportedControllers> =
  T extends Bugzilla ? BugzillaAPI : T extends Jira ? Version3Client : never;

export class Controller<T extends SupportedControllers> {
  constructor(readonly adapter: Adapter<SupportedAdapters<T>>) {}
}
