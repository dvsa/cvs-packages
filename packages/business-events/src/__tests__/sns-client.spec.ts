const xrayMock = jest.fn();

import { randomUUID } from 'node:crypto';
import { SNSClient } from '@aws-sdk/client-sns';
import { BusinessEventPublisher } from '../event-publisher';
import { TestSystemEventFactory } from './test-system-event-factory';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-sns', () => {
	const originalModule = jest.requireActual('@aws-sdk/client-sns');

	return {
		...originalModule,
		SNSClient: jest.fn().mockImplementation(() => ({
			send: sendMock,
		})),
	};
});

jest.mock('@aws-sdk/credential-providers', () => ({
	fromIni: jest.fn().mockReturnValue('iniCredentials'),
}));

jest.mock('aws-xray-sdk', () => ({
	captureAWSv3Client: xrayMock,
}));

describe('BusinessEvents', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const correlationId = randomUUID();
	const sqsRecord = { body: JSON.stringify({ correlationId }) };
	const apiEvent = { headers: { 'X-Correlation-ID': correlationId } };
	const originalEnv = process.env;

	beforeEach(() => {
		// Clear all instances and calls to constructor and all methods:
		sendMock.mockClear();
		xrayMock.mockClear();
		consoleErrorSpy.mockClear();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv; // Restore the original process.env
	});

	describe('initialise', () => {
		it('should not use credentials from ini file when USE_CREDENTIALS is false', () => {
			BusinessEventPublisher.getClient();
			expect(SNSClient).toHaveBeenCalledWith(
				expect.not.objectContaining({
					credentials: 'iniCredentials',
				})
			);
		});

		it('should use credentials from ini file when USE_CREDENTIALS is true', () => {
			process.env.USE_CREDENTIALS = 'true';
			BusinessEventPublisher.getClient();
			expect(SNSClient).toHaveBeenCalledWith(
				expect.objectContaining({
					credentials: 'iniCredentials',
				})
			);
		});

		it('should use not x-ray when _X_AMZN_TRACE_ID is false', () => {
			BusinessEventPublisher.getClient();
			expect(xrayMock).not.toHaveBeenCalled();
		});

		it('should use x-ray when _X_AMZN_TRACE_ID is true', () => {
			process.env._X_AMZN_TRACE_ID = 'true';
			BusinessEventPublisher.getClient();
			expect(xrayMock).toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('creates an extended factory event from an sqs event', async () => {
			const event = TestSystemEventFactory.fromSqsRecord(sqsRecord).validDomainEvent('custom-attribute');

			expect(event).toEqual(
				expect.objectContaining({
					topicArn: 'DOMAIN_EVENT_ARN',
					event: 'EVENT',
					subType: 'SUBTYPE',
					contextAttributes: expect.objectContaining({
						customContextAttribute: 'custom-attribute',
						correlationId,
					}),
				})
			);
		});

		it('creates an extended factory event from an api gateway proxy event', async () => {
			const event = TestSystemEventFactory.fromApiProxyEvent(apiEvent).validDomainEvent('custom-attribute');

			expect(event).toEqual(
				expect.objectContaining({
					topicArn: 'DOMAIN_EVENT_ARN',
					event: 'EVENT',
					subType: 'SUBTYPE',
					contextAttributes: expect.objectContaining({
						customContextAttribute: 'custom-attribute',
						correlationId,
					}),
				})
			);
		});
	});

	describe('publish', () => {
		it('successfully publishes a business event', async () => {
			sendMock.mockResolvedValueOnce({ MessageId: '1234' });

			const validSqsPayload = TestSystemEventFactory.fromSqsRecord(sqsRecord).validDomainEvent('custom-attribute');
			const response = await BusinessEventPublisher.publish(validSqsPayload);

			expect(response).toEqual({ MessageId: '1234' });
			expect(sendMock).toHaveBeenCalledWith(validSqsPayload.command);
		});

		it('logs an error when publishing throws an error', async () => {
			const error = new Error('SNS error');
			sendMock.mockImplementation(() => {
				throw error;
			});

			const validSqsPayload = TestSystemEventFactory.fromSqsRecord(sqsRecord).validDomainEvent('custom-attribute');
			await BusinessEventPublisher.publish(validSqsPayload);

			expect(sendMock).toHaveBeenCalledWith(validSqsPayload.command);
			expect(consoleErrorSpy).toHaveBeenCalledWith(error);
		});

		it('logs an error when publishing without a topic arn', async () => {
			const invalidPayload = TestSystemEventFactory.fromSqsRecord(sqsRecord).invalidEventMissingArn();

			await BusinessEventPublisher.publish(invalidPayload);
			expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Business event requires a topic ARN'));
		});

		it('logs an error when publishing without an event name', async () => {
			const invalidPayload = TestSystemEventFactory.fromSqsRecord(sqsRecord).invalidEventMissingName();

			await BusinessEventPublisher.publish(invalidPayload);
			expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Business event requires an event name'));
		});
	});
});
