const axios = require('axios');

// HTTP client for talking to product-service.
// In docker-compose the host is 'product-service'.
// In AWS it'll be the internal ALB DNS or a private Route 53 name.
const baseURL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

const client = axios.create({
  baseURL,
  timeout: parseInt(process.env.PRODUCT_TIMEOUT_MS || '3000', 10),
});

async function getProduct(productId) {
  const res = await client.get(`/products/${productId}`);
  return res.data;
}

async function reserve(items) {
  const res = await client.post('/inventory/reserve', { items });
  return res.data;
}

async function commit(items) {
  const res = await client.post('/inventory/commit', { items });
  return res.data;
}

async function release(items) {
  const res = await client.post('/inventory/release', { items });
  return res.data;
}

module.exports = { getProduct, reserve, commit, release };
