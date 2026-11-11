const express = require('express');
const cors = require('cors');
const pool = require('./db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory session store (for demo - use Redis in production)
const sessions = new Map();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Base URL for the frontend (change this in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Semaphore SMS API configuration
const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY || '';
const SEMAPHORE_SENDER_NAME = process.env.SEMAPHORE_SENDER_NAME || 'CLINIC';

// Function to send SMS via Semaphore
const sendSMS = async (phoneNumber, message) => {
  if (!SEMAPHORE_API_KEY) {
    console.log('SMS not sent - SEMAPHORE_API_KEY not configured');
    return false;
  }

  try {
    // Format phone number for Philippines (remove leading 0, add 63)
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '63' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('63')) {
      formattedNumber = '63' + formattedNumber;
    }

    const response = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: SEMAPHORE_API_KEY,
        number: formattedNumber,
        message: message,
        sendername: SEMAPHORE_SENDER_NAME
      })
    });

    const data = await response.json();
    console.log('SMS sent to:', formattedNumber, data);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
};

// Function to send confirmation email
const sendConfirmationEmail = async (appointment) => {
  const cancelUrl = `${FRONTEND_URL}?page=my-appointment&token=${appointment.cancel_token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: 'Appointment Confirmation - HealthCare Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1c1917; padding: 20px; text-align: center;">
          <h1 style="color: #E4FE7B; margin: 0;">HealthCare Clinic</h1>
        </div>
        <div style="padding: 30px; background: #f5f5f5;">
          <h2 style="color: #1c1917;">Appointment Confirmed!</h2>
          <p>Dear <strong>${appointment.full_name}</strong>,</p>
          <p>Your appointment has been successfully booked. Here are your details:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${appointment.service_type}</p>
            <p><strong>Date:</strong> ${appointment.preferred_date}</p>
            <p><strong>Time:</strong> ${appointment.preferred_time}</p>
            <p><strong>Reference ID:</strong> #${appointment.id}</p>
          </div>

          <p style="color: #666;">Please arrive 10 minutes before your scheduled time.</p>

          <div style="margin: 25px 0; text-align: center;">
            <a href="${cancelUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Cancel Appointment
            </a>
            <p style="color: #888; font-size: 12px; margin-top: 10px;">
              Or manage your appointment at: <a href="${cancelUrl}" style="color: #1c1917;">${FRONTEND_URL}?page=my-appointment</a>
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              HealthCare Clinic<br>
              Cantecson, Gairan, Bogo City, Cebu<br>
              Phone: +63 912 345 6789
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to:', appointment.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Create a new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      serviceType,
      preferredDate,
      preferredTime,
      notes
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !email || !serviceType || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Check for overlapping appointments (same date and time)
    const overlapCheck = await pool.query(
      `SELECT * FROM appointments
       WHERE preferred_date = $1
       AND preferred_time = $2
       AND status != 'cancelled'`,
      [preferredDate, preferredTime]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Sorry, the time slot ${preferredTime} on ${preferredDate} is already booked. Please choose a different time.`
      });
    }

    // Generate a unique cancel token
    const cancelToken = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Insert into database
    const query = `
      INSERT INTO appointments (full_name, phone_number, email, service_type, preferred_date, preferred_time, notes, cancel_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [fullName, phoneNumber, email, serviceType, preferredDate, preferredTime, notes || '', cancelToken];
    const result = await pool.query(query, values);

    // Send confirmation email and SMS (don't wait for it, don't fail if it fails)
    const appointment = result.rows[0];
    sendConfirmationEmail(appointment).catch(err => console.error('Email error:', err));

    // Send SMS confirmation
    const smsMessage = `Hi ${appointment.full_name}, your appointment at HealthCare Clinic is confirmed for ${appointment.preferred_date} at ${appointment.preferred_time}. Ref#${appointment.id}`;
    sendSMS(appointment.phone_number, smsMessage).catch(err => console.error('SMS error:', err));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! A confirmation email has been sent.',
      appointment: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment. Please try again.'
    });
  }
});

