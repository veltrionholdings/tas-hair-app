import { Routes, Route } from 'react-router-dom';
import { restoreSession } from './api/client';
import ErrorBoundary from './components/ErrorBoundary';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import StaffPage from './pages/admin/StaffPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import SchedulePage from './pages/employee/SchedulePage';

// Restore session once on app load
restoreSession();

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Customer routes (auth required) */}
          <Route path="/book" element={<BookingPage />} />
          <Route path="/booking-confirmed" element={<BookingConfirmationPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AdminDashboardPage /></RoleGuard>} />
          <Route path="/admin/bookings" element={<RoleGuard allowedRoles={['admin']}><AdminBookingsPage /></RoleGuard>} />
          <Route path="/admin/users" element={<RoleGuard allowedRoles={['admin']}><StaffPage /></RoleGuard>} />
          <Route path="/admin/services" element={<RoleGuard allowedRoles={['admin']}><AdminServicesPage /></RoleGuard>} />
          <Route path="/admin/resources" element={<RoleGuard allowedRoles={['admin']}><AdminResourcesPage /></RoleGuard>} />
          <Route path="/admin/settings" element={<RoleGuard allowedRoles={['admin']}><AdminSettingsPage /></RoleGuard>} />

          {/* Employee routes */}
          <Route path="/employee/schedule" element={<RoleGuard allowedRoles={['admin', 'employee']}><SchedulePage /></RoleGuard>} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
