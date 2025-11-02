const AuditLog = require('../models/AuditLog');

/**
 * Log user action
 */
const logAction = async (userId, action, req, metadata = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = {
  logAction,
};
