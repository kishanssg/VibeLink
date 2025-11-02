import type { Entity, Flow } from '../schemas/flowspec.js';

export interface AsyncAPIV2Document {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  channels?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    messages?: Record<string, any>;
  };
}

export interface ParsedSpec {
  entities: Entity[];
  flows: Flow[];
  metadata: {
    title: string;
    description?: string;
    version?: string;
  };
}

export class AsyncAPIParser {
  parse(spec: AsyncAPIV2Document): ParsedSpec {
    const entities: Entity[] = [];
    const flows: Flow[] = [];
    
    const metadata = {
      title: spec.info.title,
      description: spec.info.description,
      version: spec.info.version,
    };

    // Parse schemas
    if (spec.components?.schemas) {
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        entities.push({
          id: `schema:${name}`,
          type: 'schema',
          name,
          description: (schema as any).description,
          properties: {
            type: (schema as any).type,
            properties: (schema as any).properties ? Object.keys((schema as any).properties) : [],
          },
        });
      });
    }

    // Parse channels as websocket entities
    if (spec.channels) {
      Object.entries(spec.channels).forEach(([channelName, channel]) => {
        const websocketId = `websocket:${channelName.replace(/\//g, '_')}`;
        
        entities.push({
          id: websocketId,
          type: 'websocket',
          name: channelName,
          description: channel.description,
          properties: {
            channel: channelName,
          },
        });

        // Create flows for subscribe operations
        if (channel.subscribe) {
          const message = channel.subscribe.message;
          if (message?.payload?.$ref) {
            const schemaName = this.extractSchemaRef(message.payload.$ref);
            if (schemaName) {
              flows.push({
                id: `flow:subscribe:${websocketId}`,
                from: websocketId,
                to: `schema:${schemaName}`,
                method: 'SUBSCRIBE',
                dataType: 'message',
                description: channel.subscribe.description || 'Subscribe to channel',
              });
            }
          }
        }

        // Create flows for publish operations
        if (channel.publish) {
          const message = channel.publish.message;
          if (message?.payload?.$ref) {
            const schemaName = this.extractSchemaRef(message.payload.$ref);
            if (schemaName) {
              flows.push({
                id: `flow:publish:${websocketId}`,
                from: `schema:${schemaName}`,
                to: websocketId,
                method: 'PUBLISH',
                dataType: 'message',
                description: channel.publish.description || 'Publish to channel',
              });
            }
          }
        }
      });
    }

    return { entities, flows, metadata };
  }

  private extractSchemaRef(ref: string): string | null {
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }
}
