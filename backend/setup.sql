-- Create database setup file: backend/database/setup.sql
CREATE DATABASE IF NOT EXISTS parking_management;
USE parking_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'staff', 'admin') NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  license_plate VARCHAR(20) NOT NULL,
  model VARCHAR(50),
  color VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Parking spaces table
CREATE TABLE IF NOT EXISTS parking_spaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  space_number VARCHAR(10) UNIQUE NOT NULL,
  status ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
  price_per_hour DECIMAL(10,2) DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  vehicle_id INT,
  space_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  total_amount DECIMAL(10,2),
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (space_id) REFERENCES parking_spaces(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('card', 'cash', 'digital') DEFAULT 'card',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Insert demo users
INSERT IGNORE INTO users (username, password, role, email) VALUES
('customer', 'password', 'customer', 'customer@example.com'),
('staff', 'password', 'staff', 'staff@example.com'),
('admin', 'password', 'admin', 'admin@example.com');

-- Insert demo parking spaces
INSERT IGNORE INTO parking_spaces (space_number, price_per_hour) VALUES
('P01', 5.00), ('P02', 5.00), ('P03', 5.00), ('P04', 5.00), ('P05', 5.00),
('P06', 5.00), ('P07', 5.00), ('P08', 5.00), ('P09', 5.00), ('P10', 5.00),
('P11', 7.00), ('P12', 7.00), ('P13', 7.00), ('P14', 7.00), ('P15', 7.00),
('P16', 7.00), ('P17', 7.00), ('P18', 7.00), ('P19', 7.00), ('P20', 7.00);