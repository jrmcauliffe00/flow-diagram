# Flow Diagram Library

A TypeScript library for creating, manipulating, and visualizing flow diagrams. Includes an MCP server for LLM integration.

## Features

- Flow Diagram build functions
- Server features powered by Express
- MCP tools integration (including <list the specific MCP tools used, e.g. OpenAI, LangChain, etc.>)
- Diagram visualization using Mermaid and other supported formats (SVG, HTML, JSON, text)
- Testing powered by Jest

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the demo
npm run demo

# Start the MCP server
npm run mcp:dev
```

## Basic Usage

```typescript
import { createFlowDiagram, visualizeDiagram } from './src/index';

// Create a simple flow diagram
const diagram = createFlowDiagram({ title: 'My Process' });

// Add nodes
const startId = diagram.addNode({ 
  label: 'Start',
  type: 'start',
  style: { backgroundColor: '#e8f5e8' }
});

const processId = diagram.addNode({ 
  label: 'Process Data',
  type: 'process',
  style: { backgroundColor: '#e3f2fd' }
});

const endId = diagram.addNode({ 
  label: 'End',
  type: 'end',
  style: { backgroundColor: '#ffebee' }
});

// Add edges
diagram.addEdge({ sourceId: startId, targetId: processId });
diagram.addEdge({ sourceId: processId, targetId: endId });

// Auto-layout
diagram.autoLayout('hierarchical');

// Generate visualizations
const svg = visualizeDiagram(diagram, 'svg');
const mermaid = visualizeDiagram(diagram, 'mermaid');
const html = visualizeDiagram(diagram, 'html', { theme: 'dark' });
```

## Helper Functions

```typescript
import { FlowDiagramHelpers } from './src/index';

// Linear flow
const linearFlow = FlowDiagramHelpers.createLinearFlow([
  'Start', 'Process', 'Validate', 'End'
]);

// Decision tree
const decisionTree = FlowDiagramHelpers.createDecisionTree('User Login', [
  { condition: 'Valid?', next: 'Grant Access' },
  { condition: 'Invalid?', next: 'Show Error' }
]);
```

## API Reference

### Core Classes

- `FlowDiagram` - Main class for managing nodes and edges
- `FlowDiagramHelpers` - Utility functions for common patterns
- `FlowDiagramVisualizer` - Generate visualizations in multiple formats

### Key Methods

- `addNode()`, `addEdge()` - Add elements to diagrams
- `autoLayout()` - Automatic positioning
- `visualize()` - Generate SVG, HTML, Mermaid, JSON, or text output
- `createLinearFlow()`, `createDecisionTree()` - Helper functions

## Development

```bash
npm install
npm run build
npm test
npm run demo
```

## MCP Server

The library includes an MCP server for LLM integration.

### Start Server

```bash
npm run mcp:dev
```

Server runs at `http://localhost:3000` with these endpoints:
- `GET /health` - Health check
- `GET /mcp/tools` - List available tools
- `POST /mcp/tools/:toolName/execute` - Execute tools

### Available Tools

- `create_diagram`, `add_node`, `add_edge` - Basic operations
- `visualize_diagram` - Generate visualizations
- `create_linear_flow`, `create_decision_tree`, `create_process_flow` - Helper functions
- `get_diagram_info`, `list_diagrams` - Information queries

### Cursor Integration

Add this to your Cursor MCP config:

**macOS:** `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`
**Windows:** `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`
**Linux:** `~/.config/Cursor/User/globalStorage/cursor.mcp/config.json`

```json
{
  "mcpServers": {
    "flow-diagram": {
      "type": "http",
      "url": "http://localhost:3000",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

Restart Cursor after updating the configuration.

## License

MIT
