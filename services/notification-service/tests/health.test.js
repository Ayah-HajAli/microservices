jest.mock('../src/db/pool', () => ({ query: jest.fn().mockResolvedValue({ rows: [] }) }));
const request = require('supertest');
const app = require('../src/app');

test('GET /health/live', async () => {
  const res = await request(app).get('/health/live');
  expect(res.status).toBe(200);
});
