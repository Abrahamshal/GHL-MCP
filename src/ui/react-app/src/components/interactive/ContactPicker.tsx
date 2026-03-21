/**
 * ContactPicker — Search contacts via MCP tool, display results in dropdown.
 * CRM-agnostic: receives searchTool as a prop.
 *
 * Uses useSmartAction for resilient search: direct tool call if supported,
 * fallback to change tracking otherwise.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import { useCallTool } from "../../hooks/useCallTool.js";
import type { ContactPickerProps } from "../../types.js";

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export const ContactPicker: React.FC<ContactPickerProps & { onSelect?: (contact: any) => void }> = ({
  searchTool,
  selectedId,
  label,
  placeholder = "Search contacts...",
  selectTool,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Contact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { executeAction, canCallTools } = useSmartAction();
  const { execute: directExecute } = useCallTool();

  // Click outside → close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (!searchTool || q.trim().length < 1) {
        setResults([]);
        return;
      }
      setIsSearching(true);

      if (canCallTools) {
        // Direct path: use callTool for search (returns data we need)
        const res = await directExecute(searchTool, { query: q });
        if (res?.content) {
          for (const item of res.content) {
            if (item.type === "text") {
              try {
                const parsed = JSON.parse(item.text);
                const list = Array.isArray(parsed)
                  ? parsed
                  : parsed.contacts || parsed.results || parsed.data || [];
                setResults(list.slice(0, 10));
              } catch {
                setResults([]);
              }
            }
          }
        }
      } else {
        // Fallback: track the search as an action (model will handle)
        await executeAction({
          type: searchTool,
          args: { query: q },
          description: `Search contacts for "${q}"`,
        });
      }

      setIsSearching(false);
    },
    [searchTool, canCallTools, directExecute, executeAction],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const getContactName = (c: Contact): string => {
    if (c.name) return c.name;
    const parts = [c.firstName, c.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : c.id;
  };

  const handleSelect = async (contact: Contact) => {
    // Optimistic: update local state immediately
    setSelected(contact);
    setQuery(getContactName(contact));
    setIsOpen(false);
    setResults([]);

    // Notify parent component (e.g., InvoiceBuilder)
    if (onSelect) {
      onSelect(contact);
    }

    if (selectTool) {
      await executeAction({
        type: selectTool,
        args: { contactId: contact.id },
        description: `Selected contact: ${getContactName(contact)}`,
      });
    }
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="cp-wrapper" ref={wrapRef}>
      {label && <label className="mcp-field-label">{label}</label>}
      <div className="cp-input-wrap">
        <span className="cp-search-icon">🔍</span>
        <input
          type="text"
          className="mcp-field-input cp-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isSearching && <span className="cp-spinner" />}
        {selected && (
          <button className="cp-clear" onClick={handleClear} aria-label="Clear">
            ×
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="cp-dropdown">
          {results.map((contact, i) => (
            <div
              key={contact.id || i}
              className="cp-dropdown-item"
              onClick={() => handleSelect(contact)}
            >
              <span className="cp-item-name">{getContactName(contact)}</span>
              {(contact.email || contact.phone) && (
                <span className="cp-item-detail">
                  {contact.email || contact.phone}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && results.length === 0 && !isSearching && (
        <div className="cp-dropdown">
          <div className="cp-dropdown-empty">No results found</div>
        </div>
      )}
    </div>
  );
};
