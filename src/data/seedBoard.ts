import type { BoardSnapshot } from "../types/canvas";

export const ARCHITECTURE_BLUEPRINT: BoardSnapshot = {
  nodes: [
    {
      id: "node-ingest",
      kind: "note",
      title: "01 · Edge Telemetry Gateway",
      x: 80,
      y: 120,
      width: 270,
      height: 185,
      tag: "GATEWAY",
      body: "Terminates regional WebSocket & SSE feeds with backpressure shedding before dispatching frames onto the event bus.",
    },
    {
      id: "node-crdt",
      kind: "code",
      title: "Matrix Viewport Transform",
      x: 430,
      y: 70,
      width: 315,
      height: 225,
      language: "typescript",
      code: `// Cursor-centered zoom matrix
const wx = (mouseX - tx) / scale;
const wy = (mouseY - ty) / scale;
const nextScale = clamp(scale * factor, 0.25, 2.5);
const nextTx = mouseX - wx * nextScale;
const nextTy = mouseY - wy * nextScale;`,
    },
    {
      id: "node-checklist",
      kind: "checklist",
      title: "Release Readiness Checklist",
      x: 430,
      y: 350,
      width: 295,
      height: 225,
      items: [
        { id: "c1", text: "Cursor-anchored CSS matrix zoom", done: true },
        { id: "c2", text: "Live SVG Cubic Bezier routing", done: true },
        { id: "c3", text: "Undo / Redo history snapshot stack", done: true },
        { id: "c4", text: "Validate schema on JSON import", done: false },
      ],
    },
    {
      id: "node-persist",
      kind: "note",
      title: "Snapshot Compaction",
      x: 840,
      y: 195,
      width: 265,
      height: 185,
      tag: "STORAGE",
      body: "Coalesces continuous pointer drag/resize deltas into a single immutable history frame on pointerup.",
    },
    {
      id: "node-export",
      kind: "code",
      title: "JSON Wire Schema",
      x: 840,
      y: 430,
      width: 265,
      height: 160,
      language: "http",
      code: `{
  "schema": "feld.board.v1",
  "nodes": 5,
  "edges": 4
}`,
    },
  ],
  edges: [
    { id: "edge-1", fromNodeId: "node-ingest", toNodeId: "node-crdt", label: "stream" },
    { id: "edge-2", fromNodeId: "node-ingest", toNodeId: "node-checklist", label: "spec" },
    { id: "edge-3", fromNodeId: "node-crdt", toNodeId: "node-persist", label: "commit" },
    { id: "edge-4", fromNodeId: "node-checklist", toNodeId: "node-export", label: "schema" },
  ],
};

export const ROADMAP_TEMPLATE: BoardSnapshot = {
  nodes: [
    {
      id: "rm-1",
      kind: "note",
      title: "Q4 Spatial Engine Sprint",
      x: 90,
      y: 160,
      width: 265,
      height: 175,
      tag: "MILESTONE",
      body: "Ship zero-dependency infinite whiteboard engine with deterministic exportable spatial graphs.",
    },
    {
      id: "rm-2",
      kind: "checklist",
      title: "Core Canvas Primitives",
      x: 435,
      y: 95,
      width: 290,
      height: 225,
      items: [
        { id: "r1", text: "Spacebar + Middle Mouse pan", done: true },
        { id: "r2", text: "Multi-type editable nodes", done: true },
        { id: "r3", text: "Keyboard Undo / Redo (Ctrl+Z)", done: false },
      ],
    },
    {
      id: "rm-3",
      kind: "code",
      title: "Bezier Anchor Solver",
      x: 435,
      y: 365,
      width: 290,
      height: 175,
      language: "typescript",
      code: `const dx = Math.max(70, Math.abs(x2 - x1) * 0.52);
return \`M \${x1} \${y1} C \${x1 + dx} \${y1}, \${x2 - dx} \${y2}, \${x2} \${y2}\`;`,
    },
    {
      id: "rm-4",
      kind: "note",
      title: "Archival Export Bundle",
      x: 810,
      y: 225,
      width: 260,
      height: 170,
      tag: "DELIVERY",
      body: "Self-contained portable .json scene files validated cleanly upon re-import.",
    },
  ],
  edges: [
    { id: "re-1", fromNodeId: "rm-1", toNodeId: "rm-2" },
    { id: "re-2", fromNodeId: "rm-1", toNodeId: "rm-3" },
    { id: "re-3", fromNodeId: "rm-2", toNodeId: "rm-4" },
    { id: "re-4", fromNodeId: "rm-3", toNodeId: "rm-4" },
  ],
};