// Create a new BPLO Unified Permit Application
app.post('/api/bplo-applications', async (req, res) => {
  try {
    const {
      applicationType,
      amendmentType,
      modeOfPayment,
      transferLocation,
      businessStartDate,
      dateOfApplication,
      referenceNo,
      dtiSecCdaRegNo,
      dtiSecCdaRegDate,
      typeOfOrganization,
      tinNo,
      hasTaxIncentive,
      taxIncentiveEntity,
      ctcNo,
      taxpayerLastName,
      taxpayerFirstName,
      taxpayerMiddleName,
      businessName,
      tradeNameFranchise,
      corpPresidentLastName,
      corpPresidentFirstName,
      corpPresidentMiddleName,
      busHouseBldgNo,
      busBuildingName,
      busStreet,
      busBarangay,
      busSubdivisionLandmark,
      busCityMunicipality,
      busProvince,
      busTelephoneNo,
      busEmailAddress,
      ownerHouseBldgNo,
      ownerBuildingName,
      ownerStreet,
      ownerBarangay,
      ownerSubdivisionLandmark,
      ownerCityMunicipality,
      ownerProvince,
      ownerTelephoneNo,
      ownerEmailAddress,
      numEmployeesMale,
      numEmployeesFemale,
      numEmployeesBogoResiding,
      isRented,
      lessorName,
      monthlyRental,
      lessorAddress,
      lessorContactNo,
      lessorEmailAddress,
      emergencyContactPerson,
      emergencyContactNo,
      emergencyEmailAddress,
      businessActivities,
      applicantSignatureName
    } = req.body;

    const refNo = referenceNo || ('BPLO-' + Date.now().toString(36).toUpperCase());

    const query = `
      INSERT INTO bplo_application (
        application_type, amendment_type, mode_of_payment, transfer_location, business_start_date,
        date_of_application, reference_no, dti_sec_cda_reg_no, dti_sec_cda_reg_date, type_of_organization,
        tin_no, has_tax_incentive, tax_incentive_entity, ctc_no, taxpayer_last_name,
        taxpayer_first_name, taxpayer_middle_name, business_name, trade_name_franchise,
        corp_president_treasurer_last_name, corp_president_treasurer_first_name, corp_president_treasurer_middle_name,
        bus_house_bldg_no, bus_building_name, bus_street, bus_barangay, bus_subdivision_landmark,
        bus_city_municipality, bus_province, bus_telephone_no, bus_email_address,
        owner_house_bldg_no, owner_building_name, owner_street, owner_barangay, owner_subdivision_landmark,
        owner_city_municipality, owner_province, owner_telephone_no, owner_email_address,
        num_employees_male, num_employees_female, num_employees_bogo_residing, is_rented,
        lessor_name, monthly_rental, lessor_address, lessor_contact_no, lessor_email_address,
        emergency_contact_person, emergency_contact_no, emergency_email_address, business_activities,
        applicant_signature_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54
      ) RETURNING *
    `;

    const values = [
      applicationType || 'New', amendmentType || null, modeOfPayment || 'Annually', transferLocation || false, businessStartDate || null,
      dateOfApplication || new Date(), refNo, dtiSecCdaRegNo || null, dtiSecCdaRegDate || null, typeOfOrganization || 'Single',
      tinNo || null, hasTaxIncentive || false, taxIncentiveEntity || null, ctcNo || null, taxpayerLastName || '',
      taxpayerFirstName || '', taxpayerMiddleName || null, businessName || '', tradeNameFranchise || null,
      corpPresidentLastName || null, corpPresidentFirstName || null, corpPresidentMiddleName || null,
      busHouseBldgNo || null, busBuildingName || null, busStreet || null, busBarangay || '', busSubdivisionLandmark || null,
      busCityMunicipality || 'City of Bogo', busProvince || 'Cebu', busTelephoneNo || null, busEmailAddress || null,
      ownerHouseBldgNo || null, ownerBuildingName || null, ownerStreet || null, ownerBarangay || null, ownerSubdivisionLandmark || null,
      ownerCityMunicipality || null, ownerProvince || null, ownerTelephoneNo || null, ownerEmailAddress || null,
      parseInt(numEmployeesMale) || 0, parseInt(numEmployeesFemale) || 0, parseInt(numEmployeesBogoResiding) || 0, isRented || false,
      lessorName || null, parseFloat(monthlyRental) || null, lessorAddress || null, lessorContactNo || null, lessorEmailAddress || null,
      emergencyContactPerson || null, emergencyContactNo || null, emergencyEmailAddress || null, JSON.stringify(businessActivities || []),
      applicantSignatureName || null
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Unified Business Permit Application submitted successfully!',
      referenceNo: refNo,
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating BPLO application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application: ' + error.message
    });
  }
});

// Get available time slots for a specific date
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if date is blocked (holiday/closed)
    const blockedCheck = await pool.query(
      'SELECT * FROM blocked_dates WHERE blocked_date = $1',
      [date]
    );

    if (blockedCheck.rows.length > 0) {
      return res.json({
        success: true,
        date,
        availableSlots: [],
        bookedSlots: [],
        blocked: true,
        blockReason: blockedCheck.rows[0].reason
      });
    }

    // All possible time slots
    const allSlots = [
      '9:00 AM', '10:00 AM', '11:00 AM',
      '2:00 PM', '3:00 PM', '4:00 PM'
    ];

    // Get booked slots for the date
    const bookedResult = await pool.query(
      `SELECT preferred_time FROM appointments
       WHERE preferred_date = $1
       AND status != 'cancelled'`,
      [date]
    );

    const bookedSlots = bookedResult.rows.map(row => row.preferred_time);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      date,
      availableSlots,
      bookedSlots,
      blocked: false
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots'
    });
  }
});

// Get all appointments (for admin purposes)
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

