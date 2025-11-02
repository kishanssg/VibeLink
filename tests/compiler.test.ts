import { describe, it, expect } from 'vitest';
import { FlowSpecCompiler } from '../src/compiler/flowspec-compiler.js';
import { FlowSpecSchema } from '../src/schemas/flowspec.js';
import type { ParsedSpec } from '../src/parser/index.js';

describe('FlowSpecCompiler', () => {
  const compiler = new FlowSpecCompiler();

  it('should compile a parsed spec to FlowSpec', () => {
    const parsedSpec: ParsedSpec = {
      metadata: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API',
      },
      entities: [
        {
          id: 'schema:User',
          type: 'schema',
          name: 'User',
          description: 'User schema',
          properties: { type: 'object' },
        },
        {
          id: 'endpoint:getUser',
          type: 'endpoint',
          name: 'GET /users/{id}',
          properties: { method: 'GET', path: '/users/{id}' },
        },
      ],
      flows: [
        {
          id: 'flow:response:getUser',
          from: 'endpoint:getUser',
          to: 'schema:User',
          method: 'GET',
          dataType: 'response',
        },
      ],
    };

    const flowSpec = compiler.compile(parsedSpec, 'openapi');

    expect(flowSpec.version).toBe('1.0');
    expect(flowSpec.metadata.title).toBe('Test API');
    expect(flowSpec.metadata.source).toBe('openapi');
    expect(flowSpec.entities).toHaveLength(2);
    expect(flowSpec.flows).toHaveLength(1);
    expect(flowSpec.dataFlowGraph.nodes).toHaveLength(2);
    expect(flowSpec.dataFlowGraph.edges).toHaveLength(1);

    // Validate against schema
    const result = FlowSpecSchema.safeParse(flowSpec);
    expect(result.success).toBe(true);
  });

  it('should build correct data flow graph', () => {
    const parsedSpec: ParsedSpec = {
      metadata: {
        title: 'Test API',
        version: '1.0.0',
      },
      entities: [
        { id: 'schema:A', type: 'schema', name: 'A' },
        { id: 'schema:B', type: 'schema', name: 'B' },
        { id: 'endpoint:X', type: 'endpoint', name: 'X' },
      ],
      flows: [
        { id: 'flow:1', from: 'schema:A', to: 'endpoint:X', method: 'POST' },
        { id: 'flow:2', from: 'endpoint:X', to: 'schema:B', method: 'POST' },
      ],
    };

    const flowSpec = compiler.compile(parsedSpec, 'openapi');

    expect(flowSpec.dataFlowGraph.nodes).toContain('schema:A');
    expect(flowSpec.dataFlowGraph.nodes).toContain('schema:B');
    expect(flowSpec.dataFlowGraph.nodes).toContain('endpoint:X');
    
    expect(flowSpec.dataFlowGraph.edges).toHaveLength(2);
    expect(flowSpec.dataFlowGraph.edges[0].from).toBe('schema:A');
    expect(flowSpec.dataFlowGraph.edges[0].to).toBe('endpoint:X');
    expect(flowSpec.dataFlowGraph.edges[1].from).toBe('endpoint:X');
    expect(flowSpec.dataFlowGraph.edges[1].to).toBe('schema:B');
  });

  it('should compress FlowSpec correctly', () => {
    const parsedSpec: ParsedSpec = {
      metadata: {
        title: 'Test API',
        version: '1.0.0',
      },
      entities: [
        {
          id: 'schema:User',
          type: 'schema',
          name: 'User',
          description: 'User object',
        },
      ],
      flows: [
        {
          id: 'flow:1',
          from: 'schema:User',
          to: 'endpoint:X',
          method: 'GET',
        },
      ],
    };

    const flowSpec = compiler.compile(parsedSpec, 'openapi');
    const compressed = compiler.compressFlowSpec(flowSpec);

    // Check compressed structure uses abbreviated keys
    expect(compressed.v).toBe('1.0');
    expect(compressed.m.t).toBe('Test API');
    expect(compressed.e).toBeInstanceOf(Array);
    expect(compressed.f).toBeInstanceOf(Array);
    expect(compressed.g).toBeDefined();
    
    // Check entity compression
    expect(compressed.e[0].i).toBe('schema:User');
    expect(compressed.e[0].t).toBe('schema');
    expect(compressed.e[0].n).toBe('User');
  });
});
