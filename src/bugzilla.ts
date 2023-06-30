import BugzillaAPI, { Bug, Flag } from 'bugzilla';

export type BugDetails = Omit<
  Pick<Bug, 'id' | 'component' | 'flags' | 'product' | 'summary'>,
  never
>;

export class Bugzilla {
  readonly api: BugzillaAPI;
  // readonly jsonrpc: JSONRPCClient;

  constructor(instance: string, apiToken: string) {
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

  static isMatchingProduct(product: string, bug: BugDetails): boolean {
    // product matching is optional
    if (product === '') {
      return true;
    }

    return product === bug.product;
  }

  static isMatchingComponent(component: string, bug: BugDetails): boolean {
    return component === bug.component[0];
  }

  static isApproved(flags: Flag[] | undefined): boolean {
    if (!flags) {
      return false;
    }

    const approved = flags.find(
      flag => flag.name === 'release' && flag.status === '+'
    );
    return approved !== undefined;
  }
}
