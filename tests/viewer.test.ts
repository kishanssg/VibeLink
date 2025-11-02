import { describe, it, expect } from 'vitest';
import { MindmapViewer } from '../src/viewer/mindmap.js';
import type { FlowSpec } from '../src/schemas/flowspec.js';

describe('MindmapViewer', () => {
  const viewer = new MindmapViewer();

  it('should generate Mermaid diagram', () => {
    const flowSpec: FlowSpec = {
      version: '1.0',
      metadata: {
        title: 'Test API',
        source: 'openapi',
        generatedAt: new Date().toISOString(),
      },
      entities: [
        {
          id: 'schema:User',
          type: 'schema',
          name: 'User',
        },
        {
          id: 'endpoint:getUser',
          type: 'endpoint',
          name: 'GET /users',
        },
      ],
      flows: [
        {
          id: 'flow:1',
          from: 'endpoint:getUser',
          to: 'schema:User',
          method: 'GET',
        },
      ],
      dataFlowGraph: {
        nodes: ['schema:User', 'endpoint:getUser'],
        edges: [
          {
            from: 'endpoint:getUser',
            to: 'schema:User',
            label: 'GET',
          },
        ],
      },
    };

    const mermaid = viewer.generateMermaid(flowSpec);

    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('schema_User');
    expect(mermaid).toContain('endpoint_getUser');
    expect(mermaid).toContain('-->|GET|');
    expect(mermaid).toContain('classDef endpoint');
    expect(mermaid).toContain('classDef schema');
  });

  it('should generate HTML viewer', () => {
    const flowSpec: FlowSpec = {
      version: '1.0',
      metadata: {
        title: 'Test API',
        description: 'A test API',
        source: 'openapi',
        sourceVersion: '3.0.0',
        generatedAt: new Date().toISOString(),
      },
      entities: [
        {
          id: 'schema:User',
          type: 'schema',
          name: 'User',
        },
      ],
      flows: [],
      dataFlowGraph: {
        nodes: ['schema:User'],
        edges: [],
      },
    };

    const html = viewer.generateHTML(flowSpec);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test API');
    expect(html).toContain('FlowSpec Viewer');
    expect(html).toContain('mermaid');
    expect(html).toContain('graph TD');
    expect(html).toContain('<h1>🔗 Test API</h1>');
  });

  it('should use correct node shapes for different entity types', () => {
    const flowSpec: FlowSpec = {
      version: '1.0',
      metadata: {
        title: 'Test API',
        source: 'openapi',
        generatedAt: new Date().toISOString(),
      },
      entities: [
        {
          id: 'schema:User',
          type: 'schema',
          name: 'User',
        },
        {
          id: 'endpoint:getUser',
          type: 'endpoint',
          name: 'GET /users',
        },
        {
          id: 'websocket:chat',
          type: 'websocket',
          name: '/chat',
        },
      ],
      flows: [],
      dataFlowGraph: {
        nodes: ['schema:User', 'endpoint:getUser', 'websocket:chat'],
        edges: [],
      },
    };

    const mermaid = viewer.generateMermaid(flowSpec);

    // Schema uses cylinder shape [(  )]
    expect(mermaid).toContain('schema_User[(User)]');
    
    // Endpoint uses rectangle [  ]
    expect(mermaid).toContain('endpoint_getUser[GET /users]');
    
    // Websocket uses hexagon {{  }}
    expect(mermaid).toContain('websocket_chat{{/chat}}');
  });
});
