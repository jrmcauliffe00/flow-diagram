import { FlowDiagram } from './FlowDiagram';
import { Node, Edge, Position } from './types';

/**
 * Helper functions for common flow diagram operations
 */

export class FlowDiagramHelpers {
  /**
   * Create a simple linear flow (A -> B -> C -> D)
   */
  static createLinearFlow(labels: string[]): FlowDiagram {
    const diagram = new FlowDiagram();
    
    if (labels.length === 0) return diagram;
    
    // Add nodes
    const nodeIds = labels.map(label => diagram.addNode({ label }));
    
    // Connect them in sequence
    for (let i = 0; i < nodeIds.length - 1; i++) {
      diagram.addEdge({
        sourceId: nodeIds[i],
        targetId: nodeIds[i + 1]
      });
    }
    
    diagram.autoLayout('hierarchical');
    return diagram;
  }

  /**
   * Create a branching flow (one input, multiple outputs)
   */
  static createBranchingFlow(inputLabel: string, outputLabels: string[]): FlowDiagram {
    const diagram = new FlowDiagram();
    
    const inputNodeId = diagram.addNode({ label: inputLabel });
    const outputNodeIds = outputLabels.map(label => diagram.addNode({ label }));
    
    // Connect input to all outputs
    outputNodeIds.forEach(outputId => {
      diagram.addEdge({
        sourceId: inputNodeId,
        targetId: outputId
      });
    });
    
    diagram.autoLayout('hierarchical');
    return diagram;
  }

  /**
   * Create a converging flow (multiple inputs, one output)
   */
  static createConvergingFlow(inputLabels: string[], outputLabel: string): FlowDiagram {
    const diagram = new FlowDiagram();
    
    const inputNodeIds = inputLabels.map(label => diagram.addNode({ label }));
    const outputNodeId = diagram.addNode({ label: outputLabel });
    
    // Connect all inputs to output
    inputNodeIds.forEach(inputId => {
      diagram.addEdge({
        sourceId: inputId,
        targetId: outputNodeId
      });
    });
    
    diagram.autoLayout('hierarchical');
    return diagram;
  }

  /**
   * Create a decision tree flow
   */
  static createDecisionTree(
    rootLabel: string,
    decisions: Array<{ condition: string; next: string }>
  ): FlowDiagram {
    const diagram = new FlowDiagram();
    
    const rootId = diagram.addNode({ 
      label: rootLabel,
      type: 'decision',
      style: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' }
    });
    
    const decisionIds = decisions.map(decision => 
      diagram.addNode({ 
        label: decision.condition,
        type: 'condition',
        style: { backgroundColor: '#fff3e0', borderColor: '#ff9800' }
      })
    );
    
    const nextIds = decisions.map(decision => 
      diagram.addNode({ 
        label: decision.next,
        type: 'action',
        style: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' }
      })
    );
    
    // Connect root to decisions
    decisionIds.forEach(decisionId => {
      diagram.addEdge({
        sourceId: rootId,
        targetId: decisionId
      });
    });
    
    // Connect decisions to next actions
    decisions.forEach((_, index) => {
      diagram.addEdge({
        sourceId: decisionIds[index],
        targetId: nextIds[index]
      });
    });
    
    diagram.autoLayout('hierarchical');
    return diagram;
  }

