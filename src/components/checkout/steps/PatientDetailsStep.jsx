import React from 'react';
import { User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';

export default function PatientDetailsStep({ patientData, onDataChange }) {
  const handleChange = (field, value) => {
    onDataChange(field, value);
  };

  const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber'];
  const isFormValid = requiredFields.every((field) => patientData[field]);

  const InputField = ({ label, field, type = 'text', required = false, icon: Icon, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={patientData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Patient Details</h2>

      {!isFormValid && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Please fill in all required fields marked with *</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              field="firstName"
              required
              icon={User}
              placeholder="John"
            />
            <InputField
              label="Last Name"
              field="lastName"
              required
              icon={User}
              placeholder="Doe"
            />
            <InputField
              label="Date of Birth"
              field="dateOfBirth"
              type="date"
              icon={Calendar}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                value={patientData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Phone size={20} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              field="email"
              type="email"
              required
              icon={Mail}
              placeholder="john.doe@example.com"
            />
            <InputField
              label="Phone Number"
              field="phoneNumber"
              required
              icon={Phone}
              placeholder="(201) 555-1234"
            />
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Address Information
          </h3>
          <div className="space-y-4">
            <InputField
              label="Street Address"
              field="address"
              placeholder="123 Main Street"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="City"
                field="city"
                placeholder="New York"
              />
              <InputField
                label="State"
                field="state"
                placeholder="NY"
              />
              <InputField
                label="Postal Code"
                field="postalCode"
                placeholder="10001"
              />
            </div>
            <InputField
              label="Country"
              field="country"
              placeholder="United States"
            />
          </div>
        </div>

        {/* Medical Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                value={patientData.medicalHistory}
                onChange={(e) => handleChange('medicalHistory', e.target.value)}
                placeholder="Any past dental procedures, treatments, or conditions..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Allergies
              </label>
              <textarea
                value={patientData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder="Any known allergies (especially to medications, latex, etc.)..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Form Status */}
        <div className={`p-4 rounded-lg ${isFormValid ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-sm font-semibold ${isFormValid ? 'text-green-700' : 'text-gray-600'}`}>
            {isFormValid ? '✓ All required fields completed' : '○ Complete all required fields to continue'}
          </p>
        </div>
      </div>
    </div>
  );
}

const Calendar = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <path d="M16 2v4M8 2v4M3 10h18"></path>
  </svg>
);
