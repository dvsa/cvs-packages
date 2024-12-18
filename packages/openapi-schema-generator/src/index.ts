import { type SchemaObject } from 'openapi3-ts/oas30';
import {
	type TypeChecker,
	type Node as TypescriptNode,
	createProgram,
	forEachChild,
	isClassDeclaration,
	isInterfaceDeclaration,
	isLiteralTypeNode,
	isPropertyDeclaration,
	isPropertySignature,
	isTypeAliasDeclaration,
	isUnionTypeNode,
	isVariableDeclaration,
	isVariableStatement,
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

interface OpenAPIEnumSchemaObject<T> extends OpenAPISchemaObjectBase {
	enum: T[];
}

interface OpenAPIRefSchemaObject extends OpenAPISchemaObjectBase {
	$ref: string;
}

type SpecificOpenAPISchemaObject =
	| OpenAPIObjectSchemaObject
	| OpenAPIArraySchemaObject
	| OpenAPIRefSchemaObject
	| OpenAPIEnumSchemaObject<unknown>;

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
		const referencedModels = this.findReferencedModels(
			definitions[interfaceName],
			definitions,
			new Set([interfaceName])
		);
		const schemas = Object.fromEntries(
			Object.entries(definitions)
				.map(([name, def]) => [name, this.dictToOpenAPI(def)])
				.filter(([name]) => typeof name === 'string' && referencedModels.has(name))
		);
		return this.dereferenceArrays(schemas) as unknown as OpenAPIObjectSchemaObject;
	}

	/**
	 * Recursively find all referenced models in a schema
	 * e.g.
	 * - interface A { prop: B }
	 * - interface B { prop: C }
	 * - This will return a set containing A, B, and C definitions
	 * @param schema
	 * @param definitions
	 * @param referencedModels
	 * @private
	 */
	private findReferencedModels(
		schema: SchemaObject,
		definitions: Record<string, SchemaObject>,
		referencedModels: Set<string> = new Set()
	): Set<string> {
		const primitiveTypes = [
			'string',
			'number',
			'boolean',
			'any',
			'unknown',
			'null',
			'undefined',
			'void',
			'never',
			'object',
			'array',
		] as const;

		for (const [, value] of Object.entries(schema ?? {})) {
			if (!primitiveTypes.includes(value)) {
				if (value && !referencedModels.has(value)) {
					// Clean up union types by taking the first non-undefined type
					const cleanValue = value.toString().split('|')[0].trim();
					referencedModels.add(cleanValue);

					if (definitions[cleanValue]) {
						this.findReferencedModels(definitions[cleanValue], definitions, referencedModels);
					}
				}
			}
		}

		return referencedModels;
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
	private dictToOpenAPI(
		interfaceObj: Record<string, string>
	): OpenAPIObjectSchemaObject | OpenAPIEnumSchemaObject<unknown> {
		const properties: Record<string, SchemaObject> = {};
		const required: string[] = [];

		for (const [key, value] of Object.entries(interfaceObj)) {
			const isRequired = !key.endsWith('?');
			const propertyName = isRequired ? key : key.slice(0, -1);
			let val = typeof value === 'string' ? value.replace(' | undefined', '') : value;

			if (Array.isArray(val)) {
				const arrayVal: unknown[] = val;

				const calcType = arrayVal.every((val) => typeof val === 'boolean')
					? 'boolean'
					: arrayVal.every((val) => typeof val === 'number')
						? 'number'
						: 'string';

				return {
					type: calcType,
					enum: val,
				};
			}

			// Handle union types by taking the first non-undefined type
			if (typeof val === 'string' && val.includes('|')) {
				val = val.split('|')[0].trim();
			}

			if (isRequired) {
				required.push(propertyName);
			}

			properties[propertyName] = this.typeToSchemaObject(val);
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
	private typeToSchemaObject(value: string | unknown): SchemaObject | OpenAPIRefSchemaObject {
		if (typeof value === 'string' && value.endsWith('[]')) {
			return {
				type: 'array',
				items: this.typeToSchemaObject(value.slice(0, -2)),
			};
		}

		switch (value) {
			case 'string':
			case 'number':
			case 'boolean':
				return { type: value };
			default:
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

		return definitions;
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
		definition: Record<string, Record<string, string | string[]>>
	): void {
		if (isClassDeclaration(node) || isInterfaceDeclaration(node)) {
			const symbol = node.name ? typeChecker.getSymbolAtLocation(node.name) : null;

			if (symbol) {
				const name = symbol.getName();
				definition[name] = definition[name] ?? {};

				// Handle inheritance
				if (node.heritageClauses) {
					for (const heritage of node.heritageClauses) {
						for (const type of heritage.types) {
							const baseTypeName = type.expression.getText();
							if (definition[baseTypeName]) {
								// Merge base interface properties
								definition[name] = {
									...definition[baseTypeName],
									...definition[name],
								};
							}
						}
					}
				}

				for (const member of node.members) {
					if ((isPropertySignature(member) || isPropertyDeclaration(member)) && member.type) {
						const propertyName = member.name.getText() + (member.questionToken ? '?' : '');
						definition[name][propertyName] = member.type.getText();
					}
				}
			}
		} else if (isTypeAliasDeclaration(node)) {
			const name = node.name.getText();
			definition[name] = definition[name] ?? {};

			if (isUnionTypeNode(node.type)) {
				definition[name] = {
					enum: node.type.types.map((t) =>
						isLiteralTypeNode(t) ? t.literal.getText().replace(/['"]/g, '') : t.getText()
					),
				};
			}
		}
		// Add handling for const declarations
		else if (isVariableStatement(node)) {
			const declaration = node.declarationList.declarations[0];

			if (declaration && isVariableDeclaration(declaration)) {
				const name = declaration.name.getText();

				if (name) {
					definition[name] = {
						enum: Object.values(typeChecker.getTypeAtLocation(declaration).getProperties()).map((prop) =>
							prop.getName()
						),
					};
				}
			}
		}

		forEachChild(node, (n) => this.visitNode(n, typeChecker, definition));
	}
}
