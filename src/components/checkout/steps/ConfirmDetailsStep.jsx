import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Calendar, Clock, User, DollarSign } from 'lucide-react';

export default function ConfirmDetailsStep({ bookingData, onConfirm, isSubmitting = false }) {
  const [agreeTerms, setAgreeTerms] = useState(false);

  const totalPrice = bookingData.services.reduce((sum, service) => sum + service.price * service.quantity, 0);

  const handleConfirm = async () => {
    if (!agreeTerms) {
      alert('Please agree to the terms and conditions to continue.');
      return;
    }

    // Call the onConfirm callback
    await onConfirm(bookingData);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm Your Booking</h2>

      <div className="space-y-6">
        {/* Dentist Summary */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Dentist Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Dentist</p>
              <p className="text-lg font-bold text-gray-800">
                {bookingData.doctor.name || `${bookingData.doctor.first_name} ${bookingData.doctor.last_name}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Specialization</p>
              <p className="text-lg font-bold text-gray-800">
                {bookingData.doctor.specialization}
              </p>
            </div>
            {bookingData.doctor.phone_number && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-bold text-gray-800">
                  {bookingData.doctor.phone_number}
                </p>
              </div>
            )}
            {bookingData.doctor.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-bold text-gray-800 truncate">
                  {bookingData.doctor.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Date & Time */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-green-600" />
            Appointment Date & Time
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date(bookingData.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock size={16} />
                Time
              </p>
              <p className="text-lg font-bold text-gray-800">{bookingData.time}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-purple-600" />
            Selected Services
          </h3>
          <div className="space-y-3">
            {bookingData.services.map((service) => (
              <div key={service.id} className="flex justify-between items-center bg-white p-3 rounded border border-purple-200">
                <div>
                  <p className="font-semibold text-gray-800">{service.name}</p>
                  <p className="text-xs text-gray-500">
                    {service.duration_minutes} minutes × {service.quantity}
                  </p>
                </div>
                <p className="font-bold text-purple-600">
                  ${(service.price * service.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-300 mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total Price:</span>
            <span className="text-2xl font-bold text-purple-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-bold text-gray-800">
                {bookingData.patient.firstName} {bookingData.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-bold text-gray-800 truncate">
                {bookingData.patient.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-bold text-gray-800">
                {bookingData.patient.phoneNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-bold text-gray-800">
                {bookingData.patient.dateOfBirth
                  ? new Date(bookingData.patient.dateOfBirth).toLocaleDateString()
                  : 'Not provided'}
              </p>
            </div>
            {bookingData.patient.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-bold text-gray-800">
                  {bookingData.patient.address}, {bookingData.patient.city},{' '}
                  {bookingData.patient.state} {bookingData.patient.postalCode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I confirm that all the information provided is accurate and agree to the clinic's
              appointment policies and cancellation terms. I understand that appointments may be
              subject to confirmation and I will receive a confirmation email and SMS.
            </span>
          </label>
        </div>

        {/* Confirmation Status */}
        {agreeTerms ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600" />
            <span className="text-green-700 font-semibold">
              Ready to confirm your booking!
            </span>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={24} className="text-yellow-600" />
            <span className="text-yellow-700 font-semibold">
              Please agree to the terms to continue
            </span>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!agreeTerms || isSubmitting}
          className={`w-full py-4 rounded-lg font-bold text-lg transition ${
            !agreeTerms || isSubmitting
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Complete Booking'}
        </button>
      </div>
    </div>
  );
}
