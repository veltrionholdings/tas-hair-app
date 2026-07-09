import { useState, useEffect } from 'react';
import { api, Booking, Resource } from '../../api/client';
import { getMyResource } from '../../utils/getMyResource';
import '../admin/AdminPages.css';

type ViewMode = 'list' | 'calendar';

function EmployeeBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [myResource, setMyResource] = useState<Resource | null>(null);
  const [isStylist, setIsStylist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchStatuses, setSearchStatuses] = useState<string[]>([]);
  const [searchResourceIds, setSearchResourceIds] = useState<string[]>([]);

  // Notes
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (filter !== 'search') loadBookings(); }, [filter, myResource]);

  async function init() {
    const [matched, resResult] = await Promise.all([getMyResource(), api.getResources({ is_active: true })]);
    setMyResource(matched);
    setIsStylist(!!matched);
    setAllResources(resResult.data);
  }

  async function loadBookings() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

      let params: { from?: string; to?: string; status?: string } = {};
      if (filter === 'today') params = { from: today, to: tomorrow };
      else if (filter === 'tomorrow') params = { from: tomorrow, to: dayAfterTomorrow };
      else if (filter && filter !== 'search') params = { status: filter };

      const result = await api.getBookings(params);
      setBookings(scopeBookings(result.data));
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  function scopeBookings(data: Booking[]): Booking[] {
    if (!isStylist) return data; // Receptionist sees all
    if (!myResource) return [];
    return data.filter(b => {
      if (typeof b.resource === 'object' && b.resource) return b.resource.id === myResource.id;
      return b.resource_id === myResource.id;
    });
  }

  async function handleSearch() {
    if (!searchFrom && !searchTo && searchStatuses.length === 0 && searchResourceIds.length === 0) return;
    setFilter('search'); setLoading(true);
    try {
      const params: { from?: string; to?: string; status?: string } = {};
      if (searchFrom) params.from = searchFrom;
      if (searchTo) { const d = new Date(searchTo); d.setDate(d.getDate() + 1); params.to = d.toISOString().split('T')[0]; }
      if (searchStatuses.length === 1) params.status = searchStatuses[0];

      const result = await api.getBookings(params);
      let filtered = scopeBookings(result.data);
      if (searchStatuses.length > 1) filtered = filtered.filter(b => searchStatuses.includes(b.status));
      if (searchResourceIds.length > 0) filtered = filtered.filter(b => {
        const resId = typeof b.resource === 'object' && b.resource ? b.resource.id : b.resource_id;
        return resId ? searchResourceIds.includes(resId) : false;
      });
      setBookings(filtered);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  function clearSearch() { setSearchFrom(''); setSearchTo(''); setSearchStatuses([]); setSearchResourceIds([]); setFilter('today'); setShowSearch(false); }
  function toggleStatus(s: string) { setSearchStatuses(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); }
  function toggleResource(id: string) { setSearchResourceIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }

  async function handleComplete(id: string) { try { await api.completeBooking(id); await loadBookings(); } catch {} }
  async function handleNoShow(id: string) { try { await api.noShowBooking(id); await loadBookings(); } catch {} }

  async function handleSaveNotes() {
    if (!editNotesId) return; setNotesSaving(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/bookings/${editNotesId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ notes: editNotesText }),
      });
      setEditNotesId(null); await loadBookings();
    } catch {} finally { setNotesSaving(false); }
  }

  function getSorted(): Booking[] {
    return [...bookings].sort((a, b) => {
      const order: Record<string, number> = { confirmed: 0, pending: 1, completed: 2, cancelled: 3, no_show: 4 };
      const diff = (order[a.status] ?? 5) - (order[b.status] ?? 5);
      return diff !== 0 ? diff : new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  }

  function formatTime(s: string | undefined): string { if (!s) return ''; return s.includes('T') ? s.split('T')[1]?.substring(0, 5) || '' : s.substring(0, 5); }
  function formatDate(s: string): string { try { return new Date(s).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } }
  function getCustomerName(b: Booking): string { return typeof b.customer === 'object' && b.customer ? `${b.customer.first_name} ${b.customer.last_name}`.trim() : 'Customer'; }
  function getServiceName(b: Booking): string { return typeof b.service === 'object' && b.service ? b.service.name : 'Appointment'; }
  function getStylistName(b: Booking): string { return typeof b.resource === 'object' && b.resource ? b.resource.name : ''; }

  const sorted = getSorted();

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>{isStylist ? 'My Bookings' : 'All Bookings'}</h1>
          <button className="btn btn-secondary" onClick={() => setShowSearch(!showSearch)} style={{ fontSize: '0.8125rem' }}>
            {showSearch ? 'Hide' : '🔍 Search'}
          </button>
        </div>

        {/* Search Panel */}
        {showSearch && (
          <div className="card search-panel">
            <div className="form-row">
              <div className="form-group"><label>From</label><input type="date" className="form-input" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} /></div>
              <div className="form-group"><label>To</label><input type="date" className="form-input" value={searchTo} onChange={e => setSearchTo(e.target.value)} /></div>
            </div>
            {!isStylist && (
              <div className="form-group">
                <label>Stylist</label>
                <div className="chip-group">
                  {allResources.map(r => <button key={r.id} type="button" className={`chip ${searchResourceIds.includes(r.id) ? 'chip-active' : ''}`} onClick={() => toggleResource(r.id)}>{r.name}</button>)}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Status</label>
              <div className="chip-group">
                {['confirmed', 'pending', 'completed', 'cancelled', 'no_show'].map(s => <button key={s} type="button" className={`chip ${searchStatuses.includes(s) ? 'chip-active' : ''}`} onClick={() => toggleStatus(s)}>{s.replace('_', ' ')}</button>)}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={clearSearch}>Clear</button>
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="filter-tabs">
          {[
            { key: 'today', label: 'Today' }, { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'confirmed', label: 'Confirmed' }, { key: 'completed', label: 'Completed' },
            { key: '', label: 'All' },
            ...(filter === 'search' ? [{ key: 'search', label: '🔍 Results' }] : []),
          ].map(t => <button key={t.key} className={`filter-tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>{t.label}</button>)}
        </div>

        {/* View toggle */}
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
          <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
        </div>

        {/* Edit Notes Modal */}
        {editNotesId && (
          <div className="modal-backdrop" onClick={() => setEditNotesId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Booking Notes</h3>
              <div className="form-group"><textarea className="form-input" value={editNotesText} onChange={e => setEditNotesText(e.target.value)} rows={4} placeholder="Notes..." /></div>
              <div className="modal-actions">
                <button className="btn btn-secondary modal-btn" onClick={() => setEditNotesId(null)}>Cancel</button>
                <button className="btn btn-primary modal-btn" onClick={handleSaveNotes} disabled={notesSaving}>{notesSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loading-state"><div className="loading-shimmer" style={{ height: 80 }} /><div className="loading-shimmer" style={{ height: 80 }} /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state"><p>No bookings found.</p></div>
        ) : viewMode === 'calendar' ? (
          <div className="calendar-view" style={{ height: '792px' }}>
            {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
              <div key={hour} className="calendar-hour" style={{ top: `${(hour - 8) * 72}px` }}><span className="calendar-hour-label">{String(hour).padStart(2, '0')}:00</span></div>
            ))}
            {sorted.filter(b => b.status === 'confirmed' || b.status === 'pending').map(b => {
              const t = formatTime(b.start_time_local || b.start_time);
              const h = parseInt(t.split(':')[0]) || 9, m = parseInt(t.split(':')[1]) || 0;
              const top = ((h - 8) * 60 + m) * 1.2;
              const te = formatTime(b.end_time_local || b.end_time);
              const eh = parseInt(te.split(':')[0]) || h, em = parseInt(te.split(':')[1]) || m;
              const height = Math.max(((eh - h) * 60 + (em - m)) * 1.2, 45);
              return (
                <div key={b.id} className="calendar-slot" style={{ top: `${top}px`, height: `${height}px` }}>
                  <div className="calendar-slot-time">{t} – {te}</div>
                  <div className="calendar-slot-customer">{getCustomerName(b)}</div>
                  <div className="calendar-slot-service">{getServiceName(b)}</div>
                  {getStylistName(b) && <div className="calendar-slot-stylist">💇‍♀️ {getStylistName(b)}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-bookings-list">
            {sorted.map(b => (
              <div key={b.id} className="admin-booking-card card">
                <div className="admin-booking-header">
                  <span className="admin-booking-service">{getCustomerName(b)}</span>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>
                <div className="admin-booking-details">
                  <span>✂️ {getServiceName(b)}</span>
                  <span>📅 {formatDate(b.start_time)} at {formatTime(b.start_time_local || b.start_time)}</span>
                  {getStylistName(b) && <span>💇‍♀️ {getStylistName(b)}</span>}
                </div>
                {b.notes && <p style={{ fontSize: '0.75rem', color: 'var(--color-grey-dark)', marginTop: '0.25rem', fontStyle: 'italic' }}>📝 {b.notes}</p>}
                {(b.status === 'confirmed' || b.status === 'pending') && (
                  <div className="admin-booking-actions">
                    <button className="btn-small btn-complete" onClick={() => handleComplete(b.id)}>Complete</button>
                    <button className="btn-small btn-noshow" onClick={() => handleNoShow(b.id)}>No Show</button>
                    <button className="btn-small" style={{ color: 'var(--color-grey-dark)', borderColor: 'var(--color-grey-light)' }} onClick={() => { setEditNotesId(b.id); setEditNotesText(b.notes || ''); }}>Notes</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeBookingsPage;
