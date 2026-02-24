require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const useInMemory = String(process.env.USE_IN_MEMORY_DB || 'false') === 'true';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/users', userRoutes);

if (useInMemory) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port} (in-memory mode)`);
  });
} else {
  connectDB(mongoUri).then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}