// Search appointments with filters (must be before /:id route)
app.get('/api/appointments/search', async (req, res) => {
  try {
    const { query, startDate, endDate, status } = req.query;

    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (query) {
      sql += ` AND (
        LOWER(full_name) LIKE LOWER($${paramIndex}) OR
        phone_number LIKE $${paramIndex} OR
        LOWER(email) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND preferred_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND preferred_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (status && status !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ' ORDER BY preferred_date DESC, preferred_time DESC';

    const result = await pool.query(sql, params);

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// Get a single appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment'
    });
  }
});

// Update appointment status
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
});

// ==================== ADMIN AUTHENTICATION ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check against environment variables (simple approach)
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    if (username === adminUser && password === adminPass) {
      // Generate simple session token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessions.set(token, { username, loginTime: new Date() });

      res.json({
        success: true,
        message: 'Login successful',
        token
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Verify admin token
app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token && sessions.has(token)) {
    res.json({ success: true, valid: true });
  } else {
    res.status(401).json({ success: false, valid: false });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    sessions.delete(token);
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// ==================== PATIENT SELF-SERVICE ====================

// Look up appointment by email and reference ID
app.post('/api/patient/lookup', async (req, res) => {
  try {
    const { email, referenceId } = req.body;

    if (!email || !referenceId) {
      return res.status(400).json({
        success: false,
        message: 'Email and Reference ID are required'
      });
    }

    const result = await pool.query(
      `SELECT id, full_name, phone_number, email, service_type, preferred_date, preferred_time, notes, status, cancel_token, created_at
       FROM appointments
       WHERE LOWER(email) = LOWER($1) AND id = $2`,
      [email, referenceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found. Please check your email and reference ID.'
      });
    }

    res.json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to look up appointment'
    });
  }
});

// Get appointment by cancel token (for email link)
app.get('/api/patient/appointment/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, phone_number, email, service_type, preferred_date, preferred_time, notes, status, cancel_token, created_at
       FROM appointments
       WHERE cancel_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or link has expired'
      });
    }

    res.json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Token lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment'
    });
  }
});

// Patient cancels their own appointment
app.post('/api/patient/cancel', async (req, res) => {
  try {
    const { cancelToken, reason } = req.body;

    if (!cancelToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cancellation request'
      });
    }

    // Get the appointment
    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE cancel_token = $1',
      [cancelToken]
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const apt = appointment.rows[0];

    // Check if already cancelled
    if (apt.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been cancelled'
      });
    }

    // Check if appointment is in the past
    const appointmentDate = new Date(apt.preferred_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past appointments'
      });
    }

    // Cancel the appointment
    await pool.query(
      `UPDATE appointments
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP, cancellation_reason = $1
       WHERE cancel_token = $2`,
      [reason || 'Cancelled by patient', cancelToken]
    );

    // Send cancellation confirmation email
    sendCancellationEmail(apt).catch(err => console.error('Cancellation email error:', err));

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// Function to send cancellation confirmation email
const sendCancellationEmail = async (appointment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: 'Appointment Cancelled - HealthCare Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1c1917; padding: 20px; text-align: center;">
          <h1 style="color: #E4FE7B; margin: 0;">HealthCare Clinic</h1>
        </div>
        <div style="padding: 30px; background: #f5f5f5;">
          <h2 style="color: #dc2626;">Appointment Cancelled</h2>
          <p>Dear <strong>${appointment.full_name}</strong>,</p>
          <p>Your appointment has been successfully cancelled. Here were the details:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; opacity: 0.7;">
            <p style="text-decoration: line-through;"><strong>Service:</strong> ${appointment.service_type}</p>
            <p style="text-decoration: line-through;"><strong>Date:</strong> ${appointment.preferred_date}</p>
            <p style="text-decoration: line-through;"><strong>Time:</strong> ${appointment.preferred_time}</p>
            <p><strong>Reference ID:</strong> #${appointment.id}</p>
          </div>

          <p style="color: #666;">If you didn't request this cancellation or need to book a new appointment, please visit our website or contact us.</p>

          <div style="margin: 25px 0; text-align: center;">
            <a href="${FRONTEND_URL}" style="display: inline-block; padding: 12px 24px; background: #E4FE7B; color: #1c1917; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Book New Appointment
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              HealthCare Clinic<br>
              Cantecson, Gairan, Bogo City, Cebu<br>
              Phone: +63 912 345 6789
            </p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('Cancellation email sent to:', appointment.email);
};

// ==================== SEARCH & FILTER ====================
// (Moved to before /api/appointments/:id route)

// ==================== RESCHEDULE APPOINTMENT ====================

// Reschedule an appointment
app.put('/api/appointments/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { preferredDate, preferredTime } = req.body;

    if (!preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required'
      });
    }

    // Check if the new slot is available
    const overlapCheck = await pool.query(
      `SELECT * FROM appointments
       WHERE preferred_date = $1
       AND preferred_time = $2
       AND status != 'cancelled'
       AND id != $3`,
      [preferredDate, preferredTime, id]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'The selected time slot is not available'
      });
    }

    // Get the old appointment details for email
    const oldAppointment = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (oldAppointment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update the appointment
    const result = await pool.query(
      `UPDATE appointments
       SET preferred_date = $1, preferred_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [preferredDate, preferredTime, id]
    );

    // Send reschedule confirmation email
    const appointment = result.rows[0];
    sendRescheduleEmail(appointment, oldAppointment.rows[0]).catch(err =>
      console.error('Reschedule email error:', err)
    );

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment'
    });
  }
});

// Function to send reschedule email
const sendRescheduleEmail = async (newAppointment, oldAppointment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: newAppointment.email,
    subject: 'Appointment Rescheduled - HealthCare Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1c1917; padding: 20px; text-align: center;">
          <h1 style="color: #E4FE7B; margin: 0;">HealthCare Clinic</h1>
        </div>
        <div style="padding: 30px; background: #f5f5f5;">
          <h2 style="color: #1c1917;">Appointment Rescheduled</h2>
          <p>Dear <strong>${newAppointment.full_name}</strong>,</p>
          <p>Your appointment has been rescheduled. Here are your new details:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${newAppointment.service_type}</p>
            <p><strong>New Date:</strong> ${newAppointment.preferred_date}</p>
            <p><strong>New Time:</strong> ${newAppointment.preferred_time}</p>
            <p style="color: #888; text-decoration: line-through;">
              Previous: ${oldAppointment.preferred_date} at ${oldAppointment.preferred_time}
            </p>
            <p><strong>Reference ID:</strong> #${newAppointment.id}</p>
          </div>

          <p style="color: #666;">Please arrive 10 minutes before your scheduled time.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              HealthCare Clinic<br>
              Cantecson, Gairan, Bogo City, Cebu<br>
              Phone: +63 912 345 6789
            </p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('Reschedule email sent to:', newAppointment.email);
};

// ==================== REMINDER EMAILS ====================

// Function to send reminder email
const sendReminderEmail = async (appointment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: 'Appointment Reminder - Tomorrow at HealthCare Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1c1917; padding: 20px; text-align: center;">
          <h1 style="color: #E4FE7B; margin: 0;">HealthCare Clinic</h1>
        </div>
        <div style="padding: 30px; background: #f5f5f5;">
          <h2 style="color: #1c1917;">Appointment Reminder</h2>
          <p>Dear <strong>${appointment.full_name}</strong>,</p>
          <p>This is a friendly reminder that you have an appointment <strong>tomorrow</strong>.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${appointment.service_type}</p>
            <p><strong>Date:</strong> ${appointment.preferred_date}</p>
            <p><strong>Time:</strong> ${appointment.preferred_time}</p>
            <p><strong>Reference ID:</strong> #${appointment.id}</p>
          </div>

          <p style="color: #666;">Please arrive 10 minutes before your scheduled time.</p>
          <p style="color: #666;">If you need to cancel or reschedule, please contact us as soon as possible.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              HealthCare Clinic<br>
              Cantecson, Gairan, Bogo City, Cebu<br>
              Phone: +63 912 345 6789
            </p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log('Reminder email sent to:', appointment.email);
};

// Check and send reminder emails (runs every hour)
const checkAndSendReminders = async () => {
  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find appointments for tomorrow that haven't been reminded
    const result = await pool.query(
      `SELECT * FROM appointments
       WHERE preferred_date = $1
       AND status IN ('pending', 'confirmed')
       AND (reminder_sent IS NULL OR reminder_sent = false)`,
      [tomorrowStr]
    );

    for (const appointment of result.rows) {
      try {
        await sendReminderEmail(appointment);
        // Mark as reminded
        await pool.query(
          'UPDATE appointments SET reminder_sent = true WHERE id = $1',
          [appointment.id]
        );
      } catch (err) {
        console.error(`Failed to send reminder to ${appointment.email}:`, err);
      }
    }

    if (result.rows.length > 0) {
      console.log(`Sent ${result.rows.length} reminder emails`);
    }
  } catch (error) {
    console.error('Reminder check error:', error);
  }
};

