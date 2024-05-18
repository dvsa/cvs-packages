interface IFeatureFlagsConfig {
  environment: string;
  application: string;
  maxAge: number;
}

declare let process: {
  env: {
    BRANCH: string;
    FEATURE_FLAGS_APP_NAME: string;
    FEATURE_FLAGS_MAX_AGE: string;
  };
};

// Balance between reducing the number of network hops to fetch
// feature flags and recycling feature flags in the event of a deployment error.
const MAX_AGE: number = Number.parseInt(process.env.FEATURE_FLAGS_MAX_AGE ?? 5 * 60);
const ENVIRONMENT_NAME = process.env.BRANCH;
const APP_NAME: string = process.env.FEATURE_FLAGS_APP_NAME ?? 'cvs-app-config';

export const defaultFeatureFlagConfig: IFeatureFlagsConfig = {
  application: APP_NAME,
  environment: ENVIRONMENT_NAME,
  maxAge: MAX_AGE,
};
