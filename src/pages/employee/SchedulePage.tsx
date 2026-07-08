import { useState } from 'react';
import '../admin/AdminPages.css';

function SchedulePage() {
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // For now, the employee needs to know their resource ID.
  // In a full implementation, the backend would look this up from the auth token.
  // For the demo, we'll use Tas's resource ID.
  const RESOURCE_ID = '8873b698-d871-4db9-a78f-ea521bdc0bcc';

  async function handleBlockDate(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate) return;

    setLoading(true);
    setMessage('');
    try {
      // This calls the override endpoint to mark the date as unavailable
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/resources/${RESOURCE_ID}/overrides`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            override_date: blockDate,
            is_available: false,
            reason: blockReason || 'Personal day off',
          }),
        }
      );

      if (response.ok) {
        setMessage(`Date ${blockDate} has been blocked.`);
        setBlockDate('');
        setBlockReason('');
      } else {
        const err = await response.json();
        setMessage(`Error: ${err.error?.message || 'Failed to block date'}`);
      }
    } catch {
      setMessage('Error: Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  function getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>My Schedule</h1>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            Block a Date
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)', marginBottom: 'var(--space-md)' }}>
            Mark a day as unavailable. Customers will not be able to book you on this date.
          </p>

          {message && (
            <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: 'var(--space-md)' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleBlockDate}>
            <div className="form-group">
              <label htmlFor="block-date">Date</label>
              <input
                id="block-date"
                type="date"
                className="form-input"
                value={blockDate}
                min={getMinDate()}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="block-reason">Reason (optional)</label>
              <input
                id="block-reason"
                type="text"
                className="form-input"
                placeholder="e.g. Personal day, Training, Holiday"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !blockDate}>
              {loading ? 'Blocking...' : 'Block Date'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Regular Hours
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey-dark)' }}>
            Monday – Sunday: 09:00 – 18:00
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-grey)', marginTop: 'var(--space-sm)' }}>
            Contact admin to change your regular schedule.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage;