// Run reminder check every hour
setInterval(checkAndSendReminders, 60 * 60 * 1000);

// Also run once on server start
setTimeout(checkAndSendReminders, 5000);

// ==================== BLOCKED DATES / HOLIDAYS ====================

// Get all blocked dates
app.get('/api/blocked-dates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blocked_dates ORDER BY blocked_date ASC'
    );
    res.json({ success: true, blockedDates: result.rows });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blocked dates' });
  }
});

// Add a blocked date
app.post('/api/blocked-dates', async (req, res) => {
  try {
    const { blockedDate, reason } = req.body;

    if (!blockedDate) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const result = await pool.query(
      'INSERT INTO blocked_dates (blocked_date, reason) VALUES ($1, $2) RETURNING *',
      [blockedDate, reason || 'Holiday/Clinic Closed']
    );

    res.status(201).json({ success: true, blockedDate: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This date is already blocked' });
    }
    console.error('Error adding blocked date:', error);
    res.status(500).json({ success: false, message: 'Failed to add blocked date' });
  }
});

// Delete a blocked date
app.delete('/api/blocked-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM blocked_dates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Blocked date removed' });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blocked date' });
  }
});

// ==================== DOCTORS MANAGEMENT ====================

// Get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM doctors ORDER BY first_name, last_name ASC'
    );
    res.json({ success: true, doctors: result.rows });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

// Add a doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const { name, specialization, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Doctor name is required' });
    }

    const result = await pool.query(
      'INSERT INTO doctors (name, specialization, color) VALUES ($1, $2, $3) RETURNING *',
      [name, specialization || 'General Practice', color || '#3B82F6']
    );

    res.status(201).json({ success: true, doctor: result.rows[0] });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to add doctor' });
  }
});

// Update a doctor
app.put('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialization, color, active } = req.body;

    const result = await pool.query(
      `UPDATE doctors SET name = COALESCE($1, name), specialization = COALESCE($2, specialization),
       color = COALESCE($3, color), active = COALESCE($4, active), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, specialization, color, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, doctor: result.rows[0] });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to update doctor' });
  }
});

// Delete a doctor
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM doctors WHERE id = $1', [id]);
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to delete doctor' });
  }
});

// ==================== SERVICES WITH DURATION ====================

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE active = true ORDER BY name ASC'
    );
    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Add a service
app.post('/api/services', async (req, res) => {
  try {
    const { name, duration, price, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }

    const result = await pool.query(
      'INSERT INTO services (name, duration, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, duration || 30, price || 0, description || '']
    );

    res.status(201).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ success: false, message: 'Failed to add service' });
  }
});

// Update a service
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, price, description, active } = req.body;

    const result = await pool.query(
      `UPDATE services SET name = COALESCE($1, name), duration = COALESCE($2, duration),
       price = COALESCE($3, price), description = COALESCE($4, description),
       active = COALESCE($5, active), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, duration, price, description, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

// Delete a service
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE services SET active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Service deactivated' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// ==================== REPORTS & ANALYTICS ====================

// Get appointment statistics
app.get('/api/reports/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE preferred_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE preferred_date >= $1';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE preferred_date <= $1';
      params.push(endDate);
    }

    // Total appointments by status
    const statusStats = await pool.query(
      `SELECT status, COUNT(*) as count FROM appointments ${dateFilter} GROUP BY status`,
      params
    );

    // Appointments by service type
    const serviceStats = await pool.query(
      `SELECT service_type, COUNT(*) as count FROM appointments ${dateFilter} GROUP BY service_type ORDER BY count DESC`,
      params
    );

    // Daily appointment count (last 30 days)
    const dailyStats = await pool.query(
      `SELECT preferred_date as date, COUNT(*) as count
       FROM appointments
       WHERE preferred_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY preferred_date
       ORDER BY preferred_date ASC`
    );

    // Peak hours
    const hourlyStats = await pool.query(
      `SELECT preferred_time as time, COUNT(*) as count
       FROM appointments ${dateFilter}
       GROUP BY preferred_time
       ORDER BY count DESC`,
      params
    );

    // Total counts
    const totals = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed
       FROM appointments ${dateFilter}`,
      params
    );

    res.json({
      success: true,
      stats: {
        totals: totals.rows[0],
        byStatus: statusStats.rows,
        byService: serviceStats.rows,
        daily: dailyStats.rows,
        hourly: hourlyStats.rows
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// ==================== EXPORT TO CSV ====================

// Export appointments to CSV
app.get('/api/export/appointments', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND preferred_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND preferred_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (status && status !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
    }

    sql += ' ORDER BY preferred_date DESC, preferred_time DESC';

    const result = await pool.query(sql, params);

    // Convert to CSV
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Created At'];
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const values = [
        row.id,
        `"${row.full_name}"`,
        row.phone_number,
        row.email,
        `"${row.service_type}"`,
        row.preferred_date,
        row.preferred_time,
        row.status,
        `"${(row.notes || '').replace(/"/g, '""')}"`,
        row.created_at
      ];
      csvRows.push(values.join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=appointments_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// ==================== CALENDAR DATA ====================

// Get appointments for calendar view
app.get('/api/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const appointments = await pool.query(
      `SELECT id, full_name, service_type, preferred_date, preferred_time, status
       FROM appointments
       WHERE preferred_date >= $1 AND preferred_date <= $2
       ORDER BY preferred_date, preferred_time`,
      [startDate, endDate]
    );

    const blockedDates = await pool.query(
      `SELECT blocked_date, reason FROM blocked_dates
       WHERE blocked_date >= $1 AND blocked_date <= $2`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      appointments: appointments.rows,
      blockedDates: blockedDates.rows
    });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar data' });
  }
});

// ==================== SEND SMS NOTIFICATION ====================

