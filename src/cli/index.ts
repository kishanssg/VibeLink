#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import { OpenAPIParser, AsyncAPIParser } from '../parser/index.js';
import { FlowSpecCompiler } from '../compiler/index.js';
import { MindmapViewer } from '../viewer/index.js';
import { FlowSpecSchema } from '../schemas/flowspec.js';
import type { OpenAPIV3 } from 'openapi-types';
import type { AsyncAPIV2Document } from '../parser/asyncapi.js';

const program = new Command();

program
  .name('vibelink')
  .description('Convert OpenAPI/AsyncAPI specs to FlowSpec format')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert API specification to FlowSpec')
  .argument('<input>', 'Input API specification file (JSON or YAML)')
  .option('-o, --output <file>', 'Output FlowSpec file', 'output.flowspec.yml')
  .option('-t, --type <type>', 'Specification type (openapi or asyncapi)', 'openapi')
  .option('-c, --compress', 'Generate compressed FlowSpec format', false)
  .option('-v, --viewer <file>', 'Generate HTML viewer file')
  .action(async (input: string, options: any) => {
    try {
      console.log(`📖 Reading ${input}...`);
      const content = await readFile(input, 'utf-8');
      
      let spec: any;
      if (input.endsWith('.json')) {
        spec = JSON.parse(content);
      } else {
        spec = parseYAML(content);
      }

      console.log(`🔍 Parsing ${options.type} specification...`);
      let parsedSpec;
      
      if (options.type === 'openapi') {
        const parser = new OpenAPIParser();
        parsedSpec = parser.parse(spec as OpenAPIV3.Document);
      } else if (options.type === 'asyncapi') {
        const parser = new AsyncAPIParser();
        parsedSpec = parser.parse(spec as AsyncAPIV2Document);
      } else {
        throw new Error(`Unsupported specification type: ${options.type}`);
      }

      console.log(`⚙️  Compiling to FlowSpec...`);
      const compiler = new FlowSpecCompiler();
      const flowSpec = compiler.compile(parsedSpec, options.type);

      // Validate against schema
      const validationResult = FlowSpecSchema.safeParse(flowSpec);
      if (!validationResult.success) {
        console.error('❌ FlowSpec validation failed:', validationResult.error);
        throw new Error('Generated FlowSpec is invalid');
      }

      console.log(`💾 Writing FlowSpec to ${options.output}...`);
      let outputData: any = flowSpec;
      
      if (options.compress) {
        outputData = compiler.compressFlowSpec(flowSpec);
        console.log('🗜️  Applied compression');
      }

      const yamlContent = stringifyYAML(outputData);
      await writeFile(options.output, yamlContent, 'utf-8');

      console.log(`✅ FlowSpec generated successfully!`);
      console.log(`   - Entities: ${flowSpec.entities.length}`);
      console.log(`   - Flows: ${flowSpec.flows.length}`);
      console.log(`   - Nodes: ${flowSpec.dataFlowGraph.nodes.length}`);

      // Generate HTML viewer if requested
      if (options.viewer) {
        console.log(`🎨 Generating interactive viewer...`);
        const viewer = new MindmapViewer();
        const html = viewer.generateHTML(flowSpec);
        await writeFile(options.viewer, html, 'utf-8');
        console.log(`✅ Viewer generated: ${options.viewer}`);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
