const nodemailer = require('nodemailer');
const User = require('../models/User');

// Reusable pooled SMTP transporter for instant email dispatch
let transporterInstance = null;

function getTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) return null;

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      pool: true, // Reuse SMTP connections for sub-second delivery
      maxConnections: 5,
      maxMessages: 200,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }
  return transporterInstance;
}

/**
 * Send Order Placed Payment Invoice Email to Registered User
 * @param {Object} params - { order, user }
 */
async function sendOrderPlacedNotification({ order, user }) {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const transporter = getTransporter();

    if (!transporter || !emailUser) {
      console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS missing in environment variables.');
      return;
    }

    // Determine recipient email & name from registered user or order details
    let recipientEmail = order.customerEmail || '';
    let customerName = order.customerName || 'Valued Customer';

    const userId = order.user || (user && user._id);
    if (userId) {
      try {
        const regUser = await User.findById(userId);
        if (regUser) {
          if (regUser.email) recipientEmail = regUser.email;
          if (regUser.name) customerName = regUser.name;
        }
      } catch (e) {}
    }

    if (!recipientEmail && user && user.email) {
      recipientEmail = user.email;
    }

    if (!recipientEmail) {
      console.warn('⚠️ [Email Service] No recipient email address found for order placement notification.');
      return;
    }

    const orderId = order._id || order.transactionId || 'N/A';
    const orderCode = 'AF-' + String(orderId).substring(0, 8).toUpperCase();
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const customerPhone = order.customerPhone || (user && user.phone) || 'N/A';

    const addr = order.shippingAddress || {};
    const fullAddress = [addr.address, addr.apartment, addr.city, addr.state, addr.postalCode, addr.country || 'India']
      .filter(Boolean)
      .join(', ');

    const itemsPrice = Number(order.itemsPrice || order.totalPrice || 0).toFixed(2);
    const discountPrice = Number(order.discountPrice || 0).toFixed(2);
    const shippingPrice = Number(order.shippingPrice || 0).toFixed(2);
    const totalPrice = Number(order.totalPrice || 0).toFixed(2);
    const paymentMethod = order.paymentMethod || 'Razorpay Secure';
    const transactionId = order.transactionId ? order.transactionId : 'N/A';

    const orderLink = `${baseUrl}/pages/profile.html#orders`;

    // Itemized HTML Rows
    const itemsTableRows = (order.orderItems || []).map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748;">
          <strong style="color: #1a202c;">${item.name || item.title}</strong><br>
          <span style="font-size: 12px; color: #718096;">Size/Unit: ${item.unit || 'Standard'}</span>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; text-align: center;">${item.qty || item.quantity || 1}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #0f7139; font-weight: bold; text-align: right;">₹${((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    // Plain-Text Version (Anti-Spam Fallback for Inbox Delivery)
    const textFallback = `
Order Placed & Payment Invoice - Arshith Fresh

Thank you for your order, ${customerName}!
Order Number: ${orderCode}
Date: ${dateStr}

ORDER DETAILS:
${(order.orderItems || []).map(i => `- ${i.name || i.title} (Qty: ${i.qty || 1}) - ₹${((i.price || 0) * (i.qty || 1)).toFixed(2)}`).join('\n')}

Subtotal: ₹${itemsPrice}
${Number(discountPrice) > 0 ? `Discount: -₹${discountPrice}\n` : ''}Shipping: ${Number(shippingPrice) > 0 ? '₹' + shippingPrice : 'FREE'}
Total Paid: ₹${totalPrice}
Payment Method: ${paymentMethod}

Shipping Address:
${customerName} (${customerPhone})
${fullAddress}

View your order & invoice: ${orderLink}

Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka - 560076
Support: support@arshithfresh.com | +91 8618471424
`;

    const mailOptions = {
      from: `"Arshith Fresh" <${emailUser}>`,
      to: recipientEmail,
      replyTo: emailUser,
      subject: `Order Confirmation & Payment Invoice #${orderCode}`,
      text: textFallback,
      headers: {
        'X-Entity-Ref-ID': orderCode,
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'List-Unsubscribe': `<mailto:${emailUser}?subject=unsubscribe>`
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Payment Invoice</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <!-- Header Banner -->
            <div style="background-color: #0f7139; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Arshith Fresh</h1>
              <p style="color: #e6f4ea; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">100% Pure, Authentic & Fresh Natural Products</p>
            </div>

            <!-- Confirmation Banner -->
            <div style="padding: 24px 28px 12px 28px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <h2 style="color: #15803d; margin: 0 0 6px 0; font-size: 19px; font-weight: 700;">🎉 Order Placed Successfully!</h2>
                <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                  Hello <strong>${customerName}</strong>, thank you for shopping with Arshith Fresh! We have confirmed your order <strong>#${orderCode}</strong> and are packing it with care.
                </p>
              </div>

              <!-- Order Summary Meta Grid -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #edf2f7; font-size: 13px;">
                <tr>
                  <td style="padding: 14px; border-right: 1px solid #edf2f7;">
                    <span style="color: #718096; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Order Code</span>
                    <strong style="color: #0f7139; font-size: 15px;">#${orderCode}</strong>
                  </td>
                  <td style="padding: 14px; border-right: 1px solid #edf2f7;">
                    <span style="color: #718096; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Purchase Date</span>
                    <strong style="color: #2d3748;">${dateStr}</strong>
                  </td>
                  <td style="padding: 14px;">
                    <span style="color: #718096; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Payment Method</span>
                    <strong style="color: #2d3748;">${paymentMethod}</strong>
                  </td>
                </tr>
              </table>

              <!-- Customer & Shipping Details -->
              <div style="background-color: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <h3 style="color: #1a202c; font-size: 14px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin: 0 0 10px 0; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                  📍 Delivery Details
                </h3>
                <div style="font-size: 14px; color: #2d3748; line-height: 1.6;">
                  <strong>Recipient:</strong> ${customerName}<br>
                  <strong>Phone:</strong> ${customerPhone}<br>
                  <strong>Shipping Address:</strong> ${fullAddress}
                </div>
              </div>

              <!-- Itemized Invoice Table -->
              <h3 style="color: #1a202c; font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-left: 4px solid #0f7139; padding-left: 10px;">
                Itemized Payment Invoice
              </h3>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #edf2f7; text-align: left;">
                    <th style="padding: 10px; font-size: 12px; color: #4a5568; text-transform: uppercase; font-weight: 700;">Item Description</th>
                    <th style="padding: 10px; font-size: 12px; color: #4a5568; text-transform: uppercase; font-weight: 700; text-align: center;">Qty</th>
                    <th style="padding: 10px; font-size: 12px; color: #4a5568; text-transform: uppercase; font-weight: 700; text-align: right;">Unit Price</th>
                    <th style="padding: 10px; font-size: 12px; color: #4a5568; text-transform: uppercase; font-weight: 700; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsTableRows}
                </tbody>
              </table>

              <!-- Pricing Summary Card -->
              <div style="background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px; padding: 18px; margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #4a5568; margin-bottom: 8px;">
                  <span>Subtotal Items Price:</span>
                  <span>₹${itemsPrice}</span>
                </div>
                ${Number(discountPrice) > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #16a34a; margin-bottom: 8px; font-weight: 600;">
                  <span>Coupon Discount:</span>
                  <span>-₹${discountPrice}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #4a5568; margin-bottom: 10px;">
                  <span>Delivery Charges:</span>
                  <span>${Number(shippingPrice) > 0 ? '₹' + shippingPrice : '<strong style="color: #0f7139;">FREE</strong>'}</span>
                </div>
                <div style="border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 12px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #0f7139;">
                  <span>Grand Total Paid:</span>
                  <span>₹${totalPrice}</span>
                </div>
                ${transactionId !== 'N/A' ? `
                <div style="font-size: 12px; color: #718096; margin-top: 8px;">
                  Transaction Reference ID: <code>${transactionId}</code>
                </div>` : ''}
              </div>

              <!-- Call To Action Button -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${orderLink}" style="background-color: #0f7139; color: #ffffff; padding: 15px 36px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(15,113,57,0.3); transition: background-color 0.2s ease;">
                  📦 View & Track Order Details
                </a>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              <p style="margin: 0 0 6px 0;"><strong>Arshith Fresh India Pvt. Ltd.</strong> Corporate Office — Bengaluru, Karnataka, India - 560076</p>
              <p style="margin: 0;">Need help? Email <a href="mailto:support@arshithfresh.com" style="color: #0f7139;">support@arshithfresh.com</a> or call <a href="tel:+918618471424" style="color: #0f7139;">+91 8618471424</a></p>
            </div>

          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Email Sent] Instant Order Confirmation & Invoice delivered to registered email ${recipientEmail}!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending order placement email:', emailErr.message);
  }
}

/**
 * Send Order Cancelled Email Notification to Registered User
 * @param {Object} params - { order, user }
 */
async function sendOrderCancelledNotification({ order, user }) {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const transporter = getTransporter();

    if (!transporter || !emailUser) {
      console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS missing in environment variables.');
      return;
    }

    let recipientEmail = order.customerEmail || '';
    let customerName = order.customerName || 'Valued Customer';

    const userId = order.user || (user && user._id);
    if (userId) {
      try {
        const regUser = await User.findById(userId);
        if (regUser) {
          if (regUser.email) recipientEmail = regUser.email;
          if (regUser.name) customerName = regUser.name;
        }
      } catch (e) {}
    }

    if (!recipientEmail && user && user.email) {
      recipientEmail = user.email;
    }

    if (!recipientEmail) {
      console.warn('⚠️ [Email Service] No recipient email address found for order cancellation notification.');
      return;
    }

    const orderId = order._id || order.transactionId || 'N/A';
    const orderCode = 'AF-' + String(orderId).substring(0, 8).toUpperCase();
    const totalPrice = Number(order.totalPrice || 0).toFixed(2);
    const orderLink = `${baseUrl}/pages/profile.html#orders`;

    const textFallback = `
Order Cancelled - Arshith Fresh

Hello ${customerName},
Your order #${orderCode} (Total: ₹${totalPrice}) has been cancelled as requested.
All inventory items have been restored to store stock.

View your account: ${orderLink}

Arshith Fresh India Pvt. Ltd.
Support: support@arshithfresh.com | +91 8618471424
`;

    const mailOptions = {
      from: `"Arshith Fresh" <${emailUser}>`,
      to: recipientEmail,
      replyTo: emailUser,
      subject: `Order Cancelled #${orderCode} - Arshith Fresh`,
      text: textFallback,
      headers: {
        'X-Entity-Ref-ID': orderCode,
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'List-Unsubscribe': `<mailto:${emailUser}?subject=unsubscribe>`
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Cancelled</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <div style="background-color: #0f7139; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">Arshith Fresh</h1>
            </div>

            <div style="padding: 28px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #dc2626; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">Order Cancelled</h2>
                <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">
                  Hello <strong>${customerName}</strong>, your order <strong>#${orderCode}</strong> (Total: ₹${totalPrice}) has been successfully <strong>cancelled</strong>. All items in this order have been returned to store stock.
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${orderLink}" style="background-color: #4a5568; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                  View My Orders
                </a>
              </div>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              © 2025 Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka, India - 560076
            </div>

          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Email Sent] Instant Order Cancellation notice delivered to registered email ${recipientEmail}!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending order cancellation email:', emailErr.message);
  }
}

module.exports = {
  sendOrderPlacedNotification,
  sendOrderCancelledNotification
};
