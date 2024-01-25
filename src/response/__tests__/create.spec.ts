import { Response } from '../create';
import { HttpStatus } from '../../api/http-status-codes';

describe('Response', () => {
  const MOCKS = {
    HEADERS: { 'Content-Type': 'application/json' },
    PAYLOAD: { key: 'hello' },
  };

  it('should return an object with a body', () => {
    // ACT
    const resp = Response.status(HttpStatus.FORBIDDEN).payload({
      message: 'Forbidden',
    });
    // ASSERT
    expect(resp.body).toEqual('{"message":"Forbidden"}');
    expect(resp.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should return an object with a null body', () => {
    // ACT
    const resp = Response.status(HttpStatus.OK).payload(null);
    // ASSERT
    expect(resp.body).toEqual(null);
    expect(resp.statusCode).toEqual(HttpStatus.OK);
  });

  it('should return an object with a body that was JSON.stringified', () => {
    // ACT
    const resp = Response.status(HttpStatus.OK).payload(MOCKS.PAYLOAD);
    // ASSERT
    expect(resp).toEqual({
      statusCode: 200,
      body: JSON.stringify(MOCKS.PAYLOAD),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });

  it('should return an object with a body & headers', () => {
    // ACT
    const resp = Response.status(200)
      .headers(MOCKS.HEADERS)
      .payload(MOCKS.PAYLOAD);
    // ASSERT
    expect(resp).toEqual({
      statusCode: 200,
      body: JSON.stringify(MOCKS.PAYLOAD),
      headers: { 'Access-Control-Allow-Origin': '*', ...MOCKS.HEADERS },
    });
  });
});
