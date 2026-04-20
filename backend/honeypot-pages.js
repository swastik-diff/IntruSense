'use strict';

/**
 * Fake company intranet login page — captures all credentials
 */
function loginPage(error = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Meridian Corp — Employee Portal</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1117; color: #cdd6f4; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #1e1e2e; border: 1px solid #313244; border-radius: 12px; padding: 2.5rem; width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .logo { text-align: center; margin-bottom: 2rem; }
  .logo-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #89b4fa, #cba6f7); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 0.75rem; }
  h1 { font-size: 1.4rem; text-align: center; font-weight: 600; color: #cdd6f4; }
  .subtitle { text-align: center; color: #6c7086; font-size: 0.85rem; margin-top: 0.25rem; }
  label { display: block; font-size: 0.8rem; color: #a6adc8; margin-bottom: 0.4rem; margin-top: 1rem; letter-spacing: 0.5px; text-transform: uppercase; }
  input { width: 100%; padding: 0.7rem 1rem; background: #11111b; border: 1px solid #313244; border-radius: 8px; color: #cdd6f4; font-size: 0.95rem; transition: border-color 0.2s; }
  input:focus { outline: none; border-color: #89b4fa; }
  .btn { width: 100%; margin-top: 1.5rem; padding: 0.8rem; background: #89b4fa; color: #1e1e2e; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.9; }
  .error { background: #45294a; border: 1px solid #f38ba8; color: #f38ba8; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1rem; }
  .footer { text-align: center; margin-top: 1.5rem; font-size: 0.75rem; color: #45475a; }
  .divider { border: none; border-top: 1px solid #313244; margin: 1.5rem 0; }
  .sso-btn { width: 100%; padding: 0.7rem; background: transparent; border: 1px solid #313244; border-radius: 8px; color: #a6adc8; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
  .sso-btn:hover { background: #11111b; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">🏢</div>
    <h1>Meridian Corp</h1>
    <p class="subtitle">Employee Intranet Portal</p>
  </div>
  ${error ? '<div class="error">⚠️ Invalid credentials. Please try again.</div>' : ''}
  <form method="POST" action="/login">
    <label for="username">Username</label>
    <input type="text" id="username" name="username" placeholder="firstname.lastname" autocomplete="off">
    <label for="password">Password</label>
    <input type="password" id="password" name="password" placeholder="••••••••">
    <button class="btn" type="submit">Sign In</button>
  </form>
  <hr class="divider">
  <button class="sso-btn">🔐 Sign in with Microsoft SSO</button>
  <div class="footer">
    <p>© 2024 Meridian Corporation. All rights reserved.</p>
    <p style="margin-top:0.3rem">Unauthorized access is prohibited and monitored.</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Fake WordPress-style admin panel
 */
function adminPage(error = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Log In &lsaquo; Admin — WordPress</title>
<style>
  html { background: #f0f0f1; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  #login { width: 320px; margin: 100px auto; }
  #login h1 a { display: block; width: 84px; height: 84px; margin: 0 auto 1.5rem; background: #3858e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; text-decoration: none; }
  .login { background: white; border: 1px solid #c3c4c7; border-radius: 4px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  label { display: block; font-size: 14px; font-weight: 600; color: #1d2327; margin-bottom: 6px; }
  input[type=text], input[type=password] { width: 100%; padding: 8px 10px; border: 1px solid #8c8f94; border-radius: 4px; font-size: 14px; margin-bottom: 1rem; box-sizing: border-box; }
  .button-primary { background: #3858e9; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 3px; cursor: pointer; width: 100%; }
  .login-remember { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #50575e; margin-top: 0.5rem; }
  .message { background: #fff3cd; border-left: 4px solid #f0ad4e; padding: 0.5rem 1rem; margin-bottom: 1rem; font-size: 13px; }
  #login_error { background: #fcf0f1; border-left: 4px solid #d63638; padding: 0.5rem 1rem; margin-bottom: 1rem; font-size: 13px; color: #d63638; }
</style>
</head>
<body>
<div id="login">
  <h1><a href="#">W</a></h1>
  ${error ? '<div id="login_error"><strong>ERROR:</strong> The username or password is incorrect.</div>' : '<div class="message">You are now logged out.</div>'}
  <div class="login">
    <form name="loginform" method="POST" action="/admin">
      <label for="user_login">Username or Email Address</label>
      <input type="text" name="log" id="user_login" class="input" size="20" autocapitalize="none" autocomplete="username">
      <label for="user_pass">Password</label>
      <input type="password" name="pwd" id="user_pass" class="input" size="20" autocomplete="current-password">
      <input type="hidden" name="_wp_action" value="wp-login">
      <p class="submit">
        <input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Log In">
      </p>
      <label class="login-remember">
        <input name="rememberme" type="checkbox" id="rememberme" value="forever"> Remember Me
      </label>
    </form>
  </div>
  <p style="text-align:center;margin-top:1rem;font-size:13px;color:#646970;">
    <a href="#" style="color:#3858e9;">Lost your password?</a> &nbsp;&bull;&nbsp;
    <a href="/" style="color:#3858e9;">← Go to Meridian Corp</a>
  </p>
</div>
</body>
</html>`;
}

/**
 * Fake phpMyAdmin login
 */
function phpMyAdminPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>phpMyAdmin</title>
<style>
  body { background: #e8ecef; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .login-card { background: white; width: 460px; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); overflow: hidden; }
  .login-header { background: #f5762e; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem; }
  .login-header img { width: 48px; }
  .login-header h1 { color: white; font-size: 1.4rem; margin: 0; }
  .login-header span { color: rgba(255,255,255,0.75); font-size: 0.75rem; }
  .login-body { padding: 2rem; }
  .field { margin-bottom: 1rem; }
  label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
  input { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box; }
  .btn { background: #f5762e; color: white; border: none; padding: 0.7rem 2rem; border-radius: 4px; cursor: pointer; font-size: 0.95rem; float: right; }
  .version { text-align: center; font-size: 0.75rem; color: #999; margin-top: 1rem; clear: both; }
</style>
</head>
<body>
<div class="login-card">
  <div class="login-header">
    <div style="font-size:2rem;">🐬</div>
    <div>
      <h1>phpMyAdmin</h1>
      <span>MySQL Database Administration</span>
    </div>
  </div>
  <div class="login-body">
    <form method="POST" action="/phpmyadmin">
      <div class="field">
        <label>Username:</label>
        <input type="text" name="pma_username" value="root">
      </div>
      <div class="field">
        <label>Password:</label>
        <input type="password" name="pma_password" placeholder="">
      </div>
      <div class="field">
        <label>Server Choice:</label>
        <select style="width:100%;padding:0.6rem;border:1px solid #ccc;border-radius:4px;">
          <option>MySQL (localhost:3306)</option>
        </select>
      </div>
      <button class="btn" type="submit">Go →</button>
      <div class="version">phpMyAdmin 5.2.1 | MySQL 8.0.35</div>
    </form>
  </div>
</div>
</body>
</html>`;
}

/**
 * Fake .env file — classic credential canary trap
 */
function dotEnvFile() {
  return `# Application Environment Configuration
# Generated: 2024-01-15T09:23:11Z

APP_NAME=MeridianPortal
APP_ENV=production
APP_KEY=base64:kP3mN8xQ2vL9wR7tY1uH6sF4jB0cE5dA
APP_DEBUG=false
APP_URL=https://portal.meridiancorp.internal

# Database
DB_CONNECTION=mysql
DB_HOST=db-prod-01.meridiancorp.internal
DB_PORT=3306
DB_DATABASE=meridian_prod
DB_USERNAME=meridian_app
DB_PASSWORD=Mrd14n$Pr0d@2024!

# Redis Cache
REDIS_HOST=redis-01.meridiancorp.internal
REDIS_PASSWORD=rEdIs_S3cr3t_2024
REDIS_PORT=6379

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7MERIDIAN
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYMERIDIAN
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=meridian-prod-assets

# SMTP Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.meridiancorp.com
MAIL_PORT=587
MAIL_USERNAME=noreply@meridiancorp.com
MAIL_PASSWORD=Sm7p_M@il_P@ss!
MAIL_ENCRYPTION=tls

# Stripe Payments
STRIPE_KEY=pk_live_51MeridianFakeKeyHere
STRIPE_SECRET=sk_live_51MeridianFakeSecretHere

# JWT
JWT_SECRET=c4b3a2d1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3w2x1y0z
JWT_EXPIRY=7200

# Admin
ADMIN_EMAIL=admin@meridiancorp.com
ADMIN_PASSWORD=Adm1n_S3cur3_2024!
`;
}

/**
 * Fake API response for /api/v1/users
 */
function fakeUsersAPI() {
  return {
    status: 'success',
    count: 5,
    data: [
      { id: 1, username: 'jsmith', email: 'john.smith@meridiancorp.com', role: 'admin', last_login: '2024-01-15T08:43:22Z' },
      { id: 2, username: 'ejohnson', email: 'emily.johnson@meridiancorp.com', role: 'editor', last_login: '2024-01-15T07:12:01Z' },
      { id: 3, username: 'mbrown', email: 'michael.brown@meridiancorp.com', role: 'viewer', last_login: '2024-01-14T22:55:44Z' },
      { id: 4, username: 'swilliams', email: 'sarah.williams@meridiancorp.com', role: 'editor', last_login: '2024-01-14T18:30:12Z' },
      { id: 5, username: 'djones', email: 'david.jones@meridiancorp.com', role: 'admin', last_login: '2024-01-13T14:22:09Z' }
    ],
    _meta: { version: 'v1', server: 'meridian-api-01', db_version: 'MySQL 8.0.35' }
  };
}

/**
 * Fake backup.zip — tiny 1-byte file placeholder
 */
const fakeBackupContent = Buffer.from([0x50, 0x4B, 0x05, 0x06, 0x00]); // PK zip header

/**
 * Generic 404 page
 */
function notFoundPage(path) {
  return `<!DOCTYPE html>
<html><head><title>404 Not Found</title></head>
<body style="font-family:monospace;padding:2rem;">
<h1>404 Not Found</h1>
<p>The requested URL <code>${path}</code> was not found on this server.</p>
<hr><address>Apache/2.4.57 (Ubuntu) Server at portal.meridiancorp.internal Port 80</address>
</body></html>`;
}

module.exports = {
  loginPage, adminPage, phpMyAdminPage,
  dotEnvFile, fakeUsersAPI, fakeBackupContent, notFoundPage
};
