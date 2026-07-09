import { useState, useEffect } from 'react';
import { api, Booking } from '../../api/client';
import './AdminPages.css';

function AdminReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => { loadBookings(); }, [period]);

  async function loadBookings() {
    try {
      setLoading(true);
      const now = new Date();
      const from = new Date(now);
      if (period === 'week') from.setDate(now.getDate() - 7);
      else from.setDate(now.getDate() - 30);

      const result = await api.getBookings({ from: from.toISOString().split('T')[0] });
      setBookings(result.data);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  // Revenue (placeholder — would need price data on bookings)
  const completedBookings = bookings.filter(b => b.status === 'completed');

  // No-show stats
  const noShows = bookings.filter(b => b.status === 'no_show');
  const noShowCustomers = noShows.reduce((acc, b) => {
    const name = typeof b.customer === 'object' && b.customer ? `${b.customer.first_name} ${b.customer.last_name}` : 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const repeatNoShows = Object.entries(noShowCustomers).filter(([_, count]) => count > 1).sort((a, b) => b[1] - a[1]);

  // Busy hours
  const hourCounts: Record<number, number> = {};
  bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').forEach(b => {
    const time = b.start_time_local || b.start_time;
    let hour = 9;
    if (time.includes('T')) hour = parseInt(time.split('T')[1]?.split(':')[0] || '9');
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const maxHourCount = Math.max(...Object.values(hourCounts), 1);

  // Stats
  const totalBookings = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed2 = completedBookings.length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  // Export CSV
  function exportCSV() {
    const headers = ['Date', 'Time', 'Customer', 'Service', 'Stylist', 'Status'];
    const rows = bookings.map(b => {
      const date = new Date(b.start_time).toLocaleDateString('en-ZA');
      const time = (b.start_time_local || b.start_time).includes('T')
        ? (b.start_time_local || b.start_time).split('T')[1]?.substring(0, 5) || ''
        : '';
      const customer = typeof b.customer === 'object' && b.customer ? `${b.customer.first_name} ${b.customer.last_name}` : '';
      const service = typeof b.service === 'object' && b.service ? b.service.name : '';
      const stylist = typeof b.resource === 'object' && b.resource ? b.resource.name : '';
      return [date, time, customer, service, stylist, b.status];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>Reports</h1></div><div className="loading-shimmer" style={{ height: 300 }} /></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Reports</h1>
          <button className="btn btn-secondary" onClick={exportCSV} style={{ fontSize: '0.8125rem' }}>📥 Export CSV</button>
        </div>

        {/* Period toggle */}
        <div className="view-toggle" style={{ marginBottom: '1.5rem' }}>
          <button className={`view-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>This Week</button>
          <button className={`view-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>This Month</button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
          <div className="stat-card card"><div className="stat-value">{totalBookings}</div><div className="stat-label">Total</div></div>
          <div className="stat-card card"><div className="stat-value">{confirmed}</div><div className="stat-label">Confirmed</div></div>
          <div className="stat-card card"><div className="stat-value">{completed2}</div><div className="stat-label">Completed</div></div>
          <div className="stat-card card"><div className="stat-value">{cancelled}</div><div className="stat-label">Cancelled</div></div>
        </div>

        {/* Busy Hours */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>📊 Busy Hours</h3>
          <div className="busy-hours">
            {Array.from({ length: 10 }, (_, i) => i + 9).map(hour => {
              const count = hourCounts[hour] || 0;
              const width = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0;
              return (
                <div key={hour} className="busy-hour-row">
                  <span className="busy-hour-label">{String(hour).padStart(2, '0')}:00</span>
                  <div className="busy-hour-bar-bg">
                    <div className="busy-hour-bar" style={{ width: `${width}%` }} />
                  </div>
                  <span className="busy-hour-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* No-Show Tracking */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>⚠️ No-Show Repeat Offenders</h3>
          {repeatNoShows.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-grey)' }}>No repeat no-shows this {period}.</p>
          ) : (
            <div className="staff-list">
              {repeatNoShows.map(([name, count]) => (
                <div key={name} className="staff-card card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="staff-info"><div className="staff-name">{name}</div></div>
                  <div className="staff-meta"><span className="badge badge-cancelled">{count} no-shows</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReportsPage;
