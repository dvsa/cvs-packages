import { EnvironmentVariables } from '../env-vars';

describe('EnvironmentVariables', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...originalProcessEnv }; // make a copy
  });

  afterAll(() => {
    process.env = originalProcessEnv; // restore original env
  });

  describe('get', () => {
    it('should return the value of an existing environment variable', () => {
      process.env.TEST_VAR = 'testValue';
      expect(EnvironmentVariables.get('TEST_VAR')).toEqual('testValue');
    });

    it('should throw an error if the environment variable does not exist', () => {
      expect(() => EnvironmentVariables.get('NON_EXISTENT_VAR')).toThrow('Configuration item NON_EXISTENT_VAR was not provided with a value');
    });
  });

  describe('defaultIfNotPresent', () => {
    it('should return the default value if the input is undefined', () => {
      expect(EnvironmentVariables.defaultIfNotPresent(undefined, 'defaultValue')).toEqual('defaultValue');
    });

    it('should return the default value if the input is null', () => {
      expect(EnvironmentVariables.defaultIfNotPresent(null, 'defaultValue')).toEqual('defaultValue');
    });

    it('should return the default value if the input is an empty string', () => {
      expect(EnvironmentVariables.defaultIfNotPresent('', 'defaultValue')).toEqual('defaultValue');
    });

    it('should return the input value if it is present', () => {
      expect(EnvironmentVariables.defaultIfNotPresent('inputValue', 'defaultValue')).toEqual('inputValue');
    });
  });

  describe('throwIfNotPresent', () => {
    it('should throw an error if the value is undefined', () => {
      expect(() => EnvironmentVariables.throwIfNotPresent(undefined, 'configKey')).toThrow('Configuration item configKey was not provided with a value');
    });

    it('should throw an error if the value is null', () => {
      expect(() => EnvironmentVariables.throwIfNotPresent(null, 'configKey')).toThrow('Configuration item configKey was not provided with a value');
    });

    it('should throw an error if the value is an empty string', () => {
      expect(() => EnvironmentVariables.throwIfNotPresent('', 'configKey')).toThrow('Configuration item configKey was not provided with a value');
    });

    it('should return the value if it is present', () => {
      expect(EnvironmentVariables.throwIfNotPresent('validValue', 'configKey')).toEqual('validValue');
    });
  });
});