// Send SMS reminder manually
app.post('/api/send-sms', async (req, res) => {
  try {
    const { appointmentId, message } = req.body;

    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const apt = appointment.rows[0];
    const smsMessage = message || `Hi ${apt.full_name}, reminder: Your appointment at HealthCare Clinic is on ${apt.preferred_date} at ${apt.preferred_time}. Ref#${apt.id}`;

    const sent = await sendSMS(apt.phone_number, smsMessage);

    if (sent) {
      res.json({ success: true, message: 'SMS sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send SMS. Check API key configuration.' });
    }
  } catch (error) {
    console.error('SMS send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send SMS' });
  }
});

// ==================== QUEUE SYSTEM ENDPOINTS ====================

// Get active transaction types
app.get('/api/queue/transaction-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM queue_transaction_types WHERE active = true ORDER BY name');
    res.json({ success: true, types: result.rows });
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction types' });
  }
});

// Create a queue ticket
app.post('/api/queue/tickets', async (req, res) => {
  try {
    const { customerName, cellphoneNumber, transactionType, isPriority, priorityType } = req.body;

    // Get prefix for this transaction type
    const typeResult = await pool.query(
      'SELECT prefix FROM queue_transaction_types WHERE name = $1 AND active = true',
      [transactionType]
    );
    const prefix = typeResult.rows.length > 0 ? typeResult.rows[0].prefix : 'GN';

    // Get next number for this transaction type today
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM queue_tickets WHERE transaction_type = $1 AND queue_date = CURRENT_DATE",
      [transactionType]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const ticketNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    // Get queue position (how many waiting ahead)
    const posResult = await pool.query(
      "SELECT COUNT(*) as count FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE"
    );
    const position = parseInt(posResult.rows[0].count) + 1;

    const result = await pool.query(
      `INSERT INTO queue_tickets (ticket_number, customer_name, cellphone_number, transaction_type, status, queue_date, is_priority, priority_type)
       VALUES ($1, $2, $3, $4, 'waiting', CURRENT_DATE, $5, $6) RETURNING *`,
      [ticketNumber, customerName, cellphoneNumber, transactionType, isPriority || false, priorityType || null]
    );

    res.json({ success: true, ticket: result.rows[0], position });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
});

// Get queue display data (public)
app.get('/api/queue/display', async (req, res) => {
  try {
    const serving = await pool.query(
      "SELECT * FROM queue_tickets WHERE status = 'serving' AND queue_date = CURRENT_DATE ORDER BY called_at DESC"
    );
    const waiting = await pool.query(
      "SELECT * FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE ORDER BY is_priority DESC, created_at ASC"
    );

    // Calculate average serving time from today's completed tickets
    const avgResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - called_at))) as avg_seconds
       FROM queue_tickets
       WHERE status = 'completed' AND queue_date = CURRENT_DATE
       AND completed_at IS NOT NULL AND called_at IS NOT NULL`
    );
    const avgServingTime = Math.round(avgResult.rows[0].avg_seconds) || 300; // default 5 min

    // Add estimated wait time to each waiting ticket based on position
    const waitingWithEstimates = waiting.rows.map((ticket, index) => ({
      ...ticket,
      estimatedWait: (index + 1) * avgServingTime
    }));

    res.json({ success: true, serving: serving.rows, waiting: waitingWithEstimates, avgServingTime });
  } catch (error) {
    console.error('Error fetching display data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch display data' });
  }
});

// Get all teller windows
app.get('/api/queue/tellers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        COALESCE(
          json_agg(json_build_object('id', tt.id, 'name', tt.name, 'prefix', tt.prefix))
          FILTER (WHERE tt.id IS NOT NULL), '[]'
        ) as assigned_types
      FROM queue_tellers t
      LEFT JOIN queue_window_transactions wt ON t.id = wt.teller_id
      LEFT JOIN queue_transaction_types tt ON wt.transaction_type_id = tt.id AND tt.active = true
      WHERE t.is_active = true
      GROUP BY t.id
      ORDER BY t.window_name
    `);
    res.json({ success: true, tellers: result.rows });
  } catch (error) {
    console.error('Error fetching tellers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tellers' });
  }
});

