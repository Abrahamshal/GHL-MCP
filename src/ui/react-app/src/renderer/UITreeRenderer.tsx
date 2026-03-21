/**
 * UITreeRenderer — Recursively renders a UITree into React components.
 *
 * Expects the JSON format:
 * {
 *   root: string,
 *   elements: Record<string, UIElement>
 * }
 *
 * where UIElement = { key, type, props, children?: string[] }
 */
import React from "react";
import type { UITree, UIElement } from "../types.js";
import { getComponent } from "./registry.js";

// ─── Element Renderer ───────────────────────────────────────

interface ElementRendererProps {
  elementKey: string;
  elements: Record<string, UIElement>;
}

function ElementRenderer({ elementKey, elements }: ElementRendererProps): React.ReactElement | null {
  const element = elements[elementKey];
  if (!element) {
    console.warn(`UITreeRenderer: element key "${elementKey}" not found in tree`);
    return null;
  }

  const Component = getComponent(element.type);
  if (!Component) {
    return React.createElement(
      "div",
      {
        style: {
          padding: 4,
          margin: 2,
          border: "1px solid #fca5a5",
          borderRadius: 4,
          fontSize: 10,
          color: "#dc2626",
          background: "#fef2f2",
        },
      },
      `Unknown component: ${element.type}`,
    );
  }

  // Recursively render children
  const childElements = element.children?.map((childKey) =>
    React.createElement(ElementRenderer, {
      key: childKey,
      elementKey: childKey,
      elements,
    }),
  );

  return React.createElement(Component, { key: element.key, ...element.props }, childElements);
}

// ─── Tree Renderer ──────────────────────────────────────────

export interface UITreeRendererProps {
  tree: UITree;
}

export function UITreeRenderer({ tree }: UITreeRendererProps): React.ReactElement | null {
  if (!tree || !tree.root || !tree.elements) {
    return React.createElement(
      "div",
      { className: "error-state" },
      React.createElement("h3", null, "Invalid UI Tree"),
      React.createElement("p", null, "The UI tree is missing required fields (root, elements)."),
    );
  }

  return React.createElement(ElementRenderer, {
    elementKey: tree.root,
    elements: tree.elements,
  });
}
