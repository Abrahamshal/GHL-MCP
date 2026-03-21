import React from "react";
import type { CardGridProps } from "../../types.js";

const cardStatusClasses: Record<string, string> = {
  active: "cg-status-active",
  complete: "cg-status-complete",
  draft: "cg-status-draft",
  error: "cg-status-error",
  pending: "cg-status-pending",
};

export const CardGrid: React.FC<CardGridProps> = ({
  cards = [],
  columns = 3,
}) => {
  return (
    <div className={`card-grid card-grid-${columns}`}>
      {cards.map((c, i) => (
        <div key={i} className="card-grid-item">
          {c.imageUrl ? (
            <div
              className="card-grid-image"
              style={{ backgroundImage: `url('${c.imageUrl}')` }}
            />
          ) : (
            <div className="card-grid-image card-grid-image-placeholder">
              <span>📄</span>
            </div>
          )}
          <div className="card-grid-body">
            <div className="card-grid-title">{c.title}</div>
            {c.subtitle && (
              <div className="card-grid-subtitle">{c.subtitle}</div>
            )}
            {c.description && (
              <div className="card-grid-desc">{c.description}</div>
            )}
            <div className="card-grid-footer">
              {c.status ? (
                <span
                  className={`status-badge-sm ${cardStatusClasses[c.statusVariant || "active"] || "cg-status-active"}`}
                >
                  {c.status}
                </span>
              ) : (
                <span />
              )}
              {c.action && (
                <button className="btn btn-ghost btn-sm">{c.action}</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
