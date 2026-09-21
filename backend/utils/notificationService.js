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
    const invoiceNumber = 'INV-' + orderCode;
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isPaid = Boolean(order.isPaid || order.paymentStatus === 'paid');
    const paidAtStr = order.paidAt
      ? new Date(order.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : dateStr;

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
    const transactionId = (order.transactionId || order.razorpayPaymentId) ? (order.transactionId || order.razorpayPaymentId) : 'N/A';

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

    // Plain-Text Version
    const textFallback = `
${isPaid ? '[PAID TAX INVOICE]' : 'ORDER CONFIRMATION'} - Arshith Fresh

Thank you for your order, ${customerName}!
Order Number: ${orderCode}
Invoice Number: ${invoiceNumber}
Date: ${dateStr}
Payment Status: ${isPaid ? 'PAID ✓' : 'PENDING / CASH ON DELIVERY'}
Payment Method: ${paymentMethod}
Transaction Ref ID: ${transactionId}

ORDER DETAILS:
${(order.orderItems || []).map(i => `- ${i.name || i.title} (Qty: ${i.qty || 1}) - ₹${((i.price || 0) * (i.qty || 1)).toFixed(2)}`).join('\n')}

Subtotal: ₹${itemsPrice}
${Number(discountPrice) > 0 ? `Discount: -₹${discountPrice}\n` : ''}Shipping: ${Number(shippingPrice) > 0 ? '₹' + shippingPrice : 'FREE'}
Total ${isPaid ? 'Paid' : 'Amount'}: ₹${totalPrice}

Shipping Address:
${customerName} (${customerPhone})
${fullAddress}

View & download your official tax invoice: ${orderLink}

Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka - 560076
Support: support@arshithfresh.com | +91 8618471424
`;

    const mailSubject = isPaid
      ? `🧾 Official Payment Invoice & Order Confirmation #${orderCode}`
      : `Order Confirmation #${orderCode} - Arshith Fresh`;

    const mailOptions = {
      from: `"Arshith Fresh" <${emailUser}>`,
      to: recipientEmail,
      replyTo: emailUser,
      subject: mailSubject,
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
            <div style="background: linear-gradient(135deg, #0f7139 0%, #16a34a 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Arshith Fresh</h1>
              <p style="color: #e6f4ea; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">100% Pure, Authentic & Fresh Natural Products</p>
            </div>

            <div style="padding: 24px 28px 12px 28px;">
              
              <!-- Payment Status Banner -->
              ${isPaid ? `
              <div style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <h2 style="color: #15803d; margin: 0; font-size: 19px; font-weight: 800;">🎉 Payment Received & Order Confirmed!</h2>
                  <span style="background-color: #16a34a; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">✓ PAID INVOICE</span>
                </div>
                <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                  Hello <strong>${customerName}</strong>, thank you for your payment! We have received your payment of <strong>₹${totalPrice}</strong> for order <strong>#${orderCode}</strong> and are preparing your order for shipment.
                </p>
              </div>
              ` : `
              <div style="background-color: #fffbeb; border: 1.5px solid #fef3c7; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <h2 style="color: #b45309; margin: 0 0 6px 0; font-size: 19px; font-weight: 700;">🎉 Order Placed Successfully!</h2>
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                  Hello <strong>${customerName}</strong>, thank you for shopping with Arshith Fresh! We have confirmed your order <strong>#${orderCode}</strong> (${paymentMethod}).
                </p>
              </div>
              `}

              <!-- Official Payment Invoice Box -->
              <div style="background-color: #f8fafc; border: 1.5px solid ${isPaid ? '#0f7139' : '#cbd5e1'}; border-radius: 10px; padding: 18px; margin-bottom: 24px; position: relative;">
                <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
                  <h3 style="color: #0f7139; font-size: 15px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    🧾 ${isPaid ? 'Official Tax Payment Invoice' : 'Order Payment Summary'}
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; line-height: 1.8;">
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Invoice Reference:</td>
                    <td style="font-weight: 700; text-align: right; color: #0f7139;">${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Order Code:</td>
                    <td style="font-weight: 700; text-align: right; color: #1e293b;">#${orderCode}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Date / Time:</td>
                    <td style="text-align: right; color: #1e293b;">${isPaid ? paidAtStr : dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Payment Status:</td>
                    <td style="text-align: right; font-weight: 800; color: ${isPaid ? '#16a34a' : '#d97706'};">
                      ${isPaid ? '✓ PAID IN FULL' : '⏳ PENDING (COD / UNPAID)'}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Payment Method:</td>
                    <td style="text-align: right; color: #1e293b;">${paymentMethod}</td>
                  </tr>
                  ${transactionId !== 'N/A' ? `
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Transaction Ref ID:</td>
                    <td style="text-align: right;"><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;">${transactionId}</code></td>
                  </tr>
                  ` : ''}
                </table>
              </div>

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
                Itemized Invoice Breakdown
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
                  <span>${isPaid ? 'Grand Total Paid:' : 'Grand Total Amount:'}</span>
                  <span>₹${totalPrice}</span>
                </div>
              </div>

              <!-- Call To Action Buttons -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${orderLink}" style="background-color: #0f7139; color: #ffffff !important; padding: 15px 36px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(15,113,57,0.3);">
                  🧾 View & Print Payment Invoice
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
    console.log(`📧 [Email Sent] ${isPaid ? 'PAID TAX INVOICE' : 'Order Confirmation'} delivered to registered email ${recipientEmail}!`);
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

/**
 * Send New Order Alert Email Notification to Admin
 * @param {Object} params - { order }
 */
async function sendAdminOrderPlacedNotification({ order }) {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const adminEmail = process.env.ADMIN_EMAIL || emailUser;
    const transporter = getTransporter();

    if (!transporter || !emailUser || !adminEmail) {
      console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS missing in environment variables.');
      return;
    }

    const orderId = order._id || order.transactionId || 'N/A';
    const orderCode = 'AF-' + String(orderId).substring(0, 8).toUpperCase();
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const customerName = order.customerName || 'Valued Customer';
    const customerEmail = order.customerEmail || 'N/A';
    const customerPhone = order.customerPhone || 'N/A';

    const addr = order.shippingAddress || {};
    const fullAddress = [addr.address, addr.apartment, addr.city, addr.state, addr.postalCode, addr.country || 'India']
      .filter(Boolean)
      .join(', ');

    const itemsPrice = Number(order.itemsPrice || order.totalPrice || 0).toFixed(2);
    const discountPrice = Number(order.discountPrice || 0).toFixed(2);
    const shippingPrice = Number(order.shippingPrice || 0).toFixed(2);
    const totalPrice = Number(order.totalPrice || 0).toFixed(2);
    const paymentMethod = order.paymentMethod || 'Razorpay Secure';
    const dashboardLink = `${baseUrl}/admin/dashboard.html`;

    const itemsTableRows = (order.orderItems || []).map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748;">
          <strong style="color: #1a202c;">${item.name || item.title}</strong><br>
          <span style="font-size: 12px; color: #718096;">Unit: ${item.unit || 'Standard'}</span>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; text-align: center;">${item.qty || item.quantity || 1}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #0f7139; font-weight: bold; text-align: right;">₹${((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Arshith Fresh Alerts" <${emailUser}>`,
      to: adminEmail,
      subject: `🔔 New Order Received #${orderCode} - ₹${totalPrice}`,
      text: `NEW ORDER ALERT #${orderCode}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\nTotal: ₹${totalPrice}\nPayment Method: ${paymentMethod}\nAddress: ${fullAddress}\n\nView Dashboard: ${dashboardLink}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Order Alert</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <div style="background-color: #0f7139; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Arshith Fresh Store Admin</h1>
              <p style="color: #e6f4ea; margin: 4px 0 0 0; font-size: 13px;">🛒 New Customer Order Alert</p>
            </div>

            <div style="padding: 24px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <h2 style="color: #15803d; margin: 0 0 6px 0; font-size: 19px; font-weight: 700;">🎉 New Order Received!</h2>
                <p style="color: #166534; margin: 0; font-size: 14px;">
                  Order <strong>#${orderCode}</strong> has been successfully placed on <strong>${dateStr}</strong>.
                </p>
              </div>

              <!-- Customer Info -->
              <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                <h3 style="color: #1a202c; font-size: 14px; text-transform: uppercase; font-weight: 700; margin: 0 0 10px 0; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                  👤 Customer & Shipping Information
                </h3>
                <div style="font-size: 14px; color: #2d3748; line-height: 1.6;">
                  <strong>Customer Name:</strong> ${customerName}<br>
                  <strong>Email:</strong> ${customerEmail}<br>
                  <strong>Phone:</strong> ${customerPhone}<br>
                  <strong>Delivery Address:</strong> ${fullAddress}<br>
                  <strong>Payment Method:</strong> ${paymentMethod}
                </div>
              </div>

              <!-- Items Table -->
              <h3 style="color: #1a202c; font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-left: 4px solid #0f7139; padding-left: 10px;">
                Ordered Items
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

              <!-- Pricing Summary -->
              <div style="background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px; padding: 18px; margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #4a5568; margin-bottom: 8px;">
                  <span>Subtotal:</span>
                  <span>₹${itemsPrice}</span>
                </div>
                ${Number(discountPrice) > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #16a34a; margin-bottom: 8px;">
                  <span>Discount:</span>
                  <span>-₹${discountPrice}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #4a5568; margin-bottom: 10px;">
                  <span>Delivery Charge:</span>
                  <span>₹${shippingPrice}</span>
                </div>
                <div style="border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 12px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #0f7139;">
                  <span>Total Order Revenue:</span>
                  <span>₹${totalPrice}</span>
                </div>
              </div>

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${dashboardLink}" style="background-color: #0f7139; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                  📊 Manage Order in Admin Dashboard
                </a>
              </div>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              Arshith Fresh Admin Automated Notification System
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Admin Email Sent] New Order #${orderCode} notification sent to admin email (${adminEmail})!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending admin order notification:', emailErr.message);
  }
}

/**
 * Send Low Stock (<= 10) or Out of Stock (= 0) Email Notification to Admin
 * @param {Object} params - { product, newStock, oldStock }
 */
async function sendStockAlertNotification({ product, newStock, oldStock }) {
  try {
    const stockVal = Number(newStock !== undefined ? newStock : product.countInStock);
    
    // Only alert if stock is 10 or below 10
    if (stockVal > 10) return;

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const adminEmail = process.env.ADMIN_EMAIL || emailUser;
    const transporter = getTransporter();

    if (!transporter || !emailUser || !adminEmail) {
      console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS missing in environment variables.');
      return;
    }

    const isOutOfStock = stockVal <= 0;
    const productName = product.name || product.title || 'Product';
    const category = product.category || 'General';
    const unit = product.unit || '1 unit';
    const price = Number(product.price || 0).toFixed(2);
    const collectionsLink = `${baseUrl}/admin/collections.html`;

    const subject = isOutOfStock
      ? `🚨 OUT OF STOCK ALERT: "${productName}" is Out of Stock!`
      : `⚠️ LOW STOCK ALERT: "${productName}" Stock is ${stockVal} (10 or below)`;

    const headerBg = isOutOfStock ? '#991b1b' : '#b45309';
    const badgeColor = isOutOfStock ? '#dc2626' : '#d97706';
    const badgeBg = isOutOfStock ? '#fef2f2' : '#fffbeb';
    const badgeBorder = isOutOfStock ? '#fecaca' : '#fef3c7';
    const alertTitle = isOutOfStock ? '🚨 OUT OF STOCK NOTICE' : '⚠️ LOW STOCK WARNING';
    const alertDesc = isOutOfStock
      ? `The product <strong>"${productName}"</strong> has run out of stock <strong>(0 units remaining)</strong>! Customers cannot place orders for this item until stock is replenished.`
      : `The remaining stock for product <strong>"${productName}"</strong> has dropped to <strong>${stockVal} units</strong> (10 or below 10). Please restock soon to prevent running out of stock!`;

    const mailOptions = {
      from: `"Arshith Fresh Inventory" <${emailUser}>`,
      to: adminEmail,
      subject,
      text: isOutOfStock
        ? `OUT OF STOCK ALERT!\nProduct: ${productName}\nCategory: ${category}\nStock: 0\n\nPlease restock immediately: ${collectionsLink}`
        : `LOW STOCK ALERT!\nProduct: ${productName}\nCategory: ${category}\nStock: ${stockVal} units (10 or below)\n\nPlease restock soon: ${collectionsLink}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Stock Alert</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <div style="background-color: ${headerBg}; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Arshith Fresh Inventory Alert</h1>
              <p style="color: #fef2f2; margin: 4px 0 0 0; font-size: 13px;">Stock Management Alert</p>
            </div>

            <div style="padding: 24px;">
              <div style="background-color: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <h2 style="color: ${badgeColor}; margin: 0 0 8px 0; font-size: 18px; font-weight: 800;">${alertTitle}</h2>
                <p style="color: ${badgeColor}; margin: 0; font-size: 14px; line-height: 1.6;">
                  ${alertDesc}
                </p>
              </div>

              <!-- Product Details Card -->
              <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                <h3 style="color: #1a202c; font-size: 14px; text-transform: uppercase; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                  📦 Product Details
                </h3>
                <div style="font-size: 14px; color: #2d3748; line-height: 1.7;">
                  <strong>Product Name:</strong> ${productName}<br>
                  <strong>Category:</strong> ${category}<br>
                  <strong>Unit Size:</strong> ${unit}<br>
                  <strong>Selling Price:</strong> ₹${price}<br>
                  <strong>Current Stock Status:</strong> <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 14px;">${stockVal} ${isOutOfStock ? '(OUT OF STOCK)' : 'units remaining (<= 10)'}</span>
                </div>
              </div>

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${collectionsLink}" style="background-color: ${isOutOfStock ? '#dc2626' : '#0f7139'}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                  📦 Update Stock & Restock Inventory
                </a>
              </div>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              Arshith Fresh Store Automatic Stock Monitoring System
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Stock Alert Sent] ${isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK (<=10)'} notice sent to Admin (${adminEmail}) for product "${productName}" (Stock: ${stockVal})!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending stock alert notification:', emailErr.message);
  }
}

/**
 * Send Account Registration Confirmation Email to User with Website Link Button
 * @param {Object} params - { user }
 */
async function sendWelcomeRegistrationNotification({ user }) {
  try {
    if (!user || !user.email) {
      console.warn('⚠️ [Email Service] No user email provided for registration confirmation.');
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const transporter = getTransporter();

    const recipientEmail = user.email;
    const customerName = user.name || recipientEmail.split('@')[0] || 'Valued Customer';
    const regDate = new Date(user.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const websiteUrl = baseUrl;
    const profileUrl = `${baseUrl}/pages/profile.html`;

    console.log(`📧 [Registration Email Prepared] Welcome Email for ${recipientEmail} with direct website link: ${websiteUrl}`);

    if (!transporter || !emailUser) {
      console.log(`📧 [Email Simulation] Welcome email notification created for ${recipientEmail}. Website Button Link: ${websiteUrl}`);
      return;
    }

    const mailOptions = {
      from: `"Arshith Fresh" <${emailUser}>`,
      to: recipientEmail,
      subject: `Welcome to Arshith Fresh! Account Created Successfully 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0f7139 0%, #16a34a 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
            .content { padding: 32px 24px; color: #334155; }
            .card-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn-cta { display: inline-block; background-color: #0f7139; color: #ffffff !important; padding: 15px 36px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(15, 113, 57, 0.3); }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🌿 Arshith Fresh</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">Freshness Delivered Right To Your Doorstep</p>
            </div>

            <div class="content">
              <h2 style="color: #0f7139; font-size: 22px; margin-top: 0;">Welcome, ${customerName}! 🎉</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                We are thrilled to welcome you to <strong>Arshith Fresh</strong>! Your account has been created successfully and is ready to use.
              </p>

              <div class="card-box">
                <h3 style="margin-top: 0; font-size: 16px; color: #0f7139;">Account Information Summary</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registered Name:</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 700; text-align: right;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registered Email:</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 700; text-align: right;">${recipientEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registration Date:</td>
                    <td style="padding: 6px 0; color: #1e293b; text-align: right;">${regDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Status:</td>
                    <td style="padding: 6px 0; color: #16a34a; font-weight: 800; text-align: right;">✓ Active & Verified</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                You can now browse our wide selection of farm-fresh organic produce, cold-pressed oils, pure honey, seeds, and essential groceries.
              </p>

              <!-- CLICKABLE BUTTON TO VISIT WEBSITE -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${websiteUrl}" target="_blank" class="btn-cta">
                  🌐 Visit Arshith Fresh Website
                </a>
              </div>

              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 4px; margin-bottom: 24px;">
                <strong style="color: #166534; font-size: 14px;">🛍️ Exclusive Welcome Perk:</strong>
                <p style="margin: 4px 0 0 0; font-size: 13.5px; color: #15803d;">
                  Use coupon code <strong style="background: #dcfce7; padding: 2px 6px; border-radius: 4px;">ARSHITH10</strong> during checkout to get 10% OFF on your first order above ₹1,000!
                </p>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center;">
                Need assistance? Have questions? Access your <a href="${profileUrl}" style="color: #0f7139; font-weight: bold; text-decoration: underline;">User Profile</a> anytime.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Arshith Fresh. All rights reserved.</p>
              <p style="margin: 0; font-size: 11px;">You received this automated notification because an account was registered with ${recipientEmail}.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Email Sent] Welcome registration email delivered to ${recipientEmail} with clickable website button!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending welcome registration email:', emailErr.message);
  }
}

/**
 * Send Order Delivered Email Notification asking for Product Reviews
 * @param {Object} params - { order, user }
 */
async function sendOrderDeliveredNotification({ order, user }) {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const emailUser = process.env.EMAIL_USER;
    const transporter = getTransporter();

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
      console.warn('⚠️ [Email Service] No recipient email address found for order delivery notification.');
      return;
    }

    const orderId = order._id || order.transactionId || 'N/A';
    const orderCode = 'AF-' + String(orderId).substring(0, 8).toUpperCase();
    const dateStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const addr = order.shippingAddress || {};
    const fullAddress = [addr.address, addr.apartment, addr.city, addr.state, addr.postalCode, addr.country || 'India']
      .filter(Boolean)
      .join(', ');

    const reviewProfileLink = `${baseUrl}/pages/profile.html#orders`;

    // Itemized HTML Rows with Rate & Review button for each product
    const itemsTableRows = (order.orderItems || []).map(item => {
      const prodId = item.product || '';
      const prodName = item.name || item.title || 'Product';
      const reviewItemLink = prodId ? `${baseUrl}/pages/product.html?id=${prodId}#reviews` : reviewProfileLink;
      return `
        <tr>
          <td style="padding: 14px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748;">
            <strong style="color: #1a202c;">${prodName}</strong><br>
            <span style="font-size: 12px; color: #718096;">Qty: ${item.qty || item.quantity || 1} | Size/Unit: ${item.unit || 'Standard'}</span>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #0f7139; font-weight: bold; text-align: right;">
            <a href="${reviewItemLink}" style="background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 6px 14px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: 700; display: inline-block;">
              ⭐ Rate & Review
            </a>
          </td>
        </tr>
      `;
    }).join('');

    const textFallback = `
Order Delivered! - Arshith Fresh

Hello ${customerName},
Great news! Your order #${orderCode} has been delivered successfully.

WE VALUE YOUR FEEDBACK! ⭐⭐⭐⭐⭐
How were your products? We would love to hear your feedback on freshness, taste, and quality!

Rate & Review Your Products:
${reviewProfileLink}

Delivery Address:
${fullAddress}

Thank you for shopping with Arshith Fresh!
Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka - 560076
Support: support@arshithfresh.com | +91 8618471424
`;

    console.log(`📧 [Delivered Email Prepared] Notification for ${recipientEmail} (Order #${orderCode})`);

    if (!transporter || !emailUser) {
      console.log(`📧 [Email Simulation] Delivered email notification created for ${recipientEmail}. Review Link: ${reviewProfileLink}`);
      return;
    }

    const mailOptions = {
      from: `"Arshith Fresh" <${emailUser}>`,
      to: recipientEmail,
      replyTo: emailUser,
      subject: `🎉 Delivered: Your Order #${orderCode} + Please Leave a Product Review! ⭐`,
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
          <title>Order Delivered - Product Review Request</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0f7139 0%, #16a34a 100%); padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Arshith Fresh</h1>
              <p style="color: #e6f4ea; margin: 4px 0 0 0; font-size: 14px; font-weight: 500;">100% Pure, Authentic & Fresh Natural Products</p>
            </div>

            <!-- Delivery Banner -->
            <div style="padding: 28px 28px 16px 28px;">
              <div style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 6px;">📦🎉</div>
                <h2 style="color: #15803d; margin: 0 0 6px 0; font-size: 22px; font-weight: 800;">Your Order Has Been Delivered!</h2>
                <p style="color: #166534; margin: 0; font-size: 14.5px; line-height: 1.6;">
                  Hello <strong>${customerName}</strong>, your order <strong>#${orderCode}</strong> was successfully delivered on <strong>${dateStr}</strong>. We hope you love your fresh products!
                </p>
              </div>

              <!-- Delivered Items List -->
              <h3 style="color: #1a202c; font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-left: 4px solid #0f7139; padding-left: 10px;">
                Delivered Items Summary
              </h3>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #edf2f7;">
                <tbody>
                  ${itemsTableRows}
                </tbody>
              </table>

              <!-- Review Request Banner -->
              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #fde68a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(217,119,6,0.08);">
                <div style="font-size: 28px; margin-bottom: 6px;">⭐⭐⭐⭐⭐</div>
                <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 19px; font-weight: 800;">How were your products?</h3>
                <p style="color: #78350f; margin: 0 0 18px 0; font-size: 14px; line-height: 1.6;">
                  Your genuine review helps us maintain pure farm-fresh quality and guides fellow food lovers! Take 30 seconds to share your rating and review.
                </p>
                <a href="${reviewProfileLink}" target="_blank" style="background-color: #0f7139; color: #ffffff !important; padding: 14px 36px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(15,113,57,0.3);">
                  ✍️ Rate & Review Purchased Items
                </a>
              </div>

              <!-- Delivery Address Box -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; font-size: 13.5px; color: #4a5568;">
                <strong>Delivered Address:</strong> ${fullAddress}
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
    console.log(`📧 [Email Sent] Order Delivery & Review request email delivered to ${recipientEmail}!`);
  } catch (emailErr) {
    console.error('❌ [Email Error] Error sending order delivery notification:', emailErr.message);
  }
}

/**
 * Send Order Status Update Notification Email to Customer
 * @param {Object} params - { order, newStatus, user }
 */
async function sendOrderStatusUpdateNotification({ order, newStatus, user }) {
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

    if (!recipientEmail && user && user.email) recipientEmail = user.email;

    if (!recipientEmail) {
      console.warn('⚠️ [Email Service] No recipient email address found for status update notification.');
      return;
    }

    const orderId = order._id || order.transactionId || 'N/A';
    const orderCode = 'AF-' + String(orderId).substring(0, 8).toUpperCase();
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const totalPrice = Number(order.totalPrice || 0).toFixed(2);
    const trackingUrl = `${baseUrl}/pages/profile.html#orders`;

    const statusBadgeColors = {
      Confirmed: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
      Processing: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
      Dispatched: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      Shipped: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      Delivered: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
      Cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
    };

    const badgeStyle = statusBadgeColors[newStatus] || { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };

    const mailOptions = {
      from: `"Arshith Fresh Order Desk" <${emailUser}>`,
      to: recipientEmail,
      subject: `📦 Order #${orderCode} Status Updated to ${newStatus} | Arshith Fresh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px 0;">
          <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #0f7139 0%, #15803d 100%); padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Arshith Fresh</h1>
              <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 13px;">100% Pure & Authentic Natural Products</p>
            </div>
            <div style="padding: 28px 24px;">
              <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">Hello ${customerName},</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Your order <strong>#${orderCode}</strong> status has been updated to:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background: ${badgeStyle.bg}; color: ${badgeStyle.color}; border: 1px solid ${badgeStyle.border}; padding: 10px 24px; border-radius: 30px; font-weight: 700; font-size: 16px;">
                  Status: ${newStatus}
                </span>
              </div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                  <span>Order Reference:</span> <strong style="color: #1e293b;">#${orderCode}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                  <span>Order Date:</span> <strong style="color: #1e293b;">${dateStr}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b;">
                  <span>Total Value:</span> <strong style="color: #0f7139;">₹${totalPrice}</strong>
                </div>
              </div>
              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="${trackingUrl}" style="background: #0f7139; color: #ffffff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                  View & Track Order Details
                </a>
              </div>
            </div>
            <div style="background: #f8fafc; text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              © 2026 Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka, India - 560076
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [Email Sent] Order status update (${newStatus}) delivered to ${recipientEmail}`);
  } catch (err) {
    console.error('❌ [Email Error] Error sending order status update email:', err.message);
  }
}

module.exports = {
  sendOrderPlacedNotification,
  sendOrderCancelledNotification,
  sendAdminOrderPlacedNotification,
  sendStockAlertNotification,
  sendWelcomeRegistrationNotification,
  sendOrderDeliveredNotification,
  sendOrderStatusUpdateNotification
};


