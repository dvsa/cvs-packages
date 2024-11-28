import { APIGatewayProxyEvent, SQSRecord } from 'aws-lambda';
import { BusinessEvent } from './business-event';

/**
 * A base event factory that can be extended to create domain (system) specific business events
 * from common event types (SQS record, Api proxy requests).
 */
export class EventFactory {
	protected constructor(private readonly correlationId: string) {}

	/**
	 * Creates an event factory and initialises it from an SQS record.
	 * Note: A correlationId must be provided in the record body property.
	 * @param this The extended event factory to create.
	 * @param record The SQS record used to initialise the event factory.
	 * @returns An instance of the extended event factory (matches the type of the argument: this).
	 */
	static fromSqsRecord<T extends EventFactory>(this: new (id: string) => T, record: Pick<SQSRecord, 'body'>): T {
		const correlationId = JSON.parse(record.body).correlationId;
		// biome-ignore lint: lint/complexity/noThisInStatic
		return new this(correlationId);
	}

	/**
	 * Creates an event factory and initialises it from an Api Gateway Proxy event.
	 * Note: A X-Correlation-ID header value must be provided in the event headers property.
	 * @param this The extended event factory to create.
	 * @param event The Api Gateway Proxy event used to initialise the event factory.
	 * @returns An instance of the extended event factory (matches the type of the argument: this).
	 */
	static fromApiProxyEvent<T extends EventFactory>(
		this: new (
			id: string
		) => T,
		event: Pick<APIGatewayProxyEvent, 'headers'> & { headers: { 'X-Correlation-ID': string } }
	): T {
		const correlationId = event.headers['X-Correlation-ID'];
		// biome-ignore lint: lint/complexity/noThisInStatic
		return new this(correlationId);
	}

	/**
	 * Creates a business event that can be used for publishing.
	 * @param arn The topic ARN to publish to.
	 * @param event The name of the event being published.
	 * @param subType The subtype of the event being published.
	 * @param contextAttributes Additional context attributes relevant to the event.
	 * The correlationId will be included by default.
	 * @returns A hydrated business event that can be published.
	 */
	create(arn: string, event: string, subType?: string, contextAttributes?: Record<string, string>) {
		return new BusinessEvent(arn, event, subType, {
			correlationId: this.correlationId,
			...contextAttributes,
		} as Record<string, string>);
	}
}
