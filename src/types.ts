/**
 * Core types for the flow diagram system
 */

export interface Position {
  x: number;
  y: number;
}

export interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  width?: number;
  height?: number;
}

export interface EdgeStyle {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  arrowSize?: number;
  label?: string;
}

export interface Node {
  id: string;
  label: string;
  type?: string;
  position?: Position;
  style?: NodeStyle;
  data?: Record<string, any>;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  style?: EdgeStyle;
  data?: Record<string, any>;
}

export interface FlowDiagramOptions {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  gridSize?: number;
  snapToGrid?: boolean;
}

export interface VisualizationOptions {
  format: 'svg' | 'html' | 'json' | 'mermaid';
  theme?: 'light' | 'dark';
  layout?: 'hierarchical' | 'force' | 'circular' | 'grid';
  showLabels?: boolean;
  showGrid?: boolean;
}
