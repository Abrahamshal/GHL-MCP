import React, { useMemo } from 'react';
import type { FlowDiagramProps, FlowNode, FlowEdge } from '../../types.js';

const typeStyles: Record<string, string> = {
  start: 'flow-node-start',
  action: 'flow-node-action',
  condition: 'flow-node-condition',
  end: 'flow-node-end',
};

export const FlowDiagram: React.FC<FlowDiagramProps> = ({
  nodes = [],
  edges = [],
  direction = 'horizontal',
  title,
}) => {
  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔗</div>
        <p>No flow nodes</p>
      </div>
    );
  }

  // Topological ordering: walk from start nodes
  const { ordered, edgeLabelMap } = useMemo(() => {
    const nodeMap: Record<string, FlowNode> = {};
    for (const n of nodes) nodeMap[n.id] = n;

    const visited = new Set<string>();
    const order: string[] = [];
    const starts = nodes.filter(n => n.type === 'start');
    if (starts.length === 0 && nodes.length > 0) starts.push(nodes[0]);

    function walk(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      order.push(id);
      for (const e of edges) {
        if (e.from === id) walk(e.to);
      }
    }
    starts.forEach(s => walk(s.id));
    for (const n of nodes) {
      if (!visited.has(n.id)) order.push(n.id);
    }

    const eLabelMap: Record<string, string> = {};
    for (const e of edges) {
      if (e.label) eLabelMap[`${e.from}-${e.to}`] = e.label;
    }

    return { ordered: order, nodeMap, edgeLabelMap: eLabelMap };
  }, [nodes, edges]);

  const nodeMap: Record<string, FlowNode> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const isVert = direction === 'vertical';

  return (
    <div className="flow-diagram">
      {title && <div className="flow-title">{title}</div>}
      <div
        className={`flow-container ${isVert ? 'flow-vertical' : 'flow-horizontal'}`}
      >
        {ordered.map((id, i) => {
          const n = nodeMap[id];
          if (!n) return null;

          const typeCls = typeStyles[n.type || 'action'] || 'flow-node-action';
          const isCondition = n.type === 'condition';

          const nodeEl = (
            <div
              className={`flow-node ${typeCls}${isCondition ? ' flow-diamond' : ''}`}
              key={`node-${id}`}
            >
              <div className="flow-node-label">{n.label}</div>
              {n.description && (
                <div className="flow-node-desc">{n.description}</div>
              )}
            </div>
          );

          // Arrow between nodes
          let arrowEl: React.ReactNode = null;
          if (i < ordered.length - 1) {
            const edgeKey = `${ordered[i]}-${ordered[i + 1]}`;
            const lbl = edgeLabelMap[edgeKey];
            arrowEl = (
              <div
                className={`flow-arrow ${isVert ? 'flow-arrow-vert' : ''}`}
                key={`arrow-${i}`}
              >
                {isVert ? '↓' : '→'}
                {lbl && <span className="flow-edge-label">{lbl}</span>}
              </div>
            );
          }

          return (
            <React.Fragment key={id}>
              {nodeEl}
              {arrowEl}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
