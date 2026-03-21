/**
 * InvoiceBuilder — Contact picker + line items table + totals + create via tool.
 * CRM-agnostic: createTool and contactSearchTool received as props.
 *
 * Uses useSmartAction for resilient invoice creation.
 */
import React, { useState, useMemo, useCallback } from "react";
import { ContactPicker } from "./ContactPicker.js";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import type { InvoiceBuilderProps } from "../../types.js";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface SelectedContact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyName?: string;
  [key: string]: any;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  items: initialItems,
  currency = "USD",
  createTool,
  contactSearchTool,
}) => {
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialItems?.map((i) => ({
      description: i.name || i.description || "",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) || [{ description: "", quantity: 1, unitPrice: 0 }],
  );
  const [taxRate, setTaxRate] = useState(8.5);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const { executeAction } = useSmartAction();

  const updateItem = useCallback(
    (index: number, field: keyof InvoiceLineItem, value: string | number) => {
      setLineItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const addItem = () => {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(
    () => lineItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    [lineItems],
  );
  const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = subtotal + tax;

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  };

  const getContactName = (c: SelectedContact): string => {
    if (c.name) return c.name;
    const parts = [c.firstName, c.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown";
  };

  const handleContactSelect = useCallback((contact: SelectedContact) => {
    setSelectedContact(contact);
  }, []);

  const handleCreate = async () => {
    if (!createTool) return;
    setIsCreating(true);
    setCreateSuccess(false);

    const contactName = selectedContact ? getContactName(selectedContact) : undefined;
    const result = await executeAction({
      type: createTool,
      args: {
        contactId: selectedContact?.id,
        contactName,
        contactEmail: selectedContact?.email,
        items: lineItems.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.quantity * it.unitPrice,
        })),
        subtotal,
        tax,
        taxRate,
        total,
        currency,
      },
      description: `Create invoice for ${contactName || "unknown contact"} — ${fmt(total)}`,
    });

    setIsCreating(false);
    if (result.success || result.queued) {
      setCreateSuccess(true);
    }
  };

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="ib-wrap">
      <div className="ib-split">
        {/* Left: Contact Selection */}
        <div className="ib-left">
          <div className="ib-section">
            <div className="ib-section-title">Select Contact</div>
            {contactSearchTool && (
              <ContactPicker
                searchTool={contactSearchTool}
                placeholder="Search contacts..."
                onSelect={handleContactSelect}
              />
            )}
            {selectedContact && (
              <div className="ib-contact-card">
                <div className="ib-contact-row">
                  <span className="ib-contact-label">Name</span>
                  <span className="ib-contact-value">{getContactName(selectedContact)}</span>
                </div>
                {selectedContact.email && (
                  <div className="ib-contact-row">
                    <span className="ib-contact-label">Email</span>
                    <span className="ib-contact-value">{selectedContact.email}</span>
                  </div>
                )}
                {selectedContact.phone && (
                  <div className="ib-contact-row">
                    <span className="ib-contact-label">Phone</span>
                    <span className="ib-contact-value">{selectedContact.phone}</span>
                  </div>
                )}
                {(selectedContact.company || selectedContact.companyName) && (
                  <div className="ib-contact-row">
                    <span className="ib-contact-label">Company</span>
                    <span className="ib-contact-value">{selectedContact.company || selectedContact.companyName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Invoice Preview */}
        <div className="ib-right">
          <div className="ib-section">
            <div className="ib-invoice-header">
              <div className="ib-section-title">Invoice Preview</div>
              <div className="ib-invoice-meta">
                <div className="ib-meta-row"><span>Invoice Number</span><span>{invoiceNumber}</span></div>
                <div className="ib-meta-row"><span>Date</span><span>{today}</span></div>
                <div className="ib-meta-row"><span>Status</span><span className="status-badge status-draft">Draft</span></div>
              </div>
            </div>

            {/* Bill To — updates dynamically when contact is selected */}
            <div className="ib-bill-to">
              <div className="ib-bill-to-label">BILL TO</div>
              {selectedContact ? (
                <div className="ib-bill-to-info">
                  <div className="ib-bill-to-name">{getContactName(selectedContact)}</div>
                  {selectedContact.email && <div className="ib-bill-to-detail">{selectedContact.email}</div>}
                  {selectedContact.phone && <div className="ib-bill-to-detail">{selectedContact.phone}</div>}
                </div>
              ) : (
                <div className="ib-bill-to-empty">Select a contact to fill billing info</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items — full width below */}
      <div className="ib-section">
        <table className="ib-table">
          <thead>
            <tr>
              <th className="ib-th-desc">Description</th>
              <th className="ib-th-num">Qty</th>
              <th className="ib-th-num">Price</th>
              <th className="ib-th-num">Total</th>
              <th className="ib-th-act"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <input type="text" className="mcp-field-input" value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Item description" />
                </td>
                <td>
                  <input type="number" className="mcp-field-input ib-num-input" value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)} min={0} />
                </td>
                <td>
                  <input type="number" className="mcp-field-input ib-num-input" value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} min={0} step="0.01" />
                </td>
                <td className="ib-total-cell">{fmt(item.quantity * item.unitPrice)}</td>
                <td>
                  {lineItems.length > 1 && (
                    <button className="btn btn-ghost btn-sm ib-remove-btn" onClick={() => removeItem(idx)} title="Remove">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost btn-sm ib-add-btn" onClick={addItem}>+ Add Line Item</button>
      </div>

      {/* Totals */}
      <div className="ib-totals">
        <div className="ib-total-row"><span>Subtotal</span><span className="ib-total-val">{fmt(subtotal)}</span></div>
        <div className="ib-total-row">
          <span>Tax <input type="number" className="mcp-field-input ib-tax-input" value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min={0} max={100} step="0.1" />%</span>
          <span className="ib-total-val">{fmt(tax)}</span>
        </div>
        <div className="ib-total-row ib-total-final"><span>Total</span><span className="ib-total-val">{fmt(total)}</span></div>
      </div>

      {/* Actions */}
      <div className="ib-actions">
        {createSuccess && <span style={{ color: "#059669", fontSize: 13 }}>✓ Invoice queued</span>}
        <button className="btn btn-secondary btn-sm">Save Changes</button>
        {createTool && (
          <button className="btn btn-primary btn-sm" onClick={handleCreate}
            disabled={isCreating || lineItems.length === 0}>
            {isCreating ? "Creating..." : "Send Invoice"}
          </button>
        )}
      </div>
    </div>
  );
};
