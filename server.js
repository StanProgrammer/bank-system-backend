const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorHandler');

require('dotenv').config();

// Fail fast with a clear message when required config is missing.
const requiredEnv = ['DB_URL', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'Copy server/.env.example to server/.env and fill in the values.'
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors('*'));
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const bankRoutes = require('./routes/bankRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', userRoutes);
app.use('/api', bankRoutes);
app.use('/api', adminRoutes);

// Health check for deployment platforms (Render, Railway, etc.).
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Serve the built React app (production). Only active when the build exists.
const clientBuildPath = process.env.CLIENT_BUILD_PATH || path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA fallback: any non-API route serves the React app.
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  console.log(`Serving client build from ${clientBuildPath}`);
} else {
  console.log(`Client build not found at ${clientBuildPath}; running API only.`);
}

// Centralized error handling (must come after routes).
app.use(errorHandler);

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
