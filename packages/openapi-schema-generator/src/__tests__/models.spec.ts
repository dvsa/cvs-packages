import { join } from 'node:path';
import { TypescriptToOpenApiSpec } from '../index';

describe('Generation of models', () => {
	let typescriptToOpenApiSpec: TypescriptToOpenApiSpec;
	const mockFilePath = join(process.cwd(), 'src/__mocks__/models.ts');
	const interfaceName = 'Model1';

	beforeEach(() => {
		typescriptToOpenApiSpec = new TypescriptToOpenApiSpec(mockFilePath);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should throw error if the interfaceName does not exist in the file path', async () => {
		const badInterfaceName = 'BadModel';

		try {
			await typescriptToOpenApiSpec.generateByName(badInterfaceName);
		} catch (err) {
			expect(err).toBeInstanceOf(Error);
			expect((err as Error).message).toEqual(`Interface ${badInterfaceName} not found in ${mockFilePath}`);
		}
	});

	it("should only create a schema and it's children for the interfaceName requested", async () => {
		const schemaObject = await typescriptToOpenApiSpec.generateByName(interfaceName);

		// Confirm that "Model1" exists in the result
		expect(Object.keys(schemaObject).some((key) => key === interfaceName)).toEqual(true);

		// Confirm that "Model2" does not exist in the result - "Model2" is not a child of "Model1"
		expect(Object.keys(schemaObject).some((key) => key !== 'Model2')).toEqual(true);
	});

	it('should create the full json schema without child models', async () => {
		const otherInterfaceName = 'Model2';

		const schemaObject = await typescriptToOpenApiSpec.generateByName(otherInterfaceName);

		expect(schemaObject).toEqual({
			Model2: {
				properties: {
					prop4: {
						type: 'string',
					},
					prop5: {
						type: 'number',
					},
					prop6: {
						type: 'boolean',
					},
				},
				required: ['prop4', 'prop5', 'prop6'],
				type: 'object',
			},
		});
	});

	it('should create the full json schema object with child models', async () => {
		const schemaObject = await typescriptToOpenApiSpec.generateByName(interfaceName);

		expect(schemaObject).toEqual({
			DecConst: {
				enum: ['A', 'B'],
				type: 'string',
			},
			Model1: {
				properties: {
					decConst: {
						$ref: '#/components/schemas/DecConst',
					},
					prop1: {
						type: 'string',
					},
					prop2: {
						type: 'number',
					},
					prop3: {
						type: 'boolean',
					},
					propMod3: {
						$ref: '#/components/schemas/Model3',
					},
				},
				required: ['prop1', 'prop2', 'prop3', 'propMod3', 'decConst'],
				type: 'object',
			},
			Model3: {
				properties: {
					prop7: {
						type: 'string',
					},
					prop8: {
						type: 'number',
					},
					prop9: {
						type: 'boolean',
					},
					propMod4: {
						$ref: '#/components/schemas/Model4',
					},
				},
				required: ['prop7', 'prop8', 'prop9', 'propMod4'],
				type: 'object',
			},
			Model4: {
				properties: {
					prop10: {
						type: 'string',
					},
					prop11: {
						type: 'number',
					},
					prop12: {
						type: 'boolean',
					},
					propMod5: {
						$ref: '#/components/schemas/Model5',
					},
				},
				required: ['prop10', 'prop11', 'prop12', 'propMod5'],
				type: 'object',
			},
			Model5: {
				properties: {
					prop13: {
						type: 'string',
					},
					prop14: {
						type: 'number',
					},
					prop15: {
						type: 'boolean',
					},
				},
				required: ['prop13', 'prop14', 'prop15'],
				type: 'object',
			},
		});
	});
});
