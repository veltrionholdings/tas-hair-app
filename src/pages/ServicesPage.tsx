import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Service } from '../api/client';
import './ServicesPage.css';

function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const result = await api.getServices({ is_active: true });
      setServices(result.data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents: number | null): string {
    if (cents === null) return 'Price on request';
    const amount = cents / 100;
    return `R${amount.toFixed(0)}`;
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  if (loading) {
    return (
      <div className="page services-page">
        <div className="container">
          <div className="page-header">
            <h1>Our Services</h1>
            <p>Expert hair services tailored to you</p>
          </div>
          <div className="loading-state">
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page services-page">
      <div className="container">
        <div className="page-header">
          <h1>Our Services</h1>
          <p>Expert hair services tailored to you</p>
        </div>

        <div className="services-list">
          {services.map((service) => (
            <div key={service.id} className="service-card card">
              <div className="service-card-header">
                <h3>{service.name}</h3>
                <span className="service-price">
                  {formatPrice(service.price_cents)}
                </span>
              </div>
              {service.description && (
                <p className="service-description">{service.description}</p>
              )}
              <div className="service-card-footer">
                <span className="service-duration">
                  🕐 {formatDuration(service.duration_minutes)}
                </span>
                <Link
                  to={`/book?service=${service.id}`}
                  className="btn btn-primary"
                >
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;
