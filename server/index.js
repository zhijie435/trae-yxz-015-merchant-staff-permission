const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const employeeRoutes = require('./routes/employee');
const uploadRoutes = require('./routes/upload');
const taskRoutes = require('./routes/task');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/employees', employeeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行中' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
