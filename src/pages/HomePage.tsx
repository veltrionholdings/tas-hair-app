import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="page home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
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

      {/* Quick Info */}
      <section className="home-info container">
        <div className="info-card">
          <div className="info-icon">🕐</div>
          <div className="info-text">
            <h4>Working Hours</h4>
            <p>Mon – Sun: 9:00 – 18:00</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📍</div>
          <div className="info-text">
            <h4>Location</h4>
            <p>271/206 Block IA, Soshanguve</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📅</div>
          <div className="info-text">
            <h4>Appointments</h4>
            <p>Strictly by appointment only</p>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="home-services container">
        <h2>Our Services</h2>
        <div className="services-preview">
          <div className="service-preview-card">
            <div className="service-preview-icon">✂️</div>
            <h4>Pixie Cuts</h4>
            <p>Precision short cuts tailored to your face shape</p>
          </div>
          <div className="service-preview-card">
            <div className="service-preview-icon">💇‍♀️</div>
            <h4>Extensions</h4>
            <p>Microrings and seamless extensions</p>
          </div>
          <div className="service-preview-card">
            <div className="service-preview-icon">🎨</div>
            <h4>Colour</h4>
            <p>Platinum blondes and creative colour work</p>
          </div>
        </div>
        <Link to="/services" className="btn btn-secondary btn-full">
          View All Services
        </Link>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <h2>Ready for a fresh look?</h2>
          <p>Book your appointment today and let us transform your style.</p>
          <Link to="/book" className="btn btn-primary btn-lg btn-full">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
