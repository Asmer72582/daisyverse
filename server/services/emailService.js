const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send order confirmation email to owner
const sendOrderNotification = async(orderDetails) => {
        try {
            const { orderId, customerDetails, items, totalAmount, orderDate } = orderDetails;

            const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
                    subject: `New Order Received - ${orderId}`,
                    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">New Order Received!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-bottom: 15px;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> ₹${(totalAmount * 1.18).toFixed(2)}</p>
          </div>

          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-bottom: 15px;">Customer Information</h3>
            <p><strong>Name:</strong> ${customerDetails.name}</p>
            <p><strong>Email:</strong> ${customerDetails.email}</p>
            <p><strong>Phone:</strong> ${customerDetails.phone}</p>
            <p><strong>Address:</strong><br>
               ${customerDetails.address}<br>
               ${customerDetails.city}, ${customerDetails.state} ${customerDetails.zipCode}
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; margin-bottom: 15px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;"><strong>Note:</strong> Please process this order and arrange for delivery.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">This is an automated notification from Daisyverse</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email to customer
const sendCustomerConfirmation = async (orderDetails) => {
  try {
    const { orderId, customerDetails, items, totalAmount, orderDate } = orderDetails;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerDetails.email,
      subject: `Order Confirmation - ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin-bottom: 10px;">Order Confirmed!</h1>
            <p style="color: #6c757d;">Thank you for your purchase</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-bottom: 15px;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> ₹${(totalAmount * 1.18).toFixed(2)}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; margin-bottom: 15px;">Your Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-bottom: 15px;">Shipping Address</h3>
            <p><strong>${customerDetails.name}</strong></p>
            <p>${customerDetails.address}</p>
            <p>${customerDetails.city}, ${customerDetails.state} ${customerDetails.zipCode}</p>
            <p>Phone: ${customerDetails.phone}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;"><strong>Next Steps:</strong> We will process your order and send you tracking information once it ships. Expected delivery in 3-5 business days.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">Questions? Contact us at support@daisyverse.com</p>
            <p style="color: #28a745; font-weight: bold; margin-top: 10px;">Thank you for shopping with Daisyverse!</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Customer confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderNotification,
  sendCustomerConfirmation
};