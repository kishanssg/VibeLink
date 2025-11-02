import type { FlowSpec } from '../schemas/flowspec.js';

export class MindmapViewer {
  /**
   * Generate Mermaid diagram syntax from FlowSpec
   */
  generateMermaid(flowSpec: FlowSpec): string {
    const lines: string[] = ['graph TD'];
    
    // Add entities as nodes
    flowSpec.entities.forEach(entity => {
      const shape = this.getNodeShape(entity.type);
      const label = this.escapeLabel(entity.name);
      lines.push(`    ${this.sanitizeId(entity.id)}${shape.start}${label}${shape.end}`);
    });

    // Add flows as edges
    flowSpec.flows.forEach(flow => {
      const label = flow.method || flow.dataType || '';
      const from = this.sanitizeId(flow.from);
      const to = this.sanitizeId(flow.to);
      lines.push(`    ${from} -->|${label}| ${to}`);
    });

    // Add styles
    lines.push('');
    lines.push('    classDef endpoint fill:#4CAF50,stroke:#2E7D32,color:#fff');
    lines.push('    classDef schema fill:#2196F3,stroke:#1565C0,color:#fff');
    lines.push('    classDef websocket fill:#FF9800,stroke:#E65100,color:#fff');
    lines.push('');
    
    flowSpec.entities.forEach(entity => {
      lines.push(`    class ${this.sanitizeId(entity.id)} ${entity.type}`);
    });

    return lines.join('\n');
  }

  /**
   * Generate complete HTML viewer with interactive Mermaid diagram
   */
  generateHTML(flowSpec: FlowSpec): string {
    const mermaidCode = this.generateMermaid(flowSpec);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${flowSpec.metadata.title} - FlowSpec Viewer</title>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    </script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .metadata {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #2196F3;
        }
        .metadata p {
            margin: 5px 0;
            color: #666;
        }
        .mermaid-container {
            background: white;
            padding: 20px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat {
            flex: 1;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            text-align: center;
        }
        .stat h3 {
            margin: 0 0 5px 0;
            font-size: 24px;
        }
        .stat p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 ${flowSpec.metadata.title}</h1>
        
        <div class="metadata">
            <p><strong>Description:</strong> ${flowSpec.metadata.description || 'N/A'}</p>
            <p><strong>Source:</strong> ${flowSpec.metadata.source} ${flowSpec.metadata.sourceVersion || ''}</p>
            <p><strong>Generated:</strong> ${new Date(flowSpec.metadata.generatedAt).toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat">
                <h3>${flowSpec.entities.length}</h3>
                <p>Entities</p>
            </div>
            <div class="stat">
                <h3>${flowSpec.flows.length}</h3>
                <p>Flows</p>
            </div>
            <div class="stat">
                <h3>${flowSpec.dataFlowGraph.nodes.length}</h3>
                <p>Nodes</p>
            </div>
        </div>

        <div class="mermaid-container">
            <pre class="mermaid">
${mermaidCode}
            </pre>
        </div>
    </div>
</body>
</html>`;
  }

  private getNodeShape(type: string): { start: string; end: string } {
    switch (type) {
      case 'endpoint':
        return { start: '[', end: ']' }; // Rectangle
      case 'schema':
        return { start: '[(', end: ')]' }; // Cylinder
      case 'websocket':
        return { start: '{{', end: '}}' }; // Hexagon
      default:
        return { start: '(', end: ')' }; // Round
    }
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private escapeLabel(label: string): string {
    return label.replace(/"/g, '&quot;');
  }
}
