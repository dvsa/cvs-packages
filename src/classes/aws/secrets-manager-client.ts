import {
  GetSecretValueCommand,
  SecretsManagerClient,
  GetSecretValueCommandInput,
  SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import { fromIni } from '@aws-sdk/credential-providers';

export class SecretsManager {
  private static readonly defaultConfig: Partial<SecretsManagerClientConfig> = {
    region: 'eu-west-1',
  };

  /**
   * Get a Secrets Manager client
   * @param {Partial<SecretsManagerClientConfig>} config - The Secrets Manager configuration object.
   * @returns {SecretsManagerClient}
   */
  static getClient(
    config: Partial<SecretsManagerClientConfig> = SecretsManager.defaultConfig
  ): SecretsManagerClient {
    if (process.env.USE_CREDENTIALS === 'true') {
      config.credentials = fromIni();
    }

    return new SecretsManagerClient(config);
  }

  /**
   * Get a JSON parsed SecretString from AWS Secrets Manager
   * - If process.env.USE_CREDENTIALS is true, credentials will be used from ~/.aws/credentials
   * @param {GetSecretValueCommandInput} params - The parameters to send to the operation.
   * @param {Partial<SecretsManagerClientConfig>} config - The Secrets Manager configuration object.
   * @returns {Promise<T>}
   */
  static async get<T>(
    params: GetSecretValueCommandInput,
    config: Partial<SecretsManagerClientConfig> = SecretsManager.defaultConfig
  ): Promise<T> {
    try {
      const secretValue = await this.getClient(config).send(
        new GetSecretValueCommand(params)
      );

      const secret = JSON.parse(secretValue.SecretString || '');

      if (!secret || Object.keys(secret).length === 0) {
        throw new Error(`Secret string '${params.SecretId}' was empty.`);
      }

      return Promise.resolve(secret as T);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
