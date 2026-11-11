import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DateTimeStep({ selectedDoctor, date, time, onDateChange, onTimeChange }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    // Set minimum date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];
    setMinDate(minDateStr);
  }, []);

  useEffect(() => {
    if (date && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [date, selectedDoctor]);

  const fallbackSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  ];

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      // Start with fallback data
      setAvailableSlots(fallbackSlots);

      const response = await axios.get(
        `http://localhost:5000/api/doctors/${selectedDoctor.id}/availability`,
        {
          params: { date },
        }
      );
      // Handle API response structure
      const slotsList = response.data.slots || response.data;
      if (Array.isArray(slotsList) && slotsList.length > 0) {
        setAvailableSlots(slotsList);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      // Keep fallback slots visible
      setAvailableSlots(fallbackSlots);
    } finally {
      setLoading(false);
    }
  };

  const getWeekday = (dateString) => {
    const d = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Date & Time</h2>

      {!selectedDoctor && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Please select a dentist first</span>
        </div>
      )}

      {selectedDoctor && (
        <div className="space-y-6">
          {/* Selected Doctor Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">
              Selected Dentist: <span className="font-bold">Dr {selectedDoctor.last_name}</span>
            </p>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={18} />
              Choose Date
            </label>
            <input
              type="date"
              value={date || ''}
              onChange={(e) => onDateChange(e.target.value)}
              min={minDate}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {date && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: <span className="font-semibold">{getWeekday(date)}, {new Date(date).toLocaleDateString()}</span>
              </p>
            )}
          </div>

          {/* Time Selection */}
          {date && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={18} />
                Choose Time
              </label>

              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading available times...
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => onTimeChange(slot)}
                      className={`py-3 px-4 rounded-lg font-semibold transition ${
                        time === slot
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {time && (
                <p className="text-sm text-gray-600 mt-4">
                  Selected Time: <span className="font-bold text-lg text-blue-600">{time}</span>
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {date && time && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-700 mb-2">Appointment Summary</h3>
              <p className="text-sm text-gray-700">
                📅 <span className="font-semibold">{getWeekday(date)}, {new Date(date).toLocaleDateString()}</span>
              </p>
              <p className="text-sm text-gray-700">
                🕐 <span className="font-semibold">{time}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
