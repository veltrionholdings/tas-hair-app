import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, Service, Resource, AvailableSlot, isAuthenticated } from '../api/client';
import './BookingPage.css';

type BookingStep = 'service' | 'stylist' | 'datetime' | 'details' | 'confirm';

function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auth gate — check if user is logged in, redirect to login if not
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: '/book' + (window.location.search || '') } });
    }
  }, []);

  const [step, setStep] = useState<BookingStep>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Resource[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Resource | null>(null);
  const [anyAvailable, setAnyAvailable] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Pre-select service from URL
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        loadStylists();
        setStep('stylist');
      }
    }
  }, [searchParams, services]);

  // Load availability when date changes
  useEffect(() => {
    if (step === 'datetime' && selectedDate && selectedService) {
      loadAvailability();
    }
  }, [selectedDate]);

  async function loadServices() {
    try {
      setLoading(true);
      const result = await api.getServices({ is_active: true });
      setServices(result.data);
    } catch {
      setErrorMessage('Unable to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStylists() {
    try {
      const result = await api.getResources({ is_active: true });
      setStylists(result.data);
    } catch {
      // Stylists will show as empty — user can still pick "Any Available"
    }
  }

  async function loadAvailability() {
    if (!selectedService || !selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    try {
      const resourceId = anyAvailable ? undefined : selectedStylist?.id;
      const result = await api.getAvailability(selectedService.id, selectedDate, resourceId);
      setSlots(result.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setErrorMessage('');
    loadStylists();
    setStep('stylist');
  }

  function handleSelectStylist(stylist: Resource | null) {
    if (stylist) {
      setSelectedStylist(stylist);
      setAnyAvailable(false);
    } else {
      setSelectedStylist(null);
      setAnyAvailable(true);
    }
    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    setStep('datetime');
  }

  function handleSelectSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setStep('details');
  }

  async function handleConfirmBooking() {
    if (!selectedService || !selectedSlot || !customerName || !customerPhone) return;

    setBookingLoading(true);
    setErrorMessage('');
    try {
      // Create customer
      const [firstName, ...lastParts] = customerName.trim().split(' ');
      const lastName = lastParts.join(' ') || firstName;

      const customer = await api.createCustomer({
        first_name: firstName,
        last_name: lastName,
        phone: customerPhone,
        email: customerEmail,
      });

      // Create booking
      const startTime = `${selectedDate}T${selectedSlot.start_time}:00`;
      await api.createBooking({
        service_id: selectedService.id,
        resource_id: anyAvailable ? null : (selectedStylist?.id || selectedSlot.resources[0]?.id || null),
        customer_id: customer.id,
        start_time: startTime,
        party_size: 1,
        notes: notes || undefined,
      });

      navigate('/booking-confirmed');
    } catch (err: any) {
      if (err?.code === 'CONFLICT') {
        setErrorMessage('This time slot was just taken. Please select another time.');
        setStep('datetime');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setBookingLoading(false);
    }
  }

  function getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function getMaxDate(): string {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    return future.toISOString().split('T')[0];
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  if (loading) {
    return (
      <div className="page booking-page">
        <div className="container" style={{ paddingTop: '2rem', textAlign: 'center' }}>
          <div className="loading-shimmer" style={{ height: 40, width: '60%', margin: '0 auto 1rem' }} />
          <div className="loading-shimmer" style={{ height: 50, marginBottom: '0.5rem' }} />
          <div className="loading-shimmer" style={{ height: 50, marginBottom: '0.5rem' }} />
          <div className="loading-shimmer" style={{ height: 50 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page booking-page">
      <div className="container">
        {/* Progress */}
        <div className="booking-progress">
          <div className={`progress-step ${step === 'service' ? 'active' : selectedService ? 'done' : ''}`}>
            <span className="progress-dot" />
            <span className="progress-label">Service</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step === 'stylist' ? 'active' : selectedStylist || anyAvailable ? 'done' : ''}`}>
            <span className="progress-dot" />
            <span className="progress-label">Stylist</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step === 'datetime' ? 'active' : selectedSlot ? 'done' : ''}`}>
            <span className="progress-dot" />
            <span className="progress-label">Time</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step === 'details' || step === 'confirm' ? 'active' : ''}`}>
            <span className="progress-dot" />
            <span className="progress-label">Details</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="error-banner">
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {/* Step: Select Service */}
        {step === 'service' && (
          <div className="booking-step">
            <h2>Choose a Service</h2>
            <div className="booking-options">
              {services.map(service => (
                <button
                  key={service.id}
                  className="booking-option"
                  onClick={() => handleSelectService(service)}
                >
                  <div className="booking-option-info">
                    <span className="booking-option-name">{service.name}</span>
                    <span className="booking-option-meta">
                      {service.duration_minutes} min
                    </span>
                  </div>
                  <span className="booking-option-price">
                    {service.price_cents ? `R${service.price_cents / 100}` : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Select Stylist */}
        {step === 'stylist' && (
          <div className="booking-step">
            <h2>Choose a Stylist</h2>
            <p className="step-hint">Or let us assign whoever is available</p>
            <div className="booking-options">
              <button
                className="booking-option booking-option-any"
                onClick={() => handleSelectStylist(null)}
              >
                <div className="booking-option-info">
                  <span className="booking-option-name">Any Available</span>
                  <span className="booking-option-meta">First available stylist</span>
                </div>
              </button>
              {stylists.map(stylist => (
                <button
                  key={stylist.id}
                  className="booking-option"
                  onClick={() => handleSelectStylist(stylist)}
                >
                  <div className="booking-option-info">
                    <span className="booking-option-name">{stylist.name}</span>
                    {stylist.description && (
                      <span className="booking-option-meta">{stylist.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button className="btn-back" onClick={() => { setStep('service'); setSelectedService(null); }}>
              ← Back
            </button>
          </div>
        )}

        {/* Step: Select Date & Time */}
        {step === 'datetime' && (
          <div className="booking-step">
            <h2>Pick a Date & Time</h2>

            <div className="date-picker">
              <label htmlFor="booking-date" className="date-label">Date</label>
              <input
                id="booking-date"
                type="date"
                className="date-input"
                value={selectedDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate && (
                <span className="date-display">{formatDate(selectedDate)}</span>
              )}
            </div>

            {slotsLoading && (
              <div className="loading-spinner">
                <div className="spinner" />
                <span>Checking availability...</span>
              </div>
            )}

            {!slotsLoading && slots.length > 0 && (
              <div className="time-slots">
                <h4>Available Times</h4>
                <div className="slots-grid">
                  {slots
                    .filter(slot => {
                      // Extra client-side filter: hide slots in the past for today
                      const now = new Date();
                      const slotDate = new Date(`${selectedDate}T${slot.start_time}:00`);
                      return slotDate > now;
                    })
                    .map(slot => (
                    <button
                      key={slot.start_time}
                      className="slot-btn"
                      onClick={() => handleSelectSlot(slot)}
                    >
                      {slot.start_time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!slotsLoading && selectedDate && slots.length === 0 && (
              <div className="no-slots">
                <p>No available slots on this date. Try another day.</p>
              </div>
            )}

            <button className="btn-back" onClick={() => setStep('stylist')}>
              ← Back
            </button>
          </div>
        )}

        {/* Step: Customer Details */}
        {step === 'details' && (
          <div className="booking-step">
            <h2>Your Details</h2>

            <div className="booking-summary-mini">
              <span>{selectedService?.name}</span>
              <span>•</span>
              <span>{formatDate(selectedDate)}</span>
              <span>•</span>
              <span>{selectedSlot?.start_time}</span>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Thandi Mokoena"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 078 878 2527"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. thandi@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                className="form-input form-textarea"
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              disabled={!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
              onClick={() => setStep('confirm')}
            >
              Review Booking
            </button>

            <button className="btn-back" onClick={() => setStep('datetime')}>
              ← Back
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="booking-step">
            <h2>Confirm Booking</h2>

            <div className="confirm-card card">
              <div className="confirm-row">
                <span className="confirm-label">Service</span>
                <span className="confirm-value">{selectedService?.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Stylist</span>
                <span className="confirm-value">
                  {anyAvailable ? 'Any Available' : (selectedStylist?.name || selectedSlot?.resources[0]?.name)}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Date</span>
                <span className="confirm-value">{formatDate(selectedDate)}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Time</span>
                <span className="confirm-value">
                  {selectedSlot?.start_time} – {selectedSlot?.end_time}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Duration</span>
                <span className="confirm-value">{selectedService?.duration_minutes} min</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Name</span>
                <span className="confirm-value">{customerName}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Phone</span>
                <span className="confirm-value">{customerPhone}</span>
              </div>
              {selectedService?.price_cents && (
                <div className="confirm-row confirm-row-total">
                  <span className="confirm-label">Price</span>
                  <span className="confirm-value confirm-price">
                    R{selectedService.price_cents / 100}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleConfirmBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>

            <button className="btn-back" onClick={() => setStep('details')} disabled={bookingLoading}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
