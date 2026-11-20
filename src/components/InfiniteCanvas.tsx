import { useCallback, useEffect, useRef, useState } from "react";
import {
  ARCHITECTURE_BLUEPRINT,
  ROADMAP_TEMPLATE,
} from "../data/seedBoard";
import { useCanvasHistory } from "../hooks/useCanvasHistory";
import type { BoardSnapshot, CanvasNode, NodeKind, ViewportState } from "../types/canvas";
import { EdgeLayer } from "./EdgeLayer";
import { NodeCard } from "./NodeCard";
import { FloatingToolbar } from "./FloatingToolbar";
import { QaDrawer } from "./QaDrawer";

export function InfiniteCanvas() {
  const {
    present,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    setTransient,
    commit,
    recordBaselineSnapshot,
    undo,
    redo,
    resetBoard,
  } = useCanvasHistory(ARCHITECTURE_BLUEPRINT);

  const [viewport, setViewport] = useState<ViewportState>({
    tx: 80,
    ty: 90,
    scale: 0.92,
  });
  const [toolMode, setToolMode] = useState<"select" | "pan">("select");
  const [spacePressed, setSpacePressed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [wireSourceId, setWireSourceId] = useState<string | null>(null);
  const [wirePointerWorld, setWirePointerWorld] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gestureBaselineRef = useRef<BoardSnapshot | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    origTx: number;
    origTy: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // Spacebar pan key listener + Delete selected node/edge
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (e.code === "Space" && !typing) {
        e.preventDefault();
        setSpacePressed(true);
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        if (selectedEdgeId) {
          commit((prev) => ({
            ...prev,
            edges: prev.edges.filter((edge) => edge.id !== selectedEdgeId),
          }));
          setSelectedEdgeId(null);
        } else if (selectedNodeId) {
          commit((prev) => ({
            nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
            edges: prev.edges.filter(
              (ed) => ed.fromNodeId !== selectedNodeId && ed.toNodeId !== selectedNodeId
            ),
          }));
          setSelectedNodeId(null);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [commit, selectedEdgeId, selectedNodeId]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const sx = clientX - (rect?.left ?? 0);
      const sy = clientY - (rect?.top ?? 0);
      return {
        x: (sx - viewport.tx) / viewport.scale,
        y: (sy - viewport.ty) / viewport.scale,
      };
    },
    [viewport]
  );

  // Cursor-centered zoom via native non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
      setViewport((prev) => {
        const nextScale = Math.max(0.25, Math.min(2.5, prev.scale * zoomFactor));
        const worldX = (mx - prev.tx) / prev.scale;
        const worldY = (my - prev.ty) / prev.scale;
        return {
          scale: Number(nextScale.toFixed(4)),
          tx: Math.round(mx - worldX * nextScale),
          ty: Math.round(my - worldY * nextScale),
        };
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddle = e.button === 1;
    const isPanMode = toolMode === "pan" || spacePressed;

    if (isMiddle || isPanMode || e.button === 0) {
      if (isMiddle) e.preventDefault();
      if (!isMiddle && !isPanMode) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origTx: viewport.tx,
        origTy: viewport.ty,
      };
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wireSourceId) {
      setWirePointerWorld(screenToWorld(e.clientX, e.clientY));
      return;
    }
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setViewport((prev) => ({
      ...prev,
      tx: Math.round(panRef.current!.origTx + dx),
      ty: Math.round(panRef.current!.origTy + dy),
    }));
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wireSourceId) {
      setWireSourceId(null);
      setWirePointerWorld(null);
    }
    if (panRef.current) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      panRef.current = null;
    }
  };

  const handleAddNode = (kind: NodeKind) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 520;
    const cy = rect ? rect.height / 2 : 340;
    const jitter = (present.nodes.length % 5) * 28 - 40;
    const worldX = Math.round((cx - viewport.tx) / viewport.scale - 140 + jitter);
    const worldY = Math.round((cy - viewport.ty) / viewport.scale - 95 + jitter);

    const id = `node-${Date.now()}`;
    const newNode: CanvasNode =
      kind === "note"
        ? {
            id,
            kind: "note",
            title: "Architectural Note",
            x: worldX,
            y: worldY,
            width: 265,
            height: 180,
            tag: "NOTE",
            body: "Describe system contracts, boundaries, or design rationale here.",
          }
        : kind === "checklist"
          ? {
              id,
              kind: "checklist",
              title: "Verification Checklist",
              x: worldX,
              y: worldY,
              width: 280,
              height: 210,
              items: [
                { id: `${id}-1`, text: "Define edge contracts", done: false },
                { id: `${id}-2`, text: "Verify matrix viewport bounds", done: false },
              ],
            }
          : {
              id,
              kind: "code",
              title: "Transform Kernel",
              x: worldX,
              y: worldY,
              width: 300,
              height: 195,
              language: "typescript",
              code: `export function project(x: number, y: number, s: number) {\n  return { x: x * s, y: y * s };\n}`,
            };

    commit((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(id);
  };

  const handleFitView = () => {
    if (present.nodes.length === 0) {
      setViewport({ tx: 80, ty: 90, scale: 1 });
      return;
    }
    const minX = Math.min(...present.nodes.map((n) => n.x));
    const minY = Math.min(...present.nodes.map((n) => n.y));
    const maxX = Math.max(...present.nodes.map((n) => n.x + n.width));
    const maxY = Math.max(...present.nodes.map((n) => n.y + n.height));
    const rect = containerRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? 1280;
    const vh = rect?.height ?? 780;
    const bw = Math.max(200, maxX - minX);
    const bh = Math.max(200, maxY - minY);
    const scale = Math.max(
      0.35,
      Math.min(1.15, Math.min((vw - 140) / bw, (vh - 180) / bh))
    );
    const tx = Math.round((vw - bw * scale) / 2 - minX * scale);
    const ty = Math.round((vh - bh * scale) / 2 - minY * scale + 20);
    setViewport({ tx, ty, scale: Number(scale.toFixed(3)) });
  };

  const handleExportJson = () => {
    const payload = {
      schema: "feld.board.v1",
      exportedAt: new Date().toISOString(),
      viewport,
      nodes: present.nodes,
      edges: present.edges,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feld-canvas-board.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported feld-canvas-board.json");
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        nodes?: CanvasNode[];
        edges?: BoardSnapshot["edges"];
        viewport?: ViewportState;
      };
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        showToast("Invalid JSON: expected nodes and edges arrays.");
        return;
      }
      resetBoard({ nodes: parsed.nodes, edges: parsed.edges });
      if (parsed.viewport) setViewport(parsed.viewport);
      showToast(`Imported ${parsed.nodes.length} nodes & ${parsed.edges.length} edges.`);
    } catch {
      showToast("Could not parse board JSON file.");
    }
  };

  const wireOriginNode = wireSourceId
    ? present.nodes.find((n) => n.id === wireSourceId)
    : null;

  const draftWire =
    wireOriginNode && wirePointerWorld
      ? {
          fromX: wireOriginNode.x + wireOriginNode.width,
          fromY: wireOriginNode.y + wireOriginNode.height / 2,
          toX: wirePointerWorld.x,
          toY: wirePointerWorld.y,
        }
      : null;

  const gridStep = Math.max(12, 28 * viewport.scale);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#FAFBFD] text-[#111827]">
      <FloatingToolbar
        toolMode={toolMode}
        scale={viewport.scale}
        canUndo={canUndo}
        canRedo={canRedo}
        undoCount={undoCount}
        redoCount={redoCount}
        onChangeToolMode={setToolMode}
        onAddNode={handleAddNode}
        onUndo={undo}
        onRedo={redo}
        onFitView={handleFitView}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Interactive Infinite Drafting Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        style={{
          touchAction: "none",
          backgroundImage: `radial-gradient(circle, #CBD5E1 1.1px, transparent 1.1px)`,
          backgroundSize: `${gridStep}px ${gridStep}px`,
          backgroundPosition: `${viewport.tx}px ${viewport.ty}px`,
        }}
        className={`relative h-full w-full select-none ${
          spacePressed || toolMode === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        {/* CSS Matrix Transformed Infinite World Layer */}
        <div
          data-testid="world-matrix-layer"
          style={{
            transform: `matrix(${viewport.scale}, 0, 0, ${viewport.scale}, ${viewport.tx}, ${viewport.ty})`,
            transformOrigin: "0 0",
          }}
          className="absolute left-0 top-0 h-0 w-0"
        >
          <EdgeLayer
            nodes={present.nodes}
            edges={present.edges}
            draftWire={draftWire}
            selectedEdgeId={selectedEdgeId}
            onSelectEdge={(edgeId) => {
              setSelectedEdgeId(edgeId);
              setSelectedNodeId(null);
            }}
            onDeleteEdge={(edgeId) => {
              commit((prev) => ({
                ...prev,
                edges: prev.edges.filter((ed) => ed.id !== edgeId),
              }));
              setSelectedEdgeId(null);
            }}
          />

          {present.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              scale={viewport.scale}
              selected={selectedNodeId === node.id}
              onSelect={() => {
                setSelectedNodeId(node.id);
                setSelectedEdgeId(null);
              }}
              onStartTransformGesture={() => {
                gestureBaselineRef.current = present;
              }}
              onUpdateNodeTransient={(patch) => {
                setTransient((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((n) =>
                    n.id === node.id ? { ...n, ...patch } : n
                  ),
                }));
              }}
              onEndTransformGesture={() => {
                if (gestureBaselineRef.current) {
                  recordBaselineSnapshot(gestureBaselineRef.current);
                  gestureBaselineRef.current = null;
                }
              }}
              onCommitNodePatch={(patch) => {
                commit((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((n) =>
                    n.id === node.id ? { ...n, ...patch } : n
                  ),
                }));
              }}
              onDeleteNode={() => {
                commit((prev) => ({
                  nodes: prev.nodes.filter((n) => n.id !== node.id),
                  edges: prev.edges.filter(
                    (ed) => ed.fromNodeId !== node.id && ed.toNodeId !== node.id
                  ),
                }));
                setSelectedNodeId(null);
              }}
              onStartWire={(fromId, e) => {
                setWireSourceId(fromId);
                setWirePointerWorld(screenToWorld(e.clientX, e.clientY));
              }}
              onDropWire={(toId) => {
                if (wireSourceId && wireSourceId !== toId) {
                  const duplicate = present.edges.some(
                    (ed) =>
                      ed.fromNodeId === wireSourceId && ed.toNodeId === toId
                  );
                  if (!duplicate) {
                    commit((prev) => ({
                      ...prev,
                      edges: [
                        ...prev.edges,
                        {
                          id: `edge-${Date.now()}`,
                          fromNodeId: wireSourceId,
                          toNodeId: toId,
                        },
                      ],
                    }));
                  }
                }
                setWireSourceId(null);
                setWirePointerWorld(null);
              }}
            />
          ))}
        </div>

        {/* Empty State Hint */}
        {present.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white/90 px-6 py-4 text-center">
              <p className="text-sm font-semibold text-[#111827]">
                Blank Drafting Sheet
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Add a Note, Checklist, or Code Snippet from the top pill, or restore a template in Showcase / QA.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-12 right-4 z-40 rounded-lg border border-[#1B3DE5] bg-white px-3.5 py-2 font-mono text-xs text-[#1B3DE5] shadow-lg"
        >
          {toast}
        </div>
      )}

      {/* Architectural Coordinate & Attribution HUD */}
      <footer className="pointer-events-none fixed bottom-3.5 right-4 z-30 flex items-center gap-3">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#CBD5E1] bg-white/90 px-3.5 py-1.5 font-mono text-[11px] tabular-nums text-[#475569]">
          <span>
            X:{viewport.tx} Y:{viewport.ty} · {Math.round(viewport.scale * 100)}%
          </span>
          <span className="hidden sm:inline text-[#CBD5E1]">|</span>
          <span className="hidden sm:inline">
            Space+Drag Pan · Wheel Zoom ·{" "}
            <a
              href="https://github.com/jobjab-dev"
              target="_blank"
              rel="noreferrer"
              className="text-[#1B3DE5] underline underline-offset-2"
            >
              jobjab-dev
            </a>
          </span>
        </div>
      </footer>

      <QaDrawer
        nodeCount={present.nodes.length}
        edgeCount={present.edges.length}
        onLoadArchitecture={() => {
          resetBoard(ARCHITECTURE_BLUEPRINT);
          setViewport({ tx: 80, ty: 90, scale: 0.92 });
        }}
        onLoadRoadmap={() => {
          resetBoard(ROADMAP_TEMPLATE);
          setViewport({ tx: 90, ty: 95, scale: 0.92 });
        }}
        onSpawnCluster={() => {
          const base = Date.now();
          const x0 = 180 + (present.nodes.length % 4) * 90;
          const y0 = 560 + (present.nodes.length % 3) * 60;
          const n1: CanvasNode = {
            id: `cl-${base}-1`,
            kind: "note",
            title: "Cluster Intake",
            x: x0,
            y: y0,
            width: 245,
            height: 155,
            tag: "NODE",
            body: "Generated cluster node wired with Cubic Bezier routes.",
          };
          const n2: CanvasNode = {
            id: `cl-${base}-2`,
            kind: "checklist",
            title: "Cluster Checks",
            x: x0 + 320,
            y: y0 - 40,
            width: 255,
            height: 175,
            items: [
              { id: "k1", text: "Auto-routed edge", done: true },
              { id: "k2", text: "Undo history snapshot", done: false },
            ],
          };
          const n3: CanvasNode = {
            id: `cl-${base}-3`,
            kind: "code",
            title: "Cluster Handler",
            x: x0 + 640,
            y: y0,
            width: 265,
            height: 165,
            language: "typescript",
            code: `export const clusterId = "${base}";`,
          };
          commit((prev) => ({
            nodes: [...prev.nodes, n1, n2, n3],
            edges: [
              ...prev.edges,
              { id: `ce-${base}-1`, fromNodeId: n1.id, toNodeId: n2.id, label: "flow" },
              { id: `ce-${base}-2`, fromNodeId: n2.id, toNodeId: n3.id, label: "emit" },
            ],
          }));
        }}
        onClearBoard={() => resetBoard({ nodes: [], edges: [] })}
      />
    </div>
  );
}
