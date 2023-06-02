import BugzillaAPI, { Bug, Flag } from 'bugzilla';
export type BugDetails = Omit<Pick<Bug, 'id' | 'component' | 'flags' | 'product' | 'summary'>, never>;
export declare class Bugzilla {
    readonly api: BugzillaAPI;
    constructor(instance: string, apiToken: string);
    static isMatchingProduct(product: string, bug: BugDetails): boolean;
    static isMatchingComponent(component: string, bug: BugDetails): boolean;
    static isApproved(flags: Flag[] | undefined): boolean;
}
