import BugzillaAPI from 'bugzilla';
import { Version2Client } from 'jira.js';

import { Bugzilla } from './bugzilla';
import { Jira } from './jira';

export interface Adapter<T> {
  readonly api: T;
  readonly instance: string;

  getIssueDetails(id: string): Promise<IssueDetails>;

  getVersion(): Promise<string>;
  getUrl(): string;
  getMarkdownUrl(): string;
  isMatchingProduct(product: string): boolean;
  isMatchingComponent(component: string): boolean;
  isApproved(): boolean;
  changeState(): Promise<string>;
  addLink(urlType: string, bugId: string): Promise<string>;
}

export type IssueDetails = {
  id: string;
  product: string;
  component: string;
  summary: string;
  flags: Flag[];
  status: string;
};

export type Flag = {
  name: string;
  status: string;
};

export type SupportedControllers = Bugzilla | Jira;

export type SupportedAdapters<T extends SupportedControllers> =
  T extends Bugzilla ? BugzillaAPI : T extends Jira ? Version2Client : never;

export class Controller<T extends SupportedControllers> {
  constructor(readonly adapter: Adapter<SupportedAdapters<T>>) {}
}
