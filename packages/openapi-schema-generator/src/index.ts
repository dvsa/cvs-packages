import { type SchemaObject } from 'openapi3-ts/oas30';
import {
	type TypeChecker,
	type Node as TypescriptNode,
	createProgram,
	forEachChild,
	isInterfaceDeclaration,
	isPropertySignature,
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
	 * Generate OpenAPI schema from TypeScript interfaces
	 */
	async generate(): Promise<OpenAPIObjectSchemaObject> {
		const interfaces = this.extractInterfaces(this.pathToFile);

		const schemas = Object.fromEntries(
			Object.entries(interfaces).map(([name, def]) => [name, this.interfaceToOpenAPI(def)])
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
	private interfaceToOpenAPI(interfaceObj: Record<string, string>): OpenAPIObjectSchemaObject {
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
	 * Extract interfaces from the TypeScript file and convert to a dictionary
	 * @param {string} filePath
	 * @returns {Record<string, Record<string, string>>}
	 * @private
	 */
	private extractInterfaces(filePath: string): Record<string, Record<string, string>> {
		const program = createProgram([filePath], {});
		const sourceFile = program.getSourceFile(filePath);
		const typeChecker = program.getTypeChecker();
		const interfaces: Record<string, Record<string, string>> = {};

		if (sourceFile) {
			this.visitNode(sourceFile, typeChecker, interfaces);
		}

		return interfaces;
	}

	/**
	 * Visit each node in the TypeScript AST and extract interfaces
	 * @param {TypescriptNode} node
	 * @param {TypeChecker} typeChecker
	 * @param {Record<string, Record<string, string>>} interfaces
	 * @private
	 */
	private visitNode(
		node: TypescriptNode,
		typeChecker: TypeChecker,
		interfaces: Record<string, Record<string, string>>
	): void {
		if (isInterfaceDeclaration(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node.name);

			if (symbol) {
				const interfaceName = symbol.getName();
				interfaces[interfaceName] = {};

				for (const member of node.members) {
					if (isPropertySignature(member) && member.type) {
						const propertyName = member.name.getText();
						interfaces[interfaceName][propertyName] = member.type.getText();
					}
				}
			}
		}
		forEachChild(node, (n) => this.visitNode(n, typeChecker, interfaces));
	}
}
