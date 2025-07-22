const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Register customer
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      'INSERT INTO customers (user_id, name, phone) VALUES (?, ?, ?)',
      [userId, name, phone]
    );

    res.json({ message: 'Customer registered successfully', customerId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer profile
router.get('/profile', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const [customers] = await db.execute(
      'SELECT * FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add vehicle
router.post('/vehicles', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const { license_plate, model, color } = req.body;
    
    // Get customer ID
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const customerId = customers[0].id;

    const [result] = await db.execute(
      'INSERT INTO vehicles (customer_id, license_plate, model, color) VALUES (?, ?, ?, ?)',
      [customerId, license_plate, model, color]
    );

    res.json({ message: 'Vehicle added successfully', vehicleId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer vehicles
router.get('/vehicles', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const [vehicles] = await db.execute(
      'SELECT * FROM vehicles WHERE customer_id = ?',
      [customers[0].id]
    );

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking history
router.get('/bookings', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const [bookings] = await db.execute(`
      SELECT b.*, ps.space_number, v.license_plate, v.model 
      FROM bookings b 
      JOIN parking_spaces ps ON b.space_id = ps.id 
      JOIN vehicles v ON b.vehicle_id = v.id 
      WHERE b.customer_id = ? 
      ORDER BY b.created_at DESC
    `, [customers[0].id]);

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
