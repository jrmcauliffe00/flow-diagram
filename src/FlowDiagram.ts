import { Node, Edge, FlowDiagramOptions, Position } from './types';

/**
 * Core FlowDiagram class that manages nodes and edges
 */
export class FlowDiagram {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private options: FlowDiagramOptions;
  private nextNodeId = 1;
  private nextEdgeId = 1;

  constructor(options: FlowDiagramOptions = {}) {
    this.options = {
      title: 'Flow Diagram',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      gridSize: 20,
      snapToGrid: true,
      ...options
    };
  }

  // Node management methods
  addNode(node: Omit<Node, 'id'>): string {
    const id = `node_${this.nextNodeId++}`;
    const newNode: Node = {
      id,
      position: { x: 0, y: 0 },
      type: 'default',
      style: {},
      data: {},
      ...node
    };
    
    this.nodes.set(id, newNode);
    return id;
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  updateNode(id: string, updates: Partial<Node>): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    
    this.nodes.set(id, { ...node, ...updates });
    return true;
  }

  removeNode(id: string): boolean {
    if (!this.nodes.has(id)) return false;
    
    // Remove all edges connected to this node
    const edgesToRemove = Array.from(this.edges.values())
      .filter(edge => edge.sourceId === id || edge.targetId === id)
      .map(edge => edge.id);
    
    edgesToRemove.forEach(edgeId => this.edges.delete(edgeId));
    this.nodes.delete(id);
    return true;
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  // Edge management methods
  addEdge(edge: Omit<Edge, 'id'>): string {
    const id = `edge_${this.nextEdgeId++}`;
    const newEdge: Edge = {
      id,
      style: {},
      data: {},
      ...edge
    };
    
    // Validate that source and target nodes exist
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      throw new Error('Source or target node does not exist');
    }
    
    this.edges.set(id, newEdge);
    return id;
  }

  getEdge(id: string): Edge | undefined {
    return this.edges.get(id);
  }

  updateEdge(id: string, updates: Partial<Edge>): boolean {
    const edge = this.edges.get(id);
    if (!edge) return false;
    
    this.edges.set(id, { ...edge, ...updates });
    return true;
  }

  removeEdge(id: string): boolean {
    return this.edges.delete(id);
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  // Utility methods
  getConnectedNodes(nodeId: string): { incoming: Node[]; outgoing: Node[] } {
    const incoming: Node[] = [];
    const outgoing: Node[] = [];
    
    this.edges.forEach(edge => {
      if (edge.sourceId === nodeId) {
        const targetNode = this.nodes.get(edge.targetId);
        if (targetNode) outgoing.push(targetNode);
      }
      if (edge.targetId === nodeId) {
        const sourceNode = this.nodes.get(edge.sourceId);
        if (sourceNode) incoming.push(sourceNode);
      }
    });
    
    return { incoming, outgoing };
  }

  getNodeEdges(nodeId: string): Edge[] {
    return Array.from(this.edges.values()).filter(
      edge => edge.sourceId === nodeId || edge.targetId === nodeId
    );
  }

  // Layout and positioning
  autoLayout(layout: 'hierarchical' | 'circular' | 'grid' = 'hierarchical'): void {
    const nodes = this.getAllNodes();
    if (nodes.length === 0) return;

    switch (layout) {
      case 'hierarchical':
        this.hierarchicalLayout(nodes);
        break;
      case 'circular':
        this.circularLayout(nodes);
        break;
      case 'grid':
        this.gridLayout(nodes);
        break;
    }
  }

  private hierarchicalLayout(nodes: Node[]): void {
    // Simple hierarchical layout - nodes are arranged in levels
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => {
      const edges = this.getNodeEdges(node.id);
      return !edges.some(edge => edge.targetId === node.id);
    });
    
    // Assign levels using BFS
    const queue = rootNodes.map(node => ({ node, level: 0 }));
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      if (visited.has(node.id)) continue;
      
      visited.add(node.id);
      levels.set(node.id, level);
      
      // Add children to queue
      const outgoing = this.getConnectedNodes(node.id).outgoing;
      outgoing.forEach(child => {
        if (!visited.has(child.id)) {
          queue.push({ node: child, level: level + 1 });
        }
      });
    }
    
    // Position nodes based on levels
    const levelGroups = new Map<number, Node[]>();
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });
    
    const levelHeight = 150;
    const nodeSpacing = 200;
    
    levelGroups.forEach((levelNodes, level) => {
      const y = level * levelHeight + 50;
      levelNodes.forEach((node, index) => {
        const x = (index - (levelNodes.length - 1) / 2) * nodeSpacing + (this.options.width || 800) / 2;
        this.updateNode(node.id, { position: { x, y } });
      });
    });
  }

  private circularLayout(nodes: Node[]): void {
    const centerX = (this.options.width || 800) / 2;
    const centerY = (this.options.height || 600) / 2;
    const radius = Math.min(centerX, centerY) - 100;
    
    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      this.updateNode(node.id, { position: { x, y } });
    });
  }

  private gridLayout(nodes: Node[]): void {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeSpacing = 150;
    const startX = 50;
    const startY = 50;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * nodeSpacing;
      const y = startY + row * nodeSpacing;
      this.updateNode(node.id, { position: { x, y } });
    });
  }

  // Serialization
  toJSON(): any {
    return {
      options: this.options,
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  static fromJSON(data: any): FlowDiagram {
    const diagram = new FlowDiagram(data.options);
    
    // Add nodes
    data.nodes.forEach((node: Node) => {
      diagram.nodes.set(node.id, node);
    });
    
    // Add edges
    data.edges.forEach((edge: Edge) => {
      diagram.edges.set(edge.id, edge);
    });
    
    return diagram;
  }

  // Getters
  get title(): string {
    return this.options.title || 'Flow Diagram';
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  get isEmpty(): boolean {
    return this.nodes.size === 0;
  }
}
