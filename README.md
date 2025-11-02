# VibeLink

**VibeLink** is a TypeScript CLI tool that converts OpenAPI and AsyncAPI specifications into FlowSpec - a token-compressed YAML format designed for LLM consumption. It focuses on how APIs are wired and how data flows through them, creating a mental model that captures all the essential information in a compressed format.

## Features

- 🔄 **Convert OpenAPI/AsyncAPI to FlowSpec**: Parse REST and WebSocket API specifications
- 📊 **Data Flow Analysis**: Extract entities, flows, and build data flow graphs
- 🗜️ **Token Compression**: Generate compressed YAML optimized for LLM context windows
- 🎨 **Interactive Visualization**: Generate HTML viewers with Mermaid diagrams
- ✅ **Type-Safe**: Built with TypeScript and Zod schemas
- 🧪 **Well Tested**: Comprehensive test suite

## Installation

```bash
npm install
npm run build
```

## Quick Start

Convert an OpenAPI specification to FlowSpec:

```bash
# Using the built CLI
node dist/cli/index.js convert examples/stripe-api.json -o output.flowspec.yml -v viewer.html

# Or using tsx for development
npx tsx src/cli/index.ts convert examples/stripe-api.json -o output.flowspec.yml -v viewer.html
```

## Project Structure

```
vibelink/
├── src/
│   ├── parser/          # OpenAPI/AsyncAPI parsers
│   │   ├── openapi.ts
│   │   ├── asyncapi.ts
│   │   └── index.ts
│   ├── compiler/        # FlowSpec compiler
│   │   ├── flowspec-compiler.ts
│   │   └── index.ts
│   ├── viewer/          # HTML/Mermaid viewer generator
│   │   ├── mindmap.ts
│   │   └── index.ts
│   ├── schemas/         # Zod schemas for FlowSpec
│   │   └── flowspec.ts
│   └── cli/             # CLI entry point
│       └── index.ts
├── examples/            # Example API specs and conversions
│   ├── stripe-api.json
│   ├── stripe.flowspec.yml
│   └── stripe-viewer.html
├── tests/               # Test suite
│   ├── parser.test.ts
│   ├── compiler.test.ts
│   └── viewer.test.ts
└── dist/                # Compiled output
```

## Usage

### CLI Commands

```bash
vibelink convert <input> [options]
```

**Arguments:**
- `<input>` - Input API specification file (JSON or YAML)

**Options:**
- `-o, --output <file>` - Output FlowSpec file (default: `output.flowspec.yml`)
- `-t, --type <type>` - Specification type: `openapi` or `asyncapi` (default: `openapi`)
- `-c, --compress` - Generate compressed FlowSpec format (token-optimized)
- `-v, --viewer <file>` - Generate HTML viewer file

### Examples

**Basic OpenAPI conversion:**
```bash
npx tsx src/cli/index.ts convert api-spec.json
```

**With custom output and viewer:**
```bash
npx tsx src/cli/index.ts convert api-spec.json -o my-api.flowspec.yml -v my-api-viewer.html
```

**AsyncAPI conversion:**
```bash
npx tsx src/cli/index.ts convert websocket-api.yaml -t asyncapi -v viewer.html
```

**Compressed format for LLMs:**
```bash
npx tsx src/cli/index.ts convert api-spec.json -c -o compressed.flowspec.yml
```

## FlowSpec Format

FlowSpec is a structured YAML format that represents API specifications as:

1. **Entities**: API endpoints, schemas, websockets
2. **Flows**: Data flows between entities (request/response, pub/sub)
3. **Data Flow Graph**: Visual representation of entity relationships

### Example FlowSpec Structure

```yaml
version: "1.0"
metadata:
  title: "My API"
  source: "openapi"
  sourceVersion: "3.0.0"
  generatedAt: "2025-11-02T15:28:37.478Z"

entities:
  - id: schema:User
    type: schema
    name: User
    description: User object
    properties:
      type: object
      properties: [id, name, email]
      required: [id]
  
  - id: endpoint:getUser
    type: endpoint
    name: GET /users/{id}
    properties:
      path: /users/{id}
      method: GET

flows:
  - id: flow:response:getUser
    from: endpoint:getUser
    to: schema:User
    method: GET
    dataType: response

dataFlowGraph:
  nodes: [schema:User, endpoint:getUser]
  edges:
    - from: endpoint:getUser
      to: schema:User
      label: GET
```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test          # Run tests
npm run test:ui   # Run tests with UI
```

### Development Mode

```bash
npm run dev -- convert examples/stripe-api.json -v viewer.html
```

## Example: Stripe API

The repository includes a simplified Stripe API example demonstrating the conversion:

```bash
npx tsx src/cli/index.ts convert examples/stripe-api.json \
  -o examples/stripe.flowspec.yml \
  -v examples/stripe-viewer.html
```

This generates:
- **stripe.flowspec.yml**: Structured FlowSpec representation
- **stripe-viewer.html**: Interactive HTML viewer with Mermaid diagram

Open `stripe-viewer.html` in your browser to see the visualization showing:
- Customer management endpoints
- Payment Intent operations
- Charge creation flows
- Schema relationships

## Why FlowSpec?

Traditional API specifications (OpenAPI, AsyncAPI) are verbose and contain redundant information. FlowSpec:

1. **Compresses token usage**: Optimized for LLM context windows
2. **Focuses on flows**: Emphasizes data movement and API wiring
3. **Visual clarity**: Generates interactive diagrams automatically
4. **Mental model**: Creates a clear picture of API architecture

## License

MIT
