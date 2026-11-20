export type NodeKind = "note" | "checklist" | "code";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CanvasNode {
  id: string;
  kind: NodeKind;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  body?: string;
  tag?: string;
  items?: ChecklistItem[];
  language?: "typescript" | "sql" | "rust" | "http";
  code?: string;
}

export interface CanvasEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
}

export interface ViewportState {
  tx: number;
  ty: number;
  scale: number;
}

export interface BoardSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
