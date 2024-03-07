import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
import { defaultFeatureFlagConfig } from './config';
import { FeatureFlagsClientName } from './';

// When instantiating the feature flags, we should be scopiing this and caching it to the invocation instance.
// Each invocation of a lambda will get new feature flags, and that should not change throughout the lambda lifecycle.
// However, we don't want to cache them across invocations (ie outside the handler).

export class FeatureFlagsClient {
  async get<T>(clientName: FeatureFlagsClientName): Promise<T> {
    const featureFlags = await getAppConfig(`${clientName}-profile`, {
      ...defaultFeatureFlagConfig,
      transform: 'json',
    });

    return featureFlags as T;
  }
}
