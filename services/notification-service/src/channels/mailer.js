// Pluggable mail channel. Default is "log" so the local stack works with no AWS.
// Set MAIL_PROVIDER=ses in production.

const logger = require('../logger');

const PROVIDER = process.env.MAIL_PROVIDER || 'log';
let sesClient = null;
if (PROVIDER === 'ses') {
  const { SESClient } = require('@aws-sdk/client-ses');
  sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
}

async function send({ to, subject, body }) {
  if (!to) throw new Error('missing recipient');
  if (PROVIDER === 'ses') {
    const { SendEmailCommand } = require('@aws-sdk/client-ses');
    await sesClient.send(new SendEmailCommand({
      Source: process.env.MAIL_FROM || 'no-reply@example.com',
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    }));
  } else {
    logger.info({ to, subject, preview: body.slice(0, 200) }, '[MAIL LOG] (set MAIL_PROVIDER=ses to actually send)');
  }
}

module.exports = { send };
