require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection to cloud Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rutujasalunkhe0410_db_user:L5W3r7VUSkpgIWGZ@daisyverse.vxpodne.mongodb.net/daisyverse';

mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB Atlas connected successfully'))
    .catch((err) => console.error('MongoDB Atlas connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Daisy Verse API' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Product routes (using cloud MongoDB)
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

// User routes (using cloud MongoDB)
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Admin routes (using cloud MongoDB)
const { router: adminRoutes } = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Admin product management routes
const adminProductRoutes = require('./routes/admin-products');
app.use('/api/admin', adminProductRoutes);

// Order routes
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Serve static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});