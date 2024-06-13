import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { SendPayload, SimpleEmailService } from '../ses-client';

const sendMock = jest.fn();
jest.mock('@aws-sdk/client-ses', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-ses');

  return {
    ...originalModule,
    SESClient: jest.fn().mockImplementation(() => ({
      send: sendMock,
    })),
  };
});

jest.mock('@aws-sdk/credential-providers', () => ({
  fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

describe('SimpleEmailService', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    sendMock.mockClear();
  });

  const validPayload: SendPayload = {
    to: ['valid@example.com'],
    from: 'sender@example.com',
    subject: 'Test Subject',
    htmlBody: '<p>Test HTML Body</p>',
    textBody: 'Test Text Body',
  };

  describe('send', () => {
    it('successfully sends an email', async () => {
      sendMock.mockResolvedValueOnce({ MessageId: '1234' });

      const response = await SimpleEmailService.send(validPayload);

      expect(response).toEqual({ MessageId: '1234' });
      expect(sendMock).toHaveBeenCalledWith(expect.any(SendEmailCommand));
    });

    it('throws an error when email sending fails', async () => {
      sendMock.mockRejectedValueOnce(new Error('Failed to send email'));

      const invalidPayload = { ...validPayload, to: ['invalid@example.com'] };
      await expect(SimpleEmailService.send(invalidPayload)).rejects.toThrow('Failed to send email');
    });

    it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
      process.env.USE_CREDENTIALS = 'true';
      SimpleEmailService.getClient({});
      expect(SESClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: 'iniCredentials',
        })
      );
    });
  });
});
