import { Version2Client } from 'jira.js';
import { Adapter, IssueDetails } from './controller';
export declare class Jira implements Adapter<Version2Client> {
    readonly instance: string;
    readonly api: Version2Client;
    issueDetails: IssueDetails | undefined;
    constructor(instance: string, apiToken: string);
    getIssueDetails(id: string): Promise<IssueDetails>;
    getVersion(): Promise<string>;
    getUrl(): string;
    getMarkdownUrl(): string;
    isMatchingProduct(products?: string[]): boolean;
    isMatchingComponent(component: string): boolean;
    isApproved(): boolean;
    changeState(): Promise<string>;
    addLink(urlType: string, bugId: string): Promise<string>;
}
