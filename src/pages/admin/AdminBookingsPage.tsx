import { useState, useEffect } from 'react';
import { api, Booking } from '../../api/client';
import './AdminPages.css';

function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('confirmed');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);
      const result = await api.getBookings(filter ? { status: filter } : undefined);
      setBookings(result.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(isoString: string): string {
    try {
      return new Date(isoString).toLocaleDateString('en-ZA', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
    } catch { return isoString; }
  }

  async function handleComplete(id: string) {
    try {
      await api.completeBooking(id);
      await loadBookings();
    } catch { /* ignore */ }
  }

  async function handleNoShow(id: string) {
    try {
      await api.noShowBooking(id);
      await loadBookings();
    } catch { /* ignore */ }
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header">
          <h1>All Bookings</h1>
        </div>

        <div className="filter-tabs">
          {['confirmed', 'pending', 'completed', 'cancelled', 'no_show', ''].map(s => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-shimmer" style={{ height: 80 }} />
            <div className="loading-shimmer" style={{ height: 80 }} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings with status "{filter || 'any'}"</p>
          </div>
        ) : (
          <div className="admin-bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="admin-booking-card card">
                <div className="admin-booking-header">
                  <span className="admin-booking-service">
                    {typeof booking.service === 'object' ? booking.service.name : 'Appointment'}
                  </span>
                  <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                </div>
                <div className="admin-booking-details">
                  <span>📅 {formatDate(booking.start_time)}</span>
                  {booking.resource && typeof booking.resource === 'object' && (
                    <span>💇‍♀️ {booking.resource.name}</span>
                  )}
                </div>
                {booking.status === 'confirmed' && (
                  <div className="admin-booking-actions">
                    <button className="btn-small btn-complete" onClick={() => handleComplete(booking.id)}>Complete</button>
                    <button className="btn-small btn-noshow" onClick={() => handleNoShow(booking.id)}>No Show</button>
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

export default AdminBookingsPage;
