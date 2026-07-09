import { useState, useEffect } from 'react';
import { api, Booking, Resource } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPages.css';

type ViewMode = 'list' | 'calendar';

function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'noshow' | 'cancel' | null>(null);

  // Edit notes
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Advanced search filters
  const [showSearch, setShowSearch] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchStatuses, setSearchStatuses] = useState<string[]>([]);
  const [searchResourceIds, setSearchResourceIds] = useState<string[]>([]);

  useEffect(() => { loadResources(); }, []);
  useEffect(() => { if (filter !== 'search') loadBookings(); }, [filter]);

  async function loadResources() {
    try {
      const result = await api.getResources({ is_active: true });
      setResources(result.data);
    } catch { /* ignore */ }
  }

  async function loadBookings() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

      let params: { status?: string; from?: string; to?: string } = {};
      if (filter === 'today') params = { from: today, to: tomorrow };
      else if (filter === 'tomorrow') params = { from: tomorrow, to: dayAfterTomorrow };
      else if (filter && filter !== 'search') params = { status: filter };

      const result = await api.getBookings(params);
      setBookings(result.data);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  async function handleSearch() {
    if (!searchFrom && !searchTo && searchStatuses.length === 0 && searchResourceIds.length === 0) return;
    setFilter('search');
    setLoading(true);
    try {
      const params: { from?: string; to?: string; status?: string } = {};
      if (searchFrom) params.from = searchFrom;
      if (searchTo) {
        const toDate = new Date(searchTo);
        toDate.setDate(toDate.getDate() + 1);
        params.to = toDate.toISOString().split('T')[0];
      }
      // If only one status selected, use the API filter
      if (searchStatuses.length === 1) params.status = searchStatuses[0];

      const result = await api.getBookings(params);
      let filtered = result.data;

      // Client-side filter by multiple statuses
      if (searchStatuses.length > 1) {
        filtered = filtered.filter(b => searchStatuses.includes(b.status));
      }

      // Client-side filter by resource(s)
      if (searchResourceIds.length > 0) {
        filtered = filtered.filter(b => {
          const resId = typeof b.resource === 'object' && b.resource ? b.resource.id : b.resource_id;
          return resId ? searchResourceIds.includes(resId) : false;
        });
      }

      setBookings(filtered);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  function clearSearch() {
    setSearchFrom(''); setSearchTo(''); setSearchStatuses([]); setSearchResourceIds([]);
    setFilter('today');
    setShowSearch(false);
  }

  function toggleSearchStatus(status: string) {
    setSearchStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  }

  function toggleSearchResource(id: string) {
    setSearchResourceIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }

  async function handleSaveNotes() {
    if (!editNotesId) return;
    setNotesSaving(true);
    try {
      await api.rescheduleBooking(editNotesId, ''); // This won't work for notes only
      // Use direct fetch for notes update
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/bookings/${editNotesId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ notes: editNotesText }),
        }
      );
      setEditNotesId(null);
      await loadBookings();
    } catch { /* ignore */ }
    finally { setNotesSaving(false); }
  }

  // Sort: confirmed first, then by time
  function getSortedBookings(): Booking[] {
    return [...bookings].sort((a, b) => {
      const statusOrder: Record<string, number> = { confirmed: 0, pending: 1, completed: 2, cancelled: 3, no_show: 4 };
      const aOrder = statusOrder[a.status] ?? 5;
      const bOrder = statusOrder[b.status] ?? 5;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  }

  function formatDate(isoString: string): string {
    try { return new Date(isoString).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch { return isoString; }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return '';
    if (isoString.includes('T')) return isoString.split('T')[1]?.substring(0, 5) || '';
    return isoString.substring(0, 5);
  }

  function getCustomerName(booking: Booking): string {
    if (typeof booking.customer === 'object' && booking.customer) {
      return `${booking.customer.first_name} ${booking.customer.last_name}`.trim();
    }
    return 'Customer';
  }

  function getServiceName(booking: Booking): string {
    if (typeof booking.service === 'object' && booking.service) return booking.service.name;
    return 'Appointment';
  }

  function getStylistName(booking: Booking): string {
    if (typeof booking.resource === 'object' && booking.resource) return booking.resource.name;
    return '';
  }

  async function handleAction() {
    if (!actionId || !actionType) return;
    try {
      if (actionType === 'complete') await api.completeBooking(actionId);
      else if (actionType === 'noshow') await api.noShowBooking(actionId);
      else if (actionType === 'cancel') await api.cancelBooking(actionId, 'Cancelled by admin');
    } catch { /* ignore */ }
    setActionId(null); setActionType(null);
    await loadBookings();
  }

  async function handleReschedule() {
    if (!rescheduleId || !newDateTime) return;
    try {
      await api.rescheduleBooking(rescheduleId, newDateTime);
      setRescheduleId(null); setNewDateTime('');
      await loadBookings();
    } catch { /* ignore */ }
  }

  const showViewToggle = true;
  const sorted = getSortedBookings();

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Bookings</h1>
          <button className="btn btn-secondary" onClick={() => setShowSearch(!showSearch)} style={{ fontSize: '0.8125rem' }}>
            {showSearch ? 'Hide Search' : '🔍 Search'}
          </button>
        </div>

        {/* Advanced Search Panel */}
        {showSearch && (
          <div className="card search-panel">
            <div className="form-row">
              <div className="form-group">
                <label>From</label>
                <input type="date" className="form-input" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>To</label>
                <input type="date" className="form-input" value={searchTo} onChange={e => setSearchTo(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Stylist</label>
              <div className="chip-group">
                {resources.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`chip ${searchResourceIds.includes(r.id) ? 'chip-active' : ''}`}
                    onClick={() => toggleSearchResource(r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <div className="chip-group">
                {['confirmed', 'pending', 'completed', 'cancelled', 'no_show'].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${searchStatuses.includes(s) ? 'chip-active' : ''}`}
                    onClick={() => toggleSearchStatus(s)}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={clearSearch}>Clear</button>
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[
            { key: 'today', label: 'Today' },
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
            { key: '', label: 'All' },
            ...(filter === 'search' ? [{ key: 'search', label: '🔍 Results' }] : []),
          ].map(tab => (
            <button key={tab.key} className={`filter-tab ${filter === tab.key ? 'active' : ''}`} onClick={() => setFilter(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* View toggle for Today/Tomorrow */}
        {showViewToggle && (
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
            <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
          </div>
        )}

        {/* Reschedule modal */}
        {rescheduleId && (
          <div className="modal-backdrop" onClick={() => setRescheduleId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Reschedule</h3>
              <div className="form-group">
                <input type="datetime-local" className="form-input" value={newDateTime} onChange={e => setNewDateTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary modal-btn" onClick={() => setRescheduleId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleReschedule} disabled={!newDateTime}>Reschedule</button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-shimmer" style={{ height: 100 }} />
            <div className="loading-shimmer" style={{ height: 100 }} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state"><p>No bookings found.</p></div>
        ) : showViewToggle && viewMode === 'calendar' ? (
          /* Calendar View */
          <CalendarView bookings={sorted.filter(b => b.status === 'confirmed' || b.status === 'pending')} />
        ) : (
          /* List View */
          <div className="admin-bookings-list">
            {sorted.map(booking => (
              <div key={booking.id} className="admin-booking-card card">
                <div className="admin-booking-header">
                  <span className="admin-booking-service">{getCustomerName(booking)}</span>
                  <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                </div>
                <div className="admin-booking-details">
                  <span>✂️ {getServiceName(booking)}</span>
                  <span>📅 {formatDate(booking.start_time)} at {formatTime(booking.start_time_local || booking.start_time)}</span>
                </div>
                <div className="admin-booking-customer">
                  {getStylistName(booking) && <span>💇‍♀️ {getStylistName(booking)}</span>}
                  {typeof booking.customer === 'object' && booking.customer && (
                    <span className="customer-contact">{(booking.customer as any).phone || (booking.customer as any).email || ''}</span>
                  )}
                </div>
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <div className="admin-booking-actions">
                    <button className="btn-small btn-complete" onClick={() => { setActionId(booking.id); setActionType('complete'); }}>Complete</button>
                    <button className="btn-small btn-noshow" onClick={() => { setActionId(booking.id); setActionType('noshow'); }}>No Show</button>
                    <button className="btn-small btn-reschedule" onClick={() => setRescheduleId(booking.id)}>Reschedule</button>
                    <button className="btn-small btn-delete" onClick={() => { setActionId(booking.id); setActionType('cancel'); }}>Cancel</button>
                    <button className="btn-small" style={{ color: 'var(--color-grey-dark)', borderColor: 'var(--color-grey-light)' }} onClick={() => { setEditNotesId(booking.id); setEditNotesText(booking.notes || ''); }}>Notes</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Notes Modal */}
      {editNotesId && (
        <div className="modal-backdrop" onClick={() => setEditNotesId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Edit Notes</h3>
            <div className="form-group">
              <textarea className="form-input" value={editNotesText} onChange={e => setEditNotesText(e.target.value)} rows={4} placeholder="Booking notes..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary modal-btn" onClick={() => setEditNotesId(null)}>Cancel</button>
              <button className="btn btn-primary modal-btn" onClick={handleSaveNotes} disabled={notesSaving}>{notesSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={actionId !== null}
        title={actionType === 'complete' ? 'Complete Booking' : actionType === 'noshow' ? 'Mark No Show' : 'Cancel Booking'}
        message={actionType === 'cancel' ? 'Cancel this booking?' : `Mark as ${actionType}?`}
        confirmLabel={actionType === 'cancel' ? 'Cancel Booking' : 'Confirm'}
        cancelLabel="Go Back"
        onConfirm={handleAction}
        onCancel={() => { setActionId(null); setActionType(null); }}
      />
    </div>
  );
}

// ─── Calendar View Component ────────────────────────────────────────────────

interface CalendarViewProps {
  bookings: Booking[];
}

function CalendarView({ bookings }: CalendarViewProps) {
  const PX_PER_MINUTE = 1.2;
  const START_HOUR = 8;
  const END_HOUR = 19;
  const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE;

  function parseTime(isoString: string | undefined): { hour: number; min: number } {
    if (!isoString) return { hour: 9, min: 0 };
    let timeStr = isoString;
    if (isoString.includes('T')) timeStr = isoString.split('T')[1] || '09:00';
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: h || 9, min: m || 0 };
  }

  function getCustomerName(booking: Booking): string {
    if (typeof booking.customer === 'object' && booking.customer) return `${booking.customer.first_name} ${booking.customer.last_name}`.trim();
    return 'Customer';
  }

  function getServiceName(booking: Booking): string {
    if (typeof booking.service === 'object' && booking.service) return booking.service.name;
    return '';
  }

  function getStylistName(booking: Booking): string {
    if (typeof booking.resource === 'object' && booking.resource) return booking.resource.name;
    return '';
  }

  // Calculate overlapping columns
  interface SlotPosition {
    booking: Booking;
    top: number;
    height: number;
    column: number;
    totalColumns: number;
  }

  function calculatePositions(): SlotPosition[] {
    if (bookings.length === 0) return [];

    // Sort by start time
    const sorted = [...bookings].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Calculate raw positions
    const items = sorted.map(booking => {
      const start = parseTime(booking.start_time_local || booking.start_time);
      const end = parseTime(booking.end_time_local || booking.end_time);
      const topMinutes = (start.hour - START_HOUR) * 60 + start.min;
      const durationMinutes = ((end.hour - start.hour) * 60) + (end.min - start.min);
      return {
        booking,
        top: topMinutes * PX_PER_MINUTE,
        height: Math.max(durationMinutes * PX_PER_MINUTE, 45),
        startMin: topMinutes,
        endMin: topMinutes + durationMinutes,
        column: 0,
        totalColumns: 1,
      };
    });

    // Find overlapping groups and assign columns
    for (let i = 0; i < items.length; i++) {
      // Find all items that overlap with this one
      const overlapping = items.filter((other, j) =>
        j !== i && other.startMin < items[i].endMin && other.endMin > items[i].startMin
      );

      if (overlapping.length > 0) {
        // Collect this item + all overlapping into a group
        const group = [items[i], ...overlapping];
        const usedColumns = new Set(group.filter((_, idx) => idx < group.indexOf(items[i])).map(g => g.column));

        // Assign first available column
        let col = 0;
        while (usedColumns.has(col)) col++;
        items[i].column = col;

        // Set total columns for the group
        const totalCols = Math.max(...group.map(g => g.column)) + 1;
        group.forEach(g => { if (g.totalColumns < totalCols) g.totalColumns = totalCols; });
      }
    }

    // Second pass: ensure totalColumns is consistent within each overlap group
    for (let i = 0; i < items.length; i++) {
      const overlapping = items.filter((other, j) =>
        j !== i && other.startMin < items[i].endMin && other.endMin > items[i].startMin
      );
      const maxCols = Math.max(items[i].totalColumns, ...overlapping.map(o => o.totalColumns));
      items[i].totalColumns = maxCols;
      overlapping.forEach(o => { o.totalColumns = maxCols; });
    }

    return items;
  }

  const positions = calculatePositions();

  return (
    <div className="calendar-view" style={{ height: `${TOTAL_HEIGHT}px` }}>
      {/* Hour markers */}
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR).map(hour => (
        <div key={hour} className="calendar-hour" style={{ top: `${(hour - START_HOUR) * 60 * PX_PER_MINUTE}px` }}>
          <span className="calendar-hour-label">{String(hour).padStart(2, '0')}:00</span>
        </div>
      ))}

      {/* Booking slots */}
      {positions.map(({ booking, top, height, column, totalColumns }) => {
        const width = `calc((100% - 8px) / ${totalColumns})`;
        const left = `calc(${column} * (100% - 8px) / ${totalColumns} + 4px)`;

        return (
          <div
            key={booking.id}
            className="calendar-slot"
            style={{ top: `${top}px`, height: `${height}px`, width, left }}
          >
            <div className="calendar-slot-time">
              {parseTime(booking.start_time_local || booking.start_time).hour.toString().padStart(2, '0')}:{parseTime(booking.start_time_local || booking.start_time).min.toString().padStart(2, '0')}
            </div>
            <div className="calendar-slot-customer">{getCustomerName(booking)}</div>
            <div className="calendar-slot-service">{getServiceName(booking)}</div>
            {getStylistName(booking) && <div className="calendar-slot-stylist">💇‍♀️ {getStylistName(booking)}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default AdminBookingsPage;
