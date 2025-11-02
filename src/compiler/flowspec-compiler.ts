import type { Entity, Flow, FlowSpec, DataFlowGraph } from '../schemas/flowspec.js';
import type { ParsedSpec } from '../parser/index.js';

export class FlowSpecCompiler {
  compile(parsedSpec: ParsedSpec, sourceType: string): FlowSpec {
    const { entities, flows, metadata } = parsedSpec;

    // Build data flow graph
    const dataFlowGraph = this.buildDataFlowGraph(entities, flows);

    const flowSpec: FlowSpec = {
      version: '1.0',
      metadata: {
        title: metadata.title,
        description: metadata.description,
        source: sourceType,
        sourceVersion: metadata.version,
        generatedAt: new Date().toISOString(),
      },
      entities,
      flows,
      dataFlowGraph,
    };

    return flowSpec;
  }

  private buildDataFlowGraph(entities: Entity[], flows: Flow[]): DataFlowGraph {
    // Extract all unique nodes from entities
    const nodes = entities.map(e => e.id);

    // Build edges from flows
    const edges = flows.map(flow => ({
      from: flow.from,
      to: flow.to,
      label: flow.method || flow.dataType,
    }));

    return { nodes, edges };
  }

  /**
   * Compress FlowSpec by removing redundant information and using abbreviated keys
   * This creates a token-compressed format suitable for LLM consumption
   */
  compressFlowSpec(flowSpec: FlowSpec): any {
    return {
      v: flowSpec.version,
      m: {
        t: flowSpec.metadata.title,
        d: flowSpec.metadata.description,
        s: flowSpec.metadata.source,
        sv: flowSpec.metadata.sourceVersion,
        g: flowSpec.metadata.generatedAt,
      },
      e: flowSpec.entities.map(e => ({
        i: e.id,
        t: e.type,
        n: e.name,
        d: e.description,
        p: e.properties,
      })),
      f: flowSpec.flows.map(f => ({
        i: f.id,
        fr: f.from,
        to: f.to,
        m: f.method,
        dt: f.dataType,
        d: f.description,
      })),
      g: {
        n: flowSpec.dataFlowGraph.nodes,
        e: flowSpec.dataFlowGraph.edges.map(edge => ({
          fr: edge.from,
          to: edge.to,
          l: edge.label,
        })),
      },
    };
  }
}
