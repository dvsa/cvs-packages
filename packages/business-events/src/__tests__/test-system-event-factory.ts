import { EventFactory } from '../event-factory';

/**
 * Enables creation of business events at a system level.
 */
export class TestSystemEventFactory extends EventFactory {
  constructor(correlationId: string) {
    super(correlationId);
  }

  /** The topic ARN to publish internal domain events - these are not visible outside the publishing system */
  domainEventArn: string = 'DOMAIN_EVENT_ARN';

  /** The topic ARN to publish external domain events - these are visible outside the publishing system */
  coDomainEventArn: string = 'CODOMAIN_EVENT_ARN';

  /**
   * An example of a valid domain event.
   * @param customContextAttribute The custom context attributes to publish with the business event.
   * @returns A valid domain event.
   */
  public validDomainEvent = (customContextAttribute: string) =>
    super.create(this.domainEventArn, 'EVENT', 'SUBTYPE', { customContextAttribute });

  public invalidEventMissingArn = () => super.create('', 'EVENT', 'SUBTYPE');
  public invalidEventMissingName = () => super.create('ARN', '', 'SUBTYPE');
}
