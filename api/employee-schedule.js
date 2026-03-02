const { supabase } = require('./_supabase');
const { requireEmployee } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = requireEmployee(req, res);
  if (!payload) return;

  const { employeeId } = payload;

  // Default to current week (Monday-based)
  let weekStart = req.query.week_start;
  if (!weekStart) {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 1=Mon
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    weekStart = monday.toISOString().split('T')[0];
  }

  const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

  const { data, error } = await supabase
    .from('shifts')
    .select('id, start_ts, end_ts, notes')
    .eq('employee_id', employeeId)
    .gte('start_ts', weekStartDate.toISOString())
    .lt('start_ts', weekEndDate.toISOString())
    .order('start_ts');

  if (error) {
    console.error('DB error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(200).json({ shifts: data, weekStart });
};
