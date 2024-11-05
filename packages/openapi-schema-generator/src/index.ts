import { type SchemaObject } from 'openapi3-ts/oas30';
import {
  createProgram,
  forEachChild,
  isClassDeclaration,
  isInterfaceDeclaration,
  isPropertyDeclaration,
  isPropertySignature,
  type Node as TypescriptNode,
  type TypeChecker,
} from 'typescript';

type OpenAPIDataType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface OpenAPISchemaObjectBase extends SchemaObject {
	type?: OpenAPIDataType;
}

interface OpenAPIObjectSchemaObject extends OpenAPISchemaObjectBase {
	type: 'object';
	properties: Record<string, SchemaObject>;
	required?: string[];
}

interface OpenAPIArraySchemaObject extends OpenAPISchemaObjectBase {
	type: 'array';
	items: SchemaObject;
}

interface OpenAPIRefSchemaObject extends OpenAPISchemaObjectBase {
	$ref: string;
}

type SpecificOpenAPISchemaObject = OpenAPIObjectSchemaObject | OpenAPIArraySchemaObject | OpenAPIRefSchemaObject;

export class TypescriptToOpenApiSpec {
	/**
	 * Path to the file containing TypeScript interfaces
	 */
	private readonly pathToFile: string;

	public constructor(pathToFile: string) {
		this.pathToFile = pathToFile;
	}

	/**
	 * Generate many OpenAPI schemas from TypeScript interfaces
	 */
	async generateMany(): Promise<OpenAPIObjectSchemaObject> {
		const definitions = this.extractDefinitions(this.pathToFile);

		const schemas = Object.fromEntries(
			Object.entries(definitions).map(([name, def]) => [name, this.dictToOpenAPI(def)])
		);

		return this.dereferenceArrays(schemas) as unknown as OpenAPIObjectSchemaObject;
	}

	/**
	 * Generate a single OpenAPI schema from a TypeScript interface
	 * @param interfaceName
	 */
	async generateByName(interfaceName: string): Promise<OpenAPIObjectSchemaObject> {
		const definitions = this.extractDefinitions(this.pathToFile, interfaceName);

		const schemas = Object.fromEntries(
			Object.entries(definitions)
				.map(([name, def]) => [name, this.dictToOpenAPI(def)])
				.filter(([name]) => name === interfaceName)
		);

		return this.dereferenceArrays(schemas) as unknown as OpenAPIObjectSchemaObject;
	}

	/**
	 * Dereference arrays in the schema
	 * @param {Record<string, SpecificOpenAPISchemaObject>} obj
	 * @returns {Record<string, SpecificOpenAPISchemaObject>}
	 * @private
	 */
	private dereferenceArrays(
		obj: Record<string, SpecificOpenAPISchemaObject>
	): Record<string, SpecificOpenAPISchemaObject> {
		const result: Record<string, SpecificOpenAPISchemaObject> = {};

		for (const [key, value] of Object.entries(obj)) {
			if ('$ref' in value && typeof value.$ref === 'string') {
				const refValue = value.$ref;
				if (refValue.endsWith('[]')) {
					result[key] = {
						type: 'array',
						items: { $ref: refValue.slice(0, -2) },
					};
				} else {
					result[key] = value;
				}
			} else if (value.type === 'object' && value.properties) {
				result[key] = {
					...value,
					properties: this.dereferenceArrays(value.properties as Record<string, SpecificOpenAPISchemaObject>),
				};
			} else if (value.type === 'array' && value.items) {
				result[key] = {
					...value,
					// @ts-ignore
					items: this.dereferenceArrays({ item: value.items }).item,
				};
			} else {
				result[key] = value;
			}
		}

		return result;
	}

	/**
	 * Convert TypeScript interface to OpenAPI schema
	 * @param {Record<string, string>} interfaceObj
	 * @returns {OpenAPIObjectSchemaObject}
	 * @private
	 */
	private dictToOpenAPI(interfaceObj: Record<string, string>): OpenAPIObjectSchemaObject {
		const properties: Record<string, SchemaObject> = {};
		const required: string[] = [];

		for (const [key, value] of Object.entries(interfaceObj)) {
			const isRequired = !key.endsWith('?');
			const propertyName = isRequired ? key : key.slice(0, -1);

			if (isRequired) {
				required.push(propertyName);
			}

			properties[propertyName] = this.typeToSchemaObject(value);
		}

		return {
			type: 'object',
			properties,
			required: required.length > 0 ? required : undefined,
		};
	}

	/**
	 * Convert TypeScript type to OpenAPI schema object
	 * @param {string} value
	 * @returns {SchemaObject | OpenAPIRefSchemaObject}
	 * @private
	 */
	private typeToSchemaObject(value: string): SchemaObject | OpenAPIRefSchemaObject {
		switch (value) {
			case 'string':
				return { type: 'string' };
			case 'number':
				return { type: 'number' };
			case 'boolean':
				return { type: 'boolean' };
			default:
				if (value.endsWith('[]')) {
					return {
						type: 'array',
						items: this.typeToSchemaObject(value.slice(0, -2)),
					};
				}
				return { $ref: `#/components/schemas/${value}` };
		}
	}

	/**
	 * Extract definition from the TypeScript file and convert to a dictionary
	 * @param {string} filePath
	 * @param {string} interfaceName - optional name if only requesting a single interface to be converted
	 * @returns {Record<string, Record<string, string>>}
	 * @private
	 */
	private extractDefinitions(filePath: string, interfaceName?: string): Record<string, Record<string, string>> {
		const program = createProgram([filePath], {});
		const sourceFile = program.getSourceFile(filePath);
		const definitions: Record<string, Record<string, string>> = {};

		if (sourceFile) {
			const typeChecker = program.getTypeChecker();
			this.visitNode(sourceFile, typeChecker, definitions);
		}

		if (interfaceName && !definitions[interfaceName]) {
			throw new Error(`Interface ${interfaceName} not found in ${filePath}`);
		}

		return interfaceName
			? // if an interface name is provided, only return the requested model
				{ [interfaceName]: definitions[interfaceName] }
			: definitions;
	}

	/**
	 * Visit each node in the TypeScript AST and extract interfaces
	 * @param {TypescriptNode} node
	 * @param {TypeChecker} typeChecker
	 * @param {Record<string, Record<string, string>>} definition
	 * @private
	 */
	private visitNode(
		node: TypescriptNode,
		typeChecker: TypeChecker,
		definition: Record<string, Record<string, string>>
	): void {
		if (isClassDeclaration(node) || isInterfaceDeclaration(node)) {
			const symbol = node.name ? typeChecker.getSymbolAtLocation(node.name) : null;

			if (symbol) {
				const name = symbol.getName();
				definition[name] = {};

				for (const member of node.members) {
					if ((isPropertySignature(member) || isPropertyDeclaration(member)) && member.type) {
						const propertyName = member.name.getText();
						definition[name][propertyName] = member.type.getText();
					}
				}
			}
		}

		forEachChild(node, (n) => this.visitNode(n, typeChecker, definition));
	}
}
