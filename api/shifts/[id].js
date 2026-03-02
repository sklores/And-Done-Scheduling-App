const { supabase } = require('../_supabase');
const { requireManager } = require('../_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Shift ID required' });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