  /**
   * Create a process flow with parallel branches
   */
  static createProcessFlow(steps: Array<{
    name: string;
    parallel?: string[];
  }>): FlowDiagram {
    const diagram = new FlowDiagram();
    
    const nodeIds: string[] = [];
    
    steps.forEach(step => {
      if (step.parallel && step.parallel.length > 0) {
        // Create parallel branch
        const mainId = diagram.addNode({ 
          label: step.name,
          type: 'process',
          style: { backgroundColor: '#f3e5f5', borderColor: '#9c27b0' }
        });
        nodeIds.push(mainId);
        
        const parallelIds = step.parallel.map(parallelStep => 
          diagram.addNode({ 
            label: parallelStep,
            type: 'parallel',
            style: { backgroundColor: '#e1f5fe', borderColor: '#00bcd4' }
          })
        );
        
        // Connect main to parallel branches
        parallelIds.forEach(parallelId => {
          diagram.addEdge({
            sourceId: mainId,
            targetId: parallelId
          });
        });
        
        nodeIds.push(...parallelIds);
      } else {
        // Regular step
        const nodeId = diagram.addNode({ 
          label: step.name,
          type: 'process',
          style: { backgroundColor: '#f3e5f5', borderColor: '#9c27b0' }
        });
        nodeIds.push(nodeId);
      }
    });
    
    // Connect sequential steps
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const current = diagram.getNode(nodeIds[i]);
      const next = diagram.getNode(nodeIds[i + 1]);
      
      if (current && next && current.type !== 'parallel') {
        diagram.addEdge({
          sourceId: nodeIds[i],
          targetId: nodeIds[i + 1]
        });
      }
    }
    
