import BugzillaAPI from 'bugzilla';
export class Bugzilla {
    // readonly jsonrpc: JSONRPCClient;
    constructor(instance, apiToken) {
        this.api = new BugzillaAPI(instance, apiToken);
        // this.jsonrpc = new JSONRPCClient(jsonRPCRequest =>
        //   fetch(`${instance}/jsonrpc.cgi`, {
        //     method: 'POST',
        //     headers: {
        //       'content-type': 'application/json',
        //     },
        //     body: JSON.stringify(jsonRPCRequest),
        //   }).then(response => {
        //     if (response.status === 200) {
        //       // Use client.receive when you received a JSON-RPC response.
        //       return response
        //         .json()
        //         .then(jsonRPCResponse =>
        //           this.jsonrpc.receive(jsonRPCResponse as JSONRPCResponse)
        //         );
        //     } else if (jsonRPCRequest.id !== undefined) {
        //       return Promise.reject(new Error(response.statusText));
        //     }
        //   })
        // );
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