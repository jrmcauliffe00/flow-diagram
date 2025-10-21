# Flow Diagram Library

A powerful TypeScript library for creating, manipulating, and visualizing flow diagrams. Perfect for building MCP tools, web applications, and any system that needs to represent processes, workflows, or decision trees as visual diagrams.

## Features

- 🎯 **TypeScript-first**: Full type safety and excellent developer experience
- 🎨 **Multiple Visualization Formats**: SVG, HTML, Mermaid, JSON, and text output
- 🔧 **Rich API**: Create, modify, and manipulate flow diagrams programmatically
- 📐 **Auto-layout**: Automatic positioning with hierarchical, circular, and grid layouts
- 🎭 **Customizable Styling**: Full control over node and edge appearance
- 🧩 **Helper Functions**: Pre-built templates for common flow patterns
- ✅ **Validation**: Built-in diagram validation and error checking
- 🔄 **Serialization**: Save and load diagrams as JSON

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

// Linear flow: A -> B -> C -> D
const linearFlow = FlowDiagramHelpers.createLinearFlow([
  'Start', 'Process', 'Validate', 'End'
]);

// Decision tree
const decisionTree = FlowDiagramHelpers.createDecisionTree('User Login', [
  { condition: 'Valid?', next: 'Grant Access' },
  { condition: 'Invalid?', next: 'Show Error' }
]);

// Process with parallel branches
const processFlow = FlowDiagramHelpers.createProcessFlow([
  { name: 'Receive Order' },
  { name: 'Process Payment' },
  { 
    name: 'Prepare Items',
    parallel: ['Pack Item A', 'Pack Item B', 'Pack Item C']
  },
  { name: 'Ship Order' }
]);
```

## API Reference

### FlowDiagram Class

The core class for managing flow diagrams.

#### Methods

- `addNode(node: Omit<Node, 'id'>): string` - Add a new node
- `getNode(id: string): Node | undefined` - Get a node by ID
- `updateNode(id: string, updates: Partial<Node>): boolean` - Update a node
- `removeNode(id: string): boolean` - Remove a node and its edges
- `addEdge(edge: Omit<Edge, 'id'>): string` - Add a new edge
- `getEdge(id: string): Edge | undefined` - Get an edge by ID
- `updateEdge(id: string, updates: Partial<Edge>): boolean` - Update an edge
- `removeEdge(id: string): boolean` - Remove an edge
- `autoLayout(layout: 'hierarchical' | 'circular' | 'grid'): void` - Auto-position nodes
- `toJSON(): any` - Serialize to JSON
- `static fromJSON(data: any): FlowDiagram` - Deserialize from JSON

### FlowDiagramHelpers Class

Utility functions for common flow patterns.

#### Methods

- `createLinearFlow(labels: string[]): FlowDiagram` - Create a linear flow
- `createBranchingFlow(input: string, outputs: string[]): FlowDiagram` - Create branching flow
- `createConvergingFlow(inputs: string[], output: string): FlowDiagram` - Create converging flow
- `createDecisionTree(root: string, decisions: Array<{condition: string, next: string}>): FlowDiagram` - Create decision tree
- `createProcessFlow(steps: Array<{name: string, parallel?: string[]}>): FlowDiagram` - Create process flow
- `clone(diagram: FlowDiagram): FlowDiagram` - Clone a diagram
- `merge(diagram1: FlowDiagram, diagram2: FlowDiagram, options?): FlowDiagram` - Merge diagrams
- `findCycles(diagram: FlowDiagram): string[][]` - Find cycles in the diagram
- `validate(diagram: FlowDiagram): {isValid: boolean, errors: string[]}` - Validate diagram

### FlowDiagramVisualizer Class

Generate visual representations of flow diagrams.

#### Methods

- `visualize(diagram: FlowDiagram, options: VisualizationOptions): string` - Generate visualization
- `toText(diagram: FlowDiagram): string` - Generate text representation

#### Supported Formats

- **SVG**: Scalable vector graphics
- **HTML**: Complete HTML page with embedded SVG
- **Mermaid**: Mermaid diagram syntax
- **JSON**: Structured data representation
- **Text**: Human-readable text format

## Data Types

### Node

```typescript
interface Node {
  id: string;
  label: string;
  type?: string;
  position?: Position;
  style?: NodeStyle;
  data?: Record<string, any>;
}
```

### Edge

```typescript
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  style?: EdgeStyle;
  data?: Record<string, any>;
}
```

### Styling

Both nodes and edges support extensive styling options:

```typescript
interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  width?: number;
  height?: number;
}

interface EdgeStyle {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  arrowSize?: number;
  label?: string;
}
```

## Examples

Check out the `src/examples.ts` file for comprehensive examples including:

- Basic flow diagrams
- Decision trees
- Process flows with parallel branches
- Complex e-commerce workflows
- Custom styling and theming

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev

# Run demo
npm run demo
```

## MCP Integration

This library includes a built-in MCP server that exposes flow diagram functionality to LLMs via HTTP API endpoints.

### Starting the MCP Server

```bash
# Development mode (with auto-reload)
npm run mcp:dev

# Production mode
npm run build
npm run mcp:start
```

The server will be available at `http://localhost:3000` with these endpoints:

- `GET /health` - Health check
- `GET /mcp/tools` - List available MCP tools
- `POST /mcp/tools/:toolName/execute` - Execute a specific tool

### Available MCP Tools

- `create_diagram` - Create a new flow diagram
- `add_node` - Add a node to a diagram
- `add_edge` - Add an edge between nodes
- `visualize_diagram` - Generate visualizations (SVG, HTML, Mermaid, etc.)
- `create_linear_flow` - Create a linear flow
- `create_decision_tree` - Create a decision tree
- `create_process_flow` - Create a process flow with parallel branches
- `get_diagram_info` - Get diagram information
- `list_diagrams` - List all diagrams

### Example MCP Usage

```bash
# List available tools
curl http://localhost:3000/mcp/tools

# Create a linear flow
curl -X POST http://localhost:3000/mcp/tools/create_linear_flow/execute \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"labels": ["Start", "Process", "End"], "title": "My Flow"}}'
```

### Testing the MCP Server

```bash
# Run the client demo
npx ts-node examples/mcp-client-demo.ts
```

### Connecting to Cursor

To use the MCP server with Cursor, add this configuration to your Cursor MCP settings:

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

After updating the configuration, restart Cursor. You can then ask Cursor to create flow diagrams using natural language like "Create a flow diagram for user authentication" or "Make a decision tree for order processing".

## License

MIT
