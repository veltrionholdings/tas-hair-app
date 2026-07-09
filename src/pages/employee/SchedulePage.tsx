import { useState, useEffect } from 'react';
import { api, Resource } from '../../api/client';
import { getMyResource } from '../../utils/getMyResource';
import '../admin/AdminPages.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SchedulePage() {
  const [myResource, setMyResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Array<{ day: number; start: string; end: string }>>([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { findMyResource(); }, []);

  async function findMyResource() {
    try {
      const matched = await getMyResource();
      setMyResource(matched);
      if (matched) {
        const schedResult = await api.getResourceSchedule(matched.id);
        setSchedule(schedResult.data.map(s => ({ day: s.day_of_week, start: s.start_time, end: s.end_time })));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleBlockDate(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate || !myResource) return;
    setBlocking(true); setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${myResource.id}/overrides`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ override_date: blockDate, is_available: false, reason: blockReason || 'Day off' }),
        }
      );
      if (response.ok) {
        setMessage(`${blockDate} blocked — you won't receive bookings on this day.`);
        setBlockDate(''); setBlockReason('');
      } else {
        const err = await response.json();
        setMessage(`Error: ${err.error?.message || 'Failed to block date'}`);
      }
    } catch { setMessage('Error: Failed to connect.'); }
    finally { setBlocking(false); }
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>My Schedule</h1></div><div className="loading-shimmer" style={{ height: 200 }} /></div></div>;
  }

  if (!myResource) {
    return (
      <div className="page admin-page">
        <div className="container">
          <div className="page-header"><h1>My Schedule</h1></div>
          <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-grey-dark)' }}>Your account isn't linked to a stylist profile. Ask your admin to mark you as bookable.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>My Schedule</h1></div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        {/* Regular hours */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>My Regular Hours</h3>
          {schedule.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey)' }}>No schedule set. Ask your admin to configure your hours.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {DAYS.map((day, i) => {
                const entry = schedule.find(s => s.day === i);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-off-white)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-grey-dark)' }}>{day}</span>
                    <span style={{ fontWeight: entry ? 600 : 400, color: entry ? 'var(--color-black)' : 'var(--color-grey)' }}>
                      {entry ? `${entry.start} – ${entry.end}` : 'Off'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-grey)', marginTop: '0.75rem' }}>
            Contact admin to change your regular hours.
          </p>
        </div>

        {/* Block a date */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>Block a Date</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)', marginBottom: '1rem' }}>Mark a day as unavailable. No one will be able to book you.</p>
          <form onSubmit={handleBlockDate}>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-input" value={blockDate} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} onChange={e => setBlockDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input type="text" className="form-input" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Day off" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={blocking || !blockDate}>
              {blocking ? 'Blocking...' : 'Block Date'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage;
