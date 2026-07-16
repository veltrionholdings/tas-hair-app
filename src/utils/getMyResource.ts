import { api, Resource } from '../api/client';

/**
 * Get the logged-in user's name from the JWT token.
 */
export function getMyNameFromToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const parts = token.split('.');
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const payload = JSON.parse(atob(base64));
    const name = `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
    return name || (payload.email || '').split('@')[0];
  } catch { return ''; }
}

/**
 * Find the logged-in employee's linked resource.
 * First checks for custom:resource_id in the JWT.
 * Falls back to name matching (case-insensitive, trimmed).
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

  try {
    const resources = await api.getResources({ is_active: true });

    // Try by resource_id first
    if (resourceId) {
      const match = resources.data.find(r => r.id === resourceId);
      if (match) return match;
    }

    // Fallback: match by name (case-insensitive, trim whitespace)
    const match = resources.data.find(r => 
      r.name.trim().toLowerCase() === myName.trim().toLowerCase()
    );
    
    return match || null;
  } catch {
    return null;
  }
}
