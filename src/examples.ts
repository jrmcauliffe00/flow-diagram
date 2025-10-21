import { FlowDiagram, FlowDiagramHelpers, FlowDiagramVisualizer } from './index';

/**
 * Example usage of the Flow Diagram library
 */

export function createBasicExample(): FlowDiagram {
  // Create a simple linear flow
  const diagram = FlowDiagramHelpers.createLinearFlow([
    'Start',
    'Process Data',
    'Validate Input',
    'Generate Report',
    'End'
  ]);
  
  // Add some styling
  const nodes = diagram.getAllNodes();
  nodes.forEach((node, index) => {
    if (index === 0) {
      diagram.updateNode(node.id, {
        type: 'start',
        style: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' }
      });
    } else if (index === nodes.length - 1) {
      diagram.updateNode(node.id, {
        type: 'end',
        style: { backgroundColor: '#ffebee', borderColor: '#f44336' }
      });
    } else {
      diagram.updateNode(node.id, {
        type: 'process',
        style: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' }
      });
    }
  });
  
  return diagram;
}

export function createDecisionTreeExample(): FlowDiagram {
  return FlowDiagramHelpers.createDecisionTree('User Login', [
    { condition: 'Valid Credentials?', next: 'Grant Access' },
    { condition: 'Invalid Password?', next: 'Show Error' },
    { condition: 'Account Locked?', next: 'Contact Admin' }
  ]);
}

export function createProcessFlowExample(): FlowDiagram {
  return FlowDiagramHelpers.createProcessFlow([
    { name: 'Receive Order' },
    { name: 'Process Payment' },
    { 
      name: 'Prepare Items',
      parallel: ['Pack Item A', 'Pack Item B', 'Pack Item C']
    },
    { name: 'Ship Order' },
    { name: 'Send Confirmation' }
  ]);
}

export function createComplexExample(): FlowDiagram {
  const diagram = new FlowDiagram({
    title: 'E-commerce Order Processing',
    width: 1000,
    height: 800
  });
  
  // Add nodes
  const startId = diagram.addNode({
    label: 'Customer Places Order',
    type: 'start',
    style: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' }
  });
  
  const paymentId = diagram.addNode({
    label: 'Process Payment',
    type: 'process',
    style: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' }
  });
  
  const inventoryId = diagram.addNode({
    label: 'Check Inventory',
    type: 'process',
    style: { backgroundColor: '#fff3e0', borderColor: '#ff9800' }
  });
  
  const fulfillmentId = diagram.addNode({
    label: 'Fulfill Order',
    type: 'process',
    style: { backgroundColor: '#f3e5f5', borderColor: '#9c27b0' }
  });
  
  const shippingId = diagram.addNode({
    label: 'Ship Order',
    type: 'process',
    style: { backgroundColor: '#e1f5fe', borderColor: '#00bcd4' }
  });
  
  const endId = diagram.addNode({
    label: 'Order Complete',
    type: 'end',
    style: { backgroundColor: '#ffebee', borderColor: '#f44336' }
  });
  
  // Add edges
  diagram.addEdge({
    sourceId: startId,
    targetId: paymentId,
    label: 'Order Details'
  });
  
  diagram.addEdge({
    sourceId: paymentId,
    targetId: inventoryId,
    label: 'Payment Success'
  });
  
  diagram.addEdge({
    sourceId: inventoryId,
    targetId: fulfillmentId,
    label: 'Items Available'
  });
  
  diagram.addEdge({
    sourceId: fulfillmentId,
    targetId: shippingId,
    label: 'Items Packed'
  });
  
  diagram.addEdge({
    sourceId: shippingId,
    targetId: endId,
    label: 'Tracking Info'
  });
  
  // Auto-layout
  diagram.autoLayout('hierarchical');
  
  return diagram;
}

// Example of how to use the visualizer
export function generateVisualizations() {
  const diagram = createComplexExample();
  
  console.log('=== SVG Visualization ===');
  console.log(FlowDiagramVisualizer.visualize(diagram, { format: 'svg' }));
  
  console.log('\n=== Mermaid Diagram ===');
  console.log(FlowDiagramVisualizer.visualize(diagram, { format: 'mermaid' }));
  
  console.log('\n=== Text Representation ===');
  console.log(FlowDiagramVisualizer.toText(diagram));
  
  // Save HTML file
  const html = FlowDiagramVisualizer.visualize(diagram, { 
    format: 'html',
    theme: 'light',
    showGrid: true
  });
  
  return {
    svg: FlowDiagramVisualizer.visualize(diagram, { format: 'svg' }),
    mermaid: FlowDiagramVisualizer.visualize(diagram, { format: 'mermaid' }),
    html,
    text: FlowDiagramVisualizer.toText(diagram)
  };
}
