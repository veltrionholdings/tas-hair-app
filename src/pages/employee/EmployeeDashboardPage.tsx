import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Booking } from '../../api/client';
import { getMyResource } from '../../utils/getMyResource';
import '../admin/AdminPages.css';

function EmployeeDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isStylist, setIsStylist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const matched = await getMyResource();
      setIsStylist(!!matched);

      // Get all confirmed bookings so we can show today + upcoming
      const result = await api.getBookings({ status: 'confirmed' });

      if (matched) {
        // Stylist: show only my bookings
        const mine = result.data.filter(b => {
          if (typeof b.resource === 'object' && b.resource) return b.resource.id === matched.id;
          return b.resource_id === matched.id;
        });
        setBookings(mine);
      } else {
        // Receptionist: show all bookings
        setBookings(result.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return '';
    if (isoString.includes('T')) return isoString.split('T')[1]?.substring(0, 5) || '';
    return isoString.substring(0, 5);
  }

  function getCustomerName(booking: Booking): string {
    if (typeof booking.customer === 'object' && booking.customer) return `${booking.customer.first_name} ${booking.customer.last_name}`.trim();
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

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>My Day</h1></div><div className="loading-shimmer" style={{ height: 200 }} /></div></div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.start_time.startsWith(today));
  const upcomingBookings = bookings.filter(b => !b.start_time.startsWith(today) && new Date(b.start_time) > new Date());
  const confirmed = [...todayBookings, ...upcomingBookings];

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>{isStylist ? 'My Day' : "Today's Schedule"}</h1></div>

        {/* Stats */}
        <div className="dashboard-stats" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card card">
            <div className="stat-value">{todayBookings.length}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{upcomingBookings.length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>

        {/* Today's appointments */}
        {todayBookings.length > 0 && (
          <>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-grey)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today</h3>
            <div className="admin-bookings-list" style={{ marginBottom: '1.5rem' }}>
              {todayBookings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(booking => (
                <div key={booking.id} className="admin-booking-card card">
                  <div className="admin-booking-header">
                    <span className="admin-booking-service">{getCustomerName(booking)}</span>
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  </div>
                  <div className="admin-booking-details">
                    <span>✂️ {getServiceName(booking)}</span>
                    <span>🕐 {formatTime(booking.start_time_local || booking.start_time)}</span>
                    {!isStylist && getStylistName(booking) && <span>💇‍♀️ {getStylistName(booking)}</span>}
                  </div>
                  {booking.notes && <p style={{ fontSize: '0.75rem', color: 'var(--color-grey-dark)', marginTop: '0.25rem', fontStyle: 'italic' }}>📝 {booking.notes}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Upcoming */}
        {upcomingBookings.length > 0 && (
          <>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-grey)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Upcoming</h3>
            <div className="admin-bookings-list">
              {upcomingBookings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(booking => (
                <div key={booking.id} className="admin-booking-card card">
                  <div className="admin-booking-header">
                    <span className="admin-booking-service">{getCustomerName(booking)}</span>
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  </div>
                  <div className="admin-booking-details">
                    <span>✂️ {getServiceName(booking)}</span>
                    <span>📅 {new Date(booking.start_time).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })} at {formatTime(booking.start_time_local || booking.start_time)}</span>
                    {!isStylist && getStylistName(booking) && <span>💇‍♀️ {getStylistName(booking)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {confirmed.length === 0 && (
          <div className="card"><p style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>No appointments scheduled.</p></div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/employee/bookings" className="btn btn-secondary btn-full">
            {isStylist ? 'View All My Bookings' : 'View All Bookings'}
          </Link>
          {isStylist && <Link to="/employee/schedule" className="btn btn-secondary btn-full">Manage My Schedule</Link>}
          <Link to="/employee/walk-in" className="btn btn-secondary btn-full">⚡ Walk-In</Link>
          <Link to="/employee/new-booking" className="btn btn-secondary btn-full">📝 Book for a Customer</Link>
          <Link to="/employee/customers" className="btn btn-secondary btn-full">🔍 Search Customers</Link>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboardPage;
