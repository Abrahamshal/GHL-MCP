import React, { useState, useCallback } from 'react';
import type { TreeViewProps, TreeNode } from '../../types.js';

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandAll: boolean;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, depth, expandAll }) => {
  const hasChildren = !!node.children && node.children.length > 0;
  const defaultExpanded = expandAll || node.expanded !== false;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpand = useCallback(() => {
    if (hasChildren) setExpanded(e => !e);
  }, [hasChildren]);

  const indent = depth * 20;

  return (
    <>
      <div
        className="tree-item"
        style={{ paddingLeft: `${indent}px` }}
        onClick={toggleExpand}
        role={hasChildren ? 'button' : undefined}
      >
        <span className="tree-chevron">
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </span>
        {node.icon && <span className="tree-icon">{node.icon}</span>}
        <span className="tree-label">{node.label}</span>
        {node.badge && <span className="tree-badge">{node.badge}</span>}
      </div>
      {hasChildren &&
        expanded &&
        node.children!.map((child, i) => (
          <TreeNodeItem
            key={i}
            node={child}
            depth={depth + 1}
            expandAll={expandAll}
          />
        ))}
    </>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({
  nodes = [],
  title,
  expandAll = false,
}) => {
  return (
    <div className="tree-view">
      {title && <div className="tree-title">{title}</div>}
      <div className="tree-list">
        {nodes.map((n, i) => (
          <TreeNodeItem key={i} node={n} depth={0} expandAll={expandAll} />
        ))}
      </div>
    </div>
  );
};
