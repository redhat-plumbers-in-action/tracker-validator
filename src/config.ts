import { debug, getInput } from '@actions/core';
import { context } from '@actions/github';

import { CustomOctokit } from './octokit';
import { configSchema, ConfigLabels, ConfigProducts } from './schema/config';

export class Config {
  static readonly defaults = {
    labels: {
      'missing-tracker': 'tracker/missing',
      'missing-severity': 'tracker/missing-severity',
      'invalid-product': 'tracker/invalid-product',
      'invalid-component': 'tracker/invalid-component',
      unapproved: 'tracker/unapproved',
    },
    products: [],
  };
  labels: ConfigLabels;
  products: ConfigProducts;

  constructor(config: unknown) {
    const parsedConfig = configSchema.parse(config);
    this.labels = parsedConfig.labels;
    this.products = parsedConfig.products;
  }

  static async getConfig(octokit: CustomOctokit): Promise<Config> {
    const path = getInput('config-path', { required: true });

    const retrievedConfig = (
      await octokit.config.get({
        ...context.repo,
        path,
        defaults: Config.defaults,
      })
    ).config;

    debug(`Configuration '${path}': ${JSON.stringify(retrievedConfig)}`);

    if (Config.isConfigEmpty(retrievedConfig)) {
      throw new Error(
        `Missing configuration. Please setup 'Tracker Validator' Action using 'tracker-validator.yml' file.`
      );
    }

    return new this(retrievedConfig);
  }

  static isConfigEmpty(config: unknown) {
    return config === null || config === undefined;
  }
}
