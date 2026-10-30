// ============================================================
// Investment Calendar Page
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import {
  CalendarEvent,
  CalendarEventType,
  loadCalendarEvents,
  saveCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  updateEventStatus,
  getUpcomingEvents,
  getEventsBySymbol,
  formatEventType,
  getEventTypeColor,
  getDaysUntilEvent,
  isEventPast,
} from '../../engine/calendar';
import { Button, EmptyState, MetricCard } from '../common';
import { formatDate } from '../../utils/formatters';
import {
  Calendar, Plus, Trash2, Filter, Clock, CheckCircle, XCircle,
  DollarSign, TrendingUp, FileText, AlertTriangle
} from 'lucide-react';

interface InvestmentCalendarProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function InvestmentCalendar({ onNavigate, onSelectStock }: InvestmentCalendarProps) {
  const { state } = useAppState();
  const datasets = useAllDatasets();
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'upcoming' | 'all' | 'by_symbol'>('upcoming');

  // Save events whenever they change
  useEffect(() => {
    saveCalendarEvents(events);
  }, [events]);

  // Summary stats
  const stats = useMemo(() => {
    const upcoming = getUpcomingEvents(events, 30);
    const dividends = events.filter(e =>
      e.type === 'dividend_declaration' ||
      e.type === 'dividend_qualification' ||
      e.type === 'dividend_payment'
    );
    const agms = events.filter(e => e.type === 'agm');
    const earnings = events.filter(e => e.type === 'earnings');

    return {
      total: events.length,
      upcoming: upcoming.length,
      dividends: dividends.length,
      agms: agms.length,
      earnings: earnings.length,
    };
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (viewMode === 'upcoming') {
      filtered = getUpcomingEvents(filtered, 365); // Next year
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, viewMode, filterType, filterStatus]);

  // Handle create event
  const handleCreateEvent = (
    symbol: string,
    type: CalendarEventType,
    title: string,
    date: string,
    description?: string,
    amount?: number,
    currency?: string
  ) => {
    const newEvent = createCalendarEvent(symbol, type, title, date, description, amount, currency);
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(deleteCalendarEvent(events, eventId));
    }
  };

  // Handle mark complete
  const handleMarkComplete = (eventId: string) => {
    setEvents(updateEventStatus(events, eventId, 'completed'));
  };

