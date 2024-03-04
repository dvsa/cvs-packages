import {
  AttributeValue,
  DynamoDBClient,
  DynamoDBClientConfig,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { fromEnv, fromIni } from '@aws-sdk/credential-providers';

export class DynamoDb {
  private static readonly defaultConfig: Partial<DynamoDBClientConfig> = {
    region: 'eu-west-1',
  };

  /**
   * Get a DynamoDB client
   * - If `process.env.USE_CREDENTIALS` is `true`, credentials will be used from `~/.aws/credentials`
   * - If `process.env.IS_OFFLINE` is `true`, credentials will be used from .env / serverless.yml file
   * @param {Partial<DynamoDBClientConfig>} clientConfig
   * @returns {DynamoDBClient}
   */
  static getClient(
    clientConfig: Partial<DynamoDBClientConfig> = DynamoDb.defaultConfig
  ): DynamoDBDocumentClient {
    if (process.env.USE_CREDENTIALS === 'true') {
      clientConfig.credentials = fromIni();

      // If using `serverless-offline`
    } else if (process.env.IS_OFFLINE === 'true') {
      clientConfig.credentials = fromEnv();
      clientConfig.endpoint = process.env.DDB_OFFLINE_ENDPOINT;
    }

    return DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig));
  }

  /**
   * Perform a full scan of a DynamoDB table
   * @template T
   * @param {ScanCommandInput} scanParams - TableName and ExclusiveStartKey are defined so any additional parameters can be passed here
   * @param {Partial<DynamoDBClientConfig>} clientConfig - Defaults to the `eu-west-1` region
   * @return {Promise<T[]>}
   */
  static async fullScan<T>(
    scanParams: Partial<ScanCommandInput> = {},
    clientConfig: Partial<DynamoDBClientConfig> = DynamoDb.defaultConfig
  ): Promise<T[]> {
    const rows: T[] = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined =
      undefined;

    const params = {
      ExclusiveStartKey: lastEvaluatedKey,
      ...scanParams,
    } as ScanCommandInput;

    do {
      const data = await this.getClient(clientConfig).send(
        new ScanCommand(params)
      );

      if (data.Items) rows.push(...(data.Items as T[]));

      lastEvaluatedKey = data.LastEvaluatedKey;
      params.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return rows;
  }
}
