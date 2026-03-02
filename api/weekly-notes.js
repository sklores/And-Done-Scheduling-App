const { supabase } = require('./_supabase');
const { requireManager } = require('./_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  if (req.method === 'GET') {
    const { week_start } = req.query;
    if (!week_start) {
      return res.status(400).json({ error: 'week_start required' });
    }

    const { data, error } = await supabase
      .from('weekly_notes')
      .select('*')
      .eq('week_start', week_start)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json(data || { week_start, notes: '' });
  }

  if (req.method === 'POST') {
    const { week_start, notes } = req.body || {};
    if (!week_start) {
      return res.status(400).json({ error: 'week_start required' });
    }

    const { data, error } = await supabase
      .from('weekly_notes')
      .upsert({ week_start, notes: notes || '' }, { onConflict: 'week_start' })
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
