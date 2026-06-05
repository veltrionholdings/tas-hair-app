import './ContactPage.css';

function ContactPage() {
  return (
    <div className="page contact-page">
      <div className="container">
        <div className="page-header">
          <h1>Contact Us</h1>
          <p>Get in touch with Tas Hair & Beauty Cafe</p>
        </div>

        <div className="contact-cards">
          <a href="tel:+27788782527" className="contact-card card">
            <div className="contact-icon">📞</div>
            <div className="contact-info">
              <h4>Call Us</h4>
              <p>078 878 2527</p>
            </div>
          </a>

          <a
            href="https://wa.me/27788782527?text=Hi%2C%20I%27d%20like%20to%20book%20an%20appointment"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card card contact-card-whatsapp"
          >
            <div className="contact-icon">💬</div>
            <div className="contact-info">
              <h4>WhatsApp</h4>
              <p>Send us a message</p>
            </div>
          </a>

          <a href="mailto:tasmotswako@gmail.com" className="contact-card card">
            <div className="contact-icon">✉️</div>
            <div className="contact-info">
              <h4>Email</h4>
              <p>tasmotswako@gmail.com</p>
            </div>
          </a>

          <a
            href="https://maps.google.com/?q=271+206+Block+IA+Soshanguve"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card card"
          >
            <div className="contact-icon">📍</div>
            <div className="contact-info">
              <h4>Visit Us</h4>
              <p>271/206 Block IA, Soshanguve</p>
              <span className="contact-hint">Tap for directions</span>
            </div>
          </a>
        </div>

        <section className="hours-section">
          <h2>Working Hours</h2>
          <div className="hours-card card">
            <div className="hours-row">
              <span className="hours-day">Monday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Tuesday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Wednesday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Thursday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Friday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Saturday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
            <div className="hours-row">
              <span className="hours-day">Sunday</span>
              <span className="hours-time">9:00 – 18:00</span>
            </div>
          </div>
          <p className="hours-note">⚡ Strictly by appointment only</p>
        </section>

        <section className="social-section">
          <h2>Follow Us</h2>
          <a
            href="https://instagram.com/tas.hair"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link card"
          >
            <span className="social-icon">📸</span>
            <span className="social-handle">@tas.hair</span>
            <span className="social-cta">Follow on Instagram</span>
          </a>
        </section>
      </div>
    </div>
  );
}

export default ContactPage;
