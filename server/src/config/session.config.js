const authConfig = require('./auth.config');

// Reuses the session config already defined in auth.config.js (kept there
// for the OAuth handshake) instead of duplicating the same object a third time.
module.exports = authConfig.session;
