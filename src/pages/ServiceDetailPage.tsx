import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, Service } from '../api/client';

function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadService(); }, [id]);

  async function loadService() {
    try { setLoading(true); const s = await api.getService(id!); setService(s); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} minutes`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h} hour${h > 1 ? 's' : ''}`;
  }

  if (loading) {
    return <div className="page"><div className="container" style={{ padding: '2rem 1rem' }}><div className="loading-shimmer" style={{ height: 200, borderRadius: 12 }} /></div></div>;
  }

  if (!service) {
    return <div className="page"><div className="container" style={{ padding: '2rem 1rem', textAlign: 'center' }}><p>Service not found.</p></div></div>;
  }

  return (
    <div className="page">
      <div className="container" style={{ padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{service.name}</h1>
          {service.description && <p style={{ fontSize: '0.9375rem', color: 'var(--color-grey-dark)', lineHeight: 1.5 }}>{service.description}</p>}
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>Duration</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDuration(service.duration_minutes)}</span>
            </div>
            {service.price_cents && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>Price</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>R{service.price_cents / 100}</span>
              </div>
            )}
            {service.buffer_minutes > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-grey)' }}>Cleanup time</span>
                <span style={{ fontSize: '0.875rem' }}>{service.buffer_minutes} min</span>
              </div>
            )}
          </div>
        </div>

        <Link to={`/book?service=${service.id}`} className="btn btn-primary btn-full btn-lg">
          Book This Service
        </Link>

        <Link to="/services" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-grey)' }}>
          ← Back to Services
        </Link>
      </div>
    </div>
  );
}

export default ServiceDetailPage;
