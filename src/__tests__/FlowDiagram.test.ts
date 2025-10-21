import { FlowDiagram, FlowDiagramHelpers } from '../index';

describe('FlowDiagram', () => {
  let diagram: FlowDiagram;

  beforeEach(() => {
    diagram = new FlowDiagram();
  });

  test('should create empty diagram', () => {
    expect(diagram.isEmpty).toBe(true);
    expect(diagram.nodeCount).toBe(0);
    expect(diagram.edgeCount).toBe(0);
  });

  test('should add nodes', () => {
    const nodeId = diagram.addNode({ label: 'Test Node' });
    expect(nodeId).toBe('node_1');
    expect(diagram.nodeCount).toBe(1);
    expect(diagram.getNode(nodeId)?.label).toBe('Test Node');
  });

  test('should add edges', () => {
    const node1Id = diagram.addNode({ label: 'Node 1' });
    const node2Id = diagram.addNode({ label: 'Node 2' });
    const edgeId = diagram.addEdge({ sourceId: node1Id, targetId: node2Id });
    
    expect(edgeId).toBe('edge_1');
    expect(diagram.edgeCount).toBe(1);
    expect(diagram.getEdge(edgeId)?.sourceId).toBe(node1Id);
    expect(diagram.getEdge(edgeId)?.targetId).toBe(node2Id);
  });

  test('should not add edge with invalid nodes', () => {
    expect(() => {
      diagram.addEdge({ sourceId: 'invalid', targetId: 'invalid' });
    }).toThrow('Source or target node does not exist');
  });

  test('should remove nodes and connected edges', () => {
    const node1Id = diagram.addNode({ label: 'Node 1' });
    const node2Id = diagram.addNode({ label: 'Node 2' });
    diagram.addEdge({ sourceId: node1Id, targetId: node2Id });
    
    expect(diagram.edgeCount).toBe(1);
    diagram.removeNode(node1Id);
    expect(diagram.nodeCount).toBe(1);
    expect(diagram.edgeCount).toBe(0);
  });

  test('should serialize and deserialize', () => {
    diagram.addNode({ label: 'Node 1' });
    diagram.addNode({ label: 'Node 2' });
    diagram.addEdge({ sourceId: 'node_1', targetId: 'node_2' });
    
    const json = diagram.toJSON();
    const newDiagram = FlowDiagram.fromJSON(json);
    
    expect(newDiagram.nodeCount).toBe(2);
    expect(newDiagram.edgeCount).toBe(1);
  });
});

describe('FlowDiagramHelpers', () => {
  test('should create linear flow', () => {
    const diagram = FlowDiagramHelpers.createLinearFlow(['A', 'B', 'C']);
    expect(diagram.nodeCount).toBe(3);
    expect(diagram.edgeCount).toBe(2);
  });

  test('should create branching flow', () => {
    const diagram = FlowDiagramHelpers.createBranchingFlow('Input', ['Output1', 'Output2']);
    expect(diagram.nodeCount).toBe(3);
    expect(diagram.edgeCount).toBe(2);
  });

  test('should validate diagram', () => {
    const diagram = new FlowDiagram();
    diagram.addNode({ label: 'Test' });
    
    const validation = FlowDiagramHelpers.validate(diagram);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});
