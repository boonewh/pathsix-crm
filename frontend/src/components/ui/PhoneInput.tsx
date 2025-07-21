import { useState, useCallback, useEffect } from 'react';

// Phone utility functions (you can also import these from phoneUtils.ts if you prefer)
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  return phone;
}

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  let formatted = '';
  
  if (cleaned.length >= 6) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 3) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    formatted = cleaned;
  }
  
  return formatted;
}

function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

// The actual PhoneInput component
interface PhoneInputProps {
  value: string;
  onChange: (cleanedPhone: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  label, 
  required = false, 
  placeholder = "(555) 123-4567",
  className = "",
  ...props 
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(formatPhoneNumber(value || ''));

  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value || ""));
  }, [value]);
    
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneInput(inputValue);
    const cleaned = cleanPhoneNumber(formatted);
    
    setDisplayValue(formatted);
    onChange(cleaned); // Send clean value to parent
  }, [onChange]);
  
  const isValid = isValidPhoneNumber(displayValue);
  const showError = displayValue && !isValid;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border rounded px-3 py-2 text-sm ${
          showError 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } ${className}`}
        {...props}
      />
      {showError && (
        <p className="text-sm text-red-600">
          Please enter a valid phone number
        </p>
      )}
    </div>
  );
}