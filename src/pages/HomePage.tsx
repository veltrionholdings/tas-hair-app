import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Booking, isAuthenticated } from '../api/client';
import './HomePage.css';

function HomePage() {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isAuthenticated()) loadNextBooking();
  }, []);

  async function loadNextBooking() {
    try {
      const result = await api.getBookings({ status: 'confirmed' });
      // Find the next upcoming booking
      const upcoming = result.data
        .filter(b => new Date(b.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      if (upcoming.length > 0) setNextBooking(upcoming[0]);
    } catch { /* ignore */ }
  }

  function formatBookingDate(isoString: string): string {
    try { return new Date(isoString).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }); }
    catch { return ''; }
  }

  function formatTime(s: string | undefined): string {
    if (!s) return '';
    if (s.includes('T')) return s.split('T')[1]?.substring(0, 5) || '';
    return s.substring(0, 5);
  }

  return (
    <div className="page home-page">
      {/* Next appointment banner (shown if logged in and has upcoming) */}
      {nextBooking && (
        <div className="next-appointment">
          <div className="next-appointment-content">
            <span className="next-appointment-label">Your next appointment</span>
            <span className="next-appointment-service">
              {typeof nextBooking.service === 'object' && nextBooking.service ? nextBooking.service.name : 'Appointment'}
            </span>
            <span className="next-appointment-time">
              {formatBookingDate(nextBooking.start_time)} at {formatTime(nextBooking.start_time_local || nextBooking.start_time)}
            </span>
            {nextBooking.resource && typeof nextBooking.resource === 'object' && (
              <span className="next-appointment-stylist">with {nextBooking.resource.name}</span>
            )}
          </div>
          <Link to="/my-bookings" className="next-appointment-link">View →</Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">We Are Hair Trendsetters</h1>
          <p className="hero-subtitle">
            Pixie cuts • Microrings extensions • Platinum Colors
          </p>
          <Link to="/book" className="btn btn-primary btn-lg">
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
