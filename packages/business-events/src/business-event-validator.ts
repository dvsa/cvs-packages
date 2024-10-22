import { BusinessEvent } from './business-event';

export class BusinessEventValidator {
  error: boolean = false;
  message?: string;

  constructor(public payload: BusinessEvent) {}

  validate() {
    this.validateEventContainsTopic();
    this.validateEventContainsName();
  }

  validateEventContainsTopic() {
    if (!this.error && !this.payload.topicArn) {
      this.error = true;
      this.message = 'Business event requires a topic ARN';
    }
  }

  validateEventContainsName() {
    if (!this.error && !this.payload.event) {
      this.error = true;
      this.message = 'Business event requires an event name';
    }
  }
}
