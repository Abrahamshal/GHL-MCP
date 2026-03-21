/**
 * AppointmentBooker — Date picker + time slots + contact picker + book via tool.
 * CRM-agnostic: calendarTool, bookTool, contactSearchTool received as props.
 *
 * Uses useSmartAction for resilient booking.
 */
import React, { useState, useMemo, useCallback } from "react";
import { ContactPicker } from "./ContactPicker.js";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import type { AppointmentBookerProps } from "../../types.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

export const AppointmentBooker: React.FC<AppointmentBookerProps> = ({
  slots,
  calendarTool,
  bookTool,
  calendarId,
  contactSearchTool,
}) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookResult, setBookResult] = useState<"success" | "queued" | null>(null);
  const { executeAction } = useSmartAction();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to fill last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewMonth, viewYear]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const dateStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  // Check slot availability from provided slots
  const isSlotAvailable = (date: string, time: string): boolean => {
    if (!slots) return true; // All available if no slots provided
    return slots.some(
      (s) => s.date === date && s.time === time && s.available,
    );
  };

  const handleContactSelect = useCallback((contact: any) => {
    setContactId(contact.id);
    const name = contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      contact.id;
    setContactName(name);
  }, []);

  const handleBook = async () => {
    if (!bookTool || !selectedDate || !selectedTime) return;

    setIsBooking(true);
    setBookResult(null);

    const result = await executeAction({
      type: bookTool,
      args: {
        calendarId,
        contactId,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || undefined,
      },
      description: `Book appointment on ${selectedDate} at ${selectedTime}${contactName ? ` for ${contactName}` : ""}`,
    });

    setIsBooking(false);
    if (result.success && !result.queued) {
      setBookResult("success");
    } else if (result.queued) {
      setBookResult("queued");
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="ab-wrap">
      {/* Calendar */}
      <div className="ab-calendar">
        <div className="ab-cal-header">
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>
            ‹
          </button>
          <span className="ab-cal-month">{monthLabel}</span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>
            ›
          </button>
        </div>

        <div className="ab-cal-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="ab-cal-weekday">
              {d}
            </div>
          ))}
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={[
                "ab-cal-cell",
                day === null ? "ab-cal-empty" : "",
                day && isToday(day) ? "ab-cal-today" : "",
                day && selectedDate === dateStr(day) ? "ab-cal-selected" : "",
                day && isPast(day) ? "ab-cal-past" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (day && !isPast(day)) {
                  setSelectedDate(dateStr(day));
                  setSelectedTime(null);
                  setBookResult(null);
                }
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="ab-time-section">
          <label className="mcp-field-label">Select Time</label>
          <div className="ab-time-grid">
            {TIME_SLOTS.map((time) => {
              const available = isSlotAvailable(selectedDate, time);
              return (
                <button
                  key={time}
                  className={[
                    "ab-time-btn",
                    selectedTime === time ? "ab-time-selected" : "",
                    !available ? "ab-time-unavailable" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (available) {
                      setSelectedTime(time);
                      setBookResult(null);
                    }
                  }}
                  disabled={!available}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Picker */}
      {contactSearchTool && (
        <div className="ab-contact">
          <ContactPicker
            searchTool={contactSearchTool}
            label="Contact"
            placeholder="Search for contact..."
            onSelect={handleContactSelect}
          />
        </div>
      )}

      {/* Notes */}
      <div className="mcp-field">
        <label className="mcp-field-label">Notes</label>
        <textarea
          className="mcp-field-input fg-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add appointment notes..."
          rows={2}
        />
      </div>

      {/* Book Button */}
      {bookTool && (
        <div className="ab-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBook}
            disabled={!selectedDate || !selectedTime || isBooking}
          >
            {isBooking ? "Booking..." : "Book Appointment"}
          </button>
          {selectedDate && selectedTime && (
            <span className="ab-summary">
              {selectedDate} at {selectedTime}
            </span>
          )}
          {bookResult === "success" && <span style={{ color: "#059669", fontSize: 13 }}>✓ Booked</span>}
          {bookResult === "queued" && <span style={{ color: "#d97706", fontSize: 13 }}>● Queued</span>}
        </div>
      )}
    </div>
  );
};
