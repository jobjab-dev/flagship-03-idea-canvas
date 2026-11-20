import { useRef } from "react";
import {
  CheckSquare,
  Code2,
  Download,
  FileText,
  Hand,
  Maximize2,
  MousePointer,
  Redo2,
  Undo2,
  Upload,
} from "lucide-react";
import type { NodeKind } from "../types/canvas";

interface FloatingToolbarProps {
  toolMode: "select" | "pan";
  scale: number;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  onChangeToolMode: (mode: "select" | "pan") => void;
  onAddNode: (kind: NodeKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export function FloatingToolbar({
  toolMode,
  scale,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onChangeToolMode,
  onAddNode,
  onUndo,
  onRedo,
  onFitView,
  onExportJson,
  onImportJson,
}: FloatingToolbarProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3.5 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white/95 px-3 py-1.5 shadow-[0_8px_24px_rgba(17,24,39,0.08)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-r border-[#E2E8F0] pr-3 mr-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1B3DE5]" />
          <span className="text-xs font-bold tracking-tight text-[#111827]">
            FELD
          </span>
        </div>

        {/* Select / Hand Pan Mode */}
        <div className="flex items-center rounded-full bg-[#F1F5F9] p-0.5">
          <button
            type="button"
            onClick={() => onChangeToolMode("select")}
            title="Select & Move Nodes"
            aria-label="Select tool"
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              toolMode === "select"
                ? "bg-[#1B3DE5] text-white"
                : "text-[#475569] hover:text-[#111827]"
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeToolMode("pan")}
            title="Pan Viewport (or hold Space + Drag)"
            aria-label="Pan tool"
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              toolMode === "pan"
                ? "bg-[#1B3DE5] text-white"
                : "text-[#475569] hover:text-[#111827]"
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Spawn Node Types */}
        <div className="flex items-center gap-1 border-l border-[#E2E8F0] pl-2">
          <button
            type="button"
            onClick={() => onAddNode("note")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1 text-xs font-medium text-[#111827] hover:border-[#1B3DE5] hover:text-[#1B3DE5]"
          >
            <FileText className="h-3.5 w-3.5 text-[#1B3DE5]" />
            Note
          </button>
          <button
            type="button"
            onClick={() => onAddNode("checklist")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1 text-xs font-medium text-[#111827] hover:border-[#D98A12] hover:text-[#B45309]"
          >
            <CheckSquare className="h-3.5 w-3.5 text-[#D98A12]" />
            Checklist
          </button>
          <button
            type="button"
            onClick={() => onAddNode("code")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1 text-xs font-medium text-[#111827] hover:border-[#0E9F6E] hover:text-[#047857]"
          >
            <Code2 className="h-3.5 w-3.5 text-[#0E9F6E]" />
            Code
          </button>
        </div>

        {/* Undo / Redo Stack */}
        <div className="flex items-center gap-1 border-l border-[#E2E8F0] pl-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title={`Undo (Ctrl+Z) · ${undoCount} steps`}
            aria-label="Undo"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title={`Redo (Ctrl+Y) · ${redoCount} steps`}
            aria-label="Redo"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Zoom & Fit */}
        <div className="flex items-center gap-1 border-l border-[#E2E8F0] pl-2">
          <span className="px-1.5 font-mono text-[11px] tabular-nums text-[#475569]">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={onFitView}
            title="Reset & Fit Board"
            aria-label="Fit view"
            className="rounded-full p-1 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#111827]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* JSON Export / Import */}
        <div className="flex items-center gap-1 border-l border-[#E2E8F0] pl-2">
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] px-2.5 py-1 text-xs font-medium text-[#111827] hover:border-[#1B3DE5] hover:text-[#1B3DE5]"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] px-2.5 py-1 text-xs font-medium text-[#111827] hover:border-[#1B3DE5] hover:text-[#1B3DE5]"
          >
            <Upload className="h-3 w-3" />
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportJson(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
