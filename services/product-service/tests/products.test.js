jest.mock('../src/db/pool', () => ({ query: jest.fn(), connect: jest.fn() }));
const pool = require('../src/db/pool');
const request = require('supertest');
const app = require('../src/app');

describe('GET /products', () => {
  it('returns items list', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'p1', sku: 'X', name: 'Test', price_cents: 100, in_stock: 5 }] });
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
});

describe('GET /products/:id', () => {
  it('returns 404 when missing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
