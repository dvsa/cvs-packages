export class EnvironmentVariables {
	/**
	 * Get a value from the environment, or throw
	 * @param {string} key - The key to get the value for
	 * @return {string}
	 */
	static get(key: string): string {
		return EnvironmentVariables.throwIfNotPresent(process.env[key], key);
	}

	/**
	 * Check for a values existence, or return a default
	 * @returns The value or default
	 * @param value
	 * @param defaultValue
	 */
	static defaultIfNotPresent<T>(value: string | null | undefined, defaultValue: T): T {
		if (!value || value?.trim().length === 0) {
			return defaultValue;
		}
		return value as T;
	}

	/**
	 * Check for a values existence, or throw an error
	 * @returns The value or error containing configKey
	 * @param value
	 * @param configKey
	 */
	static throwIfNotPresent<T>(value: string | null | undefined, configKey: string): T {
		if (!value || value?.trim().length === 0) {
			throw new Error(`Configuration item ${configKey} was not provided with a value`);
		}
		return value as T;
	}
}
