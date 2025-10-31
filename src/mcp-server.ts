#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { FlowDiagram, FlowDiagramHelpers, FlowDiagramVisualizer, visualizeDiagram } from './index';

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
  inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
        orientation: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Orientation of the diagram flow (horizontal = left-to-right, vertical = top-to-bottom)'
        },
        showLabels: { type: 'boolean', description: 'Whether to show labels' },
        showGrid: { type: 'boolean', description: 'Whether to show grid' },
        writeToFile: { type: 'boolean', description: 'Whether to write the visualization to a file in the current working directory' },
        filename: { type: 'string', description: 'Optional custom filename (without extension). If not provided, uses diagram title or ID.' }
      },
      required: ['diagramId']
    }
  },
  {
    name: 'create_linear_flow',
    description: 'Create a linear flow diagram (A -> B -> C -> D)',
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'build_complete_flow_chart',
    description: 'Build the complete flow chart and output as a file (svg, html, mermaid, json, text)',
    inputSchema: {
      type: 'object',
      properties: {
        nodes: { type: 'array', description: 'The nodes of the flow chart' },
        edges: { type: 'array', description: 'The edges of the flow chart' },
        title: { type: 'string', description: 'The title of the flow chart' },
        parallelNodes: { type: 'array', description: 'The parallel nodes of the flow chart' },
        format: { type: 'string', description: 'The format of the output file' },
        theme: { type: 'string', description: 'The theme of the output file' },
        orientation: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Orientation of the diagram flow' },
        showLabels: { type: 'boolean', description: 'Whether to show labels' },
        showGrid: { type: 'boolean', description: 'Whether to show grid' },
        writeToFile: { type: 'boolean', description: 'Whether to write the visualization to a file in the current working directory' },
        filename: { type: 'string', description: 'Optional custom filename (without extension). If not provided, uses diagram title or ID.' }
      },
      required: []
    }
  },
  {
    name: 'edit_diagram',
    description: 'Edit an existing diagram by importing data from JSON, text, or object format. If diagramId is not provided, creates a new diagram.',
    inputSchema: {
      type: 'object',
      properties: {
        diagramId: { type: 'string', description: 'ID of the diagram to edit. If not provided, creates a new diagram.' },
        diagramData: { 
          type: ['string', 'object'],
          description: 'Diagram data in JSON string, text format, or object. Must contain nodes and/or edges.'
        },
        format: { 
          type: 'string',
          enum: ['json', 'text', 'auto'],
          description: 'Format of the input data. "auto" will try to detect automatically.'
        },
        merge: { 
          type: 'boolean',
          description: 'If true, merge with existing diagram. If false, replace existing diagram. Default: false'
        }
      },
      required: ['diagramData']
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

        const format = parameters.format || 'svg';
        const visualization = visualizeDiagram(diagram, format, {
          theme: parameters.theme || 'light',
          orientation: parameters.orientation || 'vertical',
          showLabels: parameters.showLabels !== false,
          showGrid: parameters.showGrid || false
        });

        let filePath = null;
        if (parameters.writeToFile) {
          try {
            // Generate filename
            let filename = parameters.filename;
            if (!filename) {
              filename = diagram.title || `diagram-${parameters.diagramId}`;
              // Clean filename for filesystem
              filename = filename.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
            }

            // Add appropriate extension
            const extension = format === 'html' ? 'html' : 
                            format === 'mermaid' ? 'mmd' : 
                            format === 'json' ? 'json' : 
                            format === 'text' ? 'txt' : 'svg';
            
            const fullFilename = `${filename}.${extension}`;
            filePath = path.join(process.cwd(), fullFilename);

            // Write file based on format
            if (format === 'html') {
              // Wrap SVG in HTML if it's SVG format
              const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${diagram.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .diagram { text-align: center; margin: 20px 0; }
        svg { border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${diagram.title}</h1>
        <div class="diagram">
            ${visualization}
        </div>
    </div>
</body>
</html>`;
              fs.writeFileSync(filePath, htmlContent, 'utf8');
            } else {
              fs.writeFileSync(filePath, visualization, 'utf8');
            }
          } catch (error) {
            console.error('Error writing file:', error);
            return { 
              success: false, 
              error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
        }

        return {
          success: true,
          data: {
            format,
            visualization,
            ...(filePath && { filePath })
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

      case 'build_complete_flow_chart': {
        const {
          nodes = [],
          edges = [],
          title = 'Untitled Flow Diagram',
          parallelNodes = [],
          format = 'json',
          theme = 'default',
          showLabels = true,
          showGrid = false,
          writeToFile = false,
          filename
        } = parameters;
      
        // Create new diagram
        const diagram = new FlowDiagram();
      
        // Add nodes
        const nodeIdMap = new Map();
        for (const node of nodes) {
          const nodeId = diagram.addNode({
            label: node.label || node.name || 'Unnamed',
            type: node.type || 'process',
            position: node.position,
            style: node.style,
          });
          nodeIdMap.set(node.id || node.label, nodeId);
        }
      
        // Add edges
        for (const edge of edges) {
          const sourceId = nodeIdMap.get(edge.sourceId) || edge.sourceId;
          const targetId = nodeIdMap.get(edge.targetId) || edge.targetId;
          if (sourceId && targetId) {
            diagram.addEdge({
              sourceId,
              targetId,
              label: edge.label,
              style: edge.style,
            });
          }
        }
      
        // Handle parallel groups if provided
        for (const group of parallelNodes) {
          const parentId = nodeIdMap.get(group.parentId);
          if (!parentId) continue;
          for (const pnode of group.nodes || []) {
            const parallelId = diagram.addNode({
              label: pnode.label,
              type: 'parallel',
              style: pnode.style || { backgroundColor: '#e1f5fe', borderColor: '#00bcd4' },
            });
            diagram.addEdge({ sourceId: parentId, targetId: parallelId });
          }
        }
      
        // Layout & validate
        diagram.autoLayout('hierarchical');
        const validation = FlowDiagramHelpers.validate(diagram);
      
        // Register the new diagram in memory
        diagrams.set(title, diagram);
      
        // Visualize
        const visualization = visualizeDiagram(diagram, format, {
          theme: theme || 'light',
          orientation: parameters.orientation || 'vertical',
          showLabels: showLabels !== false,
          showGrid: showGrid || false
        });

        let filePath = null;
        if (writeToFile) {
          try {
            // Generate filename
            let file = filename;
            if (!file) {
              file = title || `diagram-${title}`;
              // Clean filename for filesystem
              file = file.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
            }

            // Add appropriate extension
            const extension = format === 'html' ? 'html' : 
                            format === 'mermaid' ? 'mmd' : 
                            format === 'json' ? 'json' : 
                            format === 'text' ? 'txt' : 'svg';
            
            const fullFilename = `${file}.${extension}`;
            filePath = path.join(process.cwd(), fullFilename);

            // Write file based on format
            if (format === 'html') {
              // Wrap SVG in HTML if it's SVG format
              const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .diagram { text-align: center; margin: 20px 0; }
        svg { border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="diagram">
            ${visualization}
        </div>
    </div>
</body>
</html>`;
              fs.writeFileSync(filePath, htmlContent, 'utf8');
            } else {
              fs.writeFileSync(filePath, visualization, 'utf8');
            }
          } catch (error) {
            console.error('Error writing file:', error);
            return { 
              success: false, 
              error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
        }
      
        return {
          success: true,
          data: {
            title,
            nodeCount: diagram.getAllNodes().length,
            edgeCount: diagram.getAllEdges().length,
            validation,
            visualization,
            ...(filePath && { filePath })
          },
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

      case 'edit_diagram': {
        try {
          const { diagramId, diagramData, format = 'auto', merge = false } = parameters;
          
          // Parse the diagram data
          const parsed = FlowDiagramHelpers.parseDiagramData(diagramData, format);
          
          // Get or create diagram
          let diagram: FlowDiagram;
          let finalId: string;
          
          if (diagramId && diagrams.has(diagramId)) {
            diagram = diagrams.get(diagramId)!;
            finalId = diagramId;
            
            if (!merge) {
              // Replace: clear existing nodes and edges
              diagram.getAllNodes().forEach(node => diagram.removeNode(node.id));
            }
          } else {
            // Create new diagram
            diagram = new FlowDiagram({
              title: parsed.title || 'Edited Flow Diagram',
              ...parsed.options
            });
            finalId = diagramId || uuidv4();
          }
          
          // Map existing node IDs for merging
          const existingNodeMap = new Map<string, string>(); // label -> id
          if (merge) {
            diagram.getAllNodes().forEach(node => {
              existingNodeMap.set(node.label, node.id);
            });
          }
          
          // Add or update nodes
          const nodeIdMap = new Map<string, string>(); // parsed node id -> actual node id
          if (parsed.nodes) {
            for (const nodeData of parsed.nodes) {
              let nodeId: string;
              
              if (merge && existingNodeMap.has(nodeData.label)) {
                // Update existing node
                nodeId = existingNodeMap.get(nodeData.label)!;
                diagram.updateNode(nodeId, {
                  label: nodeData.label,
                  type: nodeData.type,
                  position: nodeData.position,
                  style: nodeData.style,
                  ...nodeData
                });
              } else {
                // Add new node
                nodeId = diagram.addNode({
                  label: nodeData.label || 'Unnamed',
                  type: nodeData.type || 'process',
                  position: nodeData.position,
                  style: nodeData.style,
                  data: nodeData.data
                });
              }
              
              nodeIdMap.set(nodeData.id || nodeData.label, nodeId);
            }
          }
          
          // Add or update edges
          if (parsed.edges) {
            for (const edgeData of parsed.edges) {
              const sourceId = nodeIdMap.get(edgeData.sourceId) || edgeData.sourceId;
              const targetId = nodeIdMap.get(edgeData.targetId) || edgeData.targetId;
              
              // Check if nodes exist
              if (!diagram.getNode(sourceId) || !diagram.getNode(targetId)) {
                continue; // Skip invalid edges
              }
              
              try {
                diagram.addEdge({
                  sourceId,
                  targetId,
                  label: edgeData.label,
                  style: edgeData.style,
                  data: edgeData.data
                });
              } catch (e) {
                // Edge might already exist, skip
              }
            }
          }
          
          // Update title if provided
          if (parsed.title && !merge) {
            diagram['options'].title = parsed.title;
          }
          
          // Store the diagram
          diagrams.set(finalId, diagram);
          
          return {
            success: true,
            data: {
              diagramId: finalId,
              title: diagram.title,
              nodeCount: diagram.nodeCount,
              edgeCount: diagram.edgeCount,
              merged: merge,
              diagram: diagram.toJSON()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to edit diagram'
          };
        }
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

// MCP Protocol endpoints
app.all('/mcp', async (req: any, res: any) => {
  try {
    // Debug logging (can be removed in production)
    // console.log(`MCP Request: ${req.method} ${req.url}`);

    // Handle GET requests (some MCP clients try GET first)
    if (req.method === 'GET') {
      res.json({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {},
            prompts: {},
            resources: {},
            logging: {},
            elicitation: {},
            roots: {
              listChanged: false
            }
          },
          serverInfo: {
            name: 'flow-diagram-mcp',
            version: '1.0.0'
          }
        }
      });
      return;
    }

    // Handle POST requests with JSON-RPC
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: Invalid JSON'
        }
      });
      return;
    }

    const { method, params, id } = req.body;
    
    // Validate required fields
    if (!method) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: missing method'
        }
      });
      return;
    }
    
    switch (method) {
      case 'initialize': {
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {
              tools: {},
              prompts: {},
              resources: {},
              logging: {},
              elicitation: {},
              roots: {
                listChanged: false
              }
            },
            serverInfo: {
              name: 'flow-diagram-mcp',
              version: '1.0.0'
            }
          }
        });
        break;
      }
      
      case 'tools/list': {
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: mcpTools
          }
        });
        break;
      }
      
      case 'prompts/list': {
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            prompts: []
          }
        });
        break;
      }
      
      case 'resources/list': {
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            resources: []
          }
        });
        break;
      }
      
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!name) {
          res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: missing tool name'
            }
          });
          return;
        }
        
        const result = await executeMCPTool(name, args || {});
        
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });
        break;
      }
      
      case 'notifications/initialized': {
        // Handle initialization notification - notifications don't return responses
        res.status(200).end();
        break;
      }
      
      default: {
        res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
});

// Legacy endpoints for backward compatibility
app.get('/mcp/tools', (req: any, res: any) => {
  res.json({
    tools: mcpTools
  });
});

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
  console.log(`Flow Diagram MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP Tools: http://localhost:${PORT}/mcp/tools`);
  console.log(`Available tools: ${mcpTools.length}`);
});
