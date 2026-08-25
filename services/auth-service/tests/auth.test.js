// Lightweight tests that don't require a live database.
// Uses a manual mock for pg pool.

jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
}));

const request = require('supertest');
const pool = require('../src/db/pool');
const app = require('../src/app');

describe('POST /auth/register', () => {
  beforeEach(() => pool.query.mockReset());

  it('rejects bad email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'longenough', fullName: 'X' });
    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@b.co', password: 'short', fullName: 'X' });
    expect(res.status).toBe(400);
  });

  it('creates a user and returns a token', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'uuid-1', email: 'a@b.co', full_name: 'A', role: 'customer', created_at: new Date() }],
    });
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@b.co', password: 'longenough', fullName: 'A' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('a@b.co');
  });

  it('returns 409 when email is taken', async () => {
    const err = new Error('dup'); err.code = '23505';
    pool.query.mockRejectedValueOnce(err);
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@b.co', password: 'longenough', fullName: 'A' });
    expect(res.status).toBe(409);
  });
});

describe('GET /health/live', () => {
  it('returns 200 without hitting DB', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
