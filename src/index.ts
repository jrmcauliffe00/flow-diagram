/**
 * Flow Diagram Library
 * A TypeScript library for creating and visualizing flow diagrams
 */

// Export core classes
export { FlowDiagram } from './FlowDiagram';
export { FlowDiagramHelpers } from './helpers';
export { FlowDiagramVisualizer } from './visualizer';

// Export types
export * from './types';

// Import for internal use
import { FlowDiagram } from './FlowDiagram';
import { FlowDiagramVisualizer } from './visualizer';

// Convenience function for quick diagram creation
export function createFlowDiagram(options?: {
  title?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}) {
  return new FlowDiagram(options);
}

// Convenience function for quick visualization
export function visualizeDiagram(
  diagram: FlowDiagram,
  format: 'svg' | 'html' | 'json' | 'mermaid' = 'svg',
  options?: {
    theme?: 'light' | 'dark';
    layout?: 'hierarchical' | 'force' | 'circular' | 'grid';
    orientation?: 'horizontal' | 'vertical';
    showLabels?: boolean;
    showGrid?: boolean;
  }
) {
  return FlowDiagramVisualizer.visualize(diagram, {
    format,
    ...options
  });
}
