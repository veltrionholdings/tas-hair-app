import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+27', country: 'ZA', label: '🇿🇦 +27', length: 9 },
  { code: '+1', country: 'US', label: '🇺🇸 +1', length: 10 },
  { code: '+44', country: 'GB', label: '🇬🇧 +44', length: 10 },
  { code: '+91', country: 'IN', label: '🇮🇳 +91', length: 10 },
  { code: '+234', country: 'NG', label: '🇳🇬 +234', length: 10 },
  { code: '+254', country: 'KE', label: '🇰🇪 +254', length: 9 },
  { code: '+255', country: 'TZ', label: '🇹🇿 +255', length: 9 },
  { code: '+263', country: 'ZW', label: '🇿🇼 +263', length: 9 },
  { code: '+267', country: 'BW', label: '🇧🇼 +267', length: 7 },
  { code: '+258', country: 'MZ', label: '🇲🇿 +258', length: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (formattedPhone: string) => void;
  required?: boolean;
  id?: string;
}

function PhoneInput({ value, onChange, required, id }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+27');
  const [localNumber, setLocalNumber] = useState(() => {
    // Parse existing value if it starts with a country code
    for (const cc of COUNTRY_CODES) {
      if (value.startsWith(cc.code)) {
        return value.slice(cc.code.length);
      }
    }
    // Strip leading 0 for local numbers
    if (value.startsWith('0')) return value.slice(1);
    return value;
  });

  function handleLocalChange(input: string) {
    // Only allow digits
    const digits = input.replace(/\D/g, '');
    // Strip leading 0 if present
    const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
    setLocalNumber(cleaned);
    onChange(`${countryCode}${cleaned}`);
  }

  function handleCountryChange(code: string) {
    setCountryCode(code);
    onChange(`${code}${localNumber}`);
  }

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);
  const isValid = localNumber.length === (selectedCountry?.length || 9);

  return (
    <div className="phone-input-group">
      <select
        className="phone-country-select"
        value={countryCode}
        onChange={e => handleCountryChange(e.target.value)}
      >
        {COUNTRY_CODES.map(cc => (
          <option key={cc.code} value={cc.code}>{cc.label}</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        className="phone-number-input"
        value={localNumber}
        onChange={e => handleLocalChange(e.target.value)}
        placeholder={`${'0'.repeat(selectedCountry?.length || 9)}`}
        required={required}
        maxLength={(selectedCountry?.length || 9) + 1}
      />
      {localNumber && !isValid && (
        <span className="phone-validation">
          {localNumber.length}/{selectedCountry?.length || 9} digits
        </span>
      )}
    </div>
  );
}

export default PhoneInput;
