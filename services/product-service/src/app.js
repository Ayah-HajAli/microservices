const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const products = require('./routes/products');
const categories = require('./routes/categories');
const inventory = require('./routes/inventory');
const health = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGINS || '*').split(',') }));
app.use(express.json({ limit: '200kb' }));
app.use(pinoHttp({ logger }));

app.use('/health', health);
app.use('/products', products);
app.use('/categories', categories);
app.use('/inventory', inventory);

app.use((req, res) => res.status(404).json({ error: 'not_found' }));
app.use(errorHandler);

module.exports = app;
