import { useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminPages.css';

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/customers?search=${encodeURIComponent(search.trim())}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      }
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>Customers</h1></div>

        <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </form>

        {!searched && (
          <div className="empty-state">
            <p>Search for a customer by name, email, or phone number.</p>
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className="empty-state"><p>No customers found for "{search}"</p></div>
        )}

        {results.length > 0 && (
          <div className="staff-list">
            {results.map(customer => (
              <Link key={customer.id} to={`/admin/customers/${customer.id}`} className="staff-card card" style={{ textDecoration: 'none' }}>
                <div className="staff-info">
                  <div className="staff-name">{customer.first_name} {customer.last_name}</div>
                  <div className="staff-email">
                    {customer.phone && `📞 ${customer.phone}`}
                    {customer.phone && customer.email && ' • '}
                    {customer.email && `✉️ ${customer.email}`}
                  </div>
                </div>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.8125rem' }}>View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomersPage;
