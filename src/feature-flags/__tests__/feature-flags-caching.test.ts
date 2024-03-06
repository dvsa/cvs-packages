import { clearCaches } from '@aws-lambda-powertools/parameters';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';

import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  GetLatestConfigurationCommandOutput,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';

import { mockClient } from 'aws-sdk-client-mock';
import { FeatureFlagsClient, FeatureFlagsClientName } from '..';
import 'aws-sdk-client-mock-jest';

type Flag = {
  enabled: boolean;
};

type CvsFeatureFlags = {
  firstFlag: Flag;
  secondFlag: Flag;
};

describe('feature flag caching', () => {
  const featureFlagValues = {
    firstFlag: {
      enabled: true,
    },
    secondFlag: {
      enabled: false,
    },
  };

  const token = 'FAKE_TOKEN';
  const client = mockClient(AppConfigDataClient);

  it('should return cached feature flags from app config', async () => {
    client.on(StartConfigurationSessionCommand).resolves({ InitialConfigurationToken: token });
    client.on(GetLatestConfigurationCommand).resolves({
      ConfigurationToken: token,
      $metadata: {
        httpStatusCode: 200,
      },
      Configuration: Uint8ArrayBlobAdapter.fromString(JSON.stringify(featureFlagValues)),
    } as GetLatestConfigurationCommandOutput);

    const firstClient = new FeatureFlagsClient(FeatureFlagsClientName.VTX);
    const firstFlags = await firstClient.get<CvsFeatureFlags>();

    // Any second call to the underlying client should return a cache value until it epires.
    // This proves we aren't hitting AWS every time we fetch the app config.
    const secondClient = new FeatureFlagsClient(FeatureFlagsClientName.VTX);
    const secondFlags = await secondClient.get<CvsFeatureFlags>();

    expect(firstFlags.firstFlag.enabled).toBe(true);
    expect(secondFlags.firstFlag.enabled).toBe(true);

    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(1);
    expect(client.commandCalls(GetLatestConfigurationCommand)).toHaveLength(1);
  });

  it('should fetch feature flags from aws when the cache clears', async () => {
    client.on(StartConfigurationSessionCommand).resolves({ InitialConfigurationToken: token });
    client.on(GetLatestConfigurationCommand).resolves({
      ConfigurationToken: token,
      $metadata: {
        httpStatusCode: 200,
      },
      Configuration: Uint8ArrayBlobAdapter.fromString(JSON.stringify(featureFlagValues)),
    } as GetLatestConfigurationCommandOutput);

    const firstClient = new FeatureFlagsClient(FeatureFlagsClientName.VTX);
    const firstFlags = await firstClient.get<CvsFeatureFlags>();

    // Force the internal app config cache to clear.
    // This proves we are hitting AWS once the cache has expired locally.
    clearCaches();

    const secondClient = new FeatureFlagsClient(FeatureFlagsClientName.VTX);
    const secondFlags = await secondClient.get<CvsFeatureFlags>();

    expect(firstFlags.firstFlag.enabled).toBe(true);
    expect(secondFlags.firstFlag.enabled).toBe(true);
    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(2);
    expect(client.commandCalls(GetLatestConfigurationCommand)).toHaveLength(2);
  });
});
