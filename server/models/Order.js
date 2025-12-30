const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerDetails: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  items: [{
    productId: {
      type: String, // Support both ObjectId strings and numeric IDs
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    color: String,
    size: String,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'upi'],
    default: 'razorpay'
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingMethod: {
    type: String,
    default: 'standard'
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  trackingNumber: String,
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order ID before saving
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderId = `DAISY${timestamp.slice(-6)}${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate tax amount before saving
orderSchema.pre('save', function (next) {
  if (this.isModified('totalAmount') || this.isNew) {
    this.taxAmount = this.totalAmount * 0.18; // 18% GST
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;