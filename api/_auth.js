const jwt = require('jsonwebtoken');

function requireManager(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const managerPassword = process.env.MANAGER_PASSWORD;
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!token || (token !== managerPassword && token !== ownerPassword)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function requireOwner(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!token || token !== ownerPassword) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function requireEmployee(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const secret = process.env.EMPLOYEE_PORTAL_SECRET;

  if (!token || !secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}

module.exports = { requireManager, requireOwner, requireEmployee };
