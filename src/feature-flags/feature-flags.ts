import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
import { APP_NAME, MAX_AGE } from './config';
import { IFeatureFlagsConfig } from './config';
import { FeatureFlagsClientName } from './';

declare let process: {
  env: {
    BRANCH: string;
  };
};

// When instantiating the feature flags, we should be scopiing this and caching it to the invocation instance.
// Each invocation of a lambda will get new feature flags, and that should not change throughout the lambda lifecycle.
// However, we don't want to cache them across invocations (ie outside the handler).

export class FeatureFlagsClient {
  private profileName: FeatureFlagsClientName;
  private config: IFeatureFlagsConfig = {
    environment: process.env.BRANCH,
    application: APP_NAME,
    maxAge: MAX_AGE,
  };

  // TODO: Refactor to provide clientName in get
  constructor(clientName: FeatureFlagsClientName) {
    this.profileName = clientName;
  }

  async get<T>(): Promise<T> {
    const featureFlags = await getAppConfig(`${this.profileName}-profile`, {
      ...this.config,
      transform: 'json',
    });

    return featureFlags as T;
  }
}
