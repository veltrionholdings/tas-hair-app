import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Service } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import './ServicesPage.css';

// Preferred display order for the known categories; anything else follows,
// with uncategorised services last.
const CATEGORY_ORDER = ['Relaxer', 'Treatment', 'Wig', 'Cut'];
const UNCATEGORISED = 'Other Services';

function getCategory(service: Service): string {
  const c = (service.metadata as { category?: unknown } | undefined)?.category;
  return typeof c === 'string' && c.trim() ? c.trim() : UNCATEGORISED;
}

function groupServicesByCategory(services: Service[]): Array<{ category: string; items: Service[] }> {
  const groups = new Map<string, Service[]>();
  for (const svc of services) {
    const cat = getCategory(svc);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(svc);
  }

  const orderIndex = (cat: string) => {
    if (cat === UNCATEGORISED) return Number.MAX_SAFE_INTEGER;
    const i = CATEGORY_ORDER.indexOf(cat);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };

  return Array.from(groups.entries())
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => {
      const diff = orderIndex(a.category) - orderIndex(b.category);
      return diff !== 0 ? diff : a.category.localeCompare(b.category);
    });
}

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
          <LoadingSpinner fullPage label="Loading services..." />
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

        {groupServicesByCategory(services).map(({ category, items }) => (
          <section key={category} className="services-category">
            <h2 className="services-category-title">{category}</h2>
            <div className="services-list">
              {items.map((service) => (
                <div key={service.id} className="service-card card">
                  <Link to={`/services/${service.id}`} className="service-card-header" style={{ textDecoration: 'none' }}>
                    <h3>{service.name}</h3>
                    <span className="service-price">
                      {formatPrice(service.price_cents)}
                    </span>
                  </Link>
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
          </section>
        ))}
      </div>
    </div>
  );
}

export default ServicesPage;
