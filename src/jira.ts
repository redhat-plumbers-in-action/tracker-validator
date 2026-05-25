import { debug } from '@actions/core';
import { Version3Client } from 'jira.js';
import {
  IssueLink,
  RemoteIssueLink,
} from 'jira.js/dist/esm/types/version3/models';

import { Adapter, IssueDetails } from './controller';
import { raise } from './util';

export class Jira implements Adapter<Version3Client> {
  readonly customFields = {
    severity: 'customfield_10840',
  };

  readonly api: Version3Client;
  issueDetails: IssueDetails | undefined;
  backfillIssue: IssueLink | undefined;

  readonly tips = {
    approval: 'Jira is approved if it has set Fix Version/s',
  };

  constructor(
    readonly instance: string,
    email: string,
    apiToken: string
  ) {
    this.api = new Version3Client({
      host: instance,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
    });
  }

  async getIssueDetails(id: string): Promise<IssueDetails> {
    const response = await this.api.issues.getIssue({ issueIdOrKey: id });

    this.issueDetails = {
      id: response.key,
      type: response.fields.issuetype?.name ?? '',
      product: response.fields.versions[0]?.name ?? '',
      component: response.fields.components[0].name ?? '',
      summary: response.fields.summary,
      fixVersions: response.fields.fixVersions.map(version => version.name),
      status: response.fields.status.name ?? '',
      severity:
        response.fields[this.customFields.severity] != null
          ? response.fields[this.customFields.severity].value
          : undefined,
      issueLinks: response.fields.issuelinks ?? [],
    };

    this.backfillIssue = this.issueDetails?.issueLinks?.find(link => {
      return (
        link.type?.outward === 'is triggering' &&
        link.outwardIssue?.key?.startsWith('PLUMBER-') &&
        link.outwardIssue?.fields?.status.name !== 'Closed'
      );
    });

    return this.issueDetails;
  }

  async getVersion(): Promise<string> {
    const response = await this.api.serverInfo.getServerInfo();
    return response.version ?? raise('Jira.getVersion(): missing version.');
  }

  getUrl(issueId?: string): string {
    const id = issueId ?? this.issueDetails?.id ?? '';

    if (id === '') {
      raise(
        'Jira.getUrl(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    return `${this.instance}/browse/${id}`;
  }

  getMarkdownUrl(issueId?: string): string {
    const id = issueId ?? this.issueDetails?.id ?? '';

    if (id === '') {
      raise(
        'Jira.getUrl(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    return `[${id}](${this.getUrl(id)})`;
  }

  isMatchingProduct(products: string[] = []): boolean {
    // product matching is optional
    if (products.length === 0) {
      return true;
    }

    if (this.issueDetails === undefined) {
      raise(
        'Jira.isMatchingProduct(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    if (this.issueDetails.fixVersions === undefined) {
      return false;
    }

    return this.issueDetails.fixVersions.some(version =>
      products.includes(version)
    );
  }

  isSeveritySet(): boolean {
    if (this.issueDetails === undefined) {
      raise(
        'Jira.isMatchingProduct(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    return !!this.issueDetails.severity;
  }

  isMatchingComponent(component: string): boolean {
    if (this.issueDetails === undefined) {
      raise(
        'Jira.isMatchingComponent(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    return this.issueDetails.component === component;
  }

  isApproved(): boolean {
    if (this.issueDetails === undefined) {
      raise(
        'Jira.isApproved(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    // Jira is approved if it has set Fix Version/s
    if (this.issueDetails.fixVersions !== undefined) {
      return this.issueDetails.fixVersions.length > 0;
    }

    return false;
  }

  async changeState(draft: boolean): Promise<string> {
    if (this.issueDetails === undefined) {
      raise(
        'Jira.changeState(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    if (
      this.issueDetails.status !== 'New' &&
      this.issueDetails.status !== 'Planning'
    ) {
      debug(
        `Jira issue ${this.issueDetails.id} isn't in 'New' or 'Planning' state.`
      );
      return `Jira issue ${this.getMarkdownUrl()} has desired state.`;
    }

    debug(`Changing state of Jira ${this.issueDetails.id}.`);

    // The state can be changed only by a transition
    // In Progress transition id is 111
    // to get the transition id, use: https://redhat.atlassian.net/rest/api/2/issue/<RHEL-XXXX>/transitions
    await this.api.issues.doTransition({
      issueIdOrKey: this.issueDetails.id,
      transition: {
        id: '111',
      },
    });

    const message = [];
    if (this.backfillIssue && this.backfillIssue.outwardIssue?.key) {
      const transition = draft
        ? { id: '3', name: 'In Progress' }
        : { id: '10154', name: 'Code Review' };

      await this.api.issues.doTransition({
        issueIdOrKey: this.backfillIssue.outwardIssue.key,
        transition,
      });
      message.push(
        `Jira issue ${this.getMarkdownUrl(this.backfillIssue.outwardIssue.key)} has changed state to '${transition.name}'`
      );
    }

    message.push(
      `Jira issue ${this.getMarkdownUrl()} has changed state to 'In Progress'`
    );
    return message.join('\n');
  }

  async addLink(urlType: string, bugId: string): Promise<string> {
    if (this.issueDetails === undefined) {
      raise(
        'Jira.addLink(): missing issueDetails, call Jira.getIssueDetails() first.'
      );
    }

    // !FIXME: explicit type is required here because of a bug in jira.js
    const links: RemoteIssueLink[] =
      await this.api.issueRemoteLinks.getRemoteIssueLinks({
        issueIdOrKey: this.issueDetails.id,
      });

    for (const link of links) {
      if (link.object === undefined) {
        continue;
      }

      if (link.object.url === `${urlType}${bugId}`) {
        return `Link ${urlType}${bugId} is already linked with Jira issue ${this.getMarkdownUrl()}.`;
      }
    }

    await this.api.issueRemoteLinks.createOrUpdateRemoteIssueLink({
      issueIdOrKey: this.issueDetails.id,
      object: {
        title: `Fix has been submitted as GitHub PR ${bugId}`,
        url: `${urlType}${bugId}`,
        icon: {
          title: 'GitHub',
          url16x16: 'https://github.githubassets.com/favicon.ico',
        },
      },
    });

    return `PR was linked with Jira issue ${this.getMarkdownUrl()}`;
  }
}
