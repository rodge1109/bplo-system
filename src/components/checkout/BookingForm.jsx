import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import axios from 'axios';
import StepIndicator from './StepIndicator';
import DentistStep from './steps/DentistStep';
import DateTimeStep from './steps/DateTimeStep';
import CartStep from './steps/CartStep';
import PatientDetailsStep from './steps/PatientDetailsStep';
import ConfirmDetailsStep from './steps/ConfirmDetailsStep';

const API_BASE_URL = 'http://localhost:5000/api';

export default function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    doctor: null,
    date: null,
    time: null,
    services: [],
    patient: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      medicalHistory: '',
      allergies: '',
    },
    patientId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, label: 'Dentist', icon: '👨‍⚕️' },
    { id: 2, label: 'Date & Time', icon: '📅' },
    { id: 3, label: 'Cart', icon: '🛒' },
    { id: 4, label: 'Patient Details', icon: '📋' },
    { id: 5, label: 'Confirm Details', icon: '✓' },
  ];

  const updateBookingData = (field, value) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePatientData = (field, value) => {
    setBookingData((prev) => ({
      ...prev,
      patient: {
        ...prev.patient,
        [field]: value,
      },
    }));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    // Validation logic for each step
    if (!isStepValid(currentStep)) {
      alert('Please fill in all required fields before proceeding.');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return bookingData.doctor !== null;
      case 2:
        return bookingData.date && bookingData.time;
      case 3:
        return bookingData.services.length > 0;
      case 4:
        return (
          bookingData.patient.firstName &&
          bookingData.patient.lastName &&
          bookingData.patient.email &&
          bookingData.patient.phoneNumber
        );
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleConfirmBooking = async (finalBookingData) => {
    setIsSubmitting(true);
    try {
      // Create appointment using existing API
      const servicesText = finalBookingData.services
        .map(s => `${s.name} (${s.quantity}x)`)
        .join(', ');

      const appointmentRes = await axios.post(`${API_BASE_URL}/appointments`, {
        fullName: `${finalBookingData.patient.firstName} ${finalBookingData.patient.lastName}`,
        phoneNumber: finalBookingData.patient.phoneNumber,
        email: finalBookingData.patient.email,
        serviceType: servicesText,
        preferredDate: finalBookingData.date,
        preferredTime: finalBookingData.time,
        notes: `Doctor: ${finalBookingData.doctor.name || finalBookingData.doctor.first_name + ' ' + finalBookingData.doctor.last_name}\nServices: ${servicesText}`,
      });

      // Success
      alert('✓ Appointment booked successfully! Check your email for confirmation.');
      setCurrentStep(1);
      setBookingData({
        doctor: null,
        date: null,
        time: null,
        services: [],
        patient: {
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          medicalHistory: '',
          allergies: '',
        },
        patientId: null,
      });
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to complete booking. Please try again.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dental Booking</h1>
          <p className="text-gray-600">Schedule your appointment in just 5 steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Step 1: Dentist Selection */}
          {currentStep === 1 && (
            <DentistStep
              selectedDoctor={bookingData.doctor}
              onDoctorSelect={(doctor) => updateBookingData('doctor', doctor)}
            />
          )}

          {/* Step 2: Date & Time */}
          {currentStep === 2 && (
            <DateTimeStep
              selectedDoctor={bookingData.doctor}
              date={bookingData.date}
              time={bookingData.time}
              onDateChange={(date) => updateBookingData('date', date)}
              onTimeChange={(time) => updateBookingData('time', time)}
            />
          )}

          {/* Step 3: Cart - Services */}
          {currentStep === 3 && (
            <CartStep
              selectedDoctor={bookingData.doctor}
              services={bookingData.services}
              onServicesChange={(services) => updateBookingData('services', services)}
            />
          )}

          {/* Step 4: Patient Details */}
          {currentStep === 4 && (
            <PatientDetailsStep
              patientData={bookingData.patient}
              onDataChange={updatePatientData}
            />
          )}

          {/* Step 5: Confirm Details */}
          {currentStep === 5 && (
            <ConfirmDetailsStep
              bookingData={bookingData}
              onConfirm={handleConfirmBooking}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              currentStep === 1 || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep === steps.length ? (
            <div className="text-sm text-gray-500">
              Click "Complete Booking" below to submit
            </div>
          ) : (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
