import { BusinessEvent } from './business-event';
import { BusinessEventValidationError } from './business-event-validation-error';

export class BusinessEventValidator {
	constructor(private readonly payload: BusinessEvent) {}

	validate(): void {
		this.validateEventContainsTopic();
		this.validateEventContainsName();
	}

	private validateEventContainsTopic(): void {
		if (!this.payload.topicArn) {
			throw new BusinessEventValidationError('Business event requires a topic ARN');
		}
	}

	private validateEventContainsName(): void {
		if (!this.payload.event) {
			throw new BusinessEventValidationError('Business event requires an event name');
		}
	}
}
