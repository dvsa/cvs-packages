import { unmarshall } from '@aws-sdk/util-dynamodb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processRecord = (record: any) => {
  const recordBody = JSON.parse(JSON.parse(record.body).Message);
  if (recordBody.eventName === 'MODIFY' && recordBody.dynamodb && recordBody.dynamodb.NewImage) {
    return unmarshall(recordBody.dynamodb.NewImage);
  }
  console.warn(`process filtered to undefined, record is ${JSON.stringify(recordBody)}`);
  return undefined;
};
