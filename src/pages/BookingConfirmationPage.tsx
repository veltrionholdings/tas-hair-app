import { Link } from 'react-router-dom';
import './BookingConfirmationPage.css';

function BookingConfirmationPage() {
  return (
    <div className="page confirmation-page">
      <div className="container">
        <div className="confirmation-content">
          <div className="confirmation-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p>
            Your appointment has been booked successfully. 
            You'll receive a confirmation via WhatsApp or SMS shortly.
          </p>

          <div className="confirmation-note">
            <strong>Reminder:</strong> Please arrive 5 minutes before your appointment time. 
            If you need to cancel or reschedule, please do so at least 24 hours in advance.
          </div>

          <div className="confirmation-actions">
            <Link to="/my-bookings" className="btn btn-primary btn-full">
              View My Bookings
            </Link>
            <Link to="/" className="btn btn-secondary btn-full">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmationPage;
