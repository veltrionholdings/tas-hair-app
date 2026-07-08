import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { authenticate, restoreSession } from './api/client';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ContactPage from './pages/ContactPage';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    // Try restoring an existing session first
    if (restoreSession()) {
      setReady(true);
      return;
    }

    // Auto-authenticate with demo credentials for the demo
    // In production, this would be replaced with a real login flow
    try {
      await authenticate('admin@tashair.test', 'TasHair2025!');
    } catch {
      // If auth fails, the app still works with demo/fallback data
    }
    setReady(true);
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center', color: '#7B2D8B' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💇‍♀️</div>
          <p style={{ fontSize: '0.875rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking-confirmed" element={<BookingConfirmationPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
    </Routes>
  );
}

export default App;
