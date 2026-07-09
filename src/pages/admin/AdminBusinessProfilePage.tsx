import { useState, useEffect } from 'react';
import './AdminPages.css';

function AdminBusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/tenant`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      if (response.ok) {
        const tenant = await response.json();
        setName(tenant.name || '');
        const meta = tenant.settings?.business || {};
        setAddress(meta.address || '271/206 Block IA, Soshanguve');
        setPhone(meta.phone || '078 878 2527');
        setEmail(meta.email || 'tasmotswako@gmail.com');
        setInstagram(meta.instagram || '@tas.hair');
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/tenant`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({
            name,
            settings: {
              business: { address, phone, email, instagram },
            },
          }),
        }
      );
      if (response.ok) setMessage('Business profile updated.');
      else setMessage('Error: Failed to save.');
    } catch { setMessage('Error: Failed to save.'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="page admin-page"><div className="container"><div className="page-header"><h1>Business Profile</h1></div><div className="loading-shimmer" style={{ height: 300 }} /></div></div>;
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="page-header"><h1>Business Profile</h1></div>

        {message && <div className={message.startsWith('Error') ? 'error-banner' : 'success-banner'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input type="text" className="form-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminBusinessProfilePage;
