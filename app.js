require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

const app = express();

app.use(cors());
app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ status: 'error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(process.env.PORT, () =>
  console.log(`伺服器啟動中：http://localhost:${PORT}`)
);
