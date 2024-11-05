import { TypescriptToOpenApiSpec } from '../index';

jest.mock('fs');
jest.mock('typescript', () => ({
	createProgram: jest.fn(),
	forEachChild: jest.fn(),
	isInterfaceDeclaration: jest.fn(),
	isPropertySignature: jest.fn(),
}));

describe('TypescriptToOpenApiSpec', () => {
	let typescriptToOpenApiSpec: TypescriptToOpenApiSpec;
	const mockFilePath = '/path/to/mock/file.ts';

	beforeEach(() => {
		typescriptToOpenApiSpec = new TypescriptToOpenApiSpec(mockFilePath);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('generateMany', () => {
		it('should generate OpenAPI schema from TypeScript interfaces', async () => {
			// Mock the extractDefinitions method
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			jest.spyOn(typescriptToOpenApiSpec as any, 'extractDefinitions').mockReturnValue({
				User: {
					id: 'number',
					name: 'string',
					isActive: 'boolean',
					roles: 'string[]',
				},
			});

			const result = await typescriptToOpenApiSpec.generateMany();

			expect(result).toEqual({
				User: {
					properties: {
						id: { type: 'number' },
						isActive: { type: 'boolean' },
						name: { type: 'string' },
						roles: { items: { type: 'string' }, type: 'array' },
					},
					required: ['id', 'name', 'isActive', 'roles'],
					type: 'object',
				},
			});
		});
	});

	describe('dereferenceArrays', () => {
		it('should dereference array types', () => {
			const input = {
				Users: { $ref: 'User[]' },
				User: {
					type: 'object',
					properties: {
						id: { type: 'number' },
						name: { type: 'string' },
					},
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const result = (typescriptToOpenApiSpec as any).dereferenceArrays(input);

			expect(result).toEqual({
				Users: {
					type: 'array',
					items: { $ref: 'User' },
				},
				User: {
					type: 'object',
					properties: {
						id: { type: 'number' },
						name: { type: 'string' },
					},
				},
			});
		});
	});

	describe('dictToOpenAPI', () => {
		it('should convert TypeScript interface to OpenAPI schema', () => {
			const input = {
				id: 'number',
				name: 'string',
				'email?': 'string',
			};

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const result = (typescriptToOpenApiSpec as any).dictToOpenAPI(input);

			expect(result).toEqual({
				type: 'object',
				properties: {
					id: { type: 'number' },
					name: { type: 'string' },
					email: { type: 'string' },
				},
				required: ['id', 'name'],
			});
		});
	});

	describe('typeToSchemaObject', () => {
		it('should convert TypeScript types to OpenAPI schema objects', () => {
			const testCases = [
				{ input: 'string', expected: { type: 'string' } },
				{ input: 'number', expected: { type: 'number' } },
				{ input: 'boolean', expected: { type: 'boolean' } },
				{ input: 'User', expected: { $ref: '#/components/schemas/User' } },
				{ input: 'string[]', expected: { type: 'array', items: { type: 'string' } } },
			];

			for (const { input, expected } of testCases) {
				// biome-ignore lint/suspicious/noExplicitAny: ignoring for spec
				const result = (typescriptToOpenApiSpec as any).typeToSchemaObject(input);
				expect(result).toEqual(expected);
			}
		});
	});

	describe('extractDefinitions', () => {
		it('should extract definitions from TypeScript file', () => {
			// Mock the TypeScript compiler API
			const mockProgram = {
				getSourceFile: jest.fn().mockReturnValue({}),
				getTypeChecker: jest.fn().mockReturnValue({}),
			};
			(require('typescript').createProgram as jest.Mock).mockReturnValue(mockProgram);

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			jest.spyOn(typescriptToOpenApiSpec as any, 'visitNode').mockImplementation();

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(typescriptToOpenApiSpec as any).extractDefinitions(mockFilePath);

			expect(require('typescript').createProgram).toHaveBeenCalledWith([mockFilePath], {});
			expect(mockProgram.getSourceFile).toHaveBeenCalledWith(mockFilePath);
			expect(mockProgram.getTypeChecker).toHaveBeenCalled();
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			expect((typescriptToOpenApiSpec as any).visitNode).toHaveBeenCalled();
		});
	});
});