// Get current ticket for a teller window
app.get('/api/queue/teller/:windowName/current', async (req, res) => {
  try {
    const { windowName } = req.params;
    const result = await pool.query(
      "SELECT * FROM queue_tickets WHERE teller_window = $1 AND status = 'serving' AND queue_date = CURRENT_DATE LIMIT 1",
      [windowName]
    );
    const skipped = await pool.query(
      "SELECT * FROM queue_tickets WHERE teller_window = $1 AND status = 'skipped' AND queue_date = CURRENT_DATE ORDER BY called_at DESC",
      [windowName]
    );
    const completedCount = await pool.query(
      "SELECT COUNT(*) as count FROM queue_tickets WHERE teller_window = $1 AND status = 'completed' AND queue_date = CURRENT_DATE",
      [windowName]
    );
    // Get assigned transaction types for this window
    const assignedTypes = await pool.query(
      `SELECT tt.name FROM queue_window_transactions wt
       JOIN queue_tellers t ON wt.teller_id = t.id
       JOIN queue_transaction_types tt ON wt.transaction_type_id = tt.id
       WHERE t.window_name = $1 AND t.is_active = true AND tt.active = true`,
      [windowName]
    );
    const typeNames = assignedTypes.rows.map(r => r.name);

    // Filter waiting tickets by assigned types if any
    let waitingTickets;
    if (typeNames.length > 0) {
      waitingTickets = await pool.query(
        "SELECT * FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE AND transaction_type = ANY($1::text[]) ORDER BY is_priority DESC, created_at ASC",
        [typeNames]
      );
    } else {
      waitingTickets = await pool.query(
        "SELECT * FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE ORDER BY is_priority DESC, created_at ASC"
      );
    }
    // Average serving time for this window today
    const avgServing = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - called_at))) as avg_seconds
       FROM queue_tickets
       WHERE teller_window = $1 AND status = 'completed' AND queue_date = CURRENT_DATE
       AND completed_at IS NOT NULL AND called_at IS NOT NULL`,
      [windowName]
    );

    res.json({
      success: true,
      current: result.rows[0] || null,
      skipped: skipped.rows,
      completedCount: parseInt(completedCount.rows[0].count),
      waitingCount: waitingTickets.rows.length,
      waitingTickets: waitingTickets.rows,
      assignedTypes: typeNames,
      avgServingTime: Math.round(avgServing.rows[0].avg_seconds) || 0
    });
  } catch (error) {
    console.error('Error fetching teller current:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch current ticket' });
  }
});

// Teller calls next ticket
app.post('/api/queue/teller/next', async (req, res) => {
  try {
    const { windowName, tellerName } = req.body;

    // Check if teller already has a serving ticket
    const existing = await pool.query(
      "SELECT * FROM queue_tickets WHERE teller_window = $1 AND status = 'serving' AND queue_date = CURRENT_DATE",
      [windowName]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Please complete or skip the current ticket first' });
    }

    // Get assigned transaction types for this window
    const assignedTypes = await pool.query(
      `SELECT tt.name FROM queue_window_transactions wt
       JOIN queue_tellers t ON wt.teller_id = t.id
       JOIN queue_transaction_types tt ON wt.transaction_type_id = tt.id
       WHERE t.window_name = $1 AND t.is_active = true AND tt.active = true`,
      [windowName]
    );
    const typeNames = assignedTypes.rows.map(r => r.name);

    // Get next waiting ticket (Priority first, then FIFO), filtered by assigned types if any
    let next;
    if (typeNames.length > 0) {
      next = await pool.query(
        "SELECT * FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE AND transaction_type = ANY($1::text[]) ORDER BY is_priority DESC, created_at ASC LIMIT 1",
        [typeNames]
      );
    } else {
      next = await pool.query(
        "SELECT * FROM queue_tickets WHERE status = 'waiting' AND queue_date = CURRENT_DATE ORDER BY is_priority DESC, created_at ASC LIMIT 1"
      );
    }

    if (next.rows.length === 0) {
      return res.json({ success: false, message: typeNames.length > 0 ? 'No matching tickets waiting for this window' : 'No tickets waiting in queue' });
    }

    const ticket = next.rows[0];
    const result = await pool.query(
      "UPDATE queue_tickets SET status = 'serving', teller_window = $1, teller_name = $2, called_at = NOW() WHERE id = $3 RETURNING *",
      [windowName, tellerName || null, ticket.id]
    );

    res.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Error calling next ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to call next ticket' });
  }
});

// Complete a ticket
app.patch('/api/queue/tickets/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE queue_tickets SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Error completing ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to complete ticket' });
  }
});

// Skip a ticket
app.patch('/api/queue/tickets/:id/skip', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE queue_tickets SET status = 'skipped' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Error skipping ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to skip ticket' });
  }
});

// Recall a skipped ticket
app.patch('/api/queue/tickets/:id/recall', async (req, res) => {
  try {
    const { id } = req.params;
    const { windowName, tellerName } = req.body;

    // Check if teller already serving
    const existing = await pool.query(
      "SELECT * FROM queue_tickets WHERE teller_window = $1 AND status = 'serving' AND queue_date = CURRENT_DATE",
      [windowName]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Please complete or skip the current ticket first' });
    }

    const result = await pool.query(
      "UPDATE queue_tickets SET status = 'serving', teller_window = $1, teller_name = $2, called_at = NOW() WHERE id = $3 AND status = 'skipped' RETURNING *",
      [windowName, tellerName || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found or not skipped' });
    }
    res.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Error recalling ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to recall ticket' });
  }
});

// Transfer a ticket to another teller window
app.patch('/api/queue/tickets/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetWindow } = req.body;

    if (!targetWindow) {
      return res.status(400).json({ success: false, message: 'Target window is required' });
    }

    // Check if target window already has a serving ticket
    const existing = await pool.query(
      "SELECT * FROM queue_tickets WHERE teller_window = $1 AND status = 'serving' AND queue_date = CURRENT_DATE",
      [targetWindow]
    );

    if (existing.rows.length > 0) {
      // Target window is busy — put ticket back to waiting, it will be next in line
      const result = await pool.query(
        "UPDATE queue_tickets SET status = 'waiting', teller_window = NULL, called_at = NULL WHERE id = $1 AND status = 'serving' RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Ticket not found or not currently being served' });
      }
      res.json({ success: true, ticket: result.rows[0], message: `Ticket transferred. ${targetWindow} is busy, ticket is back in the waiting queue.` });
    } else {
      // Target window is free — assign directly
      const result = await pool.query(
        "UPDATE queue_tickets SET status = 'serving', teller_window = $1, called_at = NOW() WHERE id = $2 AND status = 'serving' RETURNING *",
        [targetWindow, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Ticket not found or not currently being served' });
      }
      res.json({ success: true, ticket: result.rows[0], message: `Ticket transferred to ${targetWindow} and is now being served.` });
    }
  } catch (error) {
    console.error('Error transferring ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to transfer ticket' });
  }
});

// Get all today's tickets (admin)
app.get('/api/queue/tickets', async (req, res) => {
  try {
    const tickets = await pool.query(
      "SELECT * FROM queue_tickets WHERE queue_date = CURRENT_DATE ORDER BY created_at ASC"
    );
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'serving') as serving,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) as total
       FROM queue_tickets WHERE queue_date = CURRENT_DATE`
    );
    res.json({ success: true, tickets: tickets.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error('Error fetching queue tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// Reset today's queue (admin)
app.post('/api/queue/reset', async (req, res) => {
  try {
    await pool.query("DELETE FROM queue_tickets WHERE queue_date = CURRENT_DATE");
    res.json({ success: true, message: 'Queue has been reset' });
  } catch (error) {
    console.error('Error resetting queue:', error);
    res.status(500).json({ success: false, message: 'Failed to reset queue' });
  }
});

// Add transaction type (admin)
app.post('/api/queue/transaction-types', async (req, res) => {
  try {
    const { name, prefix } = req.body;
    const result = await pool.query(
      'INSERT INTO queue_transaction_types (name, prefix) VALUES ($1, $2) RETURNING *',
      [name, prefix.toUpperCase()]
    );
    res.json({ success: true, type: result.rows[0] });
  } catch (error) {
    console.error('Error adding transaction type:', error);
    res.status(500).json({ success: false, message: 'Failed to add transaction type' });
  }
});

// Delete transaction type (admin)
app.delete('/api/queue/transaction-types/:id', async (req, res) => {
  try {
    await pool.query('UPDATE queue_transaction_types SET active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Transaction type removed' });
  } catch (error) {
    console.error('Error deleting transaction type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction type' });
  }
});

// Add teller window (admin)
app.post('/api/queue/tellers', async (req, res) => {
  try {
    const { windowName } = req.body;
    const result = await pool.query(
      'INSERT INTO queue_tellers (window_name) VALUES ($1) RETURNING *',
      [windowName]
    );
    res.json({ success: true, teller: result.rows[0] });
  } catch (error) {
    console.error('Error adding teller:', error);
    res.status(500).json({ success: false, message: 'Failed to add teller window' });
  }
});

// Delete teller window (admin)
app.delete('/api/queue/tellers/:id', async (req, res) => {
  try {
    await pool.query('UPDATE queue_tellers SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Teller window removed' });
  } catch (error) {
    console.error('Error deleting teller:', error);
    res.status(500).json({ success: false, message: 'Failed to delete teller window' });
  }
});

