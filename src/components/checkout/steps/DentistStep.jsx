import React, { useState, useEffect } from 'react';
import { Star, Phone, Mail, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function DentistStep({ selectedDoctor, onDoctorSelect }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/doctors');
      // Handle API response structure
      const doctorsList = response.data.doctors || response.data;
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors');
      // Fallback to sample data
      setDoctors([
        {
          id: 1,
          first_name: 'William',
          last_name: 'Demo Dentist',
          specialization: 'General Dentistry',
          email: 'demostaff3@bookingp.com',
          phone_number: '(201) 555-1210',
          bio: 'Experienced general dentist with focus on patient comfort',
          years_experience: 10,
        },
        {
          id: 2,
          first_name: 'B.',
          last_name: 'Sick',
          specialization: 'Orthodontics',
          email: 'drbsick@bookingpress.com',
          phone_number: '(201) 221-5141',
          bio: 'Specialist in orthodontic treatments',
          years_experience: 15,
        },
        {
          id: 3,
          first_name: 'Carey',
          last_name: 'Doctor',
          specialization: 'Prosthodontics',
          email: 'drcarey@bookingpress.com',
          phone_number: '(201) 555-1218',
          bio: 'Expert in dental prosthetics and implants',
          years_experience: 12,
        },
        {
          id: 4,
          first_name: 'Fillmore',
          last_name: 'Doctor',
          specialization: 'Periodontics',
          email: 'drfillmore@bookingpress.com',
          phone_number: '(201) 555-1210',
          bio: 'Specializing in gum treatment',
          years_experience: 8,
        },
        {
          id: 5,
          first_name: 'Pulley',
          last_name: 'Doctor',
          specialization: 'Endodontics',
          email: 'drpulley@bookingpress.com',
          phone_number: '(201) 555-1419',
          bio: 'Root canal specialist',
          years_experience: 11,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading dentists...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Dentist</h2>

      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => onDoctorSelect(doctor)}
            className={`relative p-6 rounded-lg border-2 cursor-pointer transition transform hover:scale-105 ${
              selectedDoctor?.id === doctor.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-400'
            }`}
          >
            {selectedDoctor?.id === doctor.id && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="text-blue-600" size={28} />
              </div>
            )}

            {/* Doctor Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {doctor.first_name ? doctor.first_name.charAt(0) + (doctor.last_name ? doctor.last_name.charAt(0) : '') : doctor.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
            </div>

            {/* Doctor Info */}
            <h3 className="text-xl font-bold text-gray-800 text-center">
              {doctor.name || `${doctor.first_name} ${doctor.last_name}`}
            </h3>
            <p className="text-sm text-blue-600 font-semibold text-center mb-2">
              {doctor.specialization}
            </p>

            {/* Rating */}
            <div className="flex items-center justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-xs text-gray-500 ml-1">(4.8)</span>
            </div>

            {/* Experience */}
            {doctor.years_experience && (
              <p className="text-sm text-gray-600 text-center mb-4">
                {doctor.years_experience} years experience
              </p>
            )}

            {/* Contact Info */}
            {(doctor.phone_number || doctor.email) && (
              <div className="space-y-2 text-sm border-t pt-4">
                {doctor.phone_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span className="truncate">{doctor.phone_number}</span>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} />
                    <span className="truncate text-xs">{doctor.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {doctor.bio && (
              <p className="text-xs text-gray-500 mt-3 italic">{doctor.bio}</p>
            )}
          </div>
        ))}
      </div>

      {!loading && doctors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No dentists available at the moment.
        </div>
      )}
    </div>
  );
}
