const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const connectDB = require('../config/db');

const users = [
  { name: 'Admin User', email: 'admin@dmart.com', password: 'admin123', role: 'admin', phone: '+91-9876543210' },
  { name: 'Cashier Raj', email: 'cashier@dmart.com', password: 'cashier123', role: 'cashier', phone: '+91-9876543211' },
  { name: 'Staff Priya', email: 'staff@dmart.com', password: 'staff123', role: 'staff', phone: '+91-9876543212' },
  { name: 'John Customer', email: 'customer@dmart.com', password: 'customer123', role: 'customer' },
];

const products = [
  { name: 'Amul Butter 500g', barcode: '8901030862038', category: 'Dairy', sellingPrice: 245, purchasePrice: 210, gstPercent: 12, discountPercent: 0, stock: 50, minStock: 10, unit: 'pcs', supplier: { name: 'Amul India Ltd', contact: '+91-2692258506' }, expiryDate: new Date('2025-08-01') },
  { name: 'Britannia Good Day 200g', barcode: '8901063151222', category: 'Snacks', sellingPrice: 35, purchasePrice: 28, gstPercent: 12, discountPercent: 5, stock: 120, minStock: 20, unit: 'pcs', supplier: { name: 'Britannia Industries', contact: '+91-8040011000' } },
  { name: 'Coca Cola 2L', barcode: '5000112611458', category: 'Beverages', sellingPrice: 110, purchasePrice: 90, gstPercent: 28, discountPercent: 0, stock: 80, minStock: 15, unit: 'pcs', supplier: { name: 'HCCB India', contact: '+91-8040025000' } },
  { name: 'Tata Salt 1kg', barcode: '8901024010128', category: 'Groceries', sellingPrice: 28, purchasePrice: 22, gstPercent: 0, discountPercent: 0, stock: 200, minStock: 30, unit: 'kg', supplier: { name: 'Tata Consumer Products', contact: '+91-2222622426' } },
  { name: 'Sunflower Oil 1L', barcode: '8906042860018', category: 'Groceries', sellingPrice: 135, purchasePrice: 118, gstPercent: 5, discountPercent: 3, stock: 60, minStock: 10, unit: 'litre', supplier: { name: 'Adani Wilmar', contact: '+91-7926568000' } },
  { name: 'Dettol Soap 75g', barcode: '6294003601607', category: 'Personal Care', sellingPrice: 45, purchasePrice: 36, gstPercent: 18, discountPercent: 10, stock: 90, minStock: 15, unit: 'pcs', supplier: { name: 'Reckitt India', contact: '+91-1244588000' } },
  { name: 'Basmati Rice 5kg', barcode: '8902009110054', category: 'Groceries', sellingPrice: 450, purchasePrice: 390, gstPercent: 0, discountPercent: 5, stock: 40, minStock: 8, unit: 'kg', supplier: { name: 'India Gate Foods', contact: '+91-1147060000' } },
  { name: 'Maggi Noodles 70g', barcode: '8901058834107', category: 'Snacks', sellingPrice: 14, purchasePrice: 10, gstPercent: 12, discountPercent: 0, stock: 300, minStock: 50, unit: 'pcs', supplier: { name: 'Nestle India', contact: '+91-1242319100' } },
  { name: 'Surf Excel 1kg', barcode: '8901030630348', category: 'Household', sellingPrice: 185, purchasePrice: 162, gstPercent: 18, discountPercent: 0, stock: 5, minStock: 10, unit: 'kg', supplier: { name: 'HUL India', contact: '+91-2230183000' } },
  { name: 'Haldirams Bhujia 400g', barcode: '8906003700015', category: 'Snacks', sellingPrice: 110, purchasePrice: 88, gstPercent: 12, discountPercent: 8, stock: 0, minStock: 15, unit: 'pcs', supplier: { name: 'Haldirams Foods', contact: '+91-1143688000' } },
  { name: 'Mother Dairy Milk 1L', barcode: '8906022710033', category: 'Dairy', sellingPrice: 68, purchasePrice: 58, gstPercent: 5, discountPercent: 0, stock: 25, minStock: 20, unit: 'litre', supplier: { name: 'Mother Dairy', contact: '+91-1125199300' } },
  { name: 'Colgate Toothpaste 200g', barcode: '8901314001048', category: 'Personal Care', sellingPrice: 95, purchasePrice: 78, gstPercent: 18, discountPercent: 5, stock: 70, minStock: 12, unit: 'pcs', supplier: { name: 'Colgate Palmolive India', contact: '+91-2261214000' } },
];

const customers = [
  { name: 'Ramesh Kumar', phone: '9876543001', email: 'ramesh@email.com', loyaltyPoints: 150, totalSpent: 8500, totalVisits: 12 },
  { name: 'Sunita Sharma', phone: '9876543002', email: 'sunita@email.com', loyaltyPoints: 320, totalSpent: 24000, totalVisits: 28 },
  { name: 'Anjali Patel', phone: '9876543003', email: 'anjali@email.com', loyaltyPoints: 85, totalSpent: 3200, totalVisits: 7 },
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed users
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Seed products
    const createdProducts = await Product.create(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Seed customers
    const createdCustomers = await Customer.create(customers);
    console.log(`✅ Created ${createdCustomers.length} customers`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('═══════════════════════════════════');
    console.log('📧 Admin:   admin@dmart.com    | admin123');
    console.log('📧 Cashier: cashier@dmart.com  | cashier123');
    console.log('📧 Staff:   staff@dmart.com    | staff123');
    console.log('═══════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();
