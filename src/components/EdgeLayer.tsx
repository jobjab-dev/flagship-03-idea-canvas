import type { CanvasEdge, CanvasNode } from "../types/canvas";

interface EdgeLayerProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  draftWire: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

function buildCubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(68, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function EdgeLayer({
  nodes,
  edges,
  draftWire,
  selectedEdgeId,
  onSelectEdge,
  onDeleteEdge,
}: EdgeLayerProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width="1"
      height="1"
      aria-label="Node Bezier connections"
    >
      <defs>
        <marker
          id="feld-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1B3DE5" />
        </marker>
        <marker
          id="feld-arrow-selected"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#D98A12" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const from = nodeMap.get(edge.fromNodeId);
        const to = nodeMap.get(edge.toNodeId);
        if (!from || !to) return null;

        const x1 = from.x + from.width;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = to.y + to.height / 2;
        const d = buildCubicPath(x1, y1, x2, y2);
        const isSelected = selectedEdgeId === edge.id;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={edge.id} className="pointer-events-auto group">
            {/* Wide invisible hit target for easy click selection */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectEdge(edge.id);
              }}
            />
            <path
              d={d}
              fill="none"
              stroke={isSelected ? "#D98A12" : "#1B3DE5"}
              strokeWidth={isSelected ? 2.6 : 2}
              markerEnd={
                isSelected ? "url(#feld-arrow-selected)" : "url(#feld-arrow)"
              }
            />
            {(edge.label || isSelected) && (
              <g
                transform={`translate(${midX}, ${midY})`}
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isSelected) onDeleteEdge(edge.id);
                  else onSelectEdge(edge.id);
                }}
              >
                <rect
                  x="-28"
                  y="-11"
                  width="56"
                  height="22"
                  rx="4"
                  fill={isSelected ? "#D98A12" : "#FFFFFF"}
                  stroke={isSelected ? "#9F6207" : "#CBD5E1"}
                  strokeWidth="1"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontFamily="Fira Code, monospace"
                  fill={isSelected ? "#FFFFFF" : "#334155"}
                >
                  {isSelected ? "remove ×" : edge.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {draftWire && (
        <path
          d={buildCubicPath(
            draftWire.fromX,
            draftWire.fromY,
            draftWire.toX,
            draftWire.toY
          )}
          fill="none"
          stroke="#1B3DE5"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      )}
    </svg>
  );
}
