// ============================================================
// Investment Calendar Engine
// ============================================================

export type CalendarEventType = 'dividend_declaration' | 'dividend_qualification' | 'dividend_payment' | 'agm' | 'earnings' | 'corporate_action';

export interface CalendarEvent {
  id: string;
  symbol: string;
  type: CalendarEventType;
  title: string;
  date: string;
  description?: string;
  amount?: number;
  currency?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'predicta_calendar';

// Load calendar events from localStorage
export function loadCalendarEvents(): CalendarEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save calendar events to localStorage
export function saveCalendarEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save calendar events:', error);
  }
}

// Create a new calendar event
export function createCalendarEvent(
  symbol: string,
  type: CalendarEventType,
  title: string,
  date: string,
  description?: string,
  amount?: number,
  currency?: string
): CalendarEvent {
  return {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    type,
    title,
    date,
    description,
    amount,
    currency,
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  };
}

// Delete a calendar event
export function deleteCalendarEvent(events: CalendarEvent[], eventId: string): CalendarEvent[] {
  return events.filter(event => event.id !== eventId);
}

// Update event status
export function updateEventStatus(events: CalendarEvent[], eventId: string, status: CalendarEvent['status']): CalendarEvent[] {
  return events.map(event => {
    if (event.id === eventId) {
      return { ...event, status };
    }
    return event;
  });
}

// Get upcoming events (next 30 days)
export function getUpcomingEvents(events: CalendarEvent[], days: number = 30): CalendarEvent[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= futureDate && event.status === 'upcoming';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get events by symbol
export function getEventsBySymbol(events: CalendarEvent[], symbol: string): CalendarEvent[] {
  return events
    .filter(event => event.symbol === symbol)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get events by type
export function getEventsByType(events: CalendarEvent[], type: CalendarEventType): CalendarEvent[] {
  return events
    .filter(event => event.type === type)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get dividend events
export function getDividendEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => 
    event.type === 'dividend_declaration' || 
    event.type === 'dividend_qualification' || 
    event.type === 'dividend_payment'
  );
}

// Format event type for display
export function formatEventType(type: CalendarEventType): string {
  const labels: Record<CalendarEventType, string> = {
    'dividend_declaration': 'Dividend Declaration',
    'dividend_qualification': 'Dividend Qualification',
    'dividend_payment': 'Dividend Payment',
    'agm': 'Annual General Meeting',
    'earnings': 'Earnings Release',
    'corporate_action': 'Corporate Action',
  };
  return labels[type] || type;
}

// Get event type icon color
export function getEventTypeColor(type: CalendarEventType): string {
  const colors: Record<CalendarEventType, string> = {
    'dividend_declaration': 'text-[var(--color-positive)]',
    'dividend_qualification': 'text-[var(--color-accent-blue)]',
    'dividend_payment': 'text-[var(--color-positive)]',
    'agm': 'text-[var(--color-forecast)]',
    'earnings': 'text-[var(--color-warning)]',
    'corporate_action': 'text-[var(--color-text-muted)]',
  };
  return colors[type] || 'text-[var(--color-text-muted)]';
}

// Check if event is in the past
export function isEventPast(event: CalendarEvent): boolean {
  return new Date(event.date) < new Date();
}

// Get days until event
export function getDaysUntilEvent(event: CalendarEvent): number {
  const now = new Date();
  const eventDate = new Date(event.date);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
