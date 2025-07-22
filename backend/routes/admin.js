const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get total users
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    
    // Get total bookings
    const [totalBookings] = await db.execute('SELECT COUNT(*) as count FROM bookings');
    
    // Get total revenue
    const [totalRevenue] = await db.execute('SELECT SUM(amount) as total FROM payments WHERE status = "completed"');
    
    // Get available spaces
    const [availableSpaces] = await db.execute('SELECT COUNT(*) as count FROM parking_spaces WHERE status = "available"');
    
    // Get recent bookings
    const [recentBookings] = await db.execute(`
      SELECT b.*, c.name, ps.space_number, v.license_plate 
      FROM bookings b 
      JOIN customers c ON b.customer_id = c.id 
      JOIN parking_spaces ps ON b.space_id = ps.id 
      JOIN vehicles v ON b.vehicle_id = v.id 
      ORDER BY b.created_at DESC 
      LIMIT 10
    `);

    res.json({
      statistics: {
        totalUsers: totalUsers[0].count,
        totalBookings: totalBookings[0].count,
        totalRevenue: totalRevenue[0].total || 0,
        availableSpaces: availableSpaces[0].count
      },
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, username, role, email, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings
router.get('/bookings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT b.*, c.name as customer_name, ps.space_number, v.license_plate, v.model 
      FROM bookings b 
      JOIN customers c ON b.customer_id = c.id 
      JOIN parking_spaces ps ON b.space_id = ps.id 
      JOIN vehicles v ON b.vehicle_id = v.id 
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
