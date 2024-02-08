import { S3Client } from '@aws-sdk/client-s3';
import { S3Storage } from '../s3-bucket-client';

jest.mock('@aws-sdk/credential-providers', () => ({
  fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

// Mock the entire S3 SDK module
jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');

  // Mock the S3Client class
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        // Define mock behavior based on command input
        if (command.input.Bucket === 'validBucket' && command.input.Key === 'validKey') {
          return Promise.resolve({
            Body: 'mocked file content',
          });
        } else {
          return Promise.reject(new Error('File not found'));
        }
      }),
    })),
  };
});

describe('S3Storage', () => {
  describe('download', () => {
    it('successfully downloads an object from S3', async () => {
      const response = await S3Storage.download({ Bucket: 'validBucket', Key: 'validKey' });
      expect(response).toEqual({ Body: 'mocked file content' });
    });

    it('throws an error when the object does not exist', async () => {
      const params = { Bucket: 'invalidBucket', Key: 'invalidKey' };
      await expect(S3Storage.download(params)).rejects.toThrow('File not found');
    });

    it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
      process.env.USE_CREDENTIALS = 'true';
      S3Storage.getClient({});
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: 'iniCredentials',
        })
      );
    });
  });
});
