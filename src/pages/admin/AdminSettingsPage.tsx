import { useState, useEffect } from 'react';
import '../admin/AdminPages.css';

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [slotInterval, setSlotInterval] = useState('15');
  const [minAdvance, setMinAdvance] = useState('60');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('90');
  const [cancellationWindow, setCancellationWindow] = useState('1440');
  const [allowCustomerCancellation, setAllowCustomerCancellation] = useState(true);
  const [defaultStatus, setDefaultStatus] = useState('confirmed');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/tenant`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok) {
        const tenant = await response.json();
        const s = tenant.settings;
        if (s?.availability?.slot_interval_minutes) setSlotInterval(String(s.availability.slot_interval_minutes));
        if (s?.booking?.min_advance_minutes !== undefined) setMinAdvance(String(s.booking.min_advance_minutes));
        if (s?.booking?.max_advance_days) setMaxAdvanceDays(String(s.booking.max_advance_days));
        if (s?.booking?.cancellation_window_minutes !== undefined) setCancellationWindow(String(s.booking.cancellation_window_minutes));
        if (s?.booking?.allow_customer_cancellation !== undefined) setAllowCustomerCancellation(s.booking.allow_customer_cancellation);
        if (s?.booking?.default_status) setDefaultStatus(s.booking.default_status);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/tenant`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({
            settings: {
              availability: { slot_interval_minutes: parseInt(slotInterval) },
              booking: {
                min_advance_minutes: parseInt(minAdvance),
                max_advance_days: parseInt(maxAdvanceDays),
                cancellation_window_minutes: parseInt(cancellationWindow),
                allow_customer_cancellation: allowCustomerCancellation,
                default_status: defaultStatus,
              },
            },
          }),
        }
      );
      if (response.ok) setMessage('Settings saved.');
      else setMessage('Error: Failed to save settings.');
    } catch { setMessage('Error: Failed to save settings.'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="page admin-page">
        <div className="container">
          <div className="page-header"><h1>Settings</h1></div>
          <div className="loading-shimmer" style={{ height: 300, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>Settings</h1></div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Booking Rules</h3>
            <div className="form-group">
              <label>Default booking status</label>
              <select className="form-input" value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)}>
                <option value="confirmed">Confirmed (auto-approve)</option>
                <option value="pending">Pending (requires approval)</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min advance (minutes)</label>
                <input type="number" className="form-input" value={minAdvance} onChange={e => setMinAdvance(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>Max advance (days)</label>
                <input type="number" className="form-input" value={maxAdvanceDays} onChange={e => setMaxAdvanceDays(e.target.value)} min="1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cancellation window (min)</label>
                <input type="number" className="form-input" value={cancellationWindow} onChange={e => setCancellationWindow(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>Slot interval (minutes)</label>
                <input type="number" className="form-input" value={slotInterval} onChange={e => setSlotInterval(e.target.value)} min="5" />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={allowCustomerCancellation} onChange={e => setAllowCustomerCancellation(e.target.checked)} style={{ width: 18, height: 18 }} />
                Allow customers to cancel their own bookings
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
