import React, { useState, useMemo } from 'react';
import type { CalendarViewProps, CalendarEvent } from '../../types.js';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const defaultColors: Record<string, string> = {
  meeting: '#4f46e5',
  call: '#059669',
  task: '#d97706',
  deadline: '#dc2626',
  event: '#7c3aed',
};

export const CalendarView: React.FC<CalendarViewProps & { onDateClick?: (date: string) => void }> = ({
  title,
  events = [],
  highlightToday = true,
  year: propYear,
  month: propMonth,
  onDateClick,
}) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(propYear ?? now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(propMonth ?? now.getMonth() + 1);

  const monthIdx = currentMonth - 1;
  const firstDay = new Date(currentYear, monthIdx, 1).getDay();
  const daysInMonth = new Date(currentYear, monthIdx + 1, 0).getDate();
  const todayDate = now.getDate();
  const isCurrentMonth =
    currentYear === now.getFullYear() && monthIdx === now.getMonth();

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const evt of events) {
      try {
        const d = new Date(evt.date);
        if (d.getFullYear() === currentYear && d.getMonth() === monthIdx) {
          const day = d.getDate();
          (map[day] = map[day] || []).push(evt);
        }
      } catch {
        /* skip invalid dates */
      }
    }
    return map;
  }, [events, currentYear, monthIdx]);

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Build calendar cells
  const emptyCells = Array.from({ length: firstDay }, (_, i) => (
    <div className="cal-cell cal-cell-empty" key={`empty-${i}`} />
  ));

  const dayCells = Array.from({ length: daysInMonth }, (_, idx) => {
    const d = idx + 1;
    const isToday = highlightToday && isCurrentMonth && d === todayDate;
    const dayEvents = eventsByDay[d] || [];
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return (
      <div
        className={`cal-cell${isToday ? ' cal-today' : ''}`}
        key={d}
        onClick={() => onDateClick?.(dateStr)}
        style={onDateClick ? { cursor: 'pointer' } : undefined}
      >
        <span className={`cal-day-num${isToday ? ' cal-day-today' : ''}`}>
          {d}
        </span>
        <div className="cal-evts">
          {dayEvents.slice(0, 3).map((e, ei) => {
            const color =
              e.color || defaultColors[e.type || 'event'] || '#4f46e5';
            return (
              <div
                className="cal-evt"
                style={{ background: color }}
                title={`${e.title}${e.time ? ` @ ${e.time}` : ''}`}
                key={ei}
              >
                {e.title}
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="cal-evt-more">+{dayEvents.length - 3} more</div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="cal-view">
      {title && <div className="cal-title">{title}</div>}
      <div className="cal-header-month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={goToPreviousMonth}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: 12,
          }}
        >
          ‹
        </button>
        <span>{MONTH_NAMES[monthIdx]} {currentYear}</span>
        <button
          onClick={goToNextMonth}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: 12,
          }}
        >
          ›
        </button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map(dn => (
          <div className="cal-day-header" key={dn}>
            {dn}
          </div>
        ))}
        {emptyCells}
        {dayCells}
      </div>
    </div>
  );
};
