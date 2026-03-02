const twilio = require('twilio');
const { requireManager } = require('./_auth');

module.exports = async (req, res) => {
  if (!requireManager(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, fromWeekStart } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  const client = twilio(accountSid, authToken);
  const results = [];

  for (const msg of messages) {
    const { to, body } = msg;
    if (!to || !body) {
      results.push({ to, status: 'skipped', error: 'Missing to or body' });
      continue;
    }

    try {
      const result = await client.messages.create({
        body,
        from: fromNumber,
        to
      });
      results.push({ to, status: 'sent', sid: result.sid });
    } catch (err) {
      console.error('Twilio error:', err.message);
      results.push({ to, status: 'failed', error: err.message });
    }
  }

  return res.status(200).json({ results, fromWeekStart });
};
