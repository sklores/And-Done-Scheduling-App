const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Adapt Vercel-style handlers (req.query.id) for Express (req.params.id)
function mount(handler) {
  return (req, res) => {
    req.query = { ...req.query, ...req.params };
    return handler(req, res);
  };
}

// API routes
app.all('/api/owner-login',        mount(require('./api/owner-login')));
app.all('/api/employee-login',     mount(require('./api/employee-login')));
app.all('/api/employees',          mount(require('./api/employees')));
app.all('/api/employees/:id',      mount(require('./api/employees/[id]')));
app.all('/api/shifts',             mount(require('./api/shifts')));
app.all('/api/shifts/:id',         mount(require('./api/shifts/[id]')));
app.all('/api/send-schedule',      mount(require('./api/send-schedule')));
app.all('/api/employee-schedule',  mount(require('./api/employee-schedule')));
app.all('/api/weekly-notes',       mount(require('./api/weekly-notes')));

// Page routes
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/manager',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/employee', (req, res) => res.sendFile(path.join(__dirname, 'public', 'employee.html')));

app.listen(PORT, () => {
  console.log(`Shift app running on http://localhost:${PORT}`);
});
