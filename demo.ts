#!/usr/bin/env node

import { createFlowDiagram, visualizeDiagram, FlowDiagramHelpers } from './src/index';

console.log('🚀 Flow Diagram Demo\n');

// Create a simple flow diagram
console.log('Creating a simple flow diagram...');
const diagram = createFlowDiagram({ title: 'My First Flow Diagram' });

// Add some nodes
const startId = diagram.addNode({ 
  label: 'Start',
  type: 'start',
  style: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' }
});

const processId = diagram.addNode({ 
  label: 'Process Data',
  type: 'process',
  style: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' }
});

const endId = diagram.addNode({ 
  label: 'End',
  type: 'end',
  style: { backgroundColor: '#ffebee', borderColor: '#f44336' }
});

// Add edges
diagram.addEdge({ sourceId: startId, targetId: processId, label: 'Begin' });
diagram.addEdge({ sourceId: processId, targetId: endId, label: 'Complete' });

// Auto-layout
diagram.autoLayout('hierarchical');

console.log(`✅ Created diagram with ${diagram.nodeCount} nodes and ${diagram.edgeCount} edges`);

// Generate different visualizations
console.log('\n📊 Generating visualizations...');

// SVG
const svg = visualizeDiagram(diagram, 'svg', { theme: 'light' });
console.log('✅ SVG generated');

// Mermaid
const mermaid = visualizeDiagram(diagram, 'mermaid');
console.log('✅ Mermaid diagram generated');

// Text representation
const text = diagram.getAllNodes().map(node => node.label).join(' -> ');
console.log(`✅ Text representation: ${text}`);

// Create a more complex example using helpers
console.log('\n🔧 Creating complex example with helpers...');
const complexDiagram = FlowDiagramHelpers.createProcessFlow([
  { name: 'Receive Order' },
  { name: 'Process Payment' },
  { 
    name: 'Prepare Items',
    parallel: ['Pack Item A', 'Pack Item B']
  },
  { name: 'Ship Order' }
]);

console.log(`✅ Complex diagram created with ${complexDiagram.nodeCount} nodes and ${complexDiagram.edgeCount} edges`);

// Generate HTML file
const html = visualizeDiagram(complexDiagram, 'html', { 
  theme: 'dark',
  showGrid: true 
});

console.log('\n📁 Saving HTML visualization...');
// In a real app, you'd write this to a file
console.log('✅ HTML visualization ready (would be saved to file)');

console.log('\n🎉 Demo complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
console.log('3. Check out the generated files in dist/');
console.log('4. Create your own flow diagrams!');
