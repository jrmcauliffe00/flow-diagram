#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { FlowDiagram, FlowDiagramHelpers, FlowDiagramVisualizer } from './index';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage (in production, use a database)
const diagrams = new Map<string, FlowDiagram>();

// MCP Tool Registry
interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

const mcpTools: MCPTool[] = [
  {
    name: 'create_diagram',
    description: 'Create a new flow diagram',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the diagram' },
        width: { type: 'number', description: 'Width of the diagram' },
        height: { type: 'number', description: 'Height of the diagram' },
        backgroundColor: { type: 'string', description: 'Background color' }
      },
      required: []
    }
  },
  {
    name: 'add_node',
    description: 'Add a node to a flow diagram',
    parameters: {
      type: 'object',
      properties: {
        diagramId: { type: 'string', description: 'ID of the diagram' },
        label: { type: 'string', description: 'Label for the node' },
        type: { type: 'string', description: 'Type of node (start, process, end, decision, etc.)' },
        position: { 
          type: 'object', 
          description: 'Position of the node',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          }
        },
        style: { 
          type: 'object', 
          description: 'Styling for the node',
          properties: {
            backgroundColor: { type: 'string' },
            borderColor: { type: 'string' },
            color: { type: 'string' }
          }
        }
      },
      required: ['diagramId', 'label']
    }
  },
  {
    name: 'add_edge',
    description: 'Add an edge between two nodes',
    parameters: {
      type: 'object',
      properties: {
        diagramId: { type: 'string', description: 'ID of the diagram' },
        sourceId: { type: 'string', description: 'ID of the source node' },
        targetId: { type: 'string', description: 'ID of the target node' },
        label: { type: 'string', description: 'Label for the edge' },
        style: { 
          type: 'object', 
          description: 'Styling for the edge',
          properties: {
            color: { type: 'string' },
            width: { type: 'number' },
            style: { type: 'string', enum: ['solid', 'dashed', 'dotted'] }
          }
        }
      },
      required: ['diagramId', 'sourceId', 'targetId']
    }
  },
  {
    name: 'visualize_diagram',
    description: 'Generate a visualization of the diagram',
    parameters: {
      type: 'object',
      properties: {
        diagramId: { type: 'string', description: 'ID of the diagram' },
        format: { 
          type: 'string', 
          enum: ['svg', 'html', 'mermaid', 'json', 'text'],
          description: 'Output format for visualization'
        },
        theme: { 
          type: 'string', 
          enum: ['light', 'dark'],
          description: 'Theme for the visualization'
        },
        showLabels: { type: 'boolean', description: 'Whether to show labels' },
        showGrid: { type: 'boolean', description: 'Whether to show grid' }
      },
      required: ['diagramId']
    }
  },
  {
    name: 'create_linear_flow',
    description: 'Create a linear flow diagram (A -> B -> C -> D)',
    parameters: {
      type: 'object',
      properties: {
        labels: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of node labels in order'
        },
        title: { type: 'string', description: 'Title of the diagram' }
      },
      required: ['labels']
    }
  },
  {
    name: 'create_decision_tree',
    description: 'Create a decision tree diagram',
    parameters: {
      type: 'object',
      properties: {
        rootLabel: { type: 'string', description: 'Label for the root decision' },
        decisions: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              next: { type: 'string' }
            },
            required: ['condition', 'next']
          },
          description: 'Array of decision conditions and outcomes'
        },
        title: { type: 'string', description: 'Title of the diagram' }
      },
      required: ['rootLabel', 'decisions']
    }
  },
  {
    name: 'create_process_flow',
    description: 'Create a process flow with optional parallel branches',
    parameters: {
      type: 'object',
      properties: {
        steps: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parallel: { 
                type: 'array', 
                items: { type: 'string' }
              }
            },
            required: ['name']
          },
          description: 'Array of process steps'
        },
        title: { type: 'string', description: 'Title of the diagram' }
      },
      required: ['steps']
    }
  },
  {
    name: 'get_diagram_info',
    description: 'Get information about a diagram',
    parameters: {
      type: 'object',
      properties: {
        diagramId: { type: 'string', description: 'ID of the diagram' }
      },
      required: ['diagramId']
    }
  },
  {
    name: 'list_diagrams',
    description: 'List all available diagrams',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// MCP Tool execution function
async function executeMCPTool(toolName: string, parameters: any): Promise<MCPToolResult> {
  try {
    switch (toolName) {
      case 'create_diagram': {
        const diagram = new FlowDiagram({
          title: parameters.title || 'New Flow Diagram',
          width: parameters.width || 800,
          height: parameters.height || 600,
          backgroundColor: parameters.backgroundColor || '#ffffff'
        });
        
        const id = uuidv4();
        diagrams.set(id, diagram);
        
        return {
          success: true,
          data: {
            id,
            diagram: diagram.toJSON()
          }
        };
      }

      case 'add_node': {
        const diagram = diagrams.get(parameters.diagramId);
        if (!diagram) {
          return { success: false, error: 'Diagram not found' };
        }

        const nodeId = diagram.addNode({
          label: parameters.label,
          type: parameters.type,
          position: parameters.position,
          style: parameters.style
        });

        return {
          success: true,
          data: {
            nodeId,
            node: diagram.getNode(nodeId)
          }
        };
      }

      case 'add_edge': {
        const diagram = diagrams.get(parameters.diagramId);
        if (!diagram) {
          return { success: false, error: 'Diagram not found' };
        }

        const edgeId = diagram.addEdge({
          sourceId: parameters.sourceId,
          targetId: parameters.targetId,
          label: parameters.label,
          style: parameters.style
        });

        return {
          success: true,
          data: {
            edgeId,
            edge: diagram.getEdge(edgeId)
          }
        };
      }

      case 'visualize_diagram': {
        const diagram = diagrams.get(parameters.diagramId);
        if (!diagram) {
          return { success: false, error: 'Diagram not found' };
        }

        const visualization = FlowDiagramVisualizer.visualize(diagram, {
          format: parameters.format || 'svg',
          theme: parameters.theme || 'light',
          layout: parameters.layout || 'hierarchical',
          showLabels: parameters.showLabels !== false,
          showGrid: parameters.showGrid || false
        });

        return {
          success: true,
          data: {
            format: parameters.format || 'svg',
            visualization
          }
        };
      }

      case 'create_linear_flow': {
        const diagram = FlowDiagramHelpers.createLinearFlow(parameters.labels);
        if (parameters.title) {
          diagram['options'].title = parameters.title;
        }

        const id = uuidv4();
        diagrams.set(id, diagram);

        return {
          success: true,
          data: {
            id,
            diagram: diagram.toJSON()
          }
        };
      }

      case 'create_decision_tree': {
        const diagram = FlowDiagramHelpers.createDecisionTree(parameters.rootLabel, parameters.decisions);
        if (parameters.title) {
          diagram['options'].title = parameters.title;
        }

        const id = uuidv4();
        diagrams.set(id, diagram);

        return {
          success: true,
          data: {
            id,
            diagram: diagram.toJSON()
          }
        };
      }

      case 'create_process_flow': {
        const diagram = FlowDiagramHelpers.createProcessFlow(parameters.steps);
        if (parameters.title) {
          diagram['options'].title = parameters.title;
        }

        const id = uuidv4();
        diagrams.set(id, diagram);

        return {
          success: true,
          data: {
            id,
            diagram: diagram.toJSON()
          }
        };
      }

      case 'get_diagram_info': {
        const diagram = diagrams.get(parameters.diagramId);
        if (!diagram) {
          return { success: false, error: 'Diagram not found' };
        }

        return {
          success: true,
          data: {
            id: parameters.diagramId,
            title: diagram.title,
            nodeCount: diagram.nodeCount,
            edgeCount: diagram.edgeCount,
            diagram: diagram.toJSON()
          }
        };
      }

      case 'list_diagrams': {
        const diagramList = Array.from(diagrams.entries()).map(([id, diagram]) => ({
          id,
          title: diagram.title,
          nodeCount: diagram.nodeCount,
          edgeCount: diagram.edgeCount
        }));

        return {
          success: true,
          data: {
            diagrams: diagramList
          }
        };
      }

      default:
        return { success: false, error: `Tool '${toolName}' not found` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// MCP Discovery endpoint
app.get('/mcp/tools', (req: any, res: any) => {
  res.json({
    tools: mcpTools
  });
});

// MCP Tool execution endpoint
app.post('/mcp/tools/:toolName/execute', async (req: any, res: any) => {
  try {
    const { toolName } = req.params;
    const { parameters } = req.body;
    
    const result = await executeMCPTool(toolName, parameters);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      toolName: req.params.toolName
    });
  }
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Flow Diagram MCP Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 MCP Tools: http://localhost:${PORT}/mcp/tools`);
  console.log(`📚 Available tools: ${mcpTools.length}`);
});
