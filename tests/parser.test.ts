import { describe, it, expect } from 'vitest';
import { OpenAPIParser } from '../src/parser/openapi.js';
import type { OpenAPIV3 } from 'openapi-types';

describe('OpenAPIParser', () => {
  const parser = new OpenAPIParser();

  it('should parse a simple OpenAPI spec', () => {
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            operationId: 'listUsers',
            summary: 'List users',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserList',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            description: 'A user object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          UserList: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    };

    const result = parser.parse(spec);

    expect(result.metadata.title).toBe('Test API');
    expect(result.metadata.version).toBe('1.0.0');
    expect(result.entities.length).toBeGreaterThan(0);
    
    // Should have schema entities
    const schemaEntities = result.entities.filter(e => e.type === 'schema');
    expect(schemaEntities.length).toBe(2);
    
    // Should have endpoint entity
    const endpointEntities = result.entities.filter(e => e.type === 'endpoint');
    expect(endpointEntities.length).toBe(1);
    expect(endpointEntities[0].name).toBe('GET /users');
    
    // Should have flows
    expect(result.flows.length).toBeGreaterThan(0);
  });

  it('should extract schema entities', () => {
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          Product: {
            type: 'object',
            description: 'A product',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
            },
            required: ['id', 'name'],
          },
        },
      },
    };

    const result = parser.parse(spec);
    
    const productSchema = result.entities.find(e => e.id === 'schema:Product');
    expect(productSchema).toBeDefined();
    expect(productSchema?.type).toBe('schema');
    expect(productSchema?.name).toBe('Product');
    expect(productSchema?.description).toBe('A product');
    expect(productSchema?.properties?.type).toBe('object');
    expect(productSchema?.properties?.required).toEqual(['id', 'name']);
  });

  it('should create flows for request and response', () => {
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/products': {
          post: {
            operationId: 'createProduct',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ProductCreate',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Product',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          ProductCreate: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };

    const result = parser.parse(spec);
    
    // Should have request flow
    const requestFlow = result.flows.find(f => f.dataType === 'request');
    expect(requestFlow).toBeDefined();
    expect(requestFlow?.from).toBe('schema:ProductCreate');
    expect(requestFlow?.to).toBe('endpoint:createProduct');
    
    // Should have response flow
    const responseFlow = result.flows.find(f => f.dataType === 'response');
    expect(responseFlow).toBeDefined();
    expect(responseFlow?.from).toBe('endpoint:createProduct');
    expect(responseFlow?.to).toBe('schema:Product');
  });
});
