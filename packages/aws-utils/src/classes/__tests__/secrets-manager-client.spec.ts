import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SecretsManager } from '../secrets-manager-client';

jest.mock('@aws-sdk/credential-providers', () => ({
	fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

jest.mock('@aws-sdk/client-secrets-manager', () => {
	const originalModule = jest.requireActual('@aws-sdk/client-secrets-manager');

	// Mock the SecretsManagerClient class
	return {
		...originalModule,
		SecretsManagerClient: jest.fn().mockImplementation(() => ({
			send: jest.fn().mockImplementation((command) => {
				if (command.input.SecretId === 'validSecretId') {
					return Promise.resolve({
						SecretString: JSON.stringify({ secretKey: 'secretValue' }),
					});
				}

				if (command.input.SecretId === 'emptySecret') {
					return Promise.resolve({
						SecretString: JSON.stringify({}),
					});
				}

				return Promise.reject(new Error('Secret not found'));
			}),
		})),
	};
});

describe('SecretsManager', () => {
	describe('get', () => {
		it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
			process.env.USE_CREDENTIALS = 'true';
			SecretsManager.getClient({});
			expect(SecretsManagerClient).toHaveBeenCalledWith(
				expect.objectContaining({
					credentials: 'iniCredentials',
				})
			);
		});

		it('returns a parsed secret when given a valid secret ID', async () => {
			const secret = await SecretsManager.get({ SecretId: 'validSecretId' });
			expect(secret).toEqual({ secretKey: 'secretValue' });
		});

		it('throws an error when the secret ID is invalid', async () => {
			await expect(SecretsManager.get({ SecretId: 'invalidSecretId' })).rejects.toThrow('Secret not found');
		});

		it('throws an error when the secret string is empty', async () => {
			await expect(SecretsManager.get({ SecretId: 'emptySecret' })).rejects.toThrow(
				"Secret string 'emptySecret' was empty."
			);
		});
	});
});
