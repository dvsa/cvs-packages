import { DateTime } from '../date';

const mockDate = '2024-01-26';

jest.mock('dayjs', () => {
	const originalDayjs = jest.requireActual('dayjs'); // Get the original dayjs
	const customDayjs = (...args: unknown[]) => originalDayjs(...args);

	// Copy properties and methods from the original dayjs to the custom instance
	Object.assign(customDayjs, originalDayjs);

	// Override the default behavior to use a fixed date, if needed
	customDayjs.extend = originalDayjs.extend; // Ensure extend function is available
	customDayjs.utc = jest.fn(() => originalDayjs(`${mockDate}T00:00:00.000Z`));

	// Return the custom dayjs instance
	return customDayjs;
});

describe('DateTime', () => {
	describe('constructor and at static method', () => {
		it('should create an instance with the current date when no argument is provided', () => {
			const dateTime = new DateTime();
			expect(dateTime.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}(?:T[0-9:.TZ-]+)?/);
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
			expect(dateTime?.toISOString()).toContain(mockDate);
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
			expect(today.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}(?:T[0-9:.TZ-]+)?/);
		});
	});

	describe('day', () => {
		it('should return the day (numerical) of the week', () => {
			const dateTime = new DateTime(mockDate);
			expect(dateTime.day()).toEqual(5);
		});
	});

	describe('toString', () => {
		it('should return the date as a string', () => {
			const dateTime = new DateTime(mockDate);
			expect(dateTime.toString()).toEqual('Fri, 26 Jan 2024 00:00:00 GMT');
		});
	});
});
