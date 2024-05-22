import BugzillaAPI from 'bugzilla';
import { Adapter, IssueDetails } from './controller';
export declare class Bugzilla implements Adapter<BugzillaAPI> {
    readonly instance: string;
    private apiToken;
    readonly api: BugzillaAPI;
    issueDetails: IssueDetails | undefined;
    readonly tips: {
        approval: string;
    };
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
