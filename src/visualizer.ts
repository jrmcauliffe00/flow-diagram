import { FlowDiagram } from './FlowDiagram';
import { VisualizationOptions, Node, Edge } from './types';

/**
 * Visualization engine for flow diagrams
 */
export class FlowDiagramVisualizer {
  /**
   * Visualize a flow diagram in various formats
   */
  static visualize(diagram: FlowDiagram, options: VisualizationOptions): string {
    switch (options.format) {
      case 'svg':
        return this.toSVG(diagram, options);
      case 'html':
        return this.toHTML(diagram, options);
      case 'json':
        return this.toJSON(diagram, options);
      case 'mermaid':
        return this.toMermaid(diagram, options);
      default:
        throw new Error(`Unsupported visualization format: ${options.format}`);
    }
  }

  /**
   * Generate SVG representation
   */
  private static toSVG(diagram: FlowDiagram, options: VisualizationOptions): string {
    const nodes = diagram.getAllNodes();
    const edges = diagram.getAllEdges();
    const width = 800;
    const height = 600;
    const theme = options.theme || 'light';
    
    const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const nodeColor = theme === 'dark' ? '#2d2d2d' : '#f0f0f0';
    const edgeColor = theme === 'dark' ? '#666666' : '#333333';
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
    
    // Add grid if requested
    if (options.showGrid) {
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${theme === 'dark' ? '#333' : '#ddd'}" stroke-width="1"/>`;
      }
      for (let y = 0; y < height; y += gridSize) {
        svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${theme === 'dark' ? '#333' : '#ddd'}" stroke-width="1"/>`;
      }
    }
    
