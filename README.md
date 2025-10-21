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
npm install
npm run build
npm run demo
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

This library is designed to work seamlessly with MCP (Model Context Protocol) servers. The flow diagram objects can be easily serialized and passed between the MCP server and LLM clients.

## License

MIT
