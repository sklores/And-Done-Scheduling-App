const jwt = require('jsonwebtoken');
const { supabase } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'PIN code required' });
  }

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, role')
    .eq('employee_code', code.trim())
    .eq('is_active', true)
    .limit(1);

  if (error) {
    console.error('DB error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!employees || employees.length === 0) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  const employee = employees[0];
  const secret = process.env.EMPLOYEE_PORTAL_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const token = jwt.sign(
    { employeeId: employee.id, employeeName: employee.name, role: employee.role },
    secret,
    { expiresIn: '8h' }
  );

  return res.status(200).json({ token, employeeName: employee.name });
};
