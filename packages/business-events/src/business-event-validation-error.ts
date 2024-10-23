export class BusinessEventValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BusinessEventValidationError';
	}
}
