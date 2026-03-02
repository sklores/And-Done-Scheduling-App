const { supabase } = require('./_supabase');
const { requireManager } = require('./_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, role, hourly_rate, employee_code, phone, color } = req.body || {};

    if (!name || !role || !employee_code) {
      return res.status(400).json({ error: 'name, role, and employee_code are required' });
    }

    if (!/^\d{4}$/.test(employee_code)) {
      return res.status(400).json({ error: 'employee_code must be a 4-digit PIN' });
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([{
        name,
        role,
        hourly_rate: hourly_rate || 0,
        employee_code,
        phone: phone || null,
        color: color || '#888888'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Employee PIN already in use' });
      }
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
