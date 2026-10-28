const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Rental Property Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Route modules placeholders (to be expanded per feature area):
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/properties', require('./routes/propertyRoutes'));
// app.use('/api/rent', require('./routes/rentRoutes'));
// app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
