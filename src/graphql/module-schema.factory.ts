import { INestApplication, Injectable } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { join } from 'path';
import {
  printSchema,
  GraphQLSchema,
  buildSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import * as fs from 'fs';

@Injectable()
export class ModuleSchemaFactory {
  constructor(private readonly gqlSchemaHost: GraphQLSchemaHost) {}

  async exportSchemaForModule(
    moduleName: string,
    typeNames: string[],
  ): Promise<void> {
    // Get the full GraphQL schema
    const { schema } = this.gqlSchemaHost;

    // Ensure schemas directory exists
    const schemasDir = join(process.cwd(), 'src/graphql/schemas');
    if (!fs.existsSync(schemasDir)) {
      fs.mkdirSync(schemasDir, { recursive: true });
    }

    try {
      // Create separate SDL content for this module
      let moduleSDL = '';

      // Add the specified types to the module schema
      for (const typeName of typeNames) {
        const type = schema.getType(typeName);
        if (type) {
          // Extract the SDL for this type
          const typeSDL = extractTypeSDL(schema, typeName);
          if (typeSDL) {
            moduleSDL += typeSDL + '\n\n';
          }
        }
      }

      // Add Query fields related to this module
      const queryType = schema.getQueryType();
      if (queryType) {
        const queryFields = Object.values(queryType.getFields()).filter(
          (field) => {
            // Filter query fields related to this module
            // We're checking if the return type is related to any of our module types
            const returnTypeName = getBaseTypeName(field.type);
            return typeNames.includes(returnTypeName);
          },
        );

        if (queryFields.length > 0) {
          moduleSDL += 'type Query {\n';

          for (const field of queryFields) {
            const args =
              field.args.length > 0
                ? `(${field.args
                    .map((arg) => `${arg.name}: ${arg.type}`)
                    .join(', ')})`
                : '';

            moduleSDL += `  ${field.name}${args}: ${field.type}\n`;
          }

          moduleSDL += '}\n';
        }
      }

      // Write to file
      const outputPath = join(schemasDir, `${moduleName}.schema.gql`);
      fs.writeFileSync(
        outputPath,
        `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

# Schema for module: ${moduleName}
# Types included: ${typeNames.join(', ')}

${moduleSDL}`,
      );

      console.log(
        `Schema for module '${moduleName}' generated at ${outputPath}`,
      );
    } catch (error) {
      console.error(
        `Error generating schema for module '${moduleName}':`,
        error,
      );
    }
  }
}

// Helper function to extract type definition in SDL format
function extractTypeSDL(
  schema: GraphQLSchema,
  typeName: string,
): string | null {
  const type = schema.getType(typeName);
  if (!type) return null;

  // Generate SDL just for this type
  const typeDefinition = printSchema(
    new GraphQLSchema({
      types: [type],
    }),
  );

  // Remove schema definition and just keep the type definition
  return typeDefinition.replace(/schema \{[\s\S]*?\}\s+/g, '').trim();
}

// Helper function to get the base type name from a GraphQL type
function getBaseTypeName(type: any): string {
  if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
    return getBaseTypeName(type.ofType);
  }
  return type.name;
}

/**
 * Helper function to export schemas after the application is fully initialized
 */
export async function exportSchemasAfterInit(
  app: INestApplication,
): Promise<void> {
  const moduleSchemaFactory = app.get(ModuleSchemaFactory);

  // Define modules and their types
  const moduleConfigs = [
    {
      name: 'users',
      types: ['User', 'DateTime'],
    },
    {
      name: 'products',
      types: ['Product', 'DateTime'],
    },
    // Add more modules as needed
  ];

  // Export schema for each module
  for (const config of moduleConfigs) {
    await moduleSchemaFactory.exportSchemaForModule(config.name, config.types);
  }
}
