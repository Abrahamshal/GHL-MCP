/**
 * KanbanBoard — Drag-and-drop kanban board for pipeline/opportunity management.
 *
 * Uses useSmartAction for resilient drag-drop persistence with optimistic UI.
 * Falls back to change tracking when direct tool calls aren't available.
 */
import React, { useState, useCallback, useRef } from 'react';
import type { KanbanBoardProps, KanbanColumn, KanbanCard } from '../../types.js';
import { useSmartAction } from '../../hooks/useSmartAction.js';

// ─── Status classes for kanban cards ────────────────────

const kanbanStatusClasses: Record<string, string> = {
  open: 'status-open', won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
};

// ─── Drag state ─────────────────────────────────────────

interface DragState {
  cardId: string;
  fromStageId: string;
}

// ─── Props ──────────────────────────────────────────────

interface Props extends KanbanBoardProps {
  children?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

export const KanbanBoard: React.FC<Props> = ({ columns: initialColumns = [], moveTool, cardClickTool }) => {
  const { executeAction } = useSmartAction();

  // Local mutable columns state for optimistic drag-and-drop
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Keep columns in sync if props change (e.g. after tool call refreshes tree)
  const prevColumnsRef = useRef(initialColumns);
  if (prevColumnsRef.current !== initialColumns) {
    prevColumnsRef.current = initialColumns;
    setColumns(initialColumns);
  }

  // ─── Drag handlers ───────────────────────────────────

  const onDragStart = useCallback((e: React.DragEvent, cardId: string, stageId: string) => {
    dragRef.current = { cardId, fromStageId: stageId };
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    // Set a small timeout to apply the dragging class after browser paints the drag image
    requestAnimationFrame(() => {
      setDraggingCardId(cardId);
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggingCardId(null);
    setDropTargetStage(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStage(stageId);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the column body (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDropTargetStage(null);
    }
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDropTargetStage(null);

    const drag = dragRef.current;
    if (!drag) return;

    const { cardId, fromStageId } = drag;
    dragRef.current = null;
    setDraggingCardId(null);

    // Don't do anything if dropped on the same column
    if (fromStageId === toStageId) return;

    // 1. Optimistic UI: move card in local state immediately
    let movedCard: KanbanCard | undefined;
    let movedCardTitle = "";
    const prevColumns = columns;

    // Find card details for description
    for (const col of columns) {
      const card = col.cards?.find(c => c.id === cardId);
      if (card) {
        movedCardTitle = card.title || cardId;
        break;
      }
    }

    const fromStageName = columns.find(c => c.id === fromStageId)?.title || fromStageId;
    const toStageName = columns.find(c => c.id === toStageId)?.title || toStageId;

    setColumns(prev => {
      const next = prev.map(col => {
        if (col.id === fromStageId) {
          const newCards = (col.cards || []).filter(c => {
            if (c.id === cardId) {
              movedCard = c;
              return false;
            }
            return true;
          });
          return {
            ...col,
            cards: newCards,
            count: newCards.length,
          };
        }
        return col;
      });

      if (!movedCard) return prev;

      return next.map(col => {
        if (col.id === toStageId) {
          const newCards = [...(col.cards || []), movedCard!];
          return {
            ...col,
            cards: newCards,
            count: newCards.length,
          };
        }
        return col;
      });
    });

    // 2. Call moveTool via smartAction if provided
    if (moveTool) {
      const result = await executeAction({
        type: moveTool,
        args: {
          opportunityId: cardId,
          pipelineStageId: toStageId,
        },
        description: `Move "${movedCardTitle}" from ${fromStageName} → ${toStageName}`,
      });

      // If direct call failed and was NOT queued, revert
      if (!result.success && !result.queued) {
        console.error('KanbanBoard: move failed, reverting');
        setColumns(prevColumns);
      }
    }
  }, [columns, moveTool, executeAction]);

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="kanban-wrap">
      <div className="kanban-cols">
        {columns.map(col => (
          <div key={col.id} className="kanban-col" data-stage-id={col.id}>
            <div className="kanban-col-header">
              <div className="kanban-col-title-row">
                <span className="kanban-col-title">{col.title}</span>
                <span className="kanban-col-count" data-count-for={col.id}>
                  {col.count ?? col.cards?.length ?? 0}
                </span>
              </div>
              {col.totalValue && <div className="kanban-col-value">{col.totalValue}</div>}
            </div>
            <div
              className={`kanban-col-body${dropTargetStage === col.id ? ' kanban-drop-target' : ''}`}
              data-stage-id={col.id}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.id)}
            >
              {(!col.cards || col.cards.length === 0) ? (
                <div className="kanban-empty">No items</div>
              ) : (
                col.cards.map(card => (
                  <div
                    key={card.id}
                    className={`kanban-card${draggingCardId === card.id ? ' kanban-card-dragging' : ''}`}
                    draggable
                    data-card-id={card.id}
                    data-stage-id={col.id}
                    title="Drag to move • Double-click to edit"
                    onDragStart={(e) => onDragStart(e, card.id, col.id)}
                    onDragEnd={onDragEnd}
                  >
                    <div className="kanban-card-title">{card.title}</div>
                    {card.subtitle && (
                      <div className="kanban-card-subtitle">
                        {card.avatarInitials && (
                          <div className="kanban-avatar">{card.avatarInitials}</div>
                        )}
                        {card.subtitle}
                      </div>
                    )}
                    {card.value && <div className="kanban-card-value">{card.value}</div>}
                    <div className="kanban-card-footer">
                      {card.date ? <span>{card.date}</span> : <span />}
                      {card.status && (
                        <span className={`status-badge-sm ${kanbanStatusClasses[card.statusVariant || 'open'] || 'status-open'}`}>
                          {card.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
