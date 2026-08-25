// Event publishing. In production this is SQS. In docker-compose dev we
// fall back to a simple POST to notification-service so students can run
// the stack with zero AWS setup.

const axios = require('axios');
const logger = require('../logger');

const MODE = process.env.EVENT_BUS_MODE || 'http';     // 'http' | 'sqs'
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

let sqsClient = null;
if (MODE === 'sqs') {
  const { SQSClient } = require('@aws-sdk/client-sqs');
  sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
}

async function publish(event) {
  try {
    if (MODE === 'sqs') {
      const { SendMessageCommand } = require('@aws-sdk/client-sqs');
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MessageBody: JSON.stringify(event),
        MessageAttributes: { type: { DataType: 'String', StringValue: event.type } },
      }));
    } else {
      // Direct HTTP for local dev — simple and obvious
      await axios.post(`${NOTIFICATION_URL}/internal/events`, event, { timeout: 2000 });
    }
    logger.info({ type: event.type, id: event.id }, 'event published');
  } catch (err) {
    // Don't fail the order because the event failed — log and move on.
    // In real life: outbox pattern.
    logger.error({ err: err.message, type: event.type }, 'event publish failed');
  }
}

module.exports = { publish };
