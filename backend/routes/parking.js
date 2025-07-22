const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all parking spaces
router.get('/spaces', async (req, res) => {
  try {
    const [spaces] = await db.execute('SELECT * FROM parking_spaces ORDER BY space_number');
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Book parking space
router.post('/book', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const { spaceId, vehicleId, hours = 1 } = req.body;

    // Get customer ID
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const customerId = customers[0].id;

    // Check if space is available
    const [spaces] = await db.execute(
      'SELECT * FROM parking_spaces WHERE id = ? AND status = "available"',
      [spaceId]
    );

    if (spaces.length === 0) {
      return res.status(400).json({ message: 'Parking space not available' });
    }

    const space = spaces[0];
    const totalAmount = space.price_per_hour * hours;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (hours * 60 * 60 * 1000));

    // Start transaction
    await db.execute('START TRANSACTION');

    try {
      // Create booking
      const [bookingResult] = await db.execute(`
        INSERT INTO bookings (customer_id, vehicle_id, space_id, start_time, end_time, total_amount) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [customerId, vehicleId, spaceId, startTime, endTime, totalAmount]);

      // Update space status
      await db.execute(
        'UPDATE parking_spaces SET status = "booked" WHERE id = ?',
        [spaceId]
      );

      await db.execute('COMMIT');

      res.json({ 
        message: 'Parking space booked successfully', 
        bookingId: bookingResult.insertId,
        totalAmount 
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new parking space (staff only)
router.post('/spaces', authenticateToken, authorizeRole(['staff', 'admin']), async (req, res) => {
  try {
    const { space_number, price_per_hour = 5.00 } = req.body;

    const [result] = await db.execute(
      'INSERT INTO parking_spaces (space_number, price_per_hour) VALUES (?, ?)',
      [space_number, price_per_hour]
    );

    res.json({ message: 'Parking space added successfully', spaceId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update parking space (staff only)
router.put('/spaces/:id', authenticateToken, authorizeRole(['staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, price_per_hour } = req.body;

    await db.execute(
      'UPDATE parking_spaces SET status = ?, price_per_hour = ? WHERE id = ?',
      [status, price_per_hour, id]
    );

    res.json({ message: 'Parking space updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
