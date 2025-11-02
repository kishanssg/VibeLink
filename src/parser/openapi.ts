import type { OpenAPIV3 } from 'openapi-types';
import type { Entity, Flow } from '../schemas/flowspec.js';

export interface ParsedSpec {
  entities: Entity[];
  flows: Flow[];
  metadata: {
    title: string;
    description?: string;
    version?: string;
  };
}

export class OpenAPIParser {
  parse(spec: OpenAPIV3.Document): ParsedSpec {
    const entities: Entity[] = [];
    const flows: Flow[] = [];
    
    // Extract metadata
    const metadata = {
      title: spec.info.title,
      description: spec.info.description,
      version: spec.info.version,
    };

    // Parse schemas as entities
    if (spec.components?.schemas) {
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        entities.push({
          id: `schema:${name}`,
          type: 'schema',
          name,
          description: (schema as any).description,
          properties: this.extractSchemaProperties(schema),
        });
      });
    }

    // Parse endpoints as entities and create flows
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        if (!pathItem) return;
        
        const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
        methods.forEach((method) => {
          const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
          if (!operation) return;

          const operationId = operation.operationId || `${method}_${path.replace(/\//g, '_')}`;
          
          // Create endpoint entity
          entities.push({
            id: `endpoint:${operationId}`,
            type: 'endpoint',
            name: `${method.toUpperCase()} ${path}`,
            description: operation.summary || operation.description,
            properties: {
              path,
              method: method.toUpperCase(),
              operationId,
              tags: operation.tags,
            },
          });

          // Create flows for request body
          if (operation.requestBody) {
            const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
            const content = requestBody.content?.['application/json'];
            if (content?.schema) {
              const schemaRef = this.extractSchemaRef(content.schema);
              if (schemaRef) {
                flows.push({
                  id: `flow:request:${operationId}`,
                  from: `schema:${schemaRef}`,
                  to: `endpoint:${operationId}`,
                  method: method.toUpperCase(),
                  dataType: 'request',
                  description: 'Request payload',
                });
              }
            }
          }

          // Create flows for responses
          if (operation.responses) {
            Object.entries(operation.responses).forEach(([statusCode, response]) => {
              const responseObj = response as OpenAPIV3.ResponseObject;
              const content = responseObj.content?.['application/json'];
              if (content?.schema) {
                const schemaRef = this.extractSchemaRef(content.schema);
                if (schemaRef) {
                  flows.push({
                    id: `flow:response:${operationId}:${statusCode}`,
                    from: `endpoint:${operationId}`,
                    to: `schema:${schemaRef}`,
                    method: method.toUpperCase(),
                    dataType: 'response',
                    description: `Response ${statusCode}: ${responseObj.description}`,
                  });
                }
              }
            });
          }
        });
      });
    }

    return { entities, flows, metadata };
  }

  private extractSchemaRef(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): string | null {
    if ('$ref' in schema) {
      // Extract schema name from $ref like "#/components/schemas/User"
      const parts = schema.$ref.split('/');
      return parts[parts.length - 1];
    }
    return null;
  }

  private extractSchemaProperties(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): Record<string, any> {
    if ('$ref' in schema) {
      return { ref: schema.$ref };
    }
    
    const schemaObj = schema as OpenAPIV3.SchemaObject;
    return {
      type: schemaObj.type,
      properties: schemaObj.properties ? Object.keys(schemaObj.properties) : [],
      required: schemaObj.required || [],
    };
  }
}
