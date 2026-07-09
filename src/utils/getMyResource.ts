import { api, Resource } from '../api/client';

/**
 * Find the logged-in employee's linked resource.
 * First checks for custom:resource_id in the JWT.
 * Falls back to name matching.
 */
export async function getMyResource(): Promise<Resource | null> {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  let resourceId = '';
  let myName = '';

  try {
    const parts = token.split('.');
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const payload = JSON.parse(atob(base64));
    resourceId = payload['custom:resource_id'] || '';
    myName = `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
    if (!myName) myName = (payload.email || '').split('@')[0];
  } catch { return null; }

  const resources = await api.getResources({ is_active: true });

  // Try by resource_id first (set by admin via link-resource endpoint)
  if (resourceId) {
    const match = resources.data.find(r => r.id === resourceId);
    if (match) return match;
  }

  // Fallback: match by name
  return resources.data.find(r => r.name.toLowerCase() === myName.toLowerCase()) || null;
}
