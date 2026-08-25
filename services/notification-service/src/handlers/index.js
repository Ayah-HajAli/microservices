// Event handlers. Each event type renders a notification and persists it,
// then dispatches via the configured channel (SES email by default).

const pool = require('../db/pool');
const logger = require('../logger');
const mailer = require('../channels/mailer');

function fmtMoney(cents) { return `$${(cents / 100).toFixed(2)}`; }

const handlers = {
  'order.created': async (event) => {
    const { user, order } = event;
    const subject = `Order confirmation #${order.id.slice(0, 8)}`;
    const lines = order.items.map((i) => `• ${i.product_name} × ${i.quantity}  ${fmtMoney(i.line_total_cents)}`).join('\n');
    const body = `Hi ${user.email},\n\nThanks for your order!\n\n${lines}\n\nTotal: ${fmtMoney(order.total_cents)}\n\n— Shop`;
    return persistAndSend({
      user_id: user.id, user_email: user.email,
      subject, body, event_type: event.type, event_id: event.id,
    });
  },
  'user.registered': async (event) => persistAndSend({
    user_id: event.user.id, user_email: event.user.email,
    subject: 'Welcome!',
    body: `Hi ${event.user.email}, welcome to Shop.`,
    event_type: event.type, event_id: event.id,
  }),
};

async function persistAndSend({ user_id, user_email, subject, body, event_type, event_id }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, user_email, channel, subject, body, event_type, event_id, status)
     VALUES ($1, $2, 'email', $3, $4, $5, $6, 'queued')
     RETURNING id`,
    [user_id, user_email, subject, body, event_type, event_id]
  );
  const id = rows[0].id;
  try {
    await mailer.send({ to: user_email, subject, body });
    await pool.query('UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', id]);
    logger.info({ id, event_type }, 'notification sent');
  } catch (err) {
    await pool.query('UPDATE notifications SET status = $1, error = $2 WHERE id = $3', ['failed', err.message, id]);
    logger.error({ err: err.message, id }, 'notification send failed');
    throw err;
  }
}

async function handle(event) {
  const fn = handlers[event.type];
  if (!fn) {
    logger.warn({ type: event.type }, 'no handler for event type');
    return;
  }
  return fn(event);
}

module.exports = { handle };
