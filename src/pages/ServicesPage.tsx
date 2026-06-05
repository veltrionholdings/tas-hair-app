import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Service } from '../api/client';
import './ServicesPage.css';

// Demo data used when API is not yet connected
const DEMO_SERVICES: Service[] = [
  { id: '1', name: 'Pixie Cut', description: 'Precision short cut tailored to your face shape', duration_minutes: 45, buffer_minutes: 10, capacity: 1, price_cents: 25000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '2', name: 'Bob Cut', description: 'Classic bob cut with clean lines and movement', duration_minutes: 60, buffer_minutes: 10, capacity: 1, price_cents: 30000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '3', name: 'Platinum Colour', description: 'Full platinum blonde transformation', duration_minutes: 180, buffer_minutes: 15, capacity: 1, price_cents: 80000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '4', name: 'Microrings Extensions', description: 'Seamless strand-by-strand extensions using micro rings', duration_minutes: 240, buffer_minutes: 15, capacity: 1, price_cents: 150000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '5', name: 'Hair Colour (Standard)', description: 'Single process colour application', duration_minutes: 90, buffer_minutes: 15, capacity: 1, price_cents: 45000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '6', name: 'Wash & Style', description: 'Shampoo, condition, and blow-dry styling', duration_minutes: 30, buffer_minutes: 5, capacity: 1, price_cents: 15000, currency: 'ZAR', is_active: true, metadata: {} },
  { id: '7', name: 'Hair Treatment', description: 'Deep conditioning and repair treatment', duration_minutes: 45, buffer_minutes: 10, capacity: 1, price_cents: 20000, currency: 'ZAR', is_active: true, metadata: {} },
];

function ServicesPage() {
  const [services, setServices] = useState<Service[]>(DEMO_SERVICES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const result = await api.getServices({ is_active: true });
      if (result.data.length > 0) {
        setServices(result.data);
      }
    } catch {
      // Fall back to demo data
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents: number | null, currency: string | null): string {
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
                  {formatPrice(service.price_cents, service.currency)}
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
