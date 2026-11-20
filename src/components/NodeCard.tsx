import { useRef, useState } from "react";
import { Check, Copy, Plus, Trash2, GripVertical } from "lucide-react";
import type { CanvasNode, ChecklistItem } from "../types/canvas";

interface NodeCardProps {
  node: CanvasNode;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onStartTransformGesture: () => void;
  onUpdateNodeTransient: (patch: Partial<CanvasNode>) => void;
  onEndTransformGesture: () => void;
  onCommitNodePatch: (patch: Partial<CanvasNode>) => void;
  onDeleteNode: () => void;
  onStartWire: (nodeId: string, e: React.PointerEvent) => void;
  onDropWire: (nodeId: string) => void;
}

export function NodeCard({
  node,
  scale,
  selected,
  onSelect,
  onStartTransformGesture,
  onUpdateNodeTransient,
  onEndTransformGesture,
  onCommitNodePatch,
  onDeleteNode,
  onStartWire,
  onDropWire,
}: NodeCardProps) {
  const [newItemText, setNewItemText] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    moved: boolean;
  } | null>(null);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "BUTTON" || tag === "INPUT" || tag === "SVG" || tag === "PATH") {
      return;
    }
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect();
    onStartTransformGesture();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
      moved: false,
    };
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / scale;
    const dy = (e.clientY - dragRef.current.startY) / scale;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      dragRef.current.moved = true;
    }
    onUpdateNodeTransient({
      x: Math.round(dragRef.current.origX + dx),
      y: Math.round(dragRef.current.origY + dy),
    });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (dragRef.current.moved) {
      onEndTransformGesture();
    }
    dragRef.current = null;
  };

  const handleResizeDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect();
    onStartTransformGesture();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: node.width,
      origH: node.height,
      moved: false,
    };
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current) return;
    const dx = (e.clientX - resizeRef.current.startX) / scale;
    const dy = (e.clientY - resizeRef.current.startY) / scale;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      resizeRef.current.moved = true;
    }
    onUpdateNodeTransient({
      width: Math.max(220, Math.round(resizeRef.current.origW + dx)),
      height: Math.max(145, Math.round(resizeRef.current.origH + dy)),
    });
  };

  const handleResizeUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (resizeRef.current.moved) {
      onEndTransformGesture();
    }
    resizeRef.current = null;
  };

  const accentBadge =
    node.kind === "note"
      ? { label: node.tag ?? "NOTE", bg: "bg-[#EEF2FF]", text: "text-[#1B3DE5]" }
      : node.kind === "checklist"
        ? { label: "CHECKLIST", bg: "bg-[#FEF3C7]", text: "text-[#B45309]" }
        : {
            label: (node.language ?? "code").toUpperCase(),
            bg: "bg-[#D1FAE5]",
            text: "text-[#047857]",
          };

  const toggleChecklistItem = (itemId: string) => {
    const items = (node.items ?? []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onCommitNodePatch({ items });
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    const nextItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: trimmed,
      done: false,
    };
    onCommitNodePatch({ items: [...(node.items ?? []), nextItem] });
    setNewItemText("");
  };

  const removeChecklistItem = (itemId: string) => {
    onCommitNodePatch({
      items: (node.items ?? []).filter((item) => item.id !== itemId),
    });
  };

  const completedCount = (node.items ?? []).filter((i) => i.done).length;
  const totalCount = (node.items ?? []).length;

  return (
    <article
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      data-node-id={node.id}
      className={`absolute flex flex-col rounded-xl border bg-white transition-shadow ${
        selected
          ? "border-[#1B3DE5] shadow-[0_10px_28px_rgba(27,61,229,0.14)] ring-1 ring-[#1B3DE5]/30 z-20"
          : "border-[#CBD5E1] shadow-[0_4px_16px_rgba(17,24,39,0.06)] z-10"
      }`}
    >
      {/* Left Input Port */}
      <button
        type="button"
        title="Connect edge into this node"
        aria-label={`Input port for ${node.title}`}
        onPointerUp={(e) => {
          e.stopPropagation();
          onDropWire(node.id);
        }}
        className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-[#1B3DE5] bg-white hover:scale-125 transition-transform z-30 flex items-center justify-center"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#1B3DE5]" />
      </button>

      {/* Right Output Port */}
      <button
        type="button"
        title="Drag to connect wire to another node"
        aria-label={`Output port for ${node.title}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartWire(node.id, e);
        }}
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-[#1B3DE5] bg-[#1B3DE5] hover:scale-125 transition-transform z-30 flex items-center justify-center cursor-crosshair"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </button>

      {/* Draggable Drafting Header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
        className="flex cursor-grab active:cursor-grabbing items-center justify-between gap-2 rounded-t-xl border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 select-none"
      >
        <div className="flex min-w-0 items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${accentBadge.bg} ${accentBadge.text}`}
          >
            {accentBadge.label}
          </span>
          {editingTitle ? (
            <input
              type="text"
              autoFocus
              value={node.title}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onUpdateNodeTransient({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setEditingTitle(false);
                }
              }}
              aria-label="Node title"
              className="min-w-0 flex-1 truncate rounded bg-white px-1 text-xs font-semibold text-[#111827] ring-1 ring-[#1B3DE5] focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
              title="Drag header to move · Double-click title to rename"
              className="min-w-0 flex-1 truncate text-xs font-semibold text-[#111827]"
            >
              {node.title}
            </span>
          )}
        </div>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDeleteNode}
          aria-label={`Delete node ${node.title}`}
          className="rounded p-1 text-[#94A3B8] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Typed Node Body */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="flex flex-1 flex-col overflow-hidden p-3"
      >
        {node.kind === "note" && (
          <textarea
            value={node.body ?? ""}
            onChange={(e) => onUpdateNodeTransient({ body: e.target.value })}
            placeholder="Write architectural note..."
            aria-label={`${node.title} content`}
            className="h-full w-full resize-none bg-transparent text-[13px] leading-relaxed text-[#334155] focus:outline-none"
          />
        )}

        {node.kind === "checklist" && (
          <div className="flex h-full flex-col justify-between gap-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#64748B]">
              <span>PROGRESS</span>
              <span>
                {completedCount}/{totalCount} DONE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
              {(node.items ?? []).map((item) => (
                <div key={item.id} className="group flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 h-3.5 w-3.5 accent-[#D98A12] cursor-pointer"
                  />
                  <span
                    className={`flex-1 leading-snug ${
                      item.done
                        ? "line-through text-[#94A3B8]"
                        : "text-[#1E293B]"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#DC2626]"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addChecklistItem} className="flex gap-1 border-t border-[#E2E8F0] pt-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add item..."
                className="min-w-0 flex-1 bg-transparent text-xs text-[#111827] placeholder:text-[#94A3B8] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Add checklist item"
                className="rounded bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E] hover:bg-[#FDE68A]"
              >
                <Plus className="h-3 w-3" />
              </button>
            </form>
          </div>
        )}

        {node.kind === "code" && (
          <div className="flex h-full flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <select
                value={node.language ?? "typescript"}
                onChange={(e) =>
                  onCommitNodePatch({
                    language: e.target.value as CanvasNode["language"],
                  })
                }
                aria-label="Code language"
                className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] text-[#334155]"
              >
                <option value="typescript">typescript</option>
                <option value="sql">sql</option>
                <option value="rust">rust</option>
                <option value="http">json/http</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(node.code ?? "").catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] text-[#64748B] hover:text-[#0E9F6E]"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-[#0E9F6E]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              value={node.code ?? ""}
              onChange={(e) => onUpdateNodeTransient({ code: e.target.value })}
              spellCheck={false}
              aria-label={`${node.title} code editor`}
              className="flex-1 w-full resize-none rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2 font-mono text-[11px] leading-relaxed text-[#0F172A] focus:border-[#0E9F6E] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Bottom-Right Resize Grip */}
      <button
        type="button"
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
        aria-label={`Resize ${node.title}`}
        className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-br-lg flex items-end justify-end p-0.5 text-[#94A3B8] hover:text-[#1B3DE5]"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
          <path
            d="M11 3L3 11M11 7L7 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </article>
  );
}
