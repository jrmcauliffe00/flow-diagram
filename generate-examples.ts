#!/usr/bin/env node

import { createFlowDiagram, visualizeDiagram, FlowDiagramHelpers } from './src/index';
import * as fs from 'fs';
import * as path from 'path';

console.log('🚀 Generating Flow Diagram Examples\n');

// Create output directory
const outputDir = './examples';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

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
fs.writeFileSync(path.join(outputDir, 'simple-diagram.svg'), svg);
console.log('✅ SVG saved to examples/simple-diagram.svg');

// Mermaid
const mermaid = visualizeDiagram(diagram, 'mermaid');
fs.writeFileSync(path.join(outputDir, 'simple-diagram.mmd'), mermaid);
console.log('✅ Mermaid saved to examples/simple-diagram.mmd');

// HTML
const html = visualizeDiagram(diagram, 'html', { theme: 'light' });
fs.writeFileSync(path.join(outputDir, 'simple-diagram.html'), html);
console.log('✅ HTML saved to examples/simple-diagram.html');

// JSON
const json = visualizeDiagram(diagram, 'json');
fs.writeFileSync(path.join(outputDir, 'simple-diagram.json'), json);
console.log('✅ JSON saved to examples/simple-diagram.json');

// Text representation
const text = diagram.getAllNodes().map(node => node.label).join(' -> ');
fs.writeFileSync(path.join(outputDir, 'simple-diagram.txt'), text);
console.log('✅ Text saved to examples/simple-diagram.txt');

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

// Generate HTML file with dark theme
const complexHtml = visualizeDiagram(complexDiagram, 'html', { 
  theme: 'dark',
  showGrid: true 
});

// Create a decision tree example
console.log('\n🌳 Creating decision tree example...');
const decisionTree = FlowDiagramHelpers.createDecisionTree('User Login', [
  { condition: 'Valid Credentials?', next: 'Grant Access' },
  { condition: 'Invalid Password?', next: 'Show Error' },
  { condition: 'Account Locked?', next: 'Contact Admin' }
]);

const decisionHtml = visualizeDiagram(decisionTree, 'html', { theme: 'light' });
fs.writeFileSync(path.join(outputDir, 'decision-tree.html'), decisionHtml);
console.log('✅ Decision tree saved to examples/decision-tree.html');

const decisionSvg = visualizeDiagram(decisionTree, 'svg', { theme: 'light' });
fs.writeFileSync(path.join(outputDir, 'decision-tree.svg'), decisionSvg);
console.log('✅ Decision tree SVG saved to examples/decision-tree.svg');

// Create a linear flow example
console.log('\n➡️ Creating linear flow example...');
const linearFlow = FlowDiagramHelpers.createLinearFlow([
  'Start', 'Validate Input', 'Process Data', 'Generate Report', 'Send Email', 'End'
]);

const linearHtml = visualizeDiagram(linearFlow, 'html', { theme: 'light' });
fs.writeFileSync(path.join(outputDir, 'linear-flow.html'), linearHtml);
console.log('✅ Linear flow saved to examples/linear-flow.html');

console.log('\n🎉 All examples generated!');
console.log(`\nCheck out the files in the ${outputDir}/ directory:`);
console.log('- simple-diagram.html (basic example)');
console.log('- decision-tree.html (decision tree)');
console.log('- linear-flow.html (linear process)');
console.log('- Various .svg files for vector graphics');
console.log('- .mmd files for Mermaid diagrams');
console.log('- .json files for data export');
console.log('- .txt files for text representation');
