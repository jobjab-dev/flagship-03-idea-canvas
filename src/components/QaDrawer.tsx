import { useState } from "react";
import { SlidersHorizontal, X, Layers, GitBranch, Sparkles, Trash2 } from "lucide-react";

interface QaDrawerProps {
  nodeCount: number;
  edgeCount: number;
  onLoadArchitecture: () => void;
  onLoadRoadmap: () => void;
  onSpawnCluster: () => void;
  onClearBoard: () => void;
}

export function QaDrawer({
  nodeCount,
  edgeCount,
  onLoadArchitecture,
  onLoadRoadmap,
  onSpawnCluster,
  onClearBoard,
}: QaDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open ? (
        <div className="w-[290px] rounded-xl border border-[#CBD5E1] bg-white p-3.5 text-[#111827] shadow-[0_12px_32px_rgba(17,24,39,0.12)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#1B3DE5]">
              Showcase / QA Canvas
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-[#64748B] hover:text-[#111827]"
              aria-label="Close Showcase / QA drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex justify-between rounded bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-[10px] text-[#475569]">
            <span>Nodes: {nodeCount}</span>
            <span>Bezier Wires: {edgeCount}</span>
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onLoadArchitecture}
              className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-2 text-left text-xs font-medium hover:border-[#1B3DE5]"
            >
              <span className="inline-flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-[#1B3DE5]" />
                Load Edge Blueprint
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">5 NODES</span>
            </button>

            <button
              type="button"
              onClick={onLoadRoadmap}
              className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-2 text-left text-xs font-medium hover:border-[#D98A12]"
            >
              <span className="inline-flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-[#D98A12]" />
                Load Product Roadmap
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">4 NODES</span>
            </button>

            <button
              type="button"
              onClick={onSpawnCluster}
              className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-2 text-left text-xs font-medium hover:border-[#0E9F6E]"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#0E9F6E]" />
                Spawn +3 Linked Cluster
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">APPEND</span>
            </button>

            <button
              type="button"
              onClick={onClearBoard}
              className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-2 text-left text-xs font-medium hover:border-[#DC2626]"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />
                Clear Canvas Board
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">EMPTY</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-white/95 px-3.5 py-1.5 font-mono text-[11px] font-medium text-[#111827] shadow-[0_4px_12px_rgba(17,24,39,0.08)] hover:border-[#1B3DE5]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#1B3DE5]" />
          Showcase / QA
        </button>
      )}
    </div>
  );
}