  // Get event type icon
  const getEventIcon = (type: CalendarEventType) => {
    switch (type) {
      case 'dividend_declaration':
      case 'dividend_qualification':
      case 'dividend_payment':
        return <DollarSign size={16} />;
      case 'agm':
        return <FileText size={16} />;
      case 'earnings':
        return <TrendingUp size={16} />;
      case 'corporate_action':
        return <AlertTriangle size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Investment Calendar</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Track dividends, AGMs, earnings releases, and corporate actions
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Add Event
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Events"
          value={stats.total.toString()}
          icon={<Calendar size={18} className="text-[var(--color-accent-blue)]" />}
        />
        <MetricCard
          label="Next 30 Days"
          value={stats.upcoming.toString()}
          icon={<Clock size={18} className="text-[var(--color-warning)]" />}
          variant="warning"
        />
        <MetricCard
          label="Dividends"
          value={stats.dividends.toString()}
          icon={<DollarSign size={18} className="text-[var(--color-positive)]" />}
          variant="positive"
        />
        <MetricCard
          label="AGMs"
          value={stats.agms.toString()}
          icon={<FileText size={18} className="text-[var(--color-forecast)]" />}
        />
        <MetricCard
          label="Earnings"
          value={stats.earnings.toString()}
          icon={<TrendingUp size={18} className="text-[var(--color-accent-blue)]" />}
        />
      </div>

      {/* View Mode & Filters */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="upcoming">Upcoming (Next 365 Days)</option>
              <option value="all">All Events</option>
              <option value="by_symbol">By Symbol</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Event Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Types</option>
              <option value="dividend_declaration">Dividend Declaration</option>
              <option value="dividend_qualification">Dividend Qualification</option>
              <option value="dividend_payment">Dividend Payment</option>
              <option value="agm">Annual General Meeting</option>
              <option value="earnings">Earnings Release</option>
              <option value="corporate_action">Corporate Action</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} />}
          title={events.length === 0 ? "No Calendar Events" : "No Events Match Filters"}
          description={
            events.length === 0
              ? "Add your first event to start tracking dividends, AGMs, and earnings."
              : "Try changing the filters to see more events."
          }
          action={
            events.length === 0 ? (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Add First Event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
          <div className="divide-y divide-[var(--color-border-primary)]">
            {filteredEvents.map(event => {
              const daysUntil = getDaysUntilEvent(event);
              const isPast = isEventPast(event);

              return (
                <div
                  key={event.id}
                  className={`p-4 hover:bg-[var(--color-bg-hover)] transition-colors ${
                    event.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-sm font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent-blue)]"
                          onClick={() => onSelectStock(event.symbol)}
                        >
                          {event.symbol}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          event.status === 'completed'
                            ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]'
                            : event.status === 'cancelled'
                            ? 'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
                            : 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${getEventTypeColor(event.type)} bg-[var(--color-bg-tertiary)]`}>
                          {formatEventType(event.type)}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                        {event.title}
                      </h4>

                      {event.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                          {event.description}
                        </p>
                      )}

                      {event.amount && event.currency && (
                        <div className="text-xs text-[var(--color-positive)] font-semibold mb-1">
                          {event.currency} {event.amount.toLocaleString()}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(event.date)}
                        </span>
                        {!isPast && daysUntil >= 0 && (
                          <span className={daysUntil <= 7 ? 'text-[var(--color-warning)]' : ''}>
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.status === 'upcoming' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkComplete(event.id)}
                          title="Mark as completed"
                        >
                          <CheckCircle size={14} className="text-[var(--color-positive)]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Delete event"
                      >
                        <Trash2 size={14} className="text-[var(--color-negative)]" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          datasets={datasets}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {/* Disclaimer */}
      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">Note:</strong> Calendar events are stored locally in your browser.
          For automatic event updates, you would need to integrate with a corporate actions data provider.
          Dividend amounts and dates should be verified against official company announcements.
        </p>
      </div>
    </div>
  );
}

// Create Event Modal Component
function CreateEventModal({
  datasets,
  onClose,
  onCreate,
}: {
  datasets: any[];
  onClose: () => void;
  onCreate: (
    symbol: string,
    type: CalendarEventType,
    title: string,
    date: string,
    description?: string,
    amount?: number,
    currency?: string
  ) => void;
}) {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<CalendarEventType>('dividend_declaration');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const handleSubmit = () => {
    if (!symbol) {
      alert('Please select a stock');
      return;
    }
    if (!title) {
      alert('Please enter a title');
      return;
    }
    if (!date) {
      alert('Please select a date');
      return;
    }

    onCreate(
      symbol,
      type,
      title,
      date,
      description || undefined,
      amount ? Number(amount) : undefined,
      currency || undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Add Calendar Event</h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Stock</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>
                  {ds.info.symbol} — {ds.info.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Event Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEventType)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="dividend_declaration">Dividend Declaration</option>
              <option value="dividend_qualification">Dividend Qualification Date</option>
              <option value="dividend_payment">Dividend Payment</option>
              <option value="agm">Annual General Meeting</option>
              <option value="earnings">Earnings Release</option>
              <option value="corporate_action">Corporate Action</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 2024 Interim Dividend"
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            />
          </div>

          {(type === 'dividend_declaration' || type === 'dividend_payment') && (
            <>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Amount (Optional)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 0.50"
                  step="0.01"
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                >
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add Event</Button>
        </div>
      </div>
    </div>
  );
}
