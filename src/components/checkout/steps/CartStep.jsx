import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function CartStep({ selectedDoctor, services, onServicesChange }) {
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, [selectedDoctor]);

  const fallbackServices = [
    {
      id: 1,
      name: 'Routine Cleaning',
      description: 'Professional cleaning and plaque removal',
      price: 99.99,
      duration_minutes: 45,
      category: 'Preventive',
    },
    {
      id: 2,
      name: 'Dental Exam',
      description: 'Comprehensive dental examination',
      price: 79.99,
      duration_minutes: 30,
      category: 'Preventive',
    },
    {
      id: 3,
      name: 'X-Ray (Full Mouth)',
      description: 'Complete set of dental X-rays',
      price: 149.99,
      duration_minutes: 15,
      category: 'Diagnostic',
    },
    {
      id: 4,
      name: 'Cavity Filling',
      description: 'Tooth-colored composite filling',
      price: 199.99,
      duration_minutes: 30,
      category: 'Restorative',
    },
    {
      id: 5,
      name: 'Root Canal Treatment',
      description: 'Complete root canal therapy',
      price: 899.99,
      duration_minutes: 90,
      category: 'Endodontic',
    },
    {
      id: 6,
      name: 'Teeth Whitening',
      description: 'Professional in-office whitening',
      price: 299.99,
      duration_minutes: 60,
      category: 'Cosmetic',
    },
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      // Start with fallback data
      setAvailableServices(fallbackServices);

      // Try to fetch from API if doctor is selected
      if (selectedDoctor) {
        const response = await axios.get(
          `http://localhost:5000/api/doctors/${selectedDoctor.id}/services`
        );
        // Handle API response structure
        const servicesList = response.data.services || response.data;
        if (Array.isArray(servicesList) && servicesList.length > 0) {
          setAvailableServices(servicesList);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      // Keep fallback data visible
      setAvailableServices(fallbackServices);
    } finally {
      setLoading(false);
    }
  };

  const addService = (service) => {
    const existingService = services.find((s) => s.id === service.id);
    if (existingService) {
      updateServiceQuantity(service.id, existingService.quantity + 1);
    } else {
      onServicesChange([...services, { ...service, quantity: 1 }]);
    }
  };

  const removeService = (serviceId) => {
    onServicesChange(services.filter((s) => s.id !== serviceId));
  };

  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity <= 0) {
      removeService(serviceId);
    } else {
      onServicesChange(
        services.map((s) => (s.id === serviceId ? { ...s, quantity } : s))
      );
    }
  };

  const totalPrice = services.reduce((sum, service) => sum + service.price * service.quantity, 0);
  const totalDuration = services.reduce((sum, service) => sum + service.duration_minutes * service.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-600">Loading services...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Services</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Available Services */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableServices.map((service) => {
              const cartService = services.find((s) => s.id === service.id);
              return (
                <div key={service.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{service.name}</h4>
                      <p className="text-xs text-gray-500 mb-1">{service.category}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">${service.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{service.duration_minutes} minutes</p>
                    </div>

                    {cartService ? (
                      <div className="flex items-center gap-2 bg-blue-100 rounded-lg p-2">
                        <button
                          onClick={() => updateServiceQuantity(service.id, cartService.quantity - 1)}
                          className="p-1 hover:bg-blue-200 rounded"
                        >
                          <Minus size={16} className="text-blue-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-blue-600">
                          {cartService.quantity}
                        </span>
                        <button
                          onClick={() => updateServiceQuantity(service.id, cartService.quantity + 1)}
                          className="p-1 hover:bg-blue-200 rounded"
                        >
                          <Plus size={16} className="text-blue-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addService(service)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Services Cart */}
        {services.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Services</h3>
            <div className="space-y-3 mb-4">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      ${service.price.toFixed(2)} × {service.quantity} = ${(service.price * service.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeService(service.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-semibold">{totalDuration} minutes</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800">Total Price:</span>
                <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {services.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No services selected yet. Click "Add" to select a service.
          </div>
        )}
      </div>
    </div>
  );
}
