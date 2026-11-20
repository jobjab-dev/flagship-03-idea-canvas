import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardSnapshot } from "../types/canvas";

const MAX_HISTORY = 100;

export function useCanvasHistory(initial: BoardSnapshot) {
  const [past, setPast] = useState<BoardSnapshot[]>([]);
  const [present, setPresent] = useState<BoardSnapshot>(initial);
  const [future, setFuture] = useState<BoardSnapshot[]>([]);

  const presentRef = useRef(present);
  presentRef.current = present;

  // Replace present transiently without recording to undo stack (e.g. during pointer drag)
  const setTransient = useCallback(
    (updater: (prev: BoardSnapshot) => BoardSnapshot) => {
      setPresent((prev) => updater(prev));
    },
    []
  );

  // Commit a discrete state transition onto the undo history stack
  const commit = useCallback(
    (updater: (prev: BoardSnapshot) => BoardSnapshot) => {
      setPresent((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), prev]);
        setFuture([]);
        return next;
      });
    },
    []
  );

  // Record a previously captured baseline snapshot after a transient drag/resize finishes
  const recordBaselineSnapshot = useCallback((baseline: BoardSnapshot) => {
    setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), baseline]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFuture((f) => [presentRef.current, ...f]);
      setPresent(previous);
      return prevPast.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((p) => [...p, presentRef.current]);
      setPresent(next);
      return prevFuture.slice(1);
    });
  }, []);

  const resetBoard = useCallback((snapshot: BoardSnapshot) => {
    setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), presentRef.current]);
    setPresent(snapshot);
    setFuture([]);
  }, []);

  // Global keyboard shortcuts: Ctrl/Cmd+Z and Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingText =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditingText) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return {
    present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
    redoCount: future.length,
    setTransient,
    commit,
    recordBaselineSnapshot,
    undo,
    redo,
    resetBoard,
  };
}
