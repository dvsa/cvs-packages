import { Connection } from 'mysql2/promise';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import MyBatis, { Params } from 'mybatis-mapper';

export class MyBatisSession {
  /**
   * This class will instantiate a list of mappers via a MyBatis plugin
   * @param {Connection} connection - MySQL connection object
   * @param {string} namespace - Namespace of the mapper
   * @param {string[]} mappers - File paths to the mappers
   * @param {boolean} debugMode - Debug mode will log the SQL query created
   */
  constructor(
    private connection: Connection,
    private namespace: string,
    private mappers: string[],
    private debugMode: boolean = false
  ) {
    MyBatis.createMapper(this.mappers);
  }

  /**
   * Query a MySQL database
   * @param {string} mapperId - Mapper ID
   * @param {Params} params - Query parameters
   * @return {Promise<unknown[]>}
   */
  async select(mapperId: string, params: Params): Promise<unknown[]> {
    let query: string = '';

    try {
      query = MyBatis.getStatement(this.namespace, mapperId, params, {
        language: 'sql',
        indent: '  ',
      });
    } catch (err) {
      throw {
        error: err,
        message: `[ERROR]: MyBatis.getStatement for namespace: ${this.namespace} & mapperID: ${mapperId}.`,
      };
    }

    if (this.debugMode) {
      console.log(
        `*** Query for namespace: ${this.namespace} & mapperID: ${mapperId} ***`
      );
      console.log(query);
      console.log('\n***');
    }

    const [rows] = await this.connection.query(query);

    return rows as unknown[];
  }

  /**
   * Query a MySQL database and map the result to a single model
   * @template T
   * @param {string} mapperId - Mapper ID
   * @param {Params} params - Query parameters
   * @param {ClassConstructor<T>} model - Model class
   * @return {Promise<T>}
   */
  async selectOne<T>(
    mapperId: string,
    params: Params,
    model: ClassConstructor<T>
  ): Promise<T | undefined> {
    const rows = await this.selectList(mapperId, params, model);
    return rows[0];
  }

  /**
   * Query a MySQL database and map the result to a model list
   * @template T
   * @param {string} mapperId - Mapper ID
   * @param {Params} params - Query parameters
   * @param {ClassConstructor<T>} model - Model class
   * @return {Promise<T[]>}
   */
  async selectList<T>(
    mapperId: string,
    params: Params,
    model: ClassConstructor<T>
  ): Promise<T[]> {
    const rows = await this.select(mapperId, params);
    return rows.map((row) => plainToInstance(model, row));
  }

  /**
   * Query a MySQL database, and on error return empty array with error logged
   * @template T
   * @param {string} mapperId - Mapper ID
   * @param {Params} params - Query parameters
   * @param {ClassConstructor<T>} model - Model class
   * @return {Promise<T[]>}
   */
  async selectAndCatchSilently<T>(
    mapperId: string,
    params: Params,
    model: ClassConstructor<T>
  ): Promise<T[]> {
    try {
      return await this.selectList(mapperId, params, model);
    } catch (error) {
      console.error('[ERROR]: selectAndCatchSilently', error);
      return [];
    }
  }

  /**
   * Get the MySQL connection object
   * @return {Connection}
   */
  get getConnection(): Connection {
    return this.connection;
  }

  /**
   * End the MySQL connection
   * @return {Promise<void>}
   */
  async end(): Promise<void> {
    await this.connection.end();
  }
}