// Get marquee text
app.get('/api/queue/marquee', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM queue_settings WHERE key = 'marquee_text'");
    res.json({ success: true, text: result.rows[0]?.value || '' });
  } catch (error) {
    console.error('Error fetching marquee:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marquee text' });
  }
});

// Get default queue display template
app.get('/api/queue/display-template', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM queue_settings WHERE key = 'display_template'");
    const template = result.rows[0]?.value || 'template1';
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching display template:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch display template' });
  }
});

// Update marquee text
// Update window-transaction assignments
app.put('/api/queue/window-transactions/:tellerId', async (req, res) => {
  try {
    const { tellerId } = req.params;
    const { transactionTypeIds } = req.body;

    // Delete existing assignments
    await pool.query('DELETE FROM queue_window_transactions WHERE teller_id = $1', [tellerId]);

    // Insert new assignments
    if (transactionTypeIds && transactionTypeIds.length > 0) {
      const values = transactionTypeIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO queue_window_transactions (teller_id, transaction_type_id) VALUES ${values}`,
        [tellerId, ...transactionTypeIds]
      );
    }

    res.json({ success: true, message: 'Window assignments updated' });
  } catch (error) {
    console.error('Error updating window assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to update assignments' });
  }
});

app.put('/api/queue/marquee', async (req, res) => {
  try {
    const { text } = req.body;
    await pool.query(
      "INSERT INTO queue_settings (key, value) VALUES ('marquee_text', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [text]
    );
    res.json({ success: true, message: 'Marquee text updated' });
  } catch (error) {
    console.error('Error updating marquee:', error);
    res.status(500).json({ success: false, message: 'Failed to update marquee text' });
  }
});

// Update default queue display template
app.put('/api/queue/display-template', async (req, res) => {
  try {
    const { template } = req.body;
    const allowed = ['template1', 'template2', 'template3', 'template4', 'template5', 'template6'];
    if (!allowed.includes(template)) {
      return res.status(400).json({ success: false, message: 'Invalid template value' });
    }

    await pool.query(
      "INSERT INTO queue_settings (key, value) VALUES ('display_template', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [template]
    );
    res.json({ success: true, message: 'Display template updated' });
  } catch (error) {
    console.error('Error updating display template:', error);
    res.status(500).json({ success: false, message: 'Failed to update display template' });
  }
});

// Queue Reports
app.get('/api/queue/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    // Summary stats
    const summary = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) FILTER (WHERE is_priority = true) as priority_count,
        AVG(EXTRACT(EPOCH FROM (called_at - created_at))) FILTER (WHERE called_at IS NOT NULL) as avg_wait_time,
        AVG(EXTRACT(EPOCH FROM (completed_at - called_at))) FILTER (WHERE completed_at IS NOT NULL AND called_at IS NOT NULL) as avg_serving_time
      FROM queue_tickets
      WHERE queue_date >= $1 AND queue_date <= $2`,
      [start, end]
    );

    // Peak hour
    const peakHour = await pool.query(
      `SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
       FROM queue_tickets
       WHERE queue_date >= $1 AND queue_date <= $2
       GROUP BY hour ORDER BY count DESC LIMIT 1`,
      [start, end]
    );

    // By transaction type
    const byType = await pool.query(
      `SELECT transaction_type as type, COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (called_at - created_at))) FILTER (WHERE called_at IS NOT NULL) as avg_wait
       FROM queue_tickets
       WHERE queue_date >= $1 AND queue_date <= $2
       GROUP BY transaction_type ORDER BY count DESC`,
      [start, end]
    );

    // By day
    const byDay = await pool.query(
      `SELECT queue_date as date, COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM queue_tickets
       WHERE queue_date >= $1 AND queue_date <= $2
       GROUP BY queue_date ORDER BY queue_date`,
      [start, end]
    );

    // By hour
    const byHour = await pool.query(
      `SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
       FROM queue_tickets
       WHERE queue_date >= $1 AND queue_date <= $2
       GROUP BY hour ORDER BY hour`,
      [start, end]
    );

    const s = summary.rows[0];
    res.json({
      success: true,
      summary: {
        totalTickets: parseInt(s.total),
        completed: parseInt(s.completed),
        skipped: parseInt(s.skipped),
        priorityCount: parseInt(s.priority_count),
        avgWaitTime: Math.round(s.avg_wait_time) || 0,
        avgServingTime: Math.round(s.avg_serving_time) || 0,
        peakHour: peakHour.rows[0]?.hour ?? null
      },
      byTransactionType: byType.rows.map(r => ({
        type: r.type,
        count: parseInt(r.count),
        avgWait: Math.round(r.avg_wait) || 0
      })),
      byDay: byDay.rows.map(r => ({
        date: r.date,
        total: parseInt(r.total),
        completed: parseInt(r.completed)
      })),
      byHour: byHour.rows.map(r => ({
        hour: parseInt(r.hour),
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching queue reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Queue CSV Export
app.get('/api/export/queue-tickets', async (req, res) => {
  try {
    const { startDate, endDate, status, transactionType } = req.query;

    let sql = 'SELECT * FROM queue_tickets WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND queue_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      sql += ` AND queue_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    if (status && status !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (transactionType && transactionType !== 'all') {
      sql += ` AND transaction_type = $${paramIndex}`;
      params.push(transactionType);
    }

    sql += ' ORDER BY queue_date DESC, created_at DESC';

    const result = await pool.query(sql, params);

    const headers = ['Ticket #', 'Customer Name', 'Phone', 'Transaction Type', 'Status', 'Priority', 'Window', 'Teller', 'Date', 'Created At', 'Called At', 'Completed At', 'Wait Time (s)', 'Serving Time (s)'];
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const waitTime = row.called_at && row.created_at ? Math.round((new Date(row.called_at) - new Date(row.created_at)) / 1000) : '';
      const servingTime = row.completed_at && row.called_at ? Math.round((new Date(row.completed_at) - new Date(row.called_at)) / 1000) : '';
      const values = [
        row.ticket_number,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        row.cellphone_number,
        `"${row.transaction_type}"`,
        row.status,
        row.is_priority ? (row.priority_type || 'Yes') : 'No',
        row.teller_window || '',
        `"${(row.teller_name || '').replace(/"/g, '""')}"`,
        row.queue_date,
        row.created_at,
        row.called_at || '',
        row.completed_at || '',
        waitTime,
        servingTime
      ];
      csvRows.push(values.join(','));
    });

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=queue_tickets_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Queue export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export queue data' });
  }
});

// ==================== NEW DENTAL BOOKING SYSTEM ====================

// Get services for a specific doctor
app.get('/api/doctors/:doctorId/services', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await pool.query(
      `SELECT s.* FROM services s
       INNER JOIN doctor_services ds ON s.id = ds.service_id
       WHERE ds.doctor_id = $1 AND s.is_active = true
       ORDER BY s.name ASC`,
      [doctorId]
    );

    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching doctor services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Get availability for a specific doctor
app.get('/api/doctors/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Get doctor's working hours for that day of week
    const dayOfWeekMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateObj = new Date(date);
    const dayOfWeek = dayOfWeekMap[dateObj.getDay()];

    const workingHours = await pool.query(
      `SELECT * FROM doctor_availability 
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
      [doctorId, dayOfWeek]
    );

    if (workingHours.rows.length === 0) {
      return res.json({ success: true, slots: [], reason: 'Doctor not available on this day' });
    }

    // Generate 30-minute slots between working hours
    const workingHoursData = workingHours.rows[0];
    const slots = [];
    const start = new Date(`2000-01-01 ${workingHoursData.start_time}`);
    const end = new Date(`2000-01-01 ${workingHoursData.end_time}`);

    for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
      const hoursStr = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      slots.push(`${hoursStr}:${minutes}`);
    }

    // Check which slots are already booked
    const bookedSlots = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'`,
      [doctorId, date]
    );

    const bookedTimes = bookedSlots.rows.map(row => row.appointment_time);
    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));

    res.json({ 
      success: true, 
      slots: availableSlots.map(slot => {
        const [h, m] = slot.split(':');
        const period = parseInt(h) >= 12 ? 'PM' : 'AM';
        const displayHour = parseInt(h) % 12 || 12;
        return `${String(displayHour).padStart(2, '0')}:${m} ${period}`;
      })
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

// Create a new patient
app.post('/api/patients', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      postalCode,
      country,
      medicalHistory,
      allergies,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and phone number are required',
      });
    }

    // Check if patient already exists
    const existingPatient = await pool.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );

    if (existingPatient.rows.length > 0) {
      return res.json({
        success: true,
        patient: { id: existingPatient.rows[0].id },
        isNewPatient: false,
      });
    }

    // Create new patient
    const result = await pool.query(
      `INSERT INTO patients (
        first_name, last_name, email, phone_number, date_of_birth, gender,
        address, city, state, postal_code, country, medical_history, allergies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, first_name, last_name, email, phone_number`,
      [
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth || null,
        gender || null,
        address || null,
        city || null,
        state || null,
        postalCode || null,
        country || null,
        medicalHistory || null,
        allergies || null,
      ]
    );

    res.status(201).json({
      success: true,
      patient: result.rows[0],
      isNewPatient: true,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A patient with this email already exists',
      });
    }
    console.error('Error creating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient record',
    });
  }
});

