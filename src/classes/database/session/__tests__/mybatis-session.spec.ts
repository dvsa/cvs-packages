import { plainToInstance } from 'class-transformer';
import MyBatis from 'mybatis-mapper';
import { MyBatisSession } from '../mybatis-session';
import MySQL, { Connection } from 'mysql2/promise';

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[]]), // Mock a query method that resolves with an empty array
    end: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('mybatis-mapper', () => ({
  createMapper: jest.fn(),
  getStatement: jest.fn().mockReturnValue('Mock SQL Statement'),
}));

jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((_cls, obj) => obj),
}));

describe('MyBatisSession', () => {
  let mockSession: MyBatisSession;
  let mockConnection: Connection;

  beforeEach(async () => {
    mockConnection = await MySQL.createConnection({});
    mockSession = new MyBatisSession(
      mockConnection,
      'testNamespace',
      ['path/to/mapper'],
      false
    );
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  test('select executes a query and returns results', async () => {
    const results = await mockSession.select('testMapper', {});
    expect(MyBatis.getStatement).toHaveBeenCalledWith(
      'testNamespace',
      'testMapper',
      {},
      expect.anything()
    );
    expect(mockConnection.query).toHaveBeenCalledWith('Mock SQL Statement');
    expect(results).toEqual([]);
  });

  test('selectOne returns the first result of selectList', async () => {
    const mockResult = { id: 1, name: 'Test' };
    jest.spyOn(mockSession, 'selectList').mockResolvedValue([mockResult]);

    const result = await mockSession.selectOne('testMapper', {}, class {});
    expect(mockSession.selectList).toHaveBeenCalledWith(
      'testMapper',
      {},
      expect.any(Function)
    );
    expect(result).toEqual(mockResult);
  });

  test('selectList maps rows to instances of the model', async () => {
    const mockResults = [{ id: 1, name: 'Test' }];
    jest.spyOn(mockSession, 'select').mockResolvedValue(mockResults);

    const results = await mockSession.selectList('testMapper', {}, class {});
    expect(mockSession.select).toHaveBeenCalledWith('testMapper', {});
    expect(plainToInstance).toHaveBeenCalledTimes(mockResults.length);
    expect(results).toEqual(mockResults);
  });

  test('selectAndCatchSilently catches errors and logs them', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    jest
      .spyOn(mockSession, 'selectList')
      .mockRejectedValue(new Error('Test Error'));

    const results = await mockSession.selectAndCatchSilently(
      'testMapper',
      {},
      class {}
    );
    expect(console.error).toHaveBeenCalledWith(
      '[ERROR]: selectAndCatchSilently',
      expect.any(Error)
    );
    expect(results).toEqual([]);
    consoleSpy.mockRestore(); // Restore console.error after this test
  });

  test('end closes the MySQL connection', async () => {
    await mockSession.end();
    expect(mockConnection.end).toHaveBeenCalled();
  });
});
