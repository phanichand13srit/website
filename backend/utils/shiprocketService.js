require('dotenv').config();

let shiprocketToken = null;
let tokenExpiry = null;


/**
 * Authenticate with Shiprocket API using credentials in .env
 */
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.warn('[Shiprocket Service] SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set in .env');
    return null;
  }

  // Return cached token if valid (expires after ~240 hours, refresh if within 1 hour)
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      shiprocketToken = data.token;
      // Cache token for 23 hours
      tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      console.log('✅ [Shiprocket Service] Successfully authenticated with Shiprocket API!');
      return shiprocketToken;
    } else {
      console.error('[Shiprocket Service] Authentication failed:', data);
      return null;
    }
  } catch (error) {
    console.error('[Shiprocket Service] Connection error:', error.message);
    return null;
  }
}

/**
 * Automatically create an ad-hoc order in Shiprocket when a customer buys
 */
async function createShiprocketOrder(order) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const orderItems = (order.orderItems || []).map(item => ({
      name: item.name || 'Product',
      sku: (item.name || 'SKU').replace(/\s+/g, '-').toUpperCase(),
      units: item.qty || 1,
      selling_price: item.price || 0,
      discount: 0,
      tax: 0,
      hsn: 0
    }));

    const payload = {
      order_id: order._id.toString(),
      order_date: order.createdAt ? new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
      pickup_location: 'work', // Primary saved pickup location
      channel_id: '12047272', // User's Custom Channel ID
      comment: `Order placed on Arshith Fresh (${order.paymentMethod || 'Online'})`,
      billing_customer_name: order.customerName ? order.customerName.split(' ')[0] : 'Customer',
      billing_last_name: order.customerName ? order.customerName.split(' ').slice(1).join(' ') || '' : '',
      billing_address: (order.shippingAddress && order.shippingAddress.address) || 'Main Street',
      billing_address_2: (order.shippingAddress && order.shippingAddress.apartment) || '',
      billing_city: (order.shippingAddress && order.shippingAddress.city) || 'Bangalore',
      billing_pincode: (order.shippingAddress && order.shippingAddress.postalCode) || '560001',
      billing_state: (order.shippingAddress && order.shippingAddress.state) || 'Karnataka',
      billing_country: (order.shippingAddress && order.shippingAddress.country) || 'India',
      billing_email: order.customerEmail || 'support@arshithfresh.com',
      billing_phone: order.customerPhone || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentMethod && order.paymentMethod.toLowerCase().includes('cod') ? 'COD' : 'Prepaid',
      shipping_charges: order.shippingPrice || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountPrice || 0,
      sub_total: order.totalPrice || order.itemsPrice || 0,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log('[Shiprocket Service] Order push response:', result);
    return result;
  } catch (err) {
    console.error('[Shiprocket Service] Push order error:', err.message);
    return null;
  }
}

/**
 * Track shipment status by AWB or Order ID
 */
async function trackShipment(awbOrOrderId) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Shiprocket authentication unavailable' };

  try {
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track?awb_code=${encodeURIComponent(awbOrOrderId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  getShiprocketToken,
  createShiprocketOrder,
  trackShipment
};
