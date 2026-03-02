const { supabase } = require('./_supabase');
const { requireManager } = require('./_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  if (req.method === 'GET') {
    const { week_start } = req.query;

    if (!week_start) {
      return res.status(400).json({ error: 'week_start query param required (YYYY-MM-DD)' });
    }

    // Calculate week end (7 days later)
    const weekStartDate = new Date(week_start + 'T00:00:00.000Z');
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees(id, name, role, hourly_rate, color)')
      .gte('start_ts', weekStartDate.toISOString())
      .lt('start_ts', weekEndDate.toISOString())
      .order('start_ts');

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { employee_id, start_ts, end_ts, notes } = req.body || {};

    if (!employee_id || !start_ts || !end_ts) {
      return res.status(400).json({ error: 'employee_id, start_ts, and end_ts are required' });
    }

    const startDate = new Date(start_ts);
    const endDate = new Date(end_ts);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'end_ts must be after start_ts' });
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert([{ employee_id, start_ts, end_ts, notes: notes || null }])
      .select('*, employees(id, name, role, hourly_rate, color)')
      .single();

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
