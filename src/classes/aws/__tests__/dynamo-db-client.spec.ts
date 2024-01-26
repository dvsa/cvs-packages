import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDb } from '../dynamo-db-client';

// Mock the AWS SDK dependencies
jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn(),
  };
});
jest.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: jest.fn().mockReturnValue('envCredentials'),
  fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

describe('DynamoDb', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv }; // Copy the original process.env
  });

  afterEach(() => {
    process.env = originalEnv; // Restore the original process.env
    jest.clearAllMocks();
  });

  it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
    process.env.USE_CREDENTIALS = 'true';
    DynamoDb.getClient({});
    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: 'iniCredentials',
      })
    );
  });

  it('should use credentials from environment when IS_OFFLINE is true', () => {
    process.env.IS_OFFLINE = 'true';
    process.env.DDB_OFFLINE_ENDPOINT = 'http://localhost:8000';
    DynamoDb.getClient({});
    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: 'envCredentials',
        endpoint: 'http://localhost:8000',
      })
    );
  });

  it('should use default client config when no environment variables are set', () => {
    DynamoDb.getClient({});
    expect(DynamoDBClient).toHaveBeenCalledWith({});
  });

  it('should use default client config when no environment variables are set and no config passed', () => {
    DynamoDb.getClient();
    expect(DynamoDBClient).toHaveBeenCalledWith({});
  });
});
