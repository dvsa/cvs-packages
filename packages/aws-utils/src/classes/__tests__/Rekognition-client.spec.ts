import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { fromIni } from '@aws-sdk/credential-providers';
import { Rekognition } from '../rekognition-client';

jest.mock('@aws-sdk/client-rekognition');
jest.mock('@aws-sdk/credential-providers');
jest.mock('aws-xray-sdk');

describe('Rekognition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a RekognitionClient with default config when no config is provided', () => {
    const client = Rekognition.getClient();
    expect(RekognitionClient).toHaveBeenCalledWith({ region: 'eu-west-1' });
    expect(client).toBeInstanceOf(RekognitionClient);
  });

  it('returns a RekognitionClient with provided config', () => {
    const customConfig = { region: 'us-east-1' };
    const client = Rekognition.getClient(customConfig);
    expect(RekognitionClient).toHaveBeenCalledWith(customConfig);
    expect(client).toBeInstanceOf(RekognitionClient);
  });

  it('uses credentials from fromIni when USE_CREDENTIALS is true', () => {
    process.env.USE_CREDENTIALS = 'true';
    (fromIni as jest.Mock).mockReturnValue({ accessKeyId: 'test', secretAccessKey: 'test' });
    const client = Rekognition.getClient();
    expect(fromIni).toHaveBeenCalled();
    expect(RekognitionClient).toHaveBeenCalledWith(expect.objectContaining({ credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }));
    expect(client).toBeInstanceOf(RekognitionClient);
    process.env.USE_CREDENTIALS = undefined;
  });
});
