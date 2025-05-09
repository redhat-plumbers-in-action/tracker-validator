import { CustomOctokit } from './octokit';
import { ConfigLabels, ConfigProducts } from './schema/config';
export declare class Config {
    static readonly defaults: {
        labels: {
            'missing-tracker': string;
            'missing-severity': string;
            'invalid-product': string;
            'invalid-component': string;
            unapproved: string;
        };
        products: never[];
    };
    labels: ConfigLabels;
    products: ConfigProducts;
    constructor(config: unknown);
    static getConfig(octokit: CustomOctokit): Promise<Config>;
    static isConfigEmpty(config: unknown): config is null | undefined;
}
