import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { fromEnv, fromIni } from '@aws-sdk/credential-providers';

export class DynamoDb {
  /**
   * Get a DynamoDB client
   * - If `process.env.USE_CREDENTIALS` is `true`, credentials will be used from `~/.aws/credentials`
   * - If `process.env.IS_OFFLINE` is `true`, credentials will be used from .env / serverless.yml file
   * @param {Partial<DynamoDBClientConfig>} clientConfig
   * @returns {DynamoDBClient}
   */
  static getClient(
    clientConfig: Partial<DynamoDBClientConfig> = {}
  ): DynamoDBClient {
    if (process.env.USE_CREDENTIALS === 'true') {
      clientConfig.credentials = fromIni();

      // If using `serverless-offline`
    } else if (process.env.IS_OFFLINE === 'true') {
      clientConfig.credentials = fromEnv();
      clientConfig.endpoint = process.env.DDB_OFFLINE_ENDPOINT;
    }

    return new DynamoDBClient(clientConfig);
  }
}