    // Add edges first (so they appear behind nodes)
    edges.forEach(edge => {
      const sourceNode = diagram.getNode(edge.sourceId);
      const targetNode = diagram.getNode(edge.targetId);
      
      if (sourceNode && targetNode && sourceNode.position && targetNode.position) {
        const x1 = sourceNode.position.x;
        const y1 = sourceNode.position.y;
        const x2 = targetNode.position.x;
        const y2 = targetNode.position.y;
        
        // Calculate arrow direction
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;
        
        // Arrow head
        const arrowSize = edge.style?.arrowSize || 10;
        const arrowX1 = x2 - arrowSize * unitX + arrowSize * 0.5 * unitY;
        const arrowY1 = y2 - arrowSize * unitY - arrowSize * 0.5 * unitX;
        const arrowX2 = x2 - arrowSize * unitX - arrowSize * 0.5 * unitY;
        const arrowY2 = y2 - arrowSize * unitY + arrowSize * 0.5 * unitX;
        
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                stroke="${edge.style?.color || edgeColor}" 
                stroke-width="${edge.style?.width || 2}"/>`;
        svg += `<polygon points="${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}" 
                fill="${edge.style?.color || edgeColor}"/>`;
        
        // Edge label
        if (edge.label && options.showLabels !== false) {
          const labelX = (x1 + x2) / 2;
          const labelY = (y1 + y2) / 2;
          svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" 
                  fill="${textColor}" font-size="12">${edge.label}</text>`;
        }
      }
    });
    
    // Add nodes
    nodes.forEach(node => {
      if (!node.position) return;
      
      const x = node.position.x;
      const y = node.position.y;
      const nodeWidth = node.style?.width || 100;
      const nodeHeight = node.style?.height || 50;
      const rx = node.style?.borderRadius || 5;
      
      const fillColor = node.style?.backgroundColor || nodeColor;
      const strokeColor = node.style?.borderColor || edgeColor;
      const strokeWidth = node.style?.borderWidth || 2;
      
      // Node rectangle
      svg += `<rect x="${x - nodeWidth/2}" y="${y - nodeHeight/2}" 
              width="${nodeWidth}" height="${nodeHeight}" 
              rx="${rx}" ry="${rx}"
              fill="${fillColor}" 
              stroke="${strokeColor}" 
              stroke-width="${strokeWidth}"/>`;
      
      // Node label
      if (options.showLabels !== false) {
        const fontSize = node.style?.fontSize || 14;
        const fontFamily = node.style?.fontFamily || 'Arial, sans-serif';
        svg += `<text x="${x}" y="${y + 5}" text-anchor="middle" 
                fill="${node.style?.color || textColor}" 
                font-size="${fontSize}" 
                font-family="${fontFamily}">${node.label}</text>`;
      }
    });
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Generate HTML representation with embedded SVG
   */
  private static toHTML(diagram: FlowDiagram, options: VisualizationOptions): string {
    const svg = this.toSVG(diagram, options);
    const theme = options.theme || 'light';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flow Diagram</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
            font-family: Arial, sans-serif;
        }
        .diagram-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .diagram-title {
            text-align: center;
            color: ${theme === 'dark' ? '#ffffff' : '#000000'};
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="diagram-container">
        <div>
            <h1 class="diagram-title">${diagram.title}</h1>
            ${svg}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JSON representation
   */
  private static toJSON(diagram: FlowDiagram, options: VisualizationOptions): string {
    return JSON.stringify({
      title: diagram.title,
      nodes: diagram.getAllNodes(),
      edges: diagram.getAllEdges(),
      metadata: {
        nodeCount: diagram.nodeCount,
        edgeCount: diagram.edgeCount,
        generatedAt: new Date().toISOString(),
        format: options.format,
        theme: options.theme
      }
    }, null, 2);
  }

  /**
   * Generate Mermaid diagram syntax
   */
  private static toMermaid(diagram: FlowDiagram, options: VisualizationOptions): string {
    const nodes = diagram.getAllNodes();
    const edges = diagram.getAllEdges();
    
    let mermaid = 'graph TD\n';
    
    // Add nodes
    nodes.forEach(node => {
      const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      const label = node.label.replace(/"/g, '\\"');
      const nodeType = node.type || 'default';
      
      let nodeStyle = '';
      if (nodeType === 'decision') {
        nodeStyle = '{{' + label + '}}';
      } else if (nodeType === 'start') {
        nodeStyle = '[' + label + ']';
      } else if (nodeType === 'end') {
        nodeStyle = '[(' + label + ')]';
      } else {
        nodeStyle = '[' + label + ']';
      }
      
      mermaid += `    ${nodeId}${nodeStyle}\n`;
    });
    
    // Add edges
    edges.forEach(edge => {
      const sourceId = edge.sourceId.replace(/[^a-zA-Z0-9]/g, '_');
      const targetId = edge.targetId.replace(/[^a-zA-Z0-9]/g, '_');
      const label = edge.label ? `|${edge.label}|` : '';
      
      mermaid += `    ${sourceId} -->${label} ${targetId}\n`;
    });
    
    return mermaid;
  }

  /**
   * Generate a simple text representation
   */
  static toText(diagram: FlowDiagram): string {
    const nodes = diagram.getAllNodes();
    const edges = diagram.getAllEdges();
    
    let text = `Flow Diagram: ${diagram.title}\n`;
    text += `Nodes: ${diagram.nodeCount}, Edges: ${diagram.edgeCount}\n\n`;
    
    text += 'Nodes:\n';
    nodes.forEach(node => {
      text += `  - ${node.id}: ${node.label}`;
      if (node.type) text += ` (${node.type})`;
      text += '\n';
    });
    
    text += '\nEdges:\n';
    edges.forEach(edge => {
      const sourceNode = diagram.getNode(edge.sourceId);
      const targetNode = diagram.getNode(edge.targetId);
      const sourceLabel = sourceNode?.label || edge.sourceId;
      const targetLabel = targetNode?.label || edge.targetId;
      text += `  - ${sourceLabel} -> ${targetLabel}`;
      if (edge.label) text += ` (${edge.label})`;
      text += '\n';
    });
    
    return text;
  }
}
