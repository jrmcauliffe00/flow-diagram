#!/usr/bin/env node

/**
 * Example of how an LLM would interact with the MCP server
 */

interface MCPClient {
  callTool(toolName: string, parameters: any): Promise<any>;
  listTools(): Promise<any>;
}

class FlowDiagramMCPClient implements MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async callTool(toolName: string, parameters: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp/tools/${toolName}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parameters })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async listTools(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp/tools`);
    return await response.json();
  }
}

// Example usage
async function demonstrateMCPUsage() {
  console.log('MCP Client Demo\n');

  const client = new FlowDiagramMCPClient();

  try {
    // 1. List available tools
    console.log('Available MCP Tools:');
    const tools = await client.listTools();
    tools.tools.forEach((tool: any) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // 2. Create a linear flow diagram
    console.log('\nCreating linear flow...');
    const linearFlow = await client.callTool('create_linear_flow', {
      labels: ['Start', 'Process Data', 'Validate Input', 'Generate Report', 'End'],
      title: 'Data Processing Pipeline'
    });
    console.log(`Created diagram: ${linearFlow.data.id}`);

    // 3. Add a custom node
    console.log('\nAdding custom node...');
    const addNode = await client.callTool('add_node', {
      diagramId: linearFlow.data.id,
      label: 'Send Notification',
      type: 'process',
      style: { backgroundColor: '#fff3e0', borderColor: '#ff9800' }
    });
    console.log(`Added node: ${addNode.data.nodeId}`);

    // 4. Add an edge
    console.log('\nAdding edge...');
    const addEdge = await client.callTool('add_edge', {
      diagramId: linearFlow.data.id,
      sourceId: 'node_4', // Generate Report node
      targetId: addNode.data.nodeId,
      label: 'Notify User'
    });
    console.log(`Added edge: ${addEdge.data.edgeId}`);

    // 5. Generate visualization
    console.log('\nGenerating visualization...');
    const visualization = await client.callTool('visualize_diagram', {
      diagramId: linearFlow.data.id,
      format: 'svg',
      theme: 'light',
      showLabels: true
    });
    console.log('Visualization generated');

    // 6. Create a decision tree
    console.log('\nCreating decision tree...');
    const decisionTree = await client.callTool('create_decision_tree', {
      rootLabel: 'User Authentication',
      decisions: [
        { condition: 'Valid Credentials?', next: 'Grant Access' },
        { condition: 'Invalid Password?', next: 'Show Error' },
        { condition: 'Account Locked?', next: 'Contact Admin' }
      ],
      title: 'Authentication Flow'
    });
    console.log(`Created decision tree: ${decisionTree.data.id}`);

    // 7. List all diagrams
    console.log('\nAll diagrams:');
    const allDiagrams = await client.callTool('list_diagrams', {});
    allDiagrams.data.diagrams.forEach((diagram: any) => {
      console.log(`  - ${diagram.id}: ${diagram.title} (${diagram.nodeCount} nodes, ${diagram.edgeCount} edges)`);
    });

    console.log('\nMCP Demo complete!');
    console.log('\nThe LLM can now:');
    console.log('- Create and modify flow diagrams');
    console.log('- Generate visualizations in multiple formats');
    console.log('- Use helper functions for common patterns');
    console.log('- Manage multiple diagrams simultaneously');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateMCPUsage();
}

export { FlowDiagramMCPClient };
