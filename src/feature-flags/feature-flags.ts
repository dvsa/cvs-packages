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

// enum Client {
//   Vtx = 'vtx'
// }

// We have to load the app config on the container cold start.
// This is because we want to cache the config for an hour and all clients will fetch
// the config from a particular endpoint -> lambda that hydrates with the same caching time.
//

// export class FeatureFlagClient {
//   protected config: FeatureFlagsConfig;
//   protected _client: Client;
//   static _cache: Map<Client, Map<Profile, JSONValue>> = new Map<Client, Map<Profile, JSONValue>>();

//   constructor(client: Client, config: FeatureFlagsConfig) {
//     this._client = client;
//     this.config = config;

//     if (!FeatureFlagClient._cache.has(client)) {
//       FeatureFlagClient._cache.set(client, new Map<Profile, JSONValue>())
//     }
//   }

//   protected async load<T>(profile: Profile): Promise<T> {
//     return await getAppConfig(profile, {
//       ...this.config,
//       transform: 'json',
//     }) as T;
//   }

//   async get<T>(profile: Profile): Promise<T> {
//     const client = FeatureFlagClient._cache.get(this._client) as Map<Profile, JSONValue>;

//     console.log(profile, client.has(profile));
//     if (!client.has(profile)) {
//       const flags = await this.load<T>(profile);
//       client.set(profile, flags as JSONValue);
//     }

//     return client.get(profile) as T;
//   }
// }

// export class VtxFeatureFlagClient extends FeatureFlagClient {
//   constructor() {
//     const client = Client.Vtx;

//     super(client, {
//       environment: process.env.BRANCH,
//       application: `${APP_NAME}-${client}`,
//       maxAge: 60 * 60 * 24, // Fix at 24 hours
//     });
//   }
// }

// export class ExampleUsage {
//   async get() {
//     const client = new VtxFeatureFlagClient();
//     const flags = await client.get<WelshTranslationFlags>(Profile.WelshTranslations);
//     const value = flags.generateWelshCertificate.enabled;
//   }
// }
