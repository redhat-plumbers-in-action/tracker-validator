import { debug } from '@actions/core';
import BugzillaAPI from 'bugzilla';
import fetch from 'node-fetch';
import { raise } from './util';
export class Bugzilla {
    constructor(instance, apiToken) {
        this.instance = instance;
        this.apiToken = apiToken;
        this.api = new BugzillaAPI(instance, apiToken);
    }
    async getIssueDetails(id) {
        var _a, _b;
        const response = (await this.api
            .getBugs([id])
            .include(['id', 'summary', 'product', 'component', 'flags', 'status']))[0];
        this.issueDetails = {
            id: response.id.toString(),
            summary: response.summary,
            component: Array.isArray(response.component)
                ? response.component[0]
                : response.component,
            product: response.product,
            flags: (_b = (_a = response.flags) === null || _a === void 0 ? void 0 : _a.map(flag => {
                var _a;
                return {
                    name: (_a = flag.name) !== null && _a !== void 0 ? _a : '',
                    status: flag.status,
                };
            })) !== null && _b !== void 0 ? _b : [],
            status: response.status,
        };
        return this.issueDetails;
    }
    async getVersion() {
        return this.api.version();
    }
    getUrl() {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.getUrl(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        return `${this.instance}/show_bug.cgi?id=${this.issueDetails.id}`;
    }
    getMarkdownUrl() {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.getUrl(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        return `[#${this.issueDetails.id}](${this.getUrl()})`;
    }
    isMatchingProduct(products = []) {
        // product matching is optional
        if (products.length === 0) {
            return true;
        }
        if (this.issueDetails === undefined) {
            raise('Bugzilla.isMatchingProduct(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        return products.includes(this.issueDetails.product);
    }
    isMatchingComponent(component) {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.isMatchingComponent(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        return component === this.issueDetails.component;
    }
    isApproved() {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.isApproved(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        if (!this.issueDetails.flags) {
            return false;
        }
        const approved = this.issueDetails.flags.find(flag => flag.name === 'release' && flag.status === '+');
        return approved !== undefined;
    }
    async changeState() {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.changeState(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        if (this.issueDetails.status !== 'NEW' &&
            this.issueDetails.status !== 'ASSIGNED') {
            debug(`Bugzilla tracker ${this.issueDetails.id} isn't in 'NEW' or 'ASSIGNED' state.`);
            return `Bugzilla tracker ${this.getMarkdownUrl()} has desired state.`;
        }
        debug(`Changing state of Bugzilla ${this.issueDetails.id}.`);
        await this.api.updateBug(this.issueDetails.id, {
            ids: [this.issueDetails.id],
            id_or_alias: this.issueDetails.id,
            status: 'POST',
        });
        return `Bugzilla tracker ${this.getMarkdownUrl()} has changed state to 'POST'`;
    }
    async addLink(urlType, bugId) {
        if (this.issueDetails === undefined) {
            raise('Bugzilla.addLink(): missing issueDetails, call Bugzilla.getIssueDetails() first.');
        }
        await fetch(`${this.instance}/jsonrpc.cgi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiToken}`,
            },
            body: JSON.stringify({
                jsonrpc: '1.0',
                method: 'ExternalBugs.add_external_bug',
                params: [
                    {
                        bug_ids: [this.issueDetails.id],
                        external_bugs: [
                            {
                                ext_type_url: urlType,
                                ext_bz_bug_id: bugId,
                            },
                        ],
                    },
                ],
                id: 'identifier',
            }),
        });
        return `PR was linked with Bugzilla tracker ${this.getMarkdownUrl()}`;
    }
}
//# sourceMappingURL=bugzilla.js.map