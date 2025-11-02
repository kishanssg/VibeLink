import { describe, it, expect } from 'vitest';
import { AsyncAPIParser } from '../src/parser/asyncapi.js';
import type { AsyncAPIV2Document } from '../src/parser/asyncapi.js';

describe('AsyncAPIParser', () => {
  const parser = new AsyncAPIParser();

  it('should parse a simple AsyncAPI spec', () => {
    const spec: AsyncAPIV2Document = {
      asyncapi: '2.6.0',
      info: {
        title: 'Chat API',
        version: '1.0.0',
        description: 'A chat WebSocket API',
      },
      channels: {
        '/chat': {
          description: 'Chat channel',
          subscribe: {
            description: 'Receive messages',
            message: {
              payload: {
                $ref: '#/components/schemas/Message',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Message: {
            type: 'object',
            description: 'Chat message',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
            },
          },
        },
      },
    };

    const result = parser.parse(spec);

    expect(result.metadata.title).toBe('Chat API');
    expect(result.metadata.version).toBe('1.0.0');
    expect(result.entities.length).toBeGreaterThan(0);
    
    // Should have schema entities
    const schemaEntities = result.entities.filter(e => e.type === 'schema');
    expect(schemaEntities.length).toBe(1);
    
    // Should have websocket entity
    const websocketEntities = result.entities.filter(e => e.type === 'websocket');
    expect(websocketEntities.length).toBe(1);
    expect(websocketEntities[0].name).toBe('/chat');
    
    // Should have flows
    expect(result.flows.length).toBeGreaterThan(0);
  });

  it('should create websocket entities from channels', () => {
    const spec: AsyncAPIV2Document = {
      asyncapi: '2.6.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        '/notifications': {
          description: 'Notification channel',
          subscribe: {
            message: {
              payload: {
                $ref: '#/components/schemas/Notification',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Notification: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    };

    const result = parser.parse(spec);
    
    const websocket = result.entities.find(e => e.type === 'websocket');
    expect(websocket).toBeDefined();
    expect(websocket?.name).toBe('/notifications');
    expect(websocket?.properties?.channel).toBe('/notifications');
  });

  it('should create flows for subscribe and publish operations', () => {
    const spec: AsyncAPIV2Document = {
      asyncapi: '2.6.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        '/events': {
          subscribe: {
            message: {
              payload: {
                $ref: '#/components/schemas/Event',
              },
            },
          },
          publish: {
            message: {
              payload: {
                $ref: '#/components/schemas/EventCreate',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Event: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          EventCreate: {
            type: 'object',
            properties: {
              data: { type: 'string' },
            },
          },
        },
      },
    };

    const result = parser.parse(spec);
    
    // Should have subscribe flow
    const subscribeFlow = result.flows.find(f => f.method === 'SUBSCRIBE');
    expect(subscribeFlow).toBeDefined();
    expect(subscribeFlow?.to).toBe('schema:Event');
    
    // Should have publish flow
    const publishFlow = result.flows.find(f => f.method === 'PUBLISH');
    expect(publishFlow).toBeDefined();
    expect(publishFlow?.from).toBe('schema:EventCreate');
  });
});
