const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const { sendOrderNotification, sendCustomerConfirmation } = require('../services/emailService');

// Create new order
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { customerDetails, items, totalAmount, orderDate } = req.body;

        // Validate required fields
        if (!customerDetails || !items || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order details'
            });
        }

        // Validate customer details
        const requiredCustomerFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
        for (const field of requiredCustomerFields) {
            if (!customerDetails[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing customer detail: ${field}`
                });
            }
        }

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        // Check product availability and update stock
        for (const item of items) {
            // Skip validation for mock products (numeric IDs)
            if (typeof item.productId === 'number' || !isNaN(Number(item.productId))) {
                console.log(`Skipping product validation for mock product ID: ${item.productId}`);
                continue;
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.name}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}. Available: ${product.stock}`
                });
            }
        }

        // Create order
        const order = new Order({
            customerDetails: {
                ...customerDetails,
                userId: req.user.userId
            },
            items,
            totalAmount,
            orderDate: orderDate || new Date()
        });

        await order.save();

        // Update product stock (only for real products with ObjectId)
        for (const item of items) {
            // Skip stock update for mock products
            if (typeof item.productId === 'number' || !isNaN(Number(item.productId))) {
                continue;
            }

            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
            );
        }

        // Send email notifications
        try {
            await sendOrderNotification({
                orderId: order.orderId,
                customerDetails: order.customerDetails,
                items: order.items,
                totalAmount: order.totalAmount,
                orderDate: order.orderDate
            });

            await sendCustomerConfirmation({
                orderId: order.orderId,
                customerDetails: order.customerDetails,
                items: order.items,
                totalAmount: order.totalAmount,
                orderDate: order.orderDate
            });
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Don't fail the order creation if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: order.orderId,
                order: order
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId })
            .populate('items.productId', 'name images')
            .populate('customerDetails.userId', 'email name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order
        if (order.customerDetails.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message
        });
    }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ 'customerDetails.userId': req.user.userId })
            .populate('items.productId', 'name images')
            .sort({ orderDate: -1 });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message
        });
    }
});

// Update payment status
router.put('/:orderId/payment', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus, paymentDetails } = req.body;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order
        if (order.customerDetails.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update payment status
        order.paymentStatus = paymentStatus;
        if (paymentDetails) {
            order.paymentDetails = paymentDetails;
        }

        // If payment is successful, update order status
        if (paymentStatus === 'paid') {
            order.orderStatus = 'confirmed';
        }

        await order.save();

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: order
        });

    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment status',
            error: error.message
        });
    }
});

module.exports = router;