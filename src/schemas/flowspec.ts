import { z } from 'zod';

// FlowSpec Schema - Token-compressed YAML format for API specifications

export const EntitySchema = z.object({
  id: z.string(),
  type: z.enum(['endpoint', 'schema', 'websocket', 'operation']),
  name: z.string(),
  description: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
});

export const FlowSchema = z.object({
  id: z.string(),
  from: z.string(), // entity id
  to: z.string(), // entity id
  method: z.string().optional(), // HTTP method or operation
  dataType: z.string().optional(), // data type being transferred
  description: z.string().optional(),
});

export const DataFlowGraphSchema = z.object({
  nodes: z.array(z.string()), // entity ids
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
  })),
});

export const FlowSpecSchema = z.object({
  version: z.string().default('1.0'),
  metadata: z.object({
    title: z.string(),
    description: z.string().optional(),
    source: z.string(), // original spec type (OpenAPI, AsyncAPI)
    sourceVersion: z.string().optional(),
    generatedAt: z.string(),
  }),
  entities: z.array(EntitySchema),
  flows: z.array(FlowSchema),
  dataFlowGraph: DataFlowGraphSchema,
});

export type Entity = z.infer<typeof EntitySchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type DataFlowGraph = z.infer<typeof DataFlowGraphSchema>;
export type FlowSpec = z.infer<typeof FlowSpecSchema>;
