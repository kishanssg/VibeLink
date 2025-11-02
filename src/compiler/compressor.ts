import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CompressedFlowSpec {
  compressed: any;
  expandedDir: string;
  tokenReduction: number;
}

export function compressFlowSpec(
  spec: any,
  outputDir: string = '.flowspec/expanded'
): CompressedFlowSpec {
  mkdirSync(outputDir, { recursive: true });
  
  const entityMap = new Map<string, string>();
  let entityIdx = 0;
  
  // Compress entities
  const compressedEntities = spec.entities.map((entity: any) => {
    // Generate short code (C, S, P, U, O...)
    const code = entity.name.charAt(0).toUpperCase() + 
                 (entityIdx > 0 ? entityIdx.toString() : '');
    entityIdx++;
    entityMap.set(entity.id, code);
    
    // Hash the full schema
    const schemaHash = createHash('sha256')
      .update(JSON.stringify(entity.properties || {}))
      .digest('hex')
      .slice(0, 8);
    
    // Store expanded schema
    if (entity.properties) {
      const expandedPath = join(outputDir, `${schemaHash}.json`);
      writeFileSync(expandedPath, JSON.stringify({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        properties: entity.properties
      }, null, 2));
    }
    
    // Return compressed version
    return {
      code,
      name: entity.name,
      type: entity.type,
      hash: schemaHash,
      pii: entity.properties && detectPII(entity.properties)
    };
  });
  
  // Compress flows (use entity codes instead of full IDs)
  const compressedFlows = spec.flows.map((flow: any) => {
    const flowHash = createHash('sha256')
      .update(`${flow.type}${flow.name}`)
      .digest('hex')
      .slice(0, 3);
    
    return {
      id: `e${flowHash}`,
      op: flow.type.toUpperCase(),
      path: flow.name,
      in: flow.input ? entityMap.get(flow.input) : undefined,
      out: flow.output ? entityMap.get(flow.output) : undefined,
      ws: flow.type === 'websocket'
    };
  });
  
  return {
    compressed: {
      version: spec.version,
      api: spec.metadata?.name || 'unknown',
      entities: compressedEntities,
      flows: compressedFlows,
      dataflow: spec.dataFlowGraph?.edges || []
    },
    expandedDir: outputDir,
    tokenReduction: calculateReduction(spec, compressedEntities)
  };
}

function detectPII(properties: any): boolean {
  const piiFields = ['email', 'phone', 'ssn', 'address', 'passport', 'credit_card'];
  return Object.keys(properties.properties || {}).some(key =>
    piiFields.some(pii => key.toLowerCase().includes(pii))
  );
}

function calculateReduction(original: any, compressed: any): number {
  const origSize = JSON.stringify(original).length;
  const compSize = JSON.stringify(compressed).length;
  return origSize / compSize;
}