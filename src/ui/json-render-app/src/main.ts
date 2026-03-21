/**
 * GHL Dynamic View - MCP App Entry Point
 * Receives UI trees from the generate_ghl_view tool via MCP ext-apps protocol
 * and renders them using the component library.
 *
 * Implements the MCP ext-apps handshake:
 *   1. View sends ui/initialize → Host responds
 *   2. View sends ui/notifications/initialized → Host acks
 *   3. Host sends ui/notifications/tool-result → View renders
 */

import { COMPONENTS } from './components';
import { STYLES } from './styles';

// ─── Inject Styles ──────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = STYLES;
document.head.appendChild(styleEl);

// ─── Tree Renderer ──────────────────────────────────────────
interface UIElement {
  key: string;
  type: string;
  props: Record<string, any>;
  children?: string[];
}

interface UITree {
  root: string;
  elements: Record<string, UIElement>;
}

function renderElement(el: UIElement, elements: Record<string, UIElement>): string {
  const component = COMPONENTS[el.type];
  if (!component) {
    return `<div class="error-state"><p>Unknown component: ${el.type}</p></div>`;
  }

  const childrenHtml = (el.children || [])
    .map(key => {
      const childEl = elements[key];
      if (!childEl) return `<div class="text-muted">Missing element: ${key}</div>`;
      return renderElement(childEl, elements);
    })
    .join('');

  return component(el.props || {}, childrenHtml);
}

function renderTree(tree: UITree): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  try {
    const rootEl = tree.elements[tree.root];
    if (!rootEl) {
      appEl.innerHTML = `<div class="error-state"><h3>Render Error</h3><p>Root element "${tree.root}" not found in tree</p></div>`;
      return;
    }
    appEl.innerHTML = renderElement(rootEl, tree.elements);

    // After rendering, report actual content size to host
    requestAnimationFrame(() => {
      reportSize();
    });
  } catch (err: any) {
    appEl.innerHTML = `<div class="error-state"><h3>Render Error</h3><p>${err.message || 'Unknown error'}</p></div>`;
  }
}

/** Measure actual content and notify host of preferred size */
function reportSize(): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const height = Math.min(appEl.scrollHeight + 16, 600); // Cap at 600px
  const width = appEl.scrollWidth + 8;

  try {
    window.parent.postMessage({
      jsonrpc: '2.0',
      method: 'ui/notifications/size-changed',
      params: { width, height },
    }, '*');
  } catch {
    // Not in iframe
  }

  // Also set body height so the iframe can auto-size if the host supports it
  document.body.style.height = height + 'px';
  document.body.style.overflow = 'auto';
}

// ─── Loading State ──────────────────────────────────────────
function showLoading(): void {
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Generating view...</p>
      </div>`;
  }
}

function showError(message: string): void {
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.innerHTML = `<div class="error-state"><h3>Error</h3><p>${message}</p></div>`;
  }
}

// ─── Helpers ────────────────────────────────────────────────

/** Try to extract a uiTree from any data shape and render it */
function tryRenderFromData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // structuredContent.uiTree
  if (data.structuredContent?.uiTree) {
    renderTree(data.structuredContent.uiTree);
    return true;
  }
  // Direct uiTree
  if (data.uiTree) {
    renderTree(data.uiTree);
    return true;
  }
  // Direct tree shape
  if (data.root && data.elements) {
    renderTree(data as UITree);
    return true;
  }
  // Nested in content array
  if (Array.isArray(data.content)) {
    for (const item of data.content) {
      if (item.structuredContent?.uiTree) {
        renderTree(item.structuredContent.uiTree);
        return true;
      }
    }
  }
  return false;
}

// ─── MCP ext-apps Protocol (JSON-RPC over postMessage) ──────
let rpcId = 1;
let initialized = false;

function sendToHost(message: Record<string, any>): void {
  try {
    window.parent.postMessage(message, '*');
  } catch {
    // Not in an iframe or parent unavailable
  }
}

function sendJsonRpcRequest(method: string, params: Record<string, any> = {}): number {
  const id = rpcId++;
  sendToHost({ jsonrpc: '2.0', id, method, params });
  return id;
}

function sendJsonRpcNotification(method: string, params: Record<string, any> = {}): void {
  sendToHost({ jsonrpc: '2.0', method, params });
}

// ─── Message Handler ────────────────────────────────────────
showLoading();

window.addEventListener('message', (event: MessageEvent) => {
  try {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    // ── JSON-RPC protocol (ext-apps standard) ──
    if (data.jsonrpc === '2.0') {

      // JSON-RPC response (to our requests)
      if ('id' in data && (data.result !== undefined || data.error !== undefined)) {
        const id = data.id as number;
        // Check if it's a response to a tool call
        const pending = pendingToolCalls.get(id);
        if (pending) {
          pendingToolCalls.delete(id);
          if (data.error) {
            pending.reject(new Error(data.error.message || 'Tool call failed'));
          } else {
            pending.resolve(data.result);
          }
          return;
        }
        // Otherwise it's likely the initialize response
        if (!initialized) {
          initialized = true;
          sendJsonRpcNotification('ui/notifications/initialized', {});
        }
        return;
      }

      // Host sends tool result
      if (data.method === 'ui/notifications/tool-result') {
        if (tryRenderFromData(data.params)) return;
        // Try params directly as structured content
        if (data.params && tryRenderFromData(data.params)) return;
        return;
      }

      // Host sends tool input (args before result — could render partial)
      if (data.method === 'ui/notifications/tool-input') {
        // Tool is still executing; keep showing loading
        return;
      }

      // Host sends partial input (streaming)
      if (data.method === 'ui/notifications/tool-input-partial') {
        return;
      }

      // Host sends tool cancelled
      if (data.method === 'ui/notifications/tool-cancelled') {
        showError('View generation was cancelled.');
        return;
      }

      // Host context changed (theme, etc.)
      if (data.method === 'ui/notifications/host-context-changed') {
        // Could apply theme here in the future
        return;
      }

      // Host sends teardown request
      if (data.method === 'ui/teardown' && data.id) {
        sendToHost({ jsonrpc: '2.0', id: data.id, result: {} });
        return;
      }

      // Ping
      if (data.method === 'ping' && data.id) {
        sendToHost({ jsonrpc: '2.0', id: data.id, result: {} });
        return;
      }

      return;
    }

    // ── Legacy / non-JSON-RPC fallbacks ──

    // Some hosts may send custom formats
    if (data.type === 'tool-result' || data.type === 'mcp-tool-result') {
      if (tryRenderFromData(data)) return;
      const content = data.structuredContent || data.content || data.data || data;
      if (tryRenderFromData(content)) return;
    }

    if (data.type === 'mcp-app-init' && data.data) {
      if (tryRenderFromData(data.data)) return;
    }

    // Direct data passthrough
    if (tryRenderFromData(data)) return;

  } catch (err: any) {
    showError(err.message || 'Failed to process message');
  }
});

// ─── Check pre-injected data ────────────────────────────────
const preInjected = (window as any).__MCP_APP_DATA__;
if (preInjected) {
  tryRenderFromData(preInjected);
}

// ─── MCP Tool Calling ───────────────────────────────────────
const pendingToolCalls = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

function callTool(toolName: string, args: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = rpcId++;
    pendingToolCalls.set(id, { resolve, reject });
    sendToHost({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: toolName, arguments: args } });
    // Timeout after 30s
    setTimeout(() => {
      if (pendingToolCalls.has(id)) {
        pendingToolCalls.delete(id);
        reject(new Error('Tool call timed out'));
      }
    }, 30000);
  });
}

// ─── Toast Notifications ────────────────────────────────────
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const existing = document.getElementById('mcp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'mcp-toast';
  toast.className = `mcp-toast mcp-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('mcp-toast-show'));
  setTimeout(() => { toast.classList.remove('mcp-toast-show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// ─── Edit Modal ─────────────────────────────────────────────
function showEditModal(title: string, fields: Array<{key: string, label: string, value: string, type?: string}>, onSave: (values: Record<string, string>) => void): void {
  const existing = document.getElementById('mcp-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'mcp-modal';
  modal.className = 'mcp-modal-overlay';
  modal.innerHTML = `
    <div class="mcp-modal">
      <div class="mcp-modal-header">
        <span class="mcp-modal-title">${title}</span>
        <button class="mcp-modal-close" data-modal-close>&times;</button>
      </div>
      <div class="mcp-modal-body">
        ${fields.map(f => `
          <div class="mcp-field">
            <label class="mcp-field-label">${f.label}</label>
            <input class="mcp-field-input" data-field="${f.key}" type="${f.type || 'text'}" value="${f.value}" />
          </div>`).join('')}
      </div>
      <div class="mcp-modal-footer">
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" data-modal-save>Save</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', () => modal.remove()));
  modal.querySelector('[data-modal-save]')?.addEventListener('click', () => {
    const values: Record<string, string> = {};
    modal.querySelectorAll<HTMLInputElement>('[data-field]').forEach(inp => {
      values[inp.dataset.field!] = inp.value;
    });
    onSave(values);
    modal.remove();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ─── Drag & Drop (Kanban) ───────────────────────────────────
let draggedCardId: string | null = null;
let draggedFromStage: string | null = null;

document.addEventListener('dragstart', (e) => {
  const card = (e.target as HTMLElement).closest?.('.kanban-card[draggable]') as HTMLElement | null;
  if (!card) return;
  draggedCardId = card.dataset.cardId || null;
  draggedFromStage = card.dataset.stageId || null;
  card.classList.add('kanban-card-dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCardId || '');
  }
});

document.addEventListener('dragend', (e) => {
  const card = (e.target as HTMLElement).closest?.('.kanban-card') as HTMLElement | null;
  if (card) card.classList.remove('kanban-card-dragging');
  document.querySelectorAll('.kanban-col-body').forEach(el => el.classList.remove('kanban-drop-target'));
  draggedCardId = null;
  draggedFromStage = null;
});

document.addEventListener('dragover', (e) => {
  const colBody = (e.target as HTMLElement).closest?.('.kanban-col-body') as HTMLElement | null;
  if (colBody) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    colBody.classList.add('kanban-drop-target');
  }
});

document.addEventListener('dragleave', (e) => {
  const colBody = (e.target as HTMLElement).closest?.('.kanban-col-body') as HTMLElement | null;
  if (colBody) colBody.classList.remove('kanban-drop-target');
});

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  const colBody = (e.target as HTMLElement).closest?.('.kanban-col-body[data-stage-id]') as HTMLElement | null;
  if (!colBody || !draggedCardId) return;

  const newStageId = colBody.dataset.stageId;
  if (!newStageId || newStageId === draggedFromStage) return;

  // Move the card in the DOM immediately for snappy feel
  const draggedEl = document.querySelector(`.kanban-card[data-card-id="${draggedCardId}"]`) as HTMLElement;
  if (draggedEl) {
    draggedEl.classList.remove('kanban-card-dragging');
    draggedEl.dataset.stageId = newStageId;
    colBody.appendChild(draggedEl);
    showToast('Moving deal...', 'info');
  }

  // Call the MCP server to persist the change
  try {
    await callTool('update_opportunity', {
      opportunityId: draggedCardId,
      pipelineStageId: newStageId,
    });
    showToast('Deal moved!', 'success');
  } catch (err: any) {
    showToast(`Failed: ${err.message}`, 'error');
    // TODO: revert DOM on failure
  }
  colBody.classList.remove('kanban-drop-target');
});

// ─── Double-click to Edit (Kanban cards) ────────────────────
document.addEventListener('dblclick', (e) => {
  const card = (e.target as HTMLElement).closest?.('.kanban-card[data-card-id]') as HTMLElement | null;
  if (card && card.dataset.cardId) {
    const titleEl = card.querySelector('.kanban-card-title');
    const valueEl = card.querySelector('.kanban-card-value');
    showEditModal('Edit Opportunity', [
      { key: 'name', label: 'Name', value: titleEl?.textContent || '' },
      { key: 'monetaryValue', label: 'Value ($)', value: (valueEl?.textContent || '').replace(/[^0-9.]/g, ''), type: 'number' },
      { key: 'status', label: 'Status', value: 'open' },
    ], async (values) => {
      showToast('Updating...', 'info');
      try {
        const args: Record<string, any> = { opportunityId: card.dataset.cardId! };
        if (values.name) args.name = values.name;
        if (values.monetaryValue) args.monetaryValue = parseFloat(values.monetaryValue);
        if (values.status) args.status = values.status;
        await callTool('update_opportunity', args);
        // Update DOM
        if (titleEl && values.name) titleEl.textContent = values.name;
        if (valueEl && values.monetaryValue) valueEl.textContent = `$${parseFloat(values.monetaryValue).toLocaleString()}`;
        showToast('Updated!', 'success');
      } catch (err: any) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    });
    return;
  }

  // Double-click on table row
  const row = (e.target as HTMLElement).closest?.('tr[data-row-id]') as HTMLElement | null;
  if (row && row.dataset.rowId) {
    const cells = row.querySelectorAll('td');
    const headers = row.closest('table')?.querySelectorAll('th');
    const fields: Array<{key: string, label: string, value: string}> = [];
    cells.forEach((cell, i) => {
      if (cell.classList.contains('checkbox-col')) return;
      const label = headers?.[i]?.textContent?.trim() || `Field ${i}`;
      fields.push({ key: `field_${i}`, label, value: cell.textContent?.trim() || '' });
    });
    showEditModal('Row Details', fields, () => {
      showToast('Edit via table is read-only for now', 'info');
    });
  }
});

// ─── Initiate ext-apps handshake ────────────────────────────
// Send ui/initialize to the host to start the protocol
// The host will respond, then we send initialized, then it sends tool data
try {
  if (window.parent && window.parent !== window) {
    sendJsonRpcRequest('ui/initialize', {
      protocolVersion: '2026-01-26',
      appInfo: {
        name: 'GHL Dynamic View',
        version: '1.0.0',
      },
      appCapabilities: {
        tools: { listChanged: false },
      },
    });
  }
} catch {
  // Not in an iframe context — rely on __MCP_APP_DATA__
}
