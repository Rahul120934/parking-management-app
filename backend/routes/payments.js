const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Process payment
router.post('/process', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const { bookingId, paymentMethod = 'card' } = req.body;

    // Get booking details
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Process payment (mock payment processing)
    const [result] = await db.execute(
      'INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (?, ?, ?, ?)',
      [bookingId, booking.total_amount, paymentMethod, 'completed']
    );

    res.json({ 
      message: 'Payment processed successfully', 
      paymentId: result.insertId,
      amount: booking.total_amount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment history
router.get('/history', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const [payments] = await db.execute(`
      SELECT p.*, b.start_time, b.end_time, ps.space_number 
      FROM payments p 
      JOIN bookings b ON p.booking_id = b.id 
      JOIN parking_spaces ps ON b.space_id = ps.id 
      WHERE b.customer_id = ? 
      ORDER BY p.created_at DESC
    `, [customers[0].id]);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
