# @dvsa/business-events

Helper library for publishing business events.

## Pre-requisites

- Node.js (Please see `.nvmrc` in the root of the repo for a specific version)
- `npm` (If using [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm), this will be automatically managed)
- Security
  - [Git secrets](https://github.com/awslabs/git-secrets)
  - [ScanRepo](https://github.com/UKHomeOffice/repo-security-scanner)
    - Unzip `repo-security-scanner_<version>_Darwin_<architecture>.tar.gz` and rename the executable inside the folder
      to `scanrepo` - Add executable to path (using `echo $PATH` to find your path)

## Getting started

### Run the following command after cloning the project

1. `npm install` (or `npm i`)

## Using this package

Extend the `EventFactory` class as demonstrated in the `TestSystemEventFactory` class. This pattern will allow the encapsulation of all business events for a particular domain e.g.

```typescript
export class EnquirySystemEventFactory extends EventFactory {
  constructor(correlationId: string) {
    super(correlationId);
  }

  public feedJobInitiated = (feedType: string) =>
    super.create('ENQ_SYSTEM_DOMAIN_EVENTS', 'ENQ_UPDATE_NOP_INITIATED', feedType);
}
```

With a domain-specific event factory, generate a business event and call the `BusinessEventPublisher.publish` function.

```typescript
const feedJobInitiatedEvent =
  EnquirySystemEventFactory.fromSqsRecord(sqsRecord).feedJobInitiated('evl');
BusinessEventPublisher.publish(feedJobInitiatedEvent);
```

### Recommendations

Publishing business events should not impact the operation of a system. Failures should be logged and monitored, however the system should not respond to any errors in a way that impacts the expected behaviour of the system.
