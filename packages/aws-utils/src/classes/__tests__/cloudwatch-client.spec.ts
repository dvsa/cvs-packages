import { CloudWatchLogsClient, StartQueryCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient } from '../cloudwatch-client';

jest.mock('@aws-sdk/credential-providers', () => ({
	fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

// Mock the entire CloudWatch Logs SDK module
jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
	const originalModule = jest.requireActual('@aws-sdk/client-cloudwatch-logs');

	// Mock the CloudWatchLogsClient class
	return {
		...originalModule,
		CloudWatchLogsClient: jest.fn().mockImplementation(() => ({
			send: jest.fn().mockImplementation((command) => {
				// Define mock behavior based on command input
				if (command instanceof StartQueryCommand && command.input.logGroupName === 'validLogGroup') {
					return Promise.resolve({
						queryId: 'mockedQueryId',
					});
				}

				return Promise.reject(new Error('Query failed'));
			}),
		})),
	};
});

describe('CloudWatchClient', () => {
	describe('startQuery', () => {
		it('successfully starts a query on CloudWatch Logs', async () => {
			const response = await CloudWatchClient.startQuery({
				logGroupName: 'validLogGroup',
				startTime: 0,
				endTime: 1,
				queryString: 'fields @timestamp, @message',
			});
			expect(response).toEqual({ queryId: 'mockedQueryId' });
		});

		it('throws an error when the query fails', async () => {
			const params = {
				logGroupName: 'invalidLogGroup',
				startTime: 0,
				endTime: 1,
				queryString: 'fields @timestamp, @message',
			};
			await expect(CloudWatchClient.startQuery(params)).rejects.toThrow('Query failed');
		});

		it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
			process.env.USE_CREDENTIALS = 'true';
			CloudWatchClient.getClient({});
			expect(CloudWatchLogsClient).toHaveBeenCalledWith(
				expect.objectContaining({
					credentials: 'iniCredentials',
				})
			);
		});
	});
});
