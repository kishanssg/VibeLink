# Examples

This directory contains example API specifications and their FlowSpec conversions.

## Stripe API Example

To convert the Stripe API specification to FlowSpec:

```bash
# Build the project first
npm run build

# Convert to FlowSpec
node dist/cli/index.js convert examples/stripe-api.json -o examples/stripe.flowspec.yml -v examples/stripe-viewer.html

# Or using tsx for development
npm run dev convert examples/stripe-api.json -o examples/stripe.flowspec.yml -v examples/stripe-viewer.html
```

This will generate:
- `stripe.flowspec.yml` - The FlowSpec representation
- `stripe-viewer.html` - Interactive HTML viewer with Mermaid diagram

Open `stripe-viewer.html` in your browser to see the interactive visualization of the API flows.