// Create a new booking (appointment with services)
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      services,
      notes,
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, date, time, and services are required',
      });
    }

    // Convert time to datetime
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    // Check for overlapping appointments
    const overlapCheck = await pool.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'cancelled'`,
      [doctorId, appointmentDate, appointmentTime]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // Calculate total price
    const totalPrice = services.reduce((sum, service) => sum + service.price * service.quantity, 0);

    // Create appointment
    const appointmentResult = await pool.query(
      `INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, 
        appointment_datetime, status, notes, total_price, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        patientId,
        doctorId,
        appointmentDate,
        appointmentTime,
        appointmentDateTime,
        'pending',
        notes || '',
        totalPrice,
        'pending',
      ]
    );

    const appointmentId = appointmentResult.rows[0].id;

    // Add services to appointment
    for (const service of services) {
      await pool.query(
        `INSERT INTO appointment_services (appointment_id, service_id, quantity, price_at_booking)
         VALUES ($1, $2, $3, $4)`,
        [appointmentId, service.id, service.quantity, service.price]
      );
    }

    // Fetch complete appointment details
    const completeAppointment = await pool.query(
      `SELECT a.*, 
              p.first_name, p.last_name, p.email as patient_email,
              d.first_name as doc_first_name, d.last_name as doc_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    // Send confirmation email (optional - implement sendBookingConfirmationEmail function)
    // sendBookingConfirmationEmail(completeAppointment.rows[0]).catch(err => console.error('Email error:', err));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: completeAppointment.rows[0],
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.',
    });
  }
});

// Get patient profile
app.get('/api/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
    });
  }
});

// Get patient appointments
app.get('/api/patients/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT a.*, 
              d.first_name as doc_first_name, d.last_name as doc_last_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_datetime DESC`,
      [patientId]
    );

    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
