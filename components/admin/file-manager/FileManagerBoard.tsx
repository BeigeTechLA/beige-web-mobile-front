"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type FileManagerBoardColumn<T> = {
  id: string;
  title: string;
  items: T[];
};

type FileManagerBoardProps<T> = {
  columns: FileManagerBoardColumn<T>[];
  emptyMessage: string;
  getItemId: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
};

export function FileManagerBoard<T>({
  columns,
  emptyMessage,
  getItemId,
  renderCard,
}: FileManagerBoardProps<T>) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({ startX: 0, scrollLeft: 0, isActive: false });
  const [isPanning, setIsPanning] = useState(false);
  const [columnOrder, setColumnOrder] = useState<Record<string, string[]>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  useEffect(() => {
    setColumnOrder((prev) => {
      const next: Record<string, string[]> = {};

      columns.forEach((column) => {
        const currentIds = column.items.map((item) => getItemId(item));
        const previousIds = prev[column.id] || [];
        const preservedIds = previousIds.filter((id) => currentIds.includes(id));
        const appendedIds = currentIds.filter((id) => !preservedIds.includes(id));
        next[column.id] = [...preservedIds, ...appendedIds];
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const hasChanged =
        prevKeys.length !== nextKeys.length ||
        nextKeys.some((key) => {
          const previous = prev[key] || [];
          const upcoming = next[key] || [];
          if (previous.length !== upcoming.length) return true;
          return upcoming.some((id, index) => previous[index] !== id);
        });

      return hasChanged ? next : prev;
    });
  }, [columns, getItemId]);

  const orderedColumns = useMemo(() => {
    return columns.map((column) => {
      const itemMap = new Map(column.items.map((item) => [getItemId(item), item]));
      const orderedIds = columnOrder[column.id] || column.items.map((item) => getItemId(item));
      const orderedItems = orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is T => Boolean(item));

      return {
        ...column,
        items: orderedItems,
      };
    });
  }, [columnOrder, columns, getItemId]);

  useEffect(() => {
    const handleMouseUp = () => {
      panStateRef.current.isActive = false;
      setIsPanning(false);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) {
      return;
    }

    const container = boardRef.current;
    if (!container) return;

    panStateRef.current = {
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
      isActive: true,
    };
    setIsPanning(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!panStateRef.current.isActive) return;

    const container = boardRef.current;
    if (!container) return;

    const deltaX = event.clientX - panStateRef.current.startX;
    container.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    event.preventDefault();
  };

  const handleMouseEnd = () => {
    panStateRef.current.isActive = false;
    setIsPanning(false);
  };

  const reorderItems = (columnId: string, activeId: string, targetId?: string) => {
    if (activeId === targetId) return;

    setColumnOrder((prev) => {
      const currentIds = prev[columnId] || [];
      const nextIds = [...currentIds];
      const fromIndex = nextIds.indexOf(activeId);
      const targetIndex = typeof targetId === "string" ? nextIds.indexOf(targetId) : nextIds.length;

      if (fromIndex === -1 || targetIndex === -1) {
        return prev;
      }

      nextIds.splice(fromIndex, 1);
      const insertIndex =
        typeof targetId === "string"
          ? nextIds.indexOf(targetId) + (fromIndex < targetIndex ? 1 : 0)
          : nextIds.length;
      nextIds.splice(insertIndex === -1 ? nextIds.length : insertIndex, 0, activeId);

      return {
        ...prev,
        [columnId]: nextIds,
      };
    });
  };

  return (
    <div
      ref={boardRef}
      className={`overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory ${
        isPanning ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseEnd}
      onMouseLeave={handleMouseEnd}
    >
      <div className="flex items-stretch gap-5 min-w-max px-1">
        {orderedColumns.map((column) => (
          <div
            key={column.id}
            className="w-[calc(100vw-56px)] md:w-[320px] shrink-0 rounded-3xl border h-full min-h-[620px] snap-center bg-[#0A0A0A] border-[#FFFFFF33] flex flex-col"
          >
            <div className="flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 border-b border-white/5 bg-[#202020]">
              <h4 className="text-sm font-medium text-[#E8D1AB]">{column.title}</h4>
              <span className="text-sm font-medium text-white/70">{column.items.length}</span>
            </div>

            <div
              className="flex-1 min-h-0 max-h-[620px] overflow-y-auto no-scrollbar px-4 py-4 space-y-3"
              onDragOver={(event) => {
                if (draggedColumnId !== column.id) return;
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                if (draggedColumnId !== column.id || !draggedItemId) return;
                event.preventDefault();
                event.stopPropagation();
                reorderItems(column.id, draggedItemId);
                setDraggedItemId(null);
                setDraggedColumnId(null);
              }}
            >
              {column.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35">
                  {emptyMessage}
                </div>
              ) : (
                column.items.map((item) => {
                  const itemId = getItemId(item);

                  return (
                    <div
                      key={itemId}
                      draggable
                      onDragStart={() => {
                        setDraggedItemId(itemId);
                        setDraggedColumnId(column.id);
                      }}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDraggedColumnId(null);
                      }}
                      onDragOver={(event) => {
                        if (draggedColumnId !== column.id) return;
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onDrop={(event) => {
                        if (draggedColumnId !== column.id || !draggedItemId) return;
                        event.preventDefault();
                        event.stopPropagation();
                        reorderItems(column.id, draggedItemId, itemId);
                        setDraggedItemId(null);
                        setDraggedColumnId(null);
                      }}
                      className={`flex h-full ${draggedItemId === itemId ? "opacity-50 scale-95" : "opacity-100"}`}
                    >
                      {renderCard(item)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
