import BugzillaAPI from 'bugzilla';
export class Bugzilla {
    constructor(instance, apiToken) {
        this.api = new BugzillaAPI(instance, apiToken);
    }
    static isMatchingProduct(product, bug) {
        // product matching is optional
        if (product === '') {
            return true;
        }
        return product === bug.product;
    }
    static isMatchingComponent(component, bug) {
        return component === bug.component[0];
    }
    static isApproved(flags) {
        if (!flags) {
            return false;
        }
        const approved = flags.find(flag => flag.name === 'release' && flag.status === '+');
        return approved !== undefined;
    }
}
//# sourceMappingURL=bugzilla.js.map