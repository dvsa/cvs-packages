import { APIGatewayProxyResult } from 'aws-lambda';
import { HttpStatus } from '../api/http-status-codes';
import { AccessControl } from './access-control';

export class Response {
	/**
	 * Response object creation helper
	 * @param {HttpStatus} statusCode - Defaults to 'OK' / 200 status
	 * @returns {JsonResponse}
	 */
	static status(statusCode: HttpStatus): JsonResponse {
		return new JsonResponse(statusCode);
	}
}

class JsonResponse {
	private responseHeaders: Record<string, string> = {};

	constructor(private statusCode: HttpStatus) {}

	/**
	 * Add headers object to the response object
	 */
	headers(headers: Record<string, string>): JsonResponse {
		this.responseHeaders = { ...this.responseHeaders, ...headers };
		return this;
	}

	/**
	 * Add a payload to the response object
	 * @param body - Response body which will be stringified if it's not null
	 * @returns {APIGatewayProxyResult}
	 */
	payload<T>(body: T): APIGatewayProxyResult {
		return {
			statusCode: this.statusCode,
			body: body === null ? null : JSON.stringify(body),
			headers: {
				...AccessControl.OriginHeader.AllowAll,
				...this.responseHeaders,
			},
		} as unknown as APIGatewayProxyResult;
	}
}
