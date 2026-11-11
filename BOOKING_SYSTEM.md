# Dental Clinic Booking System

## Overview

This is a complete multi-step dental appointment booking system with 5 steps:

1. **Dentist Selection** - Choose from available dentists
2. **Date & Time** - Select appointment date and time
3. **Cart/Services** - Add dental services and procedures
4. **Patient Details** - Enter patient information
5. **Confirm Details** - Review and confirm booking

## Database Schema

The system uses PostgreSQL with the following key tables:

### Doctors Table
```
- id (serial primary key)
- first_name, last_name, specialization
- email, phone_number
- bio, years_experience, qualification, license_number
- is_available (boolean)
- created_at, updated_at
```

### Patients Table
```
- id (serial primary key)
- first_name, last_name, email, phone_number
- date_of_birth, gender
- address, city, state, postal_code, country
- medical_history, allergies
- insurance_provider, insurance_id
- emergency_contact_name, emergency_contact_phone
- created_at, updated_at
```

### Services Table
```
- id (serial primary key)
- name, description, price
- duration_minutes, category
- is_active (boolean)
- created_at, updated_at
```

### Appointments Table
```
- id (serial primary key)
- patient_id (foreign key)
- doctor_id (foreign key)
- appointment_date, appointment_time, appointment_datetime
- status ('pending', 'confirmed', 'cancelled', 'completed')
- notes
- total_price, payment_status
- reminder_sent (boolean)
- created_at, updated_at
```

### Appointment Services (Junction Table)
```
- id (serial primary key)
- appointment_id (foreign key)
- service_id (foreign key)
- quantity, price_at_booking
- created_at
```

### Doctor Availability Table
```
- id (serial primary key)
- doctor_id (foreign key)
- day_of_week ('Monday', 'Tuesday', etc.)
- start_time, end_time
- is_available (boolean)
- created_at, updated_at
```

### Doctor Services (Junction Table)
```
- id (serial primary key)
- doctor_id (foreign key)
- service_id (foreign key)
- created_at
```

## Setup Instructions

### 1. Database Setup

Connect to PostgreSQL and run:

```sql
-- Load the schema
\i server/clinic_schema.sql
```

This will create all tables with:
- 5 sample dentists
- 10 sample dental services
- Sample doctor availability schedules
- Sample doctor-service mappings

### 2. Backend API Endpoints

The following new endpoints are available:

**Doctors**
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:doctorId/services` - Get services for a specific doctor
- `GET /api/doctors/:doctorId/availability` - Get available time slots for a doctor

**Patients**
- `POST /api/patients` - Create new patient (or returns existing)
- `GET /api/patients/:patientId` - Get patient profile
- `GET /api/patients/:patientId/appointments` - Get patient's appointments

**Bookings**
- `POST /api/bookings` - Create new appointment with services
- `GET /api/appointments/:id` - Get appointment details

### 3. Frontend Components

The booking system includes the following React components:

**Main Component**
- `BookingForm.jsx` - Main multi-step form container

**Step Components**
- `DentistStep.jsx` - Select dentist from grid view
- `DateTimeStep.jsx` - Choose appointment date and time
- `CartStep.jsx` - Add services to appointment
- `PatientDetailsStep.jsx` - Enter patient information
- `ConfirmDetailsStep.jsx` - Review all details before confirming

**Utility Components**
- `StepIndicator.jsx` - Visual progress indicator with step icons

### 4. Integration with App

The BookingForm component can be integrated into your main app like this:

```jsx
import BookingForm from './components/checkout/BookingForm';

// In your router or main component:
<Route path="/booking" element={<BookingForm />} />
```

## Features

### Step 1: Dentist Selection
- Grid view of all available dentists
- Display doctor info: name, specialization, years of experience
- Show contact details and bio
- Visual indication of selected doctor
- Ratings display

### Step 2: Date & Time
- Date picker (minimum 1 day from now)
- Time slot availability based on doctor's schedule
- Visual feedback of selected date/time
- Prevents booking past dates

### Step 3: Cart Services
- Grid of services offered by selected doctor
- Service details: description, price, duration
- Add/remove services with quantity control
- Real-time price calculation
- Service summary with total cost

### Step 4: Patient Details
- Comprehensive patient information form
- Required fields: First name, Last name, Email, Phone
- Optional fields: DOB, gender, address, medical history, allergies
- Form validation
- Clean, organized layout

### Step 5: Confirm Details
- Complete appointment summary
- Review all selected information
- Color-coded sections for different details
- Terms and conditions checkbox
- Submit button with loading state

## Sample Data

The database is pre-populated with:

**Dentists:**
1. William Demo Dentist - General Dentistry
2. Dr B. Sick - Orthodontics
3. Dr Carey - Prosthodontics
4. Dr Fillmore - Periodontics
5. Dr Pulley - Endodontics

**Services:**
- Routine Cleaning ($99.99, 45 min)
- Dental Exam ($79.99, 30 min)
- X-Ray Full Mouth ($149.99, 15 min)
- Cavity Filling ($199.99, 30 min)
- Root Canal Treatment ($899.99, 90 min)
- Teeth Whitening ($299.99, 60 min)
- Dental Crown ($1199.99, 120 min)
- Extraction ($299.99, 30 min)
- Scaling and Root Planing ($349.99, 60 min)
- Orthodontic Consultation ($199.99, 45 min)

## Responsive Design

All components are fully responsive:
- Mobile-first approach
- Tailwind CSS for styling
- Grid layouts adapt to screen size
- Touch-friendly buttons and inputs
- Readable on all devices

## Error Handling

The system includes comprehensive error handling:
- Field validation on each step
- API error responses with user-friendly messages
- Slot availability checking
- Duplicate appointment prevention
- Session error recovery

## Future Enhancements

Potential improvements:
- Payment gateway integration
- SMS/Email confirmations (already infrastructure in place)
- Admin panel for managing doctors/services/appointments
- Patient history and medical records
- Automated reminders
- Cancellation and rescheduling features
- Multi-language support
- Insurance information handling

## Technical Stack

**Frontend:**
- React 19.2
- Vite
- Tailwind CSS 3.3
- Lucide React (icons)
- Axios (HTTP client)

**Backend:**
- Node.js / Express
- PostgreSQL 
- CORS enabled
- Nodemailer integration

## API Response Format

All endpoints follow a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Description of error"
}
```

## Styling

The booking form uses a professional design with:
- Blue and indigo color scheme
- Clear, readable typography
- Proper spacing and padding
- Visual consistency across all steps
- Accessible color contrasts
- Smooth transitions and animations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
