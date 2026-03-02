const { supabase } = require('../_supabase');
const { requireManager } = require('../_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Employee ID required' });
  }

  if (req.method === 'PATCH') {
    const { name, role, hourly_rate, employee_code, phone, color, is_active } = req.body || {};

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    if (phone !== undefined) updates.phone = phone;
    if (color !== undefined) updates.color = color;
    if (is_active !== undefined) updates.is_active = is_active;

    if (employee_code !== undefined) {
      if (!/^\d{4}$/.test(employee_code)) {
        return res.status(400).json({ error: 'employee_code must be a 4-digit PIN' });
      }
      updates.employee_code = employee_code;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Employee PIN already in use' });
      }
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { data, error } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
