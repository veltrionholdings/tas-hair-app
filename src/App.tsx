import { Routes, Route } from 'react-router-dom';
import { restoreSession } from './api/client';
import ErrorBoundary from './components/ErrorBoundary';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
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
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminNewBookingPage from './pages/admin/AdminNewBookingPage';
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminQuickActionsPage from './pages/admin/AdminQuickActionsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminBusinessProfilePage from './pages/admin/AdminBusinessProfilePage';
import SchedulePage from './pages/employee/SchedulePage';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';
import EmployeeBookingsPage from './pages/employee/EmployeeBookingsPage';
import EmployeeWalkInPage from './pages/employee/EmployeeWalkInPage';
import EmployeeNewBookingPage from './pages/employee/EmployeeNewBookingPage';
import EmployeeCustomersPage from './pages/employee/EmployeeCustomersPage';

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
          <Route path="/services/:id" element={<ServiceDetailPage />} />
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
          <Route path="/admin/settings" element={<RoleGuard allowedRoles={['admin']}><AdminSettingsPage /></RoleGuard>} />
          <Route path="/admin/new-booking" element={<RoleGuard allowedRoles={['admin']}><AdminNewBookingPage /></RoleGuard>} />
          <Route path="/admin/customers/:id" element={<RoleGuard allowedRoles={['admin']}><AdminCustomerDetailPage /></RoleGuard>} />
          <Route path="/admin/quick-actions" element={<RoleGuard allowedRoles={['admin']}><AdminQuickActionsPage /></RoleGuard>} />
          <Route path="/admin/reports" element={<RoleGuard allowedRoles={['admin']}><AdminReportsPage /></RoleGuard>} />
          <Route path="/admin/customers" element={<RoleGuard allowedRoles={['admin']}><AdminCustomersPage /></RoleGuard>} />
          <Route path="/admin/business" element={<RoleGuard allowedRoles={['admin']}><AdminBusinessProfilePage /></RoleGuard>} />

          {/* Employee routes */}
          <Route path="/employee" element={<RoleGuard allowedRoles={['admin', 'employee']}><EmployeeDashboardPage /></RoleGuard>} />
          <Route path="/employee/bookings" element={<RoleGuard allowedRoles={['admin', 'employee']}><EmployeeBookingsPage /></RoleGuard>} />
          <Route path="/employee/schedule" element={<RoleGuard allowedRoles={['admin', 'employee']}><SchedulePage /></RoleGuard>} />
          <Route path="/employee/walk-in" element={<RoleGuard allowedRoles={['admin', 'employee']}><EmployeeWalkInPage /></RoleGuard>} />
          <Route path="/employee/new-booking" element={<RoleGuard allowedRoles={['admin', 'employee']}><EmployeeNewBookingPage /></RoleGuard>} />
          <Route path="/employee/customers" element={<RoleGuard allowedRoles={['admin', 'employee']}><EmployeeCustomersPage /></RoleGuard>} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
