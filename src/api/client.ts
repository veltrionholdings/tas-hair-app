/**
 * API client for the Bookings Engine.
 * All calls go through this module for consistent error handling and auth.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || 'm535i5660f5harvfu6fou0cu9';
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'eu-west-1';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class BookingsApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        error: { code: 'UNKNOWN', message: 'An unexpected error occurred' },
      }));
      throw new ApiRequestError(
        response.status,
        errorBody.error.code,
        errorBody.error.message,
        errorBody.error.details
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  async getServices(filters?: { is_active?: boolean }) {
    const params: Record<string, string> = {};
    if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);
    return this.request<{ data: Service[]; pagination: Pagination }>('GET', '/services', undefined, params);
  }

  async getService(id: string) {
    return this.request<Service>('GET', `/services/${id}`);
  }

  // ─── Resources (Stylists) ──────────────────────────────────────────────────

  async getResources(filters?: { resource_type_id?: string; is_active?: boolean }) {
    const params: Record<string, string> = {};
    if (filters?.resource_type_id) params.resource_type_id = filters.resource_type_id;
    if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);
    return this.request<{ data: Resource[]; pagination: Pagination }>('GET', '/resources', undefined, params);
  }

  async getResourceServices(resourceId: string) {
    return this.request<{ data: Service[] }>('GET', `/resources/${resourceId}/services`);
  }

  // ─── Availability ──────────────────────────────────────────────────────────

  async getAvailability(serviceId: string, date: string, resourceId?: string) {
    const params: Record<string, string> = {
      service_id: serviceId,
      date,
    };
    if (resourceId) params.resource_id = resourceId;
    return this.request<AvailabilityResponse>('GET', '/availability', undefined, params);
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────

  async createBooking(data: CreateBookingRequest) {
    return this.request<Booking>('POST', '/bookings', data);
  }

  async getBookings(filters?: { status?: string; from?: string; to?: string }) {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    return this.request<{ data: Booking[]; pagination: Pagination }>('GET', '/bookings', undefined, params);
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request<Booking>('POST', `/bookings/${id}/cancel`, reason ? { reason } : undefined);
  }

  // ─── Customers ─────────────────────────────────────────────────────────────

  async createCustomer(data: CreateCustomerRequest) {
    return this.request<Customer>('POST', '/customers', data);
  }
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  capacity: number;
  price_cents: number | null;
  currency: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  resource_type_id: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface AvailabilityResponse {
  date: string;
  service: { id: string; name: string; duration_minutes: number };
  resource: { id: string; name: string } | null;
  slots: AvailableSlot[];
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  resources: Array<{ id: string; name: string }>;
}

export interface Booking {
  id: string;
  status: string;
  service: { id: string; name: string };
  resource: { id: string; name: string };
  customer: { id: string; first_name: string; last_name: string };
  start_time: string;
  start_time_local: string;
  end_time: string;
  end_time_local: string;
  party_size: number;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

export interface CreateBookingRequest {
  service_id: string;
  resource_id: string | null;
  customer_id: string;
  start_time: string;
  party_size: number;
  notes?: string;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface Pagination {
  next_cursor: string | null;
  has_more: boolean;
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const api = new BookingsApiClient(API_BASE_URL);

/**
 * Authenticate with Cognito and store the token.
 * Uses the Cognito InitiateAuth API directly (no SDK needed).
 */
export async function authenticate(email: string, password: string): Promise<string> {
  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Authentication failed');
  }

  const data = await response.json();
  const token = data.AuthenticationResult.IdToken;
  api.setToken(token);

  // Store token in localStorage
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_email', email);

  return token;
}

/**
 * Sign up a new customer account with Cognito.
 */
export async function signUp(
  email: string,
  password: string,
  tenantId: string = 'da8e5df8-f070-4671-a176-590a76c574b2'
): Promise<void> {
  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
    },
    body: JSON.stringify({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'custom:tenant_id', Value: tenantId },
        { Name: 'custom:role', Value: 'customer' },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Sign up failed');
  }
}

/**
 * Restore token from localStorage on app load.
 */
export function restoreSession(): boolean {
  const token = localStorage.getItem('auth_token');
  if (token) {
    // Check if token is expired (JWT exp claim)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        api.setToken(token);
        return true;
      }
    } catch {
      // Invalid token
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
  }
  return false;
}

export function logout() {
  api.clearToken();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_email');
}

export function getStoredEmail(): string | null {
  return localStorage.getItem('auth_email');
}

export default api;
