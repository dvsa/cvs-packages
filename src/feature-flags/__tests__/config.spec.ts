const getAppConfig = jest.fn();

jest.mock('@aws-lambda-powertools/parameters/appconfig', () => ({
  getAppConfig,
}));

process.env = {
  BRANCH: 'prod',
  FEATURE_FLAGS_MAX_AGE: '10',
  FEATURE_FLAGS_APP_NAME: 'cvs',
};

import { FeatureFlagsClient, FeatureFlagsClientName } from '../.';

describe('app config configuration', () => {
  it('should return feature flags using the environment configuration', async () => {
    const expectedFlags = {
      firstFlag: {
        enabled: true,
      },
    };
    const expectedProfile = 'vtx-profile';

    getAppConfig.mockReturnValue(expectedFlags);

    const client = new FeatureFlagsClient();
    const flags = await client.get(FeatureFlagsClientName.VTX);

    expect(flags).toEqual(expectedFlags);
    expect(getAppConfig).toHaveBeenCalledWith(expectedProfile, {
      environment: 'prod',
      application: 'cvs',
      maxAge: 10,
      transform: 'json',
    });
  });
});
