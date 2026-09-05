/* ==========================================================
   login.js — Netlify Function: Authentication
   POST /api/login  { username, password }
   Returns: { success, token, expiresAt }
   ========================================================== */

const { validateCredentials, createToken, respond, corsHeaders, requireAuth, TOKEN_EXPIRY_MS } = require('./auth-utils');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  // Verify existing session (GET /api/login — check if still valid)
  if (event.httpMethod === 'GET') {
    try {
      const user = requireAuth(event);
      return respond(200, { success: true, user: { username: user.username } });
    } catch (err) {
      return respond(401, { success: false, error: 'Session invalid' });
    }
  }

  // POST — Login
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = body;

    if (!username || !password) {
      return respond(400, { error: 'Missing credentials', message: 'Username and password are required' });
    }

    // Validate against environment variables
    if (!validateCredentials(username, password)) {
      return respond(401, { error: 'Invalid credentials', message: 'Wrong username or password' });
    }

    // Create signed token
    const token = createToken({ username });
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    return respond(200, {
      success: true,
      token,
      expiresAt,
      user: { username }
    });

  } catch (err) {
    if (err.statusCode) return err;
    return respond(500, { error: 'Internal server error' });
  }
};
