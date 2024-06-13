import { unmarshall } from '@aws-sdk/util-dynamodb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processRecord = (recordBody: any, eventName: string = 'MODIFY') => {
  if (recordBody.eventName === eventName && recordBody.dynamodb && recordBody.dynamodb.NewImage) {
    return unmarshall(recordBody.dynamodb.NewImage);
  }
  console.warn(`process filtered to undefined, record is ${JSON.stringify(recordBody)}`);
  return undefined;
};
