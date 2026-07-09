import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Booking } from '../../api/client';
import './AdminPages.css';

function AdminDashboardPage() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      // Get today's bookings
      const todayResult = await api.getBookings({ from: today, status: 'confirmed' });
      setTodayBookings(todayResult.data);

      // Get this week's total
      const weekResult = await api.getBookings({ from: weekAgo });
      setWeekCount(weekResult.data.length);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return '';
    if (isoString.includes('T')) return isoString.split('T')[1]?.substring(0, 5) || '';
    return isoString.substring(0, 5);
  }

  if (loading) {
    return (
      <div className="page admin-page">
        <div className="container">
          <div className="page-header"><h1>Dashboard</h1></div>
          <div className="loading-shimmer" style={{ height: 80, borderRadius: 12, marginBottom: '1rem' }} />
          <div className="loading-shimmer" style={{ height: 200, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>Dashboard</h1></div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card card">
            <div className="stat-value">{todayBookings.length}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{weekCount}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>

        {/* Today's appointments */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Today's Appointments
          </h3>
          {todayBookings.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>No appointments today.</p>
          ) : (
            <div className="today-list">
              {todayBookings.map(b => (
                <div key={b.id} className="today-item">
                  <span className="today-time">{formatTime(b.start_time_local || b.start_time)}</span>
                  <span className="today-detail">
                    {typeof b.service === 'object' ? b.service.name : 'Appointment'}
                    {typeof b.customer === 'object' && b.customer && ` — ${b.customer.first_name} ${b.customer.last_name}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="dashboard-links" style={{ marginTop: '1.5rem' }}>
          <Link to="/admin/bookings" className="btn btn-secondary btn-full" style={{ marginBottom: '0.5rem' }}>View All Bookings</Link>
          <Link to="/admin/users" className="btn btn-secondary btn-full" style={{ marginBottom: '0.5rem' }}>Manage Users</Link>
          <Link to="/admin/services" className="btn btn-secondary btn-full" style={{ marginBottom: '0.5rem' }}>Manage Services</Link>
          <Link to="/admin/resources" className="btn btn-secondary btn-full" style={{ marginBottom: '0.5rem' }}>Manage Stylists</Link>
          <Link to="/admin/settings" className="btn btn-secondary btn-full">Settings</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
