const getAppConfig = jest.fn();

jest.mock('@aws-lambda-powertools/parameters/appconfig', () => ({
  getAppConfig,
}));

import { defaultFeatureFlagConfig } from '../config';
import { FeatureFlagsClient, FeatureFlagsClientName } from '../.';

type FeatureFlags = {
  firstFlag: {
    enabled: boolean;
  };
};

describe('app config configuration', () => {
  it('should return feature flags using the default configuration', async () => {
    const expectedFlags = {
      firstFlag: {
        enabled: true,
      },
    };
    const expectedProfile = 'vtx-profile';

    getAppConfig.mockReturnValue(expectedFlags);

    const client = new FeatureFlagsClient();
    const flags = await client.get<FeatureFlags>(FeatureFlagsClientName.VTX);

    expect(flags).toEqual(expectedFlags);
    expect(getAppConfig).toHaveBeenCalledWith(expectedProfile, {
      ...defaultFeatureFlagConfig,
      transform: 'json',
    });
  });
});