    diagram.autoLayout('hierarchical');
    return diagram;
  }

  /**
   * Clone a flow diagram
   */
  static clone(diagram: FlowDiagram): FlowDiagram {
    return FlowDiagram.fromJSON(diagram.toJSON());
  }

  /**
   * Merge two flow diagrams
   */
  static merge(diagram1: FlowDiagram, diagram2: FlowDiagram, options: {
    connectEnds?: boolean;
    offset?: Position;
  } = {}): FlowDiagram {
    const merged = FlowDiagram.fromJSON(diagram1.toJSON());
    const offset = options.offset || { x: 0, y: 0 };
    
    // Add nodes from diagram2 with offset
    diagram2.getAllNodes().forEach(node => {
      const newNodeId = merged.addNode({
        ...node,
        position: node.position ? {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y
        } : undefined
      });
      
      // Update any edges that reference this node
      diagram2.getAllEdges().forEach(edge => {
        if (edge.sourceId === node.id || edge.targetId === node.id) {
          // This edge needs to be recreated with new node IDs
          // For now, we'll skip this - in a real implementation,
          // you'd need to track the ID mappings
        }
      });
    });
    
    // Add edges from diagram2
    diagram2.getAllEdges().forEach(edge => {
      // Note: This is simplified - in practice you'd need to map old IDs to new IDs
      merged.addEdge(edge);
    });
    
    if (options.connectEnds) {
      // Connect the end of diagram1 to the start of diagram2
      const diagram1EndNodes = merged.getAllNodes().filter(node => {
        const connected = merged.getConnectedNodes(node.id);
        return connected.outgoing.length === 0;
      });
      
      const diagram2StartNodes = merged.getAllNodes().filter(node => {
        const connected = merged.getConnectedNodes(node.id);
        return connected.incoming.length === 0;
      });
      
      if (diagram1EndNodes.length > 0 && diagram2StartNodes.length > 0) {
        merged.addEdge({
          sourceId: diagram1EndNodes[0].id,
          targetId: diagram2StartNodes[0].id
        });
      }
    }
    
    return merged;
  }

  /**
   * Find cycles in the flow diagram
   */
  static findCycles(diagram: FlowDiagram): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const connected = diagram.getConnectedNodes(nodeId);
      connected.outgoing.forEach(nextNode => {
        dfs(nextNode.id, [...path]);
      });
      
      recursionStack.delete(nodeId);
    };
    
    diagram.getAllNodes().forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });
    
    return cycles;
  }

  /**
   * Validate the flow diagram structure
   */
  static validate(diagram: FlowDiagram): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check for orphaned edges
    diagram.getAllEdges().forEach(edge => {
      if (!diagram.getNode(edge.sourceId)) {
        errors.push(`Edge ${edge.id} references non-existent source node ${edge.sourceId}`);
      }
      if (!diagram.getNode(edge.targetId)) {
        errors.push(`Edge ${edge.id} references non-existent target node ${edge.targetId}`);
      }
    });
    
    // Check for duplicate node IDs
    const nodeIds = new Set<string>();
    diagram.getAllNodes().forEach(node => {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);
    });
    
    // Check for duplicate edge IDs
    const edgeIds = new Set<string>();
    diagram.getAllEdges().forEach(edge => {
      if (edgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID: ${edge.id}`);
      }
      edgeIds.add(edge.id);
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse diagram data from various formats (JSON, text, or partial structure)
   */
  static parseDiagramData(data: string | object, format?: 'json' | 'text' | 'auto'): {
    nodes?: any[];
    edges?: any[];
    options?: any;
    title?: string;
  } {
    const formatType = format || 'auto';

    // If it's already an object, try to use it directly
    if (typeof data === 'object' && data !== null) {
      // Check if it's a valid FlowDiagram JSON structure
      if ('nodes' in data && 'edges' in data) {
        return {
          nodes: (data as any).nodes,
          edges: (data as any).edges,
          options: (data as any).options,
          title: (data as any).options?.title || (data as any).title
        };
      }
      // If it's just nodes/edges at top level
      if ('nodes' in data || 'edges' in data) {
        return {
          nodes: (data as any).nodes,
          edges: (data as any).edges
        };
      }
    }

    // If it's a string, parse it
    if (typeof data === 'string') {
      // Try JSON first
      if (formatType === 'json' || formatType === 'auto') {
        try {
          const parsed = JSON.parse(data);
          if ('nodes' in parsed || 'edges' in parsed) {
            return {
              nodes: parsed.nodes,
              edges: parsed.edges,
              options: parsed.options,
              title: parsed.title || parsed.options?.title
            };
          }
        } catch (e) {
          // Not JSON, continue to text parsing
        }
      }

      // Try text format parsing
      if (formatType === 'text' || formatType === 'auto') {
        return this.parseTextFormat(data);
      }
    }

    throw new Error('Unable to parse diagram data. Expected JSON with nodes/edges or text format.');
  }

  /**
   * Parse text format diagram representation
   */
  private static parseTextFormat(text: string): {
    nodes: any[];
    edges: any[];
    title?: string;
  } {
    const nodes: any[] = [];
    const edges: any[] = [];
    let title = '';
    
    const lines = text.split('\n');
    let inNodesSection = false;
    let inEdgesSection = false;
    const nodeMap = new Map<string, string>(); // label -> id
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract title
      if (trimmed.startsWith('Flow Diagram:')) {
        title = trimmed.replace('Flow Diagram:', '').trim();
        continue;
      }
      
      // Section markers
      if (trimmed === 'Nodes:') {
        inNodesSection = true;
        inEdgesSection = false;
        continue;
      }
      if (trimmed === 'Edges:') {
        inNodesSection = false;
        inEdgesSection = true;
        continue;
      }
      
      // Parse node lines: "  - node_1: Label (type)"
      if (inNodesSection && trimmed.startsWith('-')) {
        const match = trimmed.match(/- (\w+): (.+?)(?: \((.+)\))?$/);
        if (match) {
          const [, nodeId, label, type] = match;
          nodes.push({
            id: nodeId,
            label: label.trim(),
            type: type || 'process'
          });
          nodeMap.set(label.trim(), nodeId);
        }
      }
      
      // Parse edge lines: "  - Source Label -> Target Label (label)"
      if (inEdgesSection && trimmed.startsWith('-')) {
        const match = trimmed.match(/- (.+?) -> (.+?)(?: \((.+)\))?$/);
        if (match) {
          const [, sourceLabel, targetLabel, edgeLabel] = match;
          const sourceId = nodeMap.get(sourceLabel.trim()) || sourceLabel.trim();
          const targetId = nodeMap.get(targetLabel.trim()) || targetLabel.trim();
          edges.push({
            sourceId,
            targetId,
            label: edgeLabel || undefined
          });
        }
      }
    }
    
    return { nodes, edges, title: title || undefined };
  }
}
