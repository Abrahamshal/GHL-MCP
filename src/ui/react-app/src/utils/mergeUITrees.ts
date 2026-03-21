/**
 * mergeUITrees — Merges a new UI tree into an existing one, preserving
 * unchanged element references so React can skip re-rendering stable subtrees.
 *
 * This is critical for preserving local component state (e.g., form inputs,
 * drag state, dropdown open/closed) across tool result updates.
 */
import type { UITree, UIElement } from "../types.js";

/**
 * Merge two UI trees. If the root type changes, returns the new tree outright.
 * Otherwise merges element-by-element, keeping exact old references for
 * elements whose props and children haven't changed.
 */
export function mergeUITrees(prev: UITree, next: UITree): UITree {
  // If root key changed, full replacement is correct
  if (prev.root !== next.root) return next;

  // Check if root element type changed
  const prevRoot = prev.elements[prev.root];
  const nextRoot = next.elements[next.root];
  if (prevRoot && nextRoot && prevRoot.type !== nextRoot.type) return next;

  const mergedElements: Record<string, UIElement> = {};

  for (const [key, nextEl] of Object.entries(next.elements)) {
    const prevEl = prev.elements[key];
    if (prevEl && prevEl.type === nextEl.type) {
      // Same key + same type → check if props/children changed
      if (
        shallowEqualJSON(prevEl.props, nextEl.props) &&
        arraysEqual(prevEl.children, nextEl.children)
      ) {
        // Keep EXACT same reference → React skips re-render
        mergedElements[key] = prevEl;
      } else {
        // Props or children changed → use new element
        mergedElements[key] = nextEl;
      }
    } else {
      // New element or type changed → use new element
      mergedElements[key] = nextEl;
    }
  }

  return { root: next.root, elements: mergedElements };
}

/**
 * Compare two values by JSON serialization.
 * Fast-path: same reference → true.
 */
function shallowEqualJSON(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compare two optional string arrays.
 */
function arraysEqual(a?: string[], b?: string[]): boolean {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
