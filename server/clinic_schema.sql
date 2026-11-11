-- Clinic Booking System Database Schema

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    bio TEXT,
    years_experience INT,
    profile_image_url VARCHAR(500),
    qualification VARCHAR(255),
    license_number VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table (dental procedures/services)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    medical_history TEXT,
    allergies TEXT,
    insurance_provider VARCHAR(255),
    insurance_id VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments/bookings table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_datetime TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
);

-- Create appointment_services table (junction table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS appointment_services (
    id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price_at_booking DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

-- Create doctor_availability table
CREATE TABLE IF NOT EXISTS doctor_availability (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create doctor_services table (what services each doctor offers)
CREATE TABLE IF NOT EXISTS doctor_services (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    service_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(doctor_id, service_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_services_doctor_id ON doctor_services(doctor_id);

-- Insert sample doctors
INSERT INTO doctors (first_name, last_name, specialization, email, phone_number, bio, years_experience, qualification, license_number, is_available)
VALUES 
    ('William', 'Demo Dentist', 'General Dentistry', 'demostaff3@bookingp.com', '(201) 555-1210', 'Experienced general dentist with focus on patient comfort', 10, 'DDS', 'DEN001', true),
    ('B.', 'Sick', 'Orthodontics', 'drbsick@bookingpress.com', '(201) 221-5141', 'Specialist in orthodontic treatments and alignment', 15, 'DDS, Orthodontics', 'ORTHO001', true),
    ('Carey', 'Doctor', 'Prosthodontics', 'drcarey@bookingpress.com', '(201) 555-1218', 'Expert in dental prosthetics and implants', 12, 'DDS, Prosthodontics', 'PROST001', true),
    ('Fillmore', 'Doctor', 'Periodontics', 'drfillmore@bookingpress.com', '(201) 555-1210', 'Specializing in gum and periodontal disease treatment', 8, 'DDS, Periodontics', 'PERIO001', true),
    ('Pulley', 'Doctor', 'Endodontics', 'drpulley@bookingpress.com', '(201) 555-1419', 'Root canal specialist with advanced techniques', 11, 'DDS, Endodontics', 'ENDO001', true);

-- Insert sample services
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES 
    ('Routine Cleaning', 'Professional cleaning and plaque removal', 99.99, 45, 'Preventive', true),
    ('Dental Exam', 'Comprehensive dental examination', 79.99, 30, 'Preventive', true),
    ('X-Ray (Full Mouth)', 'Complete set of dental X-rays', 149.99, 15, 'Diagnostic', true),
    ('Cavity Filling', 'Tooth-colored composite filling', 199.99, 30, 'Restorative', true),
    ('Root Canal Treatment', 'Complete root canal therapy', 899.99, 90, 'Endodontic', true),
    ('Teeth Whitening', 'Professional in-office whitening', 299.99, 60, 'Cosmetic', true),
    ('Dental Crown', 'Porcelain dental crown', 1199.99, 120, 'Restorative', true),
    ('Extraction', 'Tooth extraction procedure', 299.99, 30, 'Surgical', true),
    ('Scaling and Root Planing', 'Deep cleaning for gum disease', 349.99, 60, 'Periodontal', true),
    ('Orthodontic Consultation', 'Braces and alignment consultation', 199.99, 45, 'Orthodontic', true);

-- Insert sample doctor availability (working hours)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
VALUES 
    (1, 'Monday', '09:00', '17:00', true),
    (1, 'Tuesday', '09:00', '17:00', true),
    (1, 'Wednesday', '09:00', '17:00', true),
    (1, 'Thursday', '09:00', '17:00', true),
    (1, 'Friday', '09:00', '17:00', true),
    (2, 'Monday', '10:00', '18:00', true),
    (2, 'Tuesday', '10:00', '18:00', true),
    (2, 'Wednesday', '10:00', '18:00', true),
    (2, 'Thursday', '10:00', '18:00', true),
    (2, 'Friday', '10:00', '18:00', true),
    (3, 'Monday', '08:00', '16:00', true),
    (3, 'Tuesday', '08:00', '16:00', true),
    (3, 'Wednesday', '08:00', '16:00', true),
    (3, 'Thursday', '08:00', '16:00', true),
    (3, 'Friday', '08:00', '16:00', true);

-- Insert doctor services (which services each doctor provides)
INSERT INTO doctor_services (doctor_id, service_id)
VALUES 
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 6), (1, 10),
    (2, 2), (2, 3), (2, 10),
    (3, 2), (3, 3), (3, 7),
    (4, 2), (4, 3), (4, 9),
    (5, 2), (5, 3), (5, 5);
