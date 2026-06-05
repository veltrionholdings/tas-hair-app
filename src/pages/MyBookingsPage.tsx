import { useState, useEffect } from 'react';
import { api, Booking } from '../api/client';
import './MyBookingsPage.css';

// Demo data for when API isn't connected
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-1',
    status: 'confirmed',
    service: { id: '1', name: 'Pixie Cut' },
    resource: { id: 'r1', name: 'Tas' },
    customer: { id: 'c1', first_name: 'Demo', last_name: 'User' },
    start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    start_time_local: '10:00',
    end_time: new Date(Date.now() + 86400000 * 2 + 2700000).toISOString(),
    end_time_local: '10:45',
    party_size: 1,
    notes: null,
    created_at: new Date().toISOString(),
  },
];

function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      const result = await api.getBookings({ status: 'confirmed' });
      if (result.data.length > 0) setBookings(result.data);
    } catch {
      // Use demo data
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(bookingId, 'Customer requested cancellation');
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch {
      alert('Unable to cancel. Please contact the salon directly.');
    }
  }

  function formatBookingDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  function formatBookingTime(localTime: string): string {
    return localTime.substring(0, 5);
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'badge-confirmed';
      case 'pending': return 'badge-pending';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      default: return '';
    }
  }

  return (
    <div className="page my-bookings-page">
      <div className="container">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>Your upcoming appointments</p>
        </div>

        {bookings.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings yet</h3>
            <p>Book your first appointment to get started.</p>
          </div>
        )}

        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card card">
              <div className="booking-card-header">
                <h3>{booking.service.name}</h3>
                <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-card-details">
                <div className="booking-detail">
                  <span className="detail-icon">📅</span>
                  <span>{formatBookingDate(booking.start_time)}</span>
                </div>
                <div className="booking-detail">
                  <span className="detail-icon">🕐</span>
                  <span>{formatBookingTime(booking.start_time_local)} – {formatBookingTime(booking.end_time_local)}</span>
                </div>
                <div className="booking-detail">
                  <span className="detail-icon">💇‍♀️</span>
                  <span>{booking.resource.name}</span>
                </div>
              </div>
              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <button
                  className="btn-cancel"
                  onClick={() => handleCancel(booking.id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyBookingsPage;
