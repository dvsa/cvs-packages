import { PublishCommand } from '@aws-sdk/client-sns';

/**
 * A simple decorator for deserialising the publish command.
 */
export class BusinessEvent {
  public command: PublishCommand;

  /**
   * Creates a new business event with an initialised SNS publish command.
   * @param topicArn The topic ARN the event will be published to.
   * @param event The event name being published.
   * @param subType The event subtype being published.
   * @param contextAttributes Additional attributes relevant to the business event.
   */
  constructor(
    public topicArn: string,
    public event: string,
    public subType?: string,
    public contextAttributes?: Record<string, string>
  ) {
    this.command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify({
        event: this.event,
        subType: this.subType,
        contextAttributes: this.contextAttributes,
      }),
    });
  }
}
