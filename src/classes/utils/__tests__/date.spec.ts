import { DateTime } from '../date';

const mockDate = '2024-01-26';

jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  // Mock the current time to a fixed point for consistent testing
  return jest.fn(() => originalDayjs(`${mockDate}T00:00:00.000Z`));
});

describe('DateTime', () => {
  describe('constructor and at static method', () => {
    it('should create an instance with the current date when no argument is provided', () => {
      const dateTime = new DateTime();
      expect(dateTime.toISOString()).toEqual(`${mockDate}T00:00:00.000Z`);
    });

    it('should create an instance from a string', () => {
      const dateTime = new DateTime(mockDate);
      expect(dateTime.toISOString()).toContain(mockDate);
    });

    it('should create an instance from a Date object', () => {
      const date = new Date(mockDate);
      const dateTime = new DateTime(date);
      expect(dateTime.toISOString()).toContain(mockDate);
    });

    it('should create an instance from another DateTime instance', () => {
      const original = new DateTime(mockDate);
      const dateTime = new DateTime(original);
      expect(dateTime.toISOString()).toContain(mockDate);
    });

    it('static at method should create a new DateTime instance', () => {
      const dateTime = DateTime.at(mockDate);
      expect(dateTime.toISOString()).toContain(mockDate);
    });
  });

  describe('manipulation methods', () => {
    it('should add days correctly', () => {
      const dateTime = new DateTime(mockDate).add(1, 'day');
      expect(dateTime.format('YYYY-MM-DD')).toEqual('2024-01-27');
    });

    it('should subtract days correctly', () => {
      const dateTime = new DateTime(mockDate).subtract(1, 'day');
      expect(dateTime.format('YYYY-MM-DD')).toEqual('2024-01-25');
    });
  });

  describe('formatting', () => {
    it('should format the date correctly', () => {
      const dateTime = new DateTime(mockDate);
      expect(dateTime.format('YYYY-MM-DD')).toEqual(mockDate);
    });
  });

  describe('static methods', () => {
    it('today should return the current date', () => {
      const today = DateTime.today();
      expect(today.toISOString()).toContain(`${mockDate}T00:00:00.000Z`);
    });
  });
});
