import { debug } from '@actions/core';
import { Version2Client } from 'jira.js';
import { raise } from './util';
export class Jira {
    constructor(instance, apiToken) {
        this.instance = instance;
        this.api = new Version2Client({
            host: instance,
            authentication: {
                personalAccessToken: apiToken,
            },
        });
    }
    async getIssueDetails(id) {
        var _a, _b, _c, _d;
        const response = await this.api.issues.getIssue({ issueIdOrKey: id });
        this.issueDetails = {
            id: response.key,
            product: (_b = (_a = response.fields.versions[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
            component: (_c = response.fields.components[0].name) !== null && _c !== void 0 ? _c : '',
            summary: response.fields.summary,
            fixVersions: response.fields.fixVersions.map(version => version.name),
            status: (_d = response.fields.status.name) !== null && _d !== void 0 ? _d : '',
        };
        return this.issueDetails;
    }
    async getVersion() {
        var _a;
        const response = await this.api.serverInfo.getServerInfo();
        return (_a = response.version) !== null && _a !== void 0 ? _a : raise('Jira.getVersion(): missing version.');
    }
    getUrl() {
        if (this.issueDetails === undefined) {
            raise('Jira.getUrl(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        return `${this.instance}/browse/${this.issueDetails.id}`;
    }
    getMarkdownUrl() {
        if (this.issueDetails === undefined) {
            raise('Jira.getUrl(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        return `[${this.issueDetails.id}](${this.getUrl()})`;
    }
    isMatchingProduct(products = []) {
        // product matching is optional
        if (products.length === 0) {
            return true;
        }
        if (this.issueDetails === undefined) {
            raise('Jira.isMatchingProduct(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        return products.includes(this.issueDetails.product);
    }
    isMatchingComponent(component) {
        if (this.issueDetails === undefined) {
            raise('Jira.isMatchingComponent(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        return this.issueDetails.component === component;
    }
    isApproved() {
        if (this.issueDetails === undefined) {
            raise('Jira.isApproved(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        // Jira is approved if it has set Fix Version/s
        if (this.issueDetails.fixVersions !== undefined) {
            return this.issueDetails.fixVersions.length > 0;
        }
        return false;
    }
    async changeState() {
        if (this.issueDetails === undefined) {
            raise('Jira.changeState(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        if (this.issueDetails.status !== 'New' &&
            this.issueDetails.status !== 'Planning') {
            debug(`Jira issue ${this.issueDetails.id} isn't in 'New' or 'Planning' state.`);
            return `Jira issue ${this.getMarkdownUrl()} has desired state.`;
        }
        debug(`Changing state of Jira ${this.issueDetails.id}.`);
        // The state can be changed only by a transition
        // In Progress transition id is 111
        // to get the transition id, use: https://issues.redhat.com/rest/api/2/issue/<RHEL-XXXX>/transitions
        await this.api.issues.doTransition({
            issueIdOrKey: this.issueDetails.id,
            transition: {
                id: '111',
            },
        });
        return `Jira issue ${this.getMarkdownUrl()} has changed state to 'In Progress'`;
    }
    async addLink(urlType, bugId) {
        if (this.issueDetails === undefined) {
            raise('Jira.addLink(): missing issueDetails, call Jira.getIssueDetails() first.');
        }
        // !FIXME: explicit type is required here because of a bug in jira.js
        const links = await this.api.issueRemoteLinks.getRemoteIssueLinks({
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
//# sourceMappingURL=jira.js.map