import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="page home-page">
      {/* Hero Section — full viewport height minus header and nav */}
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
