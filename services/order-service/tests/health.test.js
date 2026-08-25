jest.mock('../src/db/pool', () => ({ query: jest.fn().mockResolvedValue({ rows: [] }), connect: jest.fn() }));
const request = require('supertest');
const app = require('../src/app');

describe('GET /health/live', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
  });
});
