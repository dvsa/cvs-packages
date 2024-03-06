const getAppConfig = jest.fn();

import { FeatureFlagsClient, FeatureFlagsClientName } from '../.';
import { APP_NAME, MAX_AGE } from '../config';

jest.mock('@aws-lambda-powertools/parameters/appconfig', () => ({
  getAppConfig,
}));

type FeatureFlags = {
  firstFlag: {
    enabled: boolean;
  };
};

describe('app config configuration', () => {
  it('should call app config correctly', async () => {
    process.env = {
      BRANCH: 'prod',
    };

    const expectedFlags = {
      firstFlag: {
        enabled: true,
      },
    };

    const expectedConfig = {
      environment: 'prod',
      application: APP_NAME,
      maxAge: MAX_AGE,
      transform: 'json',
    };

    const expectedProfile = 'vtx-profile';

    getAppConfig.mockReturnValue(expectedFlags);

    const client = new FeatureFlagsClient(FeatureFlagsClientName.VTX);
    const flags = await client.get<FeatureFlags>();

    expect(flags).toEqual(expectedFlags);
    expect(getAppConfig).toHaveBeenCalledWith(expectedProfile, expectedConfig);
  });
});
