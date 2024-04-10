import { unmarshall } from '@aws-sdk/util-dynamodb';
import { processRecord } from '../sqsFilter'; // Assuming unmarshall comes from aws-sdk

jest.mock('@aws-sdk/util-dynamodb', () => ({
  unmarshall: jest.fn(),
}));

describe('processRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unmarshall and return NewImage when event name matches and NewImage is present', () => {
    const newImageMock = { id: '1', name: 'Test Item' };
    const recordBody = {
      eventName: 'MODIFY',
      dynamodb: {
        NewImage: newImageMock,
      },
    };

    (unmarshall as jest.Mock).mockReturnValue(newImageMock);

    const result = processRecord(recordBody);

    expect(unmarshall).toHaveBeenCalledWith(newImageMock);
    expect(result).toEqual(newImageMock);
  });

  it('should return undefined and log a warning if event name does not match', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const recordBody = {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: { id: '2', name: 'Another Test Item' },
      },
    };

    const result = processRecord(recordBody);

    expect(result).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should return undefined and log a warning if NewImage is not present', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const recordBody = {
      eventName: 'MODIFY', // Matching event name
      dynamodb: {}, // Missing NewImage
    };

    const result = processRecord(recordBody);

    expect(result).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should handle malformed records gracefully', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const malformedRecord = {}; // Malformed record

    const result = processRecord(malformedRecord);

    expect(result).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});
