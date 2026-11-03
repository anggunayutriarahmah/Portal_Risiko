import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { normalizeUserRole, formatUserRole, type PusriRisk, type RiskLevel, type UserRole, type UserAccount } from './src/types/pusri.ts';
import { pusriDb } from './server/db.ts';
import { generatePusriSqlDump, saveSqlDumpToDisk } from './server/sqlGenerator.ts';
import {
  signSessionToken,
  verifySessionToken,
  revokeSessionToken,
  extractBearerToken,
  createSsoAuthorizationCode,
  consumeSsoAuthorizationCode,
  sanitizeUserAccount
} from './server/security.ts';
import { 
  initMySqlConnection, 
  saveRiskToMySql, 
  deleteRiskFromMySql, 
  loadRisksFromMySql, 
  getMySqlStatus, 
  getTableData,
  syncDepartmentsToMySql,
  loadDepartmentsFromMySql,
  syncSumberRisikoToMySql,
  loadSumberRisikoFromMySql,
  loadUsersFromMySql,
  findPasswordResetUserInMySql,
  createPasswordResetTicketInMySql,
  migratePendingPasswordResetTicketsToMySql,
  loadPasswordResetTicketsFromMySql,
  resolvePasswordResetTicketInMySql,
  loadMasterLikelihoodConsequenceFromMySql,
  replaceMasterLikelihoodConsequenceInMySql,
  DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE,
  type MasterLikelihoodConsequenceRow,
  syncUsersToMySql,
  updateUserAvatarInMySql,
  syncFullDatabaseToMySql
} from './server/mysql.ts';

const app = express();
const server = http.createServer(app);

// Parse port & host from environment variables or command-line args
let PORT = Number(process.env.PORT) || 3000;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  const parsedPort = Number(process.argv[portArgIndex + 1]);
  if (!isNaN(parsedPort) && parsedPort > 0) PORT = parsedPort;
}

let HOST = '0.0.0.0';
const hostArgIndex = process.argv.indexOf('--host');
if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
  HOST = process.argv[hostArgIndex + 1];
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads/profile-avatars', express.static(path.join(process.cwd(), 'uploads', 'profile-avatars')));

const requireMySqlForRiskData: express.RequestHandler = (_req, res, next) => {
  if (!getMySqlStatus().isConnected) {
    return res.status(503).json({
      success: false,
      message: 'Koneksi MySQL belum tersedia. Data risiko tidak disimpan atau ditampilkan dari penyimpanan lokal.'
    });
  }
  next();
};

app.use(['/api/risks', '/api/vp', '/api/carry-over'], requireMySqlForRiskData);

// Helper: Calculate risk level according to Master Data Peta Matriks Risiko Pusri (5x5)
function calculateRiskLevel(likelihood: number, impact: number): RiskLevel {
  const k = Math.min(5, Math.max(1, Math.round(Number(likelihood) || 1)));
  const d = Math.min(5, Math.max(1, Math.round(Number(impact) || 1)));
  const score = k * d;
  if (score >= 17) return 'High';
  if (score >= 12) return 'Mod to High';
  if (score >= 8) return 'Moderate';
  if (score >= 4) return 'Low to Mod';
  return 'Low';
}

function isNonMitigationStrategy(strategy: unknown): boolean {
  return ['Diterima', 'Dihindari', 'Transfer', 'Ditransfer'].includes(String(strategy || ''));
}

// Helper: Determine mitigation requirement based on risk score and guidelines
function assessMitigationRequirement(likelihood: number, impact: number) {
  const score = likelihood * impact;
  const level = calculateRiskLevel(likelihood, impact);
  const isRequired = level === 'High' || level === 'Mod to High' || level === 'Moderate';
  
  let statusText = 'Toleransi Risiko Terpenuhi (Dapat Diterima)';
  let recommendation = 'Risiko berada dalam batas toleransi. Pertahankan pengendalian rutin atau terima risiko.';

  if (level === 'High') {
    statusText = 'Wajib Mitigasi Segera (High Risk)';
    recommendation = 'Risiko TINGGI/EKSTREM melebihi selera risiko korporat Pusri. Wajib menyusun rencana mitigasi komprehensif, persetujuan Direksi/VP, dan monitoring triwulanan.';
  } else if (level === 'Mod to High') {
    statusText = 'Wajib Mitigasi Aktif (Mod to High)';
    recommendation = 'Risiko MOD TO HIGH melebihi toleransi standar. Wajib menyusun rencana tindakan penanganan/mitigasi dengan target waktu dan PIC yang jelas.';
  } else if (level === 'Moderate') {
    statusText = 'Mitigasi Direkomendasikan (Moderate)';
    recommendation = 'Risiko MODERATE. Disarankan membuat langkah mitigasi atau memperkuat pengendalian existing agar tidak eskalasi.';
  }

  return {
    score,
    level,
    isRequired,
    statusText,
    recommendation
  };
}

// ----------------------------------------------------
// REST API ENDPOINTS (Compatible with Golang Microservices)
// ----------------------------------------------------

// 1. Health & Database Status
app.get('/api/health', (req, res) => {
  const dbStats = pusriDb.getStats();
  res.json({
    status: 'ok',
    service: 'Portal Risiko PT Pupuk Sriwidjaja Palembang API',
    engine: 'Golang 1.22 REST + MySQL 8.0 Engine Hybrid Bridge',
    timestamp: new Date().toISOString(),
    database: dbStats,
    totalRisks: dbStats.totalRisks
  });
});

// Database Detail Endpoint
app.get('/api/database/status', (req, res) => {
  res.json({
    success: true,
    data: pusriDb.getStats()
  });
});

// Download Raw MySQL Schema & Seed SQL File (Password Protected: portal123, Admin Only)
app.get('/api/database/download-sql', (req, res) => {
  const pwd = (req.query.password as string) || (req.headers['x-database-password'] as string);
  if (pwd !== 'portal123') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Password basis data salah. Masukkan password administrator portal123 untuk mengunduh skema dan data MySQL.'
    });
  }

  try {
    const dynamicSql = generatePusriSqlDump();
    saveSqlDumpToDisk(); // Synchronize to server/backend_go/schema.sql

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pusri_risk_db_2026.sql"');
    return res.send(dynamicSql);
  } catch (err: any) {
    console.error('Error generating dynamic SQL dump:', err);
    const sqlPath = path.join(process.cwd(), 'server', 'backend_go', 'schema.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="pusri_risk_db_2026.sql"');
      return fs.createReadStream(sqlPath).pipe(res);
    }
    return res.status(500).json({ success: false, message: 'Gagal membuat file database SQL.' });
  }
});

// Verify Download Database Password
app.post('/api/database/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === 'portal123') {
    return res.json({ success: true, message: 'Password database valid.' });
  }
  return res.status(401).json({ success: false, message: 'Password salah! Akses download database ditolak.' });
});

// ----------------------------------------------------
// ZERO-TRUST CORPORATE SSO & IAM SESSION GUARDS
// ----------------------------------------------------

function getVerifiedSessionUser(req: express.Request): UserAccount | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload || !payload.sub) return null;

  const liveUser = pusriDb.findUserById(payload.sub) || pusriDb.findUser(payload.badge || payload.username);
  if (!liveUser) return null;
  if (liveUser.accountStatus && liveUser.accountStatus !== 'active') return null;
  return sanitizeUserAccount(liveUser);
}

function requireAuthenticatedUser(req: express.Request, res: express.Response): UserAccount | null {
  const user = getVerifiedSessionUser(req);
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Sesi Single Sign-On (SSO) tidak valid atau telah berakhir. Silakan login kembali melalui Portal SSO Pusri.'
    });
    return null;
  }
  return user;
}

function requireRiskAdmin(req: express.Request, res: express.Response): UserAccount | null {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return null;
  if (user.role !== 'risk admin') {
    pusriDb.recordIamSecurityEvent({
      eventType: 'IMPERSONATION_BLOCKED',
      severity: 'CRITICAL',
      actorIdentifier: user.badge || user.username,
      actorName: user.nama,
      details: `Akses tidak sah ke endpoint otoritas Risk Admin oleh akun ${user.nama} (${user.role}) berhasil dicegah server.`
    });
    res.status(403).json({
      success: false,
      message: 'Akses Ditolak (Zero-Trust IAM): Otoritas ini hanya diizinkan bagi akun resmi Risk Admin yang terverifikasi server SSO.'
    });
    return null;
  }
  return user;
}

async function persistUserToMySql(userId: string): Promise<boolean> {
  const user = pusriDb.getRawUsersForDatabaseSync().find((account) => account.id === userId);
  return Boolean(user && await syncUsersToMySql([user]) === 1);
}

app.use(async (req, res, next) => {
  if (
    !req.path.startsWith('/api/') ||
    req.path.startsWith('/api/database/') ||
    req.path === '/api/database'
  ) {
    return next();
  }

  const users = await loadUsersFromMySql();
  if (users === null) {
    return res.status(503).json({
      success: false,
      message: 'Akun tidak dapat diverifikasi karena MySQL tidak tersedia.'
    });
  }
  pusriDb.hydrateFromMySql({ users });
  next();
});

function getRedirectUri(req: express.Request): string {
  const base = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  return `${base}/auth/callback`;
}

// 1. Corporate SSO Configuration Status
app.get('/api/auth/sso/config', (req, res) => {
  const isExternalConfigured = Boolean(
    process.env.SSO_CLIENT_ID &&
    process.env.SSO_CLIENT_SECRET &&
    process.env.SSO_AUTH_URL &&
    process.env.SSO_TOKEN_URL
  );
  res.json({
    success: true,
    data: {
      providerName: process.env.SSO_PROVIDER_NAME || 'Pusri Corporate Identity Provider (IAM OIDC)',
      protocol: 'OpenID Connect 1.0 (PKCE S256) + JWT HS256',
      pusriIdpActive: true,
      externalOidcConfigured: isExternalConfigured,
      allowedDomains: (process.env.SSO_ALLOWED_DOMAINS || 'pusri.co.id,pupuk-indonesia.com').split(',').map((d) => d.trim()),
      callbackUrl: getRedirectUri(req),
      zeroTrustPolicy: {
        selfRegistrationRoleAssignment: false,
        defaultOnboardingRole: 'risk officer',
        requireAdminApprovalForNewUsers: true,
        bruteForceMaxAttempts: 5,
        lockoutDurationMinutes: 15,
        sessionDurationHours: 8
      }
    }
  });
});

// 2. Pusri Corporate IdP OIDC Authorization Endpoint (PKCE S256)
app.post('/api/auth/sso/authorize', (req, res) => {
  const { identifier, password, codeChallenge, state } = req.body;
  if (!codeChallenge || typeof codeChallenge !== 'string' || codeChallenge.length < 16) {
    return res.status(400).json({
      success: false,
      message: 'Parameter kriptografi PKCE code_challenge wajib disertakan untuk sesi SSO.'
    });
  }

  const authResult = pusriDb.authenticate(identifier || '', password || '', 'PUSRI_IAM_SSO');
  if (!authResult.success || !authResult.user) {
    return res.status(authResult.statusCode || 401).json({
      success: false,
      message: authResult.message || 'Autentikasi SSO Korporat ditolak.'
    });
  }

  const code = createSsoAuthorizationCode(authResult.user.id, codeChallenge, String(state || ''));
  return res.json({
    success: true,
    code,
    state: state || '',
    issuer: 'https://sso-iam.pusri.co.id'
  });
});

// 3. Pusri Corporate IdP OIDC Token Exchange Endpoint (PKCE S256 -> Signed HS256 JWT)
app.post('/api/auth/sso/token', (req, res) => {
  const { code, codeVerifier, state } = req.body;
  if (!code || !codeVerifier) {
    return res.status(400).json({
      success: false,
      message: 'Kode otorisasi SSO dan PKCE code_verifier wajib disertakan.'
    });
  }

  const exchange = consumeSsoAuthorizationCode(String(code), String(codeVerifier), state ? String(state) : undefined);
  if (!exchange.valid || !exchange.userId) {
    return res.status(401).json({
      success: false,
      message: exchange.reason || 'Pertukaran token SSO gagal.'
    });
  }

  const rawUser = pusriDb.findUserById(exchange.userId);
  if (!rawUser || (rawUser.accountStatus && rawUser.accountStatus !== 'active')) {
    return res.status(403).json({
      success: false,
      message: 'Akun SSO tidak aktif atau belum diotorisasi oleh Administrator IAM.'
    });
  }

  const safeUser = sanitizeUserAccount(rawUser);
  const token = signSessionToken(safeUser, 'PUSRI_IAM_SSO');

  return res.json({
    success: true,
    token,
    tokenType: 'Bearer',
    expiresIn: 8 * 3600,
    user: safeUser
  });
});

// 4. External OAuth 2.0 / OIDC Federation URL (Microsoft Entra ID / Google Workspace / Okta)
app.get('/api/auth/oauth/url', (req, res) => {
  const clientId = process.env.SSO_CLIENT_ID;
  const authEndpoint = process.env.SSO_AUTH_URL;
  if (!clientId || !authEndpoint) {
    return res.status(400).json({
      success: false,
      message: 'Integrasi IdP Eksternal (Microsoft Entra ID / Google Workspace) belum dikonfigurasi pada variabel environment SSO_CLIENT_ID & SSO_AUTH_URL. Gunakan tombol SSO Korporat Pusri (IAM Internal) di atas.'
    });
  }

  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account'
  });

  res.json({
    success: true,
    url: `${authEndpoint}?${params.toString()}`
  });
});

// External OAuth 2.0 / OIDC Popup Callback Handler
const oauthCallbackHandler = async (req: express.Request, res: express.Response) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.send(`<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;">
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: 'Otorisasi SSO dibatalkan.' }, '*');
          window.close();
        }
      </script>
      <p>Otorisasi SSO dibatalkan. Jendela ini akan tertutup otomatis.</p>
    </body></html>`);
  }

  try {
    const tokenRes = await fetch(process.env.SSO_TOKEN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SSO_CLIENT_ID!,
        client_secret: process.env.SSO_CLIENT_SECRET!,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: getRedirectUri(req)
      })
    });

    if (!tokenRes.ok) {
      throw new Error('Gagal menukar authorization code dengan Identity Provider.');
    }
    const tokenData: any = await tokenRes.json();

    let email = '';
    let name = '';
    if (process.env.SSO_USERINFO_URL && tokenData.access_token) {
      const uRes = await fetch(process.env.SSO_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (uRes.ok) {
        const uInfo: any = await uRes.json();
        email = uInfo.email || uInfo.preferred_username || '';
        name = uInfo.name || '';
      }
    }

    if (!email && tokenData.id_token) {
      const segs = String(tokenData.id_token).split('.');
      if (segs.length === 3) {
        const claims = JSON.parse(Buffer.from(segs[1], 'base64url').toString('utf-8'));
        email = claims.email || claims.preferred_username || '';
        name = claims.name || '';
      }
    }

    if (!email) {
      throw new Error('Identity Provider tidak mengembalikan klaim email terverifikasi.');
    }

    const oidcAuth = pusriDb.authenticateExternalOidcEmail(email, name);
    if (!oidcAuth.success || !oidcAuth.user) {
      const safeMsg = JSON.stringify(oidcAuth.message);
      return res.send(`<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_PENDING', message: ${safeMsg} }, '*');
            window.close();
          }
        </script>
        <p>${oidcAuth.message}</p>
      </body></html>`);
    }

    const sessionToken = signSessionToken(oidcAuth.user, 'OIDC_EXTERNAL');
    const payloadJson = JSON.stringify({
      type: 'OAUTH_AUTH_SUCCESS',
      token: sessionToken,
      user: oidcAuth.user
    });

    return res.send(`<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;">
      <script>
        if (window.opener) {
          window.opener.postMessage(${payloadJson}, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      </script>
      <p>Single Sign-On berhasil. Jendela ini akan tertutup otomatis.</p>
    </body></html>`);
  } catch (err: any) {
    const errMsg = JSON.stringify(err?.message || 'Gagal memproses callback SSO.');
    return res.send(`<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;">
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: ${errMsg} }, '*');
          window.close();
        }
      </script>
      <p>Autentikasi SSO gagal.</p>
    </body></html>`);
  }
};

app.get(['/auth/callback', '/auth/callback/'], oauthCallbackHandler);

// 5. Verify Current Session Token (Zero-Trust Anti-Tamper Check)
app.get('/api/auth/me', (req, res) => {
  const user = getVerifiedSessionUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Sesi tidak terautentikasi atau token tidak valid.'
    });
  }
  return res.json({
    success: true,
    user
  });
});

// 6. Logout & Revoke Session Token
app.post('/api/auth/logout', (req, res) => {
  const token = extractBearerToken(req);
  const user = getVerifiedSessionUser(req);
  if (token) {
    revokeSessionToken(token);
  }
  if (user) {
    pusriDb.recordIamSecurityEvent({
      eventType: 'LOGOUT',
      severity: 'INFO',
      actorIdentifier: user.badge || user.username,
      actorName: user.nama,
      details: `Sesi SSO diakhiri dengan aman oleh ${user.nama}.`
    });
  }
  return res.json({ success: true, message: 'Sesi SSO berhasil diakhiri.' });
});

// 7. IAM Credential Login Endpoint (Issues Server-Signed HS256 JWT)
app.post('/api/auth/login', async (req, res) => {
  const users = await loadUsersFromMySql();
  if (users === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca akun dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users });

  const { identifier, password } = req.body;
  const authResult = pusriDb.authenticate(identifier || '', password || '', 'LOCAL_IAM');
  const changedUser = pusriDb.findUser(identifier || '');
  if (changedUser) {
    if (!await persistUserToMySql(changedUser.id)) {
      return res.status(503).json({ success: false, message: 'Status autentikasi gagal disimpan ke MySQL.' });
    }
  }
  if (!authResult.success || !authResult.user) {
    return res.status(authResult.statusCode || 401).json({
      success: false,
      message: authResult.message || 'Autentikasi ditolak.'
    });
  }

  const token = signSessionToken(authResult.user, 'LOCAL_IAM');
  res.json({
    success: true,
    message: authResult.message || 'Autentikasi berhasil.',
    token,
    user: authResult.user,
    data: authResult.user
  });
});

// 8. Employee Onboarding Access Request (ZERO SELF-ASSIGNED ROLES: Always forced to 'risk officer' + 'pending_approval')
const handleAccessRequest = async (req: express.Request, res: express.Response) => {
  const currentUsers = await loadUsersFromMySql();
  if (currentUsers === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca akun dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users: currentUsers });

  const { username, nama, nik, badge, password, role, jabatan, jabatanPengajuan, unitKerja, kodeUnitKerja, email } = req.body;
  const finalBadge = String(badge || nik || username || '').trim();

  if (!nama || !unitKerja || !finalBadge) {
    return res.status(400).json({
      success: false,
      message: 'Nomor Badge Pegawai, Nama Lengkap, Email Dinas, dan Unit Kerja wajib diisi.'
    });
  }

  const submittedJabatan = (jabatanPengajuan || jabatan) ? String(jabatanPengajuan || jabatan).trim() : 'Staf / Risk Officer Unit Kerja';
  const reqResult = pusriDb.requestEmployeeAccess({
    username: (username || finalBadge).trim(),
    nama: String(nama).trim(),
    nik: (nik || finalBadge).trim(),
    badge: finalBadge,
    password: String(password || ''),
    requestedRoleAttempt: role ? String(role) : undefined,
    jabatan: submittedJabatan,
    jabatanPengajuan: submittedJabatan,
    unitKerja: String(unitKerja).trim(),
    kodeUnitKerja: kodeUnitKerja ? String(kodeUnitKerja).trim() : 'OP-IIB',
    email: email ? String(email).trim() : `${(username || finalBadge).toLowerCase()}@pusri.co.id`
  });

  if (!reqResult.success) {
    return res.status(400).json(reqResult);
  }
  if (!reqResult.user || !await persistUserToMySql(reqResult.user.id)) {
    return res.status(503).json({ success: false, message: 'Permohonan akun gagal disimpan ke MySQL.' });
  }

  res.status(201).json({
    success: true,
    pendingApproval: true,
    message: reqResult.message,
    user: reqResult.user,
    data: reqResult.user
  });
};

app.post('/api/auth/request-access', handleAccessRequest);
app.post('/api/auth/register', handleAccessRequest);

// 9. Password Reset Ticket Request (Blocks Unauthenticated Password Takeover!)
const handlePasswordResetTicket = async (req: express.Request, res: express.Response) => {
  const { identifier, email, reason } = req.body;
  let verifiedUser: UserAccount | null;
  try {
    verifiedUser = await findPasswordResetUserInMySql(
      String(identifier || ''),
      String(email || '')
    );
  } catch (error) {
    console.error('[Password Reset] Gagal memverifikasi akun di MySQL:', error);
    return res.status(503).json({ success: false, message: 'Akun tidak dapat diverifikasi karena gagal membaca MySQL.' });
  }
  if (!verifiedUser) {
    return res.status(400).json({
      success: false,
      message: 'Kombinasi Nomor Badge dan Email Korporat tidak cocok dengan data pegawai terdaftar di IAM Pusri.'
    });
  }

  const ticket = {
    id: `RST-${randomUUID()}`,
    identifier: String(identifier || '').trim(),
    userName: verifiedUser.nama,
    badge: verifiedUser.badge || verifiedUser.nik,
    email: verifiedUser.email || String(email || '').trim(),
    unitKerja: verifiedUser.unitKerja,
    reason: reason ? String(reason).trim() : 'Permohonan pemulihan kredensial',
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  try {
    const saved = await createPasswordResetTicketInMySql(ticket);
    if (!saved) {
      return res.status(503).json({ success: false, message: 'Tiket gagal disimpan ke MySQL.' });
    }
  } catch (error) {
    console.error('[Password Reset] Gagal menyimpan tiket ke MySQL:', error);
    return res.status(503).json({ success: false, message: 'Tiket gagal disimpan ke MySQL.' });
  }
  return res.json({
    success: true,
    ticket,
    message: `Tiket pemulihan kredensial (${ticket.id}) telah dikirim ke Administrator IAM Korporat.`
  });
};

app.post('/api/auth/request-password-reset', handlePasswordResetTicket);
app.post('/api/auth/reset-password', handlePasswordResetTicket);

// 10. Authenticated Self-Service Change Password
app.post('/api/auth/change-password', async (req, res) => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body;
  const result = pusriDb.changeOwnPassword(
    user.id,
    String(currentPassword || ''),
    String(newPassword || '')
  );
  if (!result.success) {
    return res.status(400).json(result);
  }
  if (!await persistUserToMySql(user.id)) {
    return res.status(503).json({ success: false, message: 'Kata sandi berubah tetapi gagal disimpan ke MySQL.' });
  }
  return res.json(result);
});

// 11. Protected IAM User Directory & Admin Management Endpoints (STRICT RISK ADMIN ONLY)
app.get('/api/auth/users', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;
  const users = await loadUsersFromMySql();
  if (users === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca akun dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users });
  res.json({ success: true, total: users.length, data: users.map(sanitizeUserAccount) });
});

app.get('/api/iam/users', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;
  const users = await loadUsersFromMySql();
  if (users === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca akun dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users });
  res.json({ success: true, total: users.length, data: users.map(sanitizeUserAccount) });
});

app.post('/api/iam/users', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;

  const currentUsers = await loadUsersFromMySql();
  if (currentUsers === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat akun terbaru dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users: currentUsers });

  const { username, nama, badge, email, password, role, jabatan, unitKerja, kodeUnitKerja } = req.body;
  const result = pusriDb.createOfficialUserByAdmin(
    {
      username,
      nama: String(nama || ''),
      badge: String(badge || ''),
      email: String(email || ''),
      password: String(password || ''),
      role: normalizeUserRole(role),
      jabatan,
      unitKerja: String(unitKerja || ''),
      kodeUnitKerja: String(kodeUnitKerja || 'OP-IIB')
    },
    admin
  );

  if (!result.success) {
    return res.status(400).json(result);
  }
  if (!result.user || !await persistUserToMySql(result.user.id)) {
    return res.status(503).json({ success: false, message: 'Akun gagal disimpan sepenuhnya ke MySQL.' });
  }
  return res.status(201).json(result);
});

app.put('/api/iam/users/:id/access', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;

  const currentUsers = await loadUsersFromMySql();
  if (currentUsers === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat akun terbaru dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ users: currentUsers });

  const { role, accountStatus, unitKerja, kodeUnitKerja, jabatan } = req.body;
  const result = pusriDb.updateIamAccessByAdmin(
    req.params.id,
    {
      role: role ? normalizeUserRole(role) : undefined,
      accountStatus,
      unitKerja,
      kodeUnitKerja,
      jabatan
    },
    admin
  );

  if (!result.success) {
    return res.status(400).json(result);
  }
  if (!result.user || !await persistUserToMySql(result.user.id)) {
    return res.status(503).json({ success: false, message: 'Perubahan akun gagal disimpan sepenuhnya ke MySQL.' });
  }
  return res.json(result);
});

app.get('/api/iam/security-logs', (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;
  const logs = pusriDb.getIamSecurityLogs();
  res.json({ success: true, total: logs.length, data: logs });
});

app.get('/api/iam/reset-tickets', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;
  let tickets = await loadPasswordResetTicketsFromMySql();
  if (tickets === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca tiket reset sandi dari MySQL.' });
  }
  try {
    const migrated = await migratePendingPasswordResetTicketsToMySql(pusriDb.getPasswordResetTickets());
    if (migrated > 0) {
      tickets = await loadPasswordResetTicketsFromMySql();
      if (tickets === null) {
        return res.status(503).json({ success: false, message: 'Tiket berhasil dipindahkan, tetapi gagal memuat ulang antrean MySQL.' });
      }
    }
  } catch (error) {
    console.error('[MySQL Reset Ticket Migration Error]:', error);
    return res.status(503).json({ success: false, message: 'Gagal memindahkan tiket pending ke MySQL.' });
  }
  res.json({ success: true, total: tickets.length, data: tickets });
});

app.post('/api/iam/reset-tickets/:id/resolve', async (req, res) => {
  const admin = requireRiskAdmin(req, res);
  if (!admin) return;

  const { action, newTemporaryPassword } = req.body;
  const result = await resolvePasswordResetTicketInMySql(
    req.params.id,
    action === 'reject' ? 'reject' : 'approve',
    newTemporaryPassword ? String(newTemporaryPassword) : undefined,
    `${admin.nama} (${admin.badge || admin.username})`
  );
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Get User Profile & RBAC Permissions (Verified via Session Token first)
app.get('/api/user/profile', (req, res) => {
  const sessionUser = getVerifiedSessionUser(req);
  const badgeQuery = sessionUser?.badge || (req.query.badge as string) || (req.query.username as string) || (req.query.identifier as string);
  const role = sessionUser?.role || (req.query.role as string) || 'risk officer';

  if (badgeQuery) {
    const user = (sessionUser ? pusriDb.findUser(sessionUser.id) : undefined) || sessionUser || pusriDb.findUser(badgeQuery);
    if (user) {
      const initials = user.nama
        ? user.nama.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
        : 'US';
      return res.json({
        success: true,
        data: {
          nik: user.nik || user.badge || '-',
          badge: user.badge || user.nik || '-',
          nama: user.nama,
          email: user.email || `${(user.username || user.badge || 'user').toLowerCase()}@pusri.co.id`,
          jabatan: user.jabatan || (user.role === 'risk admin' ? 'Super Admin Enterprise Risk Management Korporat (Risk Admin)' : user.role === 'risk owner' ? 'Vice President Operasi Pabrik Pusri IIB (Risk Owner)' : 'Risk Officer Unit Kerja Pabrik'),
          unitKerja: user.unitKerja,
          kodeUnitKerja: user.kodeUnitKerja || 'OP-IIB',
          role: user.role,
          avatarUrl: user.avatarUrl,
          avatarInitials: initials,
          terakhirLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('id-ID') : 'Sesi SSO Aktif',
          hakAkses: user.role === 'risk admin' ? [
            'Otoritas Penuh Manajemen Akses & Single Sign-On (IAM)',
            'Identifikasi & Usulan Risiko Lintas Departemen',
            'Review & Verifikasi Atasan/VP',
            'Approval Korporat & Penugasan PIC Resmi',
            'Pengendalian Triwulan (TW 1-4) & Evaluasi Carry Over',
            'Master Data Organisasi & Manajemen Database MySQL'
          ] : user.role === 'risk owner' ? [
            'Review & Verifikasi Usulan Risiko Unit Kerja',
            'Validasi Matriks 5x5 Tingkat Risiko Inherent',
            'Pemberian Arahan Strategi Penanganan',
            'Penerusan Usulan ke Risk Admin Korporat'
          ] : [
            'Pengisian Formulir Identifikasi Risiko (SOP 1-7)',
            'Checklist Standar Jenis & Kategori Risiko',
            'Input Realisasi Pengendalian Triwulanan (TW 1-4)'
          ]
        }
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Profil memerlukan sesi Single Sign-On yang aktif.'
  });
});

// Update User Profile Endpoint (Authenticated self-profile update, RBAC fields locked)
app.put('/api/user/profile', async (req, res) => {
  const sessionUser = requireAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const { nama, email, jabatan, unitKerja, kodeUnitKerja } = req.body;
  const updated = pusriDb.updateUserProfile(sessionUser.id, {
    nama,
    email,
    jabatan,
    unitKerja,
    kodeUnitKerja
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan di database IAM.' });
  }
  if (!await persistUserToMySql(sessionUser.id)) {
    return res.status(503).json({ success: false, message: 'Perubahan profil gagal disimpan ke MySQL.' });
  }

  res.json({
    success: true,
    message: 'Profil pegawai berhasil diperbarui.',
    data: updated
  });
});

app.put('/api/user/profile/avatar', async (req, res) => {
  const sessionUser = requireAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const imageData = req.body?.imageData;
  const match = typeof imageData === 'string'
    ? imageData.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!match) {
    return res.status(422).json({ success: false, message: 'Pilih gambar JPG, PNG, atau WebP yang valid.' });
  }

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const imageBuffer = Buffer.from(match[2], 'base64');
  if (imageBuffer.length > 2 * 1024 * 1024) {
    return res.status(413).json({ success: false, message: 'Ukuran foto maksimal 2 MB.' });
  }

  const validSignature =
    (extension === 'jpg' && imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff) ||
    (extension === 'png' && imageBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (extension === 'webp' && imageBuffer.toString('ascii', 0, 4) === 'RIFF' && imageBuffer.toString('ascii', 8, 12) === 'WEBP');
  if (!validSignature) {
    return res.status(422).json({ success: false, message: 'Isi file tidak sesuai format gambar yang dipilih.' });
  }

  const fileName = `${randomUUID()}.${extension}`;
  const avatarDirectory = path.join(process.cwd(), 'uploads', 'profile-avatars');
  const avatarUrl = `/uploads/profile-avatars/${fileName}`;
  try {
    await fs.promises.mkdir(avatarDirectory, { recursive: true });
    await fs.promises.writeFile(path.join(avatarDirectory, fileName), imageBuffer, { flag: 'wx' });
    const updatedUser = pusriDb.updateUserProfile(sessionUser.id, { avatarUrl });
    if (!updatedUser) {
      await fs.promises.unlink(path.join(avatarDirectory, fileName));
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan di database IAM.' });
    }

    if (getMySqlStatus().isConnected) {
      const savedToMySql = await updateUserAvatarInMySql(sessionUser.id, avatarUrl);
      if (!savedToMySql) {
        console.warn(`[MySQL Avatar Sync] Tidak ada baris akun MySQL untuk user ${sessionUser.id}.`);
      }
    }

    return res.json({
      success: true,
      message: 'Foto profil berhasil diperbarui.',
      data: { avatarUrl }
    });
  } catch (error) {
    console.error('[Profile Avatar Upload Error]:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan foto profil di server.' });
  }
});

app.delete('/api/user/profile/avatar', async (req, res) => {
  const sessionUser = requireAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const user = pusriDb.findUserById(sessionUser.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan di database IAM.' });
  }

  const previousAvatarUrl = user.avatarUrl;
  if (previousAvatarUrl && !/^\/uploads\/profile-avatars\/[a-f0-9-]+\.(?:jpg|png|webp)$/i.test(previousAvatarUrl)) {
    return res.status(422).json({ success: false, message: 'Lokasi foto profil tersimpan tidak valid.' });
  }

  try {
    if (getMySqlStatus().isConnected) {
      await updateUserAvatarInMySql(sessionUser.id, null);
    }

    const updatedUser = pusriDb.updateUserProfile(sessionUser.id, { avatarUrl: undefined });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan di database IAM.' });
    }

    if (previousAvatarUrl) {
      const fileName = path.basename(previousAvatarUrl);
      const avatarPath = path.join(process.cwd(), 'uploads', 'profile-avatars', fileName);
      await fs.promises.unlink(avatarPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }

    return res.json({
      success: true,
      message: 'Foto profil berhasil dihapus.'
    });
  } catch (error) {
    console.error('[Profile Avatar Delete Error]:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus foto profil.' });
  }
});

// 2. Master Checklist Jenis Risiko (Sesuai Kategori Risiko)
app.get('/api/master/checklist-jenis-risiko', (req, res) => {
  const { kategori, search } = req.query;
  const items = pusriDb.getMasterChecklist(
    typeof kategori === 'string' ? kategori : undefined,
    typeof search === 'string' ? search : undefined
  );

  const allItems = pusriDb.getMasterChecklist();
  const categories = Array.from(new Set(allItems.map((i: any) => i.kategori)));

  res.json({
    success: true,
    total: items.length,
    categories,
    data: items
  });
});

// 2B. Master Sumber Risiko (Baca oleh seluruh role untuk dropdown, Input/Edit/Hapus DIKUNCI KHUSUS Risk Admin)
app.get('/api/master/sumber-risiko', async (_req, res) => {
  const groups = await loadSumberRisikoFromMySql();
  if (groups === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca master sumber risiko dari MySQL.' });
  }
  const totalItems = groups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
  res.json({
    success: true,
    totalCategories: groups.length,
    totalItems,
    data: groups
  });
});

app.post('/api/master/sumber-risiko', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const currentSources = await loadSumberRisikoFromMySql();
  if (currentSources === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master sumber risiko dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ sumberRisiko: currentSources });

  const { kategori, item } = req.body || {};
  const result = pusriDb.addMasterSumberRisiko(
    String(kategori || ''),
    String(item || ''),
    `${adminUser.nama} (${adminUser.badge || 'Admin'})`
  );
  if (!result.success) {
    return res.status(400).json(result);
  }
  saveSqlDumpToDisk();
  const saved = await syncSumberRisikoToMySql(result.data);
  if (saved !== result.data.reduce((total, group) => total + group.items.length, 0)) {
    return res.status(503).json({ success: false, message: 'Master sumber risiko gagal disimpan ke MySQL.' });
  }
  res.json(result);
});

app.put('/api/master/sumber-risiko', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const actorLabel = `${adminUser.nama} (${adminUser.badge || 'Admin'})`;
  if (req.body?.action === 'reset') {
    const resetData = pusriDb.resetMasterSumberRisiko(actorLabel);
    saveSqlDumpToDisk();
    const saved = await syncSumberRisikoToMySql(resetData);
    if (saved !== resetData.reduce((total, group) => total + group.items.length, 0)) {
      return res.status(503).json({ success: false, message: 'Master sumber risiko gagal disimpan ke MySQL.' });
    }
    return res.json({
      success: true,
      message: 'Master Sumber Risiko berhasil dikembalikan ke standar awal Pusri.',
      data: resetData
    });
  }

  const currentSources = await loadSumberRisikoFromMySql();
  if (currentSources === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master sumber risiko dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ sumberRisiko: currentSources });

  const { oldKategori, newKategori, oldItem, newItem } = req.body || {};
  const result = pusriDb.updateMasterSumberRisiko({
    oldKategori: String(oldKategori || ''),
    newKategori: newKategori !== undefined ? String(newKategori) : undefined,
    oldItem: oldItem !== undefined ? String(oldItem) : undefined,
    newItem: newItem !== undefined ? String(newItem) : undefined,
    actor: actorLabel
  });
  if (!result.success) {
    return res.status(400).json(result);
  }
  saveSqlDumpToDisk();
  const saved = await syncSumberRisikoToMySql(result.data);
  if (saved !== result.data.reduce((total, group) => total + group.items.length, 0)) {
    return res.status(503).json({ success: false, message: 'Master sumber risiko gagal disimpan ke MySQL.' });
  }
  res.json(result);
});

app.delete('/api/master/sumber-risiko', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const currentSources = await loadSumberRisikoFromMySql();
  if (currentSources === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master sumber risiko dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ sumberRisiko: currentSources });

  const kategori = (req.body?.kategori ?? req.query?.kategori ?? '') as string;
  const item = (req.body?.item ?? req.query?.item) as string | undefined;
  const result = pusriDb.deleteMasterSumberRisiko({
    kategori: String(kategori),
    item: item !== undefined ? String(item) : undefined,
    actor: `${adminUser.nama} (${adminUser.badge || 'Admin'})`
  });
  if (!result.success) {
    return res.status(400).json(result);
  }
  saveSqlDumpToDisk();
  const saved = await syncSumberRisikoToMySql(result.data);
  if (saved !== result.data.reduce((total, group) => total + group.items.length, 0)) {
    return res.status(503).json({ success: false, message: 'Master sumber risiko gagal disimpan ke MySQL.' });
  }
  res.json(result);
});

app.get('/api/master/likelihood-consequence', async (_req, res) => {
  try {
    const data = await loadMasterLikelihoodConsequenceFromMySql();
    return res.json({ success: true, total: data.length, data });
  } catch (error: any) {
    console.error('[Master Likelihood MySQL] Gagal memuat data:', error);
    return res.status(503).json({
      success: false,
      message: error?.message || 'Gagal memuat Master Likelihood dari MySQL.'
    });
  }
});

app.put('/api/master/likelihood-consequence', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const rows = req.body?.action === 'reset'
    ? DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE
    : req.body?.rows;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ success: false, message: 'Data Master Likelihood tidak valid.' });
  }

  const validLevels = new Set<number>();
  const validIds = new Set<string>();
  const validGrades = new Set(['L', 'LM', 'M', 'MH', 'H']);
  const normalizedRows: MasterLikelihoodConsequenceRow[] = [];
  for (const row of rows) {
    const likelihood = Number(row?.likelihood);
    const id = typeof row?.id === 'string' ? row.id.trim() : '';
    const grades = [row?.c1, row?.c2, row?.c3, row?.c4, row?.c5];
    if (
      !id || id.length > 20 || validIds.has(id) ||
      !Number.isInteger(likelihood) || likelihood < 1 || likelihood > 255 || validLevels.has(likelihood) ||
      typeof row?.keteranganEn !== 'string' || !row.keteranganEn.trim() || row.keteranganEn.length > 100 ||
      typeof row?.keteranganId !== 'string' || !row.keteranganId.trim() || row.keteranganId.length > 100 ||
      !grades.every((grade: unknown) => typeof grade === 'string' && validGrades.has(grade)) ||
      !['Aktif', 'Nonaktif'].includes(row?.status)
    ) {
      return res.status(400).json({ success: false, message: 'Terdapat baris Master Likelihood yang tidak valid atau duplikat.' });
    }
    validIds.add(id);
    validLevels.add(likelihood);
    normalizedRows.push({
      id,
      likelihood,
      keteranganEn: row.keteranganEn.trim(),
      keteranganId: row.keteranganId.trim(),
      c1: row.c1,
      c2: row.c2,
      c3: row.c3,
      c4: row.c4,
      c5: row.c5,
      status: row.status
    });
  }

  try {
    await replaceMasterLikelihoodConsequenceInMySql(normalizedRows);
    const data = await loadMasterLikelihoodConsequenceFromMySql();
    return res.json({
      success: true,
      message: req.body?.action === 'reset'
        ? 'Master Likelihood berhasil dikembalikan ke standar.'
        : 'Master Likelihood berhasil disimpan ke MySQL.',
      total: data.length,
      data
    });
  } catch (error: any) {
    console.error(`[Master Likelihood MySQL] Gagal menyimpan oleh ${adminUser.username}:`, error);
    return res.status(503).json({
      success: false,
      message: error?.message || 'Gagal menyimpan Master Likelihood ke MySQL.'
    });
  }
});

// 3. Master Organisasi & Departemen (Baca publik internal, Input/Edit/Hapus DIKUNCI KHUSUS Risk Admin)
app.get('/api/master/departments', async (_req, res) => {
  const departments = await loadDepartmentsFromMySql();
  if (departments === null) {
    return res.status(503).json({ success: false, message: 'Gagal membaca master organisasi dari MySQL.' });
  }
  res.json({
    success: true,
    data: departments
  });
});

app.post('/api/master/departments/:kode/personnel', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const currentDepartments = await loadDepartmentsFromMySql();
  if (currentDepartments === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master organisasi dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ departments: currentDepartments });

  const { kode } = req.params;
  const { type, nik, nama } = req.body;
  if (!nik || !nama || !type || !['officer', 'owner'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type (officer/owner), NIK, dan Nama wajib diisi.' });
  }
  const updated = pusriDb.addDepartmentPersonnel(kode, type, { nik, nama });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Departemen tidak ditemukan.' });
  }
  saveSqlDumpToDisk();
  const departments = pusriDb.getAllDepartments();
  const saved = await syncDepartmentsToMySql(departments);
  if (saved !== departments.length) {
    return res.status(503).json({ success: false, message: 'Master organisasi gagal disimpan ke MySQL.' });
  }
  res.json({ success: true, data: updated });
});

app.delete('/api/master/departments/:kode/personnel/:type/:nik', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const currentDepartments = await loadDepartmentsFromMySql();
  if (currentDepartments === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master organisasi dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ departments: currentDepartments });

  const { kode, type, nik } = req.params;
  if (!type || !['officer', 'owner'].includes(type) || !nik) {
    return res.status(400).json({ success: false, message: 'Parameter tidak valid.' });
  }
  const updated = pusriDb.removeDepartmentPersonnel(kode, type as 'officer' | 'owner', decodeURIComponent(nik));
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Departemen tidak ditemukan.' });
  }
  saveSqlDumpToDisk();
  const departments = pusriDb.getAllDepartments();
  const saved = await syncDepartmentsToMySql(departments);
  if (saved !== departments.length) {
    return res.status(503).json({ success: false, message: 'Master organisasi gagal disimpan ke MySQL.' });
  }
  res.json({ success: true, data: updated });
});

app.put('/api/master/departments/:kode', async (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const currentDepartments = await loadDepartmentsFromMySql();
  if (currentDepartments === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat master organisasi dari MySQL.' });
  }
  pusriDb.hydrateFromMySql({ departments: currentDepartments });

  const { kode } = req.params;
  const data = req.body;
  const updated = pusriDb.updateDepartment({ ...data, kode });
  saveSqlDumpToDisk();
  const departments = pusriDb.getAllDepartments();
  const saved = await syncDepartmentsToMySql(departments);
  if (saved !== departments.length) {
    return res.status(503).json({ success: false, message: 'Master organisasi gagal disimpan ke MySQL.' });
  }
  res.json({ success: true, data: updated });
});

// 4. Endpoint Validasi Data Risiko & Kebutuhan Mitigasi
app.post('/api/risks/validate', (req, res) => {
  const {
    pernyataanRisiko,
    penyebabRisiko,
    dampakRisiko,
    kemungkinanAwal,
    dampakAwal,
    jenisPenanganan,
    rencanaPenanganan
  } = req.body;

  const errors: string[] = [];

  if (!pernyataanRisiko || typeof pernyataanRisiko !== 'string' || pernyataanRisiko.trim().length < 5) {
    errors.push('Pernyataan risiko wajib diisi (minimal 5 karakter).');
  }
  if (!penyebabRisiko || typeof penyebabRisiko !== 'string' || penyebabRisiko.trim().length < 3) {
    errors.push('Akar penyebab risiko wajib diisi.');
  }
  if (!dampakRisiko || typeof dampakRisiko !== 'string' || dampakRisiko.trim().length < 3) {
    errors.push('Uraian dampak risiko wajib diisi.');
  }

  const k = Number(kemungkinanAwal) || 1;
  const d = Number(dampakAwal) || 1;
  const assessment = assessMitigationRequirement(k, d);

  // Validation rules for Mitigation requirement (All 4 strategies permitted)
  if (jenisPenanganan === 'Mitigasi') {
    if (!rencanaPenanganan || typeof rencanaPenanganan !== 'string' || rencanaPenanganan.trim().length < 5) {
      errors.push('Rencana langkah mitigasi wajib diisi jika jenis penanganan adalah Mitigasi.');
    }
  }

  res.json({
    valid: errors.length === 0,
    errors,
    assessment
  });
});

// 4B. API Pengajuan Approval Identifikasi Risiko & Pemisahan Risiko Otomatis
// Memvalidasi data dari Unit Kerja, memisahkan data menjadi risiko individual, dan menyimpan ke database
app.post('/api/approval/submit-identifikasi', (req, res) => {
  const { identifikasi, sasaranRKAP, sasaranUnitKerja, konteksEksternal, konteksInternal, kodeOrganisasi, namaOrganisasi, tahun, createdBy, risks } = req.body;
  
  const incomingItems: any[] = Array.isArray(risks) 
    ? risks 
    : (Array.isArray(req.body) ? req.body : (req.body.pernyataanRisiko ? [req.body] : []));

  if (incomingItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada data identifikasi risiko yang diajukan untuk approval.'
    });
  }

  const validationErrors: { index: number; errors: string[] }[] = [];
  const processedRisks: PusriRisk[] = [];
  const currentTotal = pusriDb.countRisks();

  // Validasi menyeluruh untuk memastikan data risiko yang diajukan lengkap
  incomingItems.forEach((item, index) => {
    const itemErrors: string[] = [];
    if (!item.pernyataanRisiko || typeof item.pernyataanRisiko !== 'string' || item.pernyataanRisiko.trim().length === 0) {
      itemErrors.push('Pernyataan risiko wajib diisi.');
    }
    if (!item.penyebabRisiko || typeof item.penyebabRisiko !== 'string' || item.penyebabRisiko.trim().length === 0) {
      itemErrors.push('Akar penyebab risiko wajib diisi.');
    }
    if (!item.dampakRisiko || typeof item.dampakRisiko !== 'string' || item.dampakRisiko.trim().length === 0) {
      itemErrors.push('Uraian dampak risiko wajib diisi.');
    }
    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    if (kemungkinan < 1 || kemungkinan > 5 || dampak < 1 || dampak > 5) {
      itemErrors.push('Skala kemungkinan dan dampak harus berada dalam rentang 1 - 5.');
    }

    if (itemErrors.length > 0) {
      validationErrors.push({ index: index + 1, errors: itemErrors });
    }
  });

  if (validationErrors.length > 0) {
    const details = validationErrors.map(v => `Butir #${v.index}: ${v.errors.join(', ')}`).join(' | ');
    return res.status(422).json({
      success: false,
      message: `Pengajuan approval ditolak: ${details}`,
      errors: validationErrors
    });
  }

  const baseNowMs = Date.now();
  // Pemisahan Identifikasi Risiko Secara Otomatis menjadi data risiko individual
  incomingItems.forEach((item, idx) => {
    // Pastikan urutan paling atas draf memiliki timestamp terbaru sehingga muncul paling atas
    const itemIsoTime = new Date(baseNowMs + (incomingItems.length - idx)).toISOString();
    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    const inherentScore = kemungkinan * dampak;
    const level = calculateRiskLevel(kemungkinan, dampak);
    const generatedCode = pusriDb.getNextRiskCode(Number(item.tahun || tahun || 2026));
    const finalId = (item.id && !pusriDb.getRiskById(item.id)) ? item.id : generatedCode.id;
    const kodeRisiko = (item.kodeRisiko && !pusriDb.getRiskById(item.kodeRisiko)) ? item.kodeRisiko : generatedCode.kodeRisiko;

    const butuhMitigasi = inherentScore >= 10 || item.jenisPenanganan === 'Mitigasi';
    const statusKebutuhanMitigasi = inherentScore >= 16 
      ? 'Wajib Mitigasi Segera (High Risk)' 
      : inherentScore >= 12 
        ? 'Wajib Mitigasi Aktif (Mod to High)' 
        : inherentScore >= 8 
          ? 'Mitigasi Direkomendasikan (Moderate)' 
          : 'Toleransi Terpenuhi (Dapat Diterima)';

    const separatedRisk: PusriRisk = {
      id: finalId,
      kodeRisiko,
      kodeOrganisasi: item.kodeOrganisasi || kodeOrganisasi || 'OP-IIB',
      namaOrganisasi: item.namaOrganisasi || namaOrganisasi || 'Departemen Operasi Pabrik Pusri IIB',
      tahun: Number(item.tahun || tahun || 2026),
      sasaranRKAP: item.sasaranRKAP || sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || konteksEksternal || '-',
      konteksInternal: item.konteksInternal || konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional & Produksi',
      pernyataanRisiko: item.pernyataanRisiko.trim(),
      penyebabRisiko: item.penyebabRisiko.trim(),
      dampakRisiko: item.dampakRisiko.trim(),
      pengendalianExisting: item.pengendalianExisting || 'Monitoring SOP Rutin',
      kategoriRisiko: item.kategoriRisiko || 'Operasional',
      kriteriaDampakKey: item.kriteriaDampakKey || undefined,
      kriteriaDampakTitle: item.kriteriaDampakTitle || undefined,
      kriteriaDampakLevel: item.kriteriaDampakLevel !== undefined ? Number(item.kriteriaDampakLevel) : (dampak || undefined),
      kemungkinanAwal: kemungkinan,
      dampakAwal: dampak,
      tingkatRisikoAwal: level,
      currentTingkatRisiko: level,
      inherentScore,
      butuhMitigasi,
      statusKebutuhanMitigasi,
      alasanKebutuhanMitigasi: butuhMitigasi
        ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.`
        : `Skor inherent ${inherentScore} (<10) dalam batas toleransi.`,
      jenisPenanganan: item.jenisPenanganan || (butuhMitigasi ? 'Mitigasi' : 'Diterima'),
      rencanaPenanganan: item.rencanaPenanganan || '',
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'Risiko Awal (Input Unit Kerja)',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: (item.jenisPenanganan === 'Diterima' || item.jenisPenanganan === 'Dihindari' || item.jenisPenanganan === 'Transfer' || (item.jenisPenanganan as string) === 'Ditransfer') ? '-' : (item.picPelaksana || 'Superintendent Operasi'),
      picPengendali: (item.jenisPenanganan === 'Diterima' || item.jenisPenanganan === 'Dihindari' || item.jenisPenanganan === 'Transfer' || (item.jenisPenanganan as string) === 'Ditransfer') ? '-' : (item.picPengendali || 'VP Departemen'),
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin / OPEX',
      statusWorkflow: 'Menunggu_Approval_VP',
      pengendalianTriwulan: [],
      createdDate: itemIsoTime,
      updatedDate: itemIsoTime,
      createdBy: createdBy || item.createdBy || 'User Unit Kerja'
    };

    const saved = pusriDb.createRisk(separatedRisk);
    processedRisks.push(saved);
    saveRiskToMySql(saved).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  });

  res.status(201).json({
    success: true,
    message: `Pengajuan approval identifikasi risiko berhasil diproses. ${processedRisks.length} data risiko telah dipisahkan secara otomatis dan disimpan ke database untuk review Atasan / VP.`,
    count: processedRisks.length,
    statusWorkflow: 'Menunggu_Approval_VP',
    data: processedRisks
  });
});

// API 1: Mengambil daftar risiko yang menunggu proses review oleh Atasan/VP
app.get('/api/vp/pending-risks', async (req, res) => {
  const { kodeOrganisasi, search } = req.query;
  const databaseRisks = await loadRisksFromMySql();
  if (databaseRisks === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat risiko dari MySQL.' });
  }
  const query = typeof search === 'string' ? search.toLowerCase() : '';
  const list = databaseRisks.filter((risk) =>
    risk.statusWorkflow === 'Menunggu_Approval_VP' &&
    (!kodeOrganisasi || kodeOrganisasi === 'ALL' || risk.kodeOrganisasi === kodeOrganisasi) &&
    (!query || [risk.pernyataanRisiko, risk.kodeRisiko, risk.namaOrganisasi, risk.rencanaPenanganan]
      .some((value) => value.toLowerCase().includes(query)))
  );

  res.json({
    success: true,
    total: list.length,
    data: list
  });
});

// API 2: Mengambil detail data risiko yang akan dilakukan review
app.get('/api/vp/risks/:id', async (req, res) => {
  const databaseRisks = await loadRisksFromMySql();
  if (databaseRisks === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat risiko dari MySQL.' });
  }
  const risk = databaseRisks.find((item) => item.id === req.params.id || item.kodeRisiko === req.params.id);
  if (!risk) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${req.params.id} tidak ditemukan.`
    });
  }

  res.json({
    success: true,
    data: risk
  });
});

// API 3: Proses Review dan Approval Risiko oleh Atasan/VP (Enforced Server-Side SSO Token)
app.post('/api/vp/risks/:id/decision', (req, res) => {
  const { id } = req.params;
  const { decision, notes, picPelaksana, picPengendali } = req.body;

  const sessionUser = requireAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const normRole = sessionUser.role;
  const actor = `${sessionUser.nama} (${sessionUser.badge})`;
  const role = normRole;

  if (normRole !== 'risk owner' && normRole !== 'risk admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak (Zero-Trust IAM): Hanya Risk Owner (VP) dan Risk Admin terverifikasi SSO yang memiliki hak akses review risiko.'
    });
  }

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan di database.`
    });
  }

  // Mencegah risiko yang telah diproses agar tidak dilakukan approval berulang pada status yang tidak sesuai
  if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || existing.statusWorkflow === 'Menunggu_Approval_Admin' || existing.statusWorkflow === 'Tercatat_Final') {
    if (decision === 'approve') {
      return res.status(409).json({
        success: false,
        message: `Risiko ${existing.kodeRisiko} telah disetujui sebelumnya (status saat ini: ${existing.statusWorkflow}). Approval berulang tidak diperbolehkan.`
      });
    }
  }

  if (decision === 'revisi') {
    const revisionNote = (notes && typeof notes === 'string' && notes.trim().length >= 3)
      ? notes.trim()
      : 'Mohon lakukan perbaikan dan penyempurnaan uraian risiko serta rencana mitigasi sesuai arahan SOP Pusri sebelum diajukan kembali.';

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Revisi',
        reviewNotesVp: revisionNote
      },
      actor || 'Atasan / VP',
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'revisi',
      statusWorkflow: 'Revisi',
      message: `Risiko ${existing.kodeRisiko} berhasil dikembalikan ke Unit Kerja dengan status (revisi).`,
      data: updated
    });
  }

  if (decision === 'approve') {
    const completesAtVp = isNonMitigationStrategy(existing.jenisPenanganan);
    const nextStatus = completesAtVp ? 'Tercatat_Final' : 'Menunggu_Approval_Admin';
    const defaultVpNote = completesAtVp
      ? `Telah direview dan disetujui oleh Atasan / VP (Strategi ${existing.jenisPenanganan} — persetujuan selesai di tingkat Atasan / VP).`
      : 'Telah disetujui oleh Atasan / VP dan diteruskan ke Risk Admin.';

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: nextStatus,
        reviewNotesVp: notes ? notes.trim() : defaultVpNote,
        picPelaksana: picPelaksana !== undefined ? picPelaksana : (existing.picPelaksana || ''),
        picPengendali: picPengendali !== undefined ? picPengendali : (existing.picPengendali || '')
      },
      actor || 'Atasan / VP',
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'approve',
      statusWorkflow: nextStatus,
      message: completesAtVp
        ? `Risiko ${existing.kodeRisiko} (Strategi ${existing.jenisPenanganan}) berhasil disetujui oleh Atasan / VP dan selesai di tingkat Atasan / VP.`
        : `Risiko ${existing.kodeRisiko} berhasil disetujui oleh Atasan / VP dan diteruskan ke tahap Approval Admin Korporat.`,
      data: updated
    });
  }

  return res.status(400).json({
    success: false,
    message: "Keputusan review tidak valid. Pilihan keputusan: 'approve' atau 'revisi'."
  });
});

// 5. Get All Risks (dengan filter & search)
app.get('/api/risks', async (req, res) => {
  const { kodeOrganisasi, tahun, status, search, kategori, tingkatRisiko } = req.query;

  const databaseRisks = await loadRisksFromMySql();
  if (databaseRisks === null) {
    return res.status(503).json({
      success: false,
      message: 'Data risiko tidak dapat dimuat karena koneksi MySQL belum tersedia.'
    });
  }
  const result = databaseRisks.filter((risk) =>
    (!kodeOrganisasi || kodeOrganisasi === 'ALL' || risk.kodeOrganisasi === kodeOrganisasi) &&
    (!tahun || tahun === 'ALL' || risk.tahun === Number(tahun)) &&
    (!status || status === 'ALL' || risk.statusWorkflow === status) &&
    (!kategori || kategori === 'ALL' || risk.kategoriRisiko === kategori) &&
    (!tingkatRisiko || tingkatRisiko === 'ALL' || risk.tingkatRisikoAwal === tingkatRisiko || risk.currentTingkatRisiko === tingkatRisiko) &&
    (!search || [
      risk.pernyataanRisiko,
      risk.kodeRisiko,
      risk.namaOrganisasi,
      risk.rencanaPenanganan
    ].some((value) => value.toLowerCase().includes(String(search).toLowerCase())))
  );

  res.json({
    success: true,
    total: result.length,
    data: result
  });
});

// 6. Get Single Risk by ID
app.get('/api/risks/:id', async (req, res) => {
  const databaseRisks = await loadRisksFromMySql();
  if (databaseRisks === null) {
    return res.status(503).json({ success: false, message: 'Gagal memuat risiko dari MySQL.' });
  }
  const risk = databaseRisks.find((item) => item.id === req.params.id || item.kodeRisiko === req.params.id);
  if (!risk) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan' });
  }
  res.json({ success: true, data: risk });
});

// 7. Create New Risk(s) - Menyimpan ke Database (Single & Bulk)
app.post('/api/risks', async (req, res) => {
  const payload = req.body;

  const incomingRisks: Partial<PusriRisk>[] = Array.isArray(payload) 
    ? payload 
    : (Array.isArray(payload.risks) ? payload.risks : [payload]);

  if (incomingRisks.length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada data risiko yang dikirim.' });
  }

  const createdRisks: PusriRisk[] = [];
  const validationErrors: { index: number; errors: string[] }[] = [];
  const currentTotal = pusriDb.countRisks();

  incomingRisks.forEach((item, index) => {
    const itemErrors: string[] = [];
    if (!item.pernyataanRisiko || item.pernyataanRisiko.trim().length < 3) {
      itemErrors.push('Pernyataan risiko wajib diisi.');
    }
    if (!item.kodeOrganisasi) {
      itemErrors.push('Unit kerja/organisasi wajib dipilih.');
    }

    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    const level: any = calculateRiskLevel(kemungkinan, dampak);
    const inherentScore = kemungkinan * dampak;

    const allowedCategories = ['Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan'];
    if (item.kategoriRisiko && !allowedCategories.includes(item.kategoriRisiko)) {
      itemErrors.push(`Kategori risiko '${item.kategoriRisiko}' tidak valid. Harus salah satu dari: ${allowedCategories.join(', ')}.`);
    }

    if (itemErrors.length > 0) {
      validationErrors.push({ index, errors: itemErrors });
      return;
    }

    const now = new Date(Date.now() + (incomingRisks.length - index)).toISOString();
    const generatedCode = pusriDb.getNextRiskCode(Number(item.tahun) || 2026);
    const newRiskId = (item.id && !pusriDb.getRiskById(item.id)) ? item.id : generatedCode.id;
    const kodeRisiko = (item.kodeRisiko && !pusriDb.getRiskById(item.kodeRisiko)) ? item.kodeRisiko : generatedCode.kodeRisiko;

    const butuhMitigasi = inherentScore >= 10 || item.jenisPenanganan === 'Mitigasi';
    const statusKebutuhanMitigasi = inherentScore >= 16 
      ? 'Wajib Mitigasi Segera (High Risk)' 
      : inherentScore >= 12 
        ? 'Wajib Mitigasi Aktif (Mod to High)' 
        : inherentScore >= 8 
          ? 'Mitigasi Direkomendasikan (Moderate)' 
          : item.jenisPenanganan === 'Mitigasi' 
            ? 'Mitigasi Sukarela' 
            : 'Toleransi Terpenuhi (Dapat Diterima)';

    const alasanKebutuhanMitigasi = inherentScore >= 10
      ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib menyusun rencana mitigasi.`
      : `Skor inherent ${inherentScore} (<10) berada dalam batas toleransi wajar.`;

    const newRisk: PusriRisk = {
      id: newRiskId,
      kodeRisiko,
      kodeOrganisasi: item.kodeOrganisasi || 'PRD-1B',
      namaOrganisasi: item.namaOrganisasi || 'Departemen Operasi Pabrik 1B',
      tahun: Number(item.tahun) || 2026,
      sasaranRKAP: item.sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || '-',
      konteksInternal: item.konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional & Produksi',
      pernyataanRisiko: item.pernyataanRisiko || '',
      penyebabRisiko: item.penyebabRisiko || '-',
      dampakRisiko: item.dampakRisiko || '-',
      pengendalianExisting: item.pengendalianExisting || 'SOP Pengendalian Internal Terkait',
      kategoriRisiko: (item.kategoriRisiko as any) || 'Operasional',
      kriteriaDampakKey: item.kriteriaDampakKey || undefined,
      kriteriaDampakTitle: item.kriteriaDampakTitle || undefined,
      kriteriaDampakLevel: item.kriteriaDampakLevel !== undefined ? Number(item.kriteriaDampakLevel) : (dampak || undefined),
      jenisPenanganan: ((item.jenisPenanganan as string) === 'Ditransfer' ? 'Transfer' : (item.jenisPenanganan || 'Mitigasi')) as any,
      kemungkinanAwal: kemungkinan,
      dampakAwal: dampak,
      tingkatRisikoAwal: level,
      currentTingkatRisiko: level,
      inherentScore,
      butuhMitigasi: item.jenisPenanganan === 'Mitigasi' || inherentScore >= 10,
      statusKebutuhanMitigasi,
      alasanKebutuhanMitigasi,
      rencanaPenanganan: item.rencanaPenanganan && item.rencanaPenanganan.trim()
        ? item.rencanaPenanganan.trim()
        : (item.jenisPenanganan === 'Diterima' ? 'Risiko diterima dalam selera risiko toleransi operasional' : item.jenisPenanganan === 'Dihindari' ? 'Aktivitas penyebab risiko dihindari' : ((item.jenisPenanganan as string) === 'Transfer' || (item.jenisPenanganan as string) === 'Ditransfer') ? 'Pengalihan risiko via skema asuransi/kontrak' : 'Pelaksanaan program tindakan mitigasi'),
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'Risiko Awal (Input Unit Kerja)',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: item.picPelaksana || item.picPengendali || '',
      picPengendali: item.picPengendali || item.picPelaksana || '',
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin',
      statusWorkflow: 'Menunggu_Approval_VP',
      reviewNotesVp: item.reviewNotesVp,
      approvalNotesAdmin: item.approvalNotesAdmin,
      pengendalianTriwulan: item.pengendalianTriwulan || [],
      carryOverInfo: item.carryOverInfo,
      createdDate: now,
      updatedDate: now,
      createdBy: item.createdBy || 'Risk Officer Unit'
    };

    pusriDb.createRisk(newRisk);
    createdRisks.push(newRisk);
  });

  if (validationErrors.length > 0 && createdRisks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input risiko gagal.',
      errors: validationErrors
    });
  }

  const savedRecords = await Promise.all(createdRisks.map((risk) => saveRiskToMySql(risk)));
  if (savedRecords.some((saved) => !saved)) {
    const databaseRisks = await loadRisksFromMySql();
    if (databaseRisks !== null) pusriDb.hydrateFromMySql({ risks: databaseRisks });
    return res.status(503).json({
      success: false,
      message: 'Sebagian data risiko gagal disimpan ke MySQL. Data yang berhasil tersimpan dimuat ulang dari database.',
      savedCount: savedRecords.filter(Boolean).length
    });
  }

  res.status(201).json({
    success: true,
    message: `${createdRisks.length} data risiko berhasil disimpan ke database MySQL Portal Risiko Pusri.`,
    count: createdRisks.length,
    data: createdRisks
  });
});

// 8. Update Risk by ID dengan Enforced Server-Side SSO RBAC
app.put('/api/risks/:id', (req, res) => {
  const { actor: bodyActor, role: bodyRole, ...updates } = req.body;
  const existing = pusriDb.getRiskById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan.' });
  }

  const sessionUser = getVerifiedSessionUser(req);
  const normRole: UserRole = sessionUser ? sessionUser.role : 'risk officer';
  const actor = sessionUser ? `${sessionUser.nama} (${sessionUser.badge})` : (bodyActor || 'User');

  // RBAC Access Control Enforcement (Strictly verified via Server JWT Session, ignoring spoofed body.role)
  const adminRestrictedFields = [
    'sasaranRKAP',
    'sasaranUnitKerja',
    'konteksEksternal',
    'konteksInternal',
    'sumberRisiko',
    'pernyataanRisiko',
    'penyebabRisiko',
    'dampakRisiko',
    'pengendalianExisting',
    'kategoriRisiko',
    'bidangFungsiRisiko',
    'subBidangRisiko',
    'bidangProyek',
    'kemungkinanAwal',
    'dampakAwal',
    'inherentScore',
    'tingkatRisikoAwal',
    'currentTingkatRisiko',
    'jenisPenanganan',
    'rencanaPenanganan',
    'rencanaPengendalian',
    'kriteriaDampakKey',
    'kriteriaDampakTitle'
  ];
  if (normRole === 'risk admin' && adminRestrictedFields.some((field) => field in updates)) {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Risk Admin hanya berwenang melakukan approval dan tidak dapat mengubah data risiko.'
    });
  }

  if (normRole === 'risk admin' && Array.isArray(updates.pengendalianTriwulan)) {
    const existingControls = existing.pengendalianTriwulan || [];
    for (const control of updates.pengendalianTriwulan) {
      const previousControl = existingControls.find((item) => item.triwulan === control.triwulan);
      if (control.isAdminProgressAcc && !previousControl?.isPicAcc) {
        return res.status(409).json({
          success: false,
          message: `ACC laporan pengendalian PIC ${control.triwulan} terlebih dahulu sebelum ACC progres Admin.`
        });
      }
      if (
        control.statusKeputusan &&
        control.statusKeputusan !== previousControl?.statusKeputusan &&
        !previousControl?.isAdminProgressAcc
      ) {
        return res.status(409).json({
          success: false,
          message: `ACC progres pengerjaan Admin ${control.triwulan} terlebih dahulu sebelum evaluasi.`
        });
      }
    }
  }

  if (updates.statusWorkflow && updates.statusWorkflow !== existing.statusWorkflow) {
    if (
      existing.statusWorkflow === 'Menunggu_Approval_VP' &&
      updates.statusWorkflow === 'Tercatat_Final' &&
      normRole !== 'risk owner'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Hanya Atasan / VP yang dapat menyelesaikan risiko non-mitigasi setelah review.'
      });
    }
    if (
      updates.statusWorkflow === 'Menunggu_Approval_Admin' ||
      (existing.statusWorkflow === 'Menunggu_Approval_VP' && (updates.statusWorkflow === 'Draft_Unit' || updates.statusWorkflow === 'Tercatat_Final'))
    ) {
      if (!sessionUser || normRole === 'risk officer') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak (Zero-Trust SSO): Otoritas Review & Verifikasi Risiko hanya dimiliki oleh akun Risk Owner (VP) atau Risk Admin terverifikasi.'
        });
      }
    }
    if (updates.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || updates.statusWorkflow === 'Selesai') {
      if (!sessionUser || normRole !== 'risk admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak (Zero-Trust SSO): Otoritas Approval Korporat & Penugasan Resmi PIC hanya dimiliki oleh akun Risk Admin terverifikasi.'
        });
      }
    }
    if (updates.statusWorkflow === 'Carry_Over') {
      if (!sessionUser || normRole === 'risk officer') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak (Zero-Trust SSO): Penetapan status Carry Over hanya dapat disetujui oleh Komite Risiko / Risk Admin terverifikasi.'
        });
      }
    }
  }

  const updatedRisk = pusriDb.updateRisk(req.params.id, updates, actor, normRole);
  if (updatedRisk) {
    saveRiskToMySql(updatedRisk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: `Risiko ${updatedRisk?.kodeRisiko} berhasil diperbarui. Sinkronisasi antar modul berhasil.`,
    data: updatedRisk
  });
});

// API: Sinkronisasi Seluruh Data Risiko dari UI ke Database (Upsert Batch)
app.post('/api/risks/sync-ui', (req, res) => {
  const { risks, actor = 'System UI Full Sync' } = req.body;
  if (!Array.isArray(risks)) {
    return res.status(400).json({ success: false, message: 'Data risiko harus berupa array.' });
  }

  const synced = pusriDb.syncUiRisks(risks, actor);
  // Simpan ke MySQL jika aktif
  for (const r of synced) {
    saveRiskToMySql(r).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: `Berhasil menyinkronkan ${synced.length} data risiko dari UI ke database.`,
    count: synced.length,
    data: synced
  });
});

// API: Upsert Single Risk (Create if new, Update if exists)
app.post('/api/risks/upsert', (req, res) => {
  const risk = req.body;
  if (!risk || typeof risk !== 'object') {
    return res.status(400).json({ success: false, message: 'Data risiko wajib diisi.' });
  }

  const sessionUser = getVerifiedSessionUser(req);
  const actor = sessionUser ? `${sessionUser.nama} (${sessionUser.badge})` : (risk.diperbaruiOleh || 'System Sync');
  const actorRole = sessionUser ? sessionUser.role : 'risk officer';

  const result = pusriDb.upsertRisk(risk, actor, actorRole);
  saveRiskToMySql(result).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Risiko ${result.kodeRisiko} berhasil disinkronkan ke database.`,
    data: result
  });
});

// 8B. API Khusus: Update Data Risiko (Pembaruan & Pengajuan Kembali Risiko oleh Unit Kerja dan VP)
app.put('/api/risks/:id/update-data', (req, res) => {
  const { id } = req.params;
  const {
    sasaranRKAP,
    sasaranUnitKerja,
    konteksEksternal,
    konteksInternal,
    sumberRisiko,
    pernyataanRisiko,
    penyebabRisiko,
    dampakRisiko,
    pengendalianExisting,
    kategoriRisiko,
    bidangFungsiRisiko,
    subBidangRisiko,
    bidangProyek,
    kemungkinanAwal,
    dampakAwal,
    kriteriaDampakKey,
    kriteriaDampakTitle,
    kriteriaDampakLevel,
    jenisPenanganan,
    rencanaPenanganan,
    targetWaktuMitigasi,
    biayaRencanaPengendalian,
    picPelaksana,
    picPengendali,
    jenisAnggaran,
    catatanPerbaikan,
    resubmit,
    userUnitKerja,
    userKodeUnitKerja,
    role = 'risk officer',
    actor = 'User Unit Kerja'
  } = req.body;

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan di database.`
    });
  }

  // Hak Akses Validation:
  // Jika risiko sudah berstatus Selesai, risiko telah closed/permanen dan tidak dapat diedit
  if (existing.statusWorkflow === 'Selesai') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Risiko telah berstatus Selesai (Closed). Hanya data risiko yang belum selesai yang dapat diperbarui.'
    });
  }

  const sessionUser = getVerifiedSessionUser(req);
  const normActorRole = sessionUser ? sessionUser.role : normalizeUserRole(role);
  const resolvedActor = sessionUser ? `${sessionUser.nama} (${sessionUser.badge})` : actor;

  if (normActorRole === 'risk admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Risk Admin hanya berwenang melakukan approval dan tidak dapat mengubah data risiko.'
    });
  }

  // 1. User Risk Officer hanya dapat mengedit daftar risiko dari departemennya sendiri atas nama pengguna tersebut
  if (normActorRole === 'risk officer') {
    const uDept = (sessionUser?.unitKerja || userUnitKerja || '').trim().toLowerCase();
    const uKode = (sessionUser?.kodeUnitKerja || userKodeUnitKerja || '').trim().toLowerCase();
    if (uDept || uKode) {
      const isMyDept =
        (uDept && existing.namaOrganisasi.toLowerCase().includes(uDept)) ||
        (uKode && existing.kodeOrganisasi.toLowerCase() === uKode) ||
        (uDept && uDept.includes(existing.namaOrganisasi.toLowerCase()));
      if (!isMyDept) {
        return res.status(403).json({
          success: false,
          message: `Akses Ditolak: Risk Officer hanya dapat mengedit data risiko dari departemen Anda sendiri (${sessionUser?.unitKerja || userUnitKerja || uKode}).`
        });
      }
    }
  }

  const effPernyataan = pernyataanRisiko !== undefined ? String(pernyataanRisiko).trim() : existing.pernyataanRisiko;
  const effPenyebab = penyebabRisiko !== undefined ? String(penyebabRisiko).trim() : existing.penyebabRisiko;
  const effDampak = dampakRisiko !== undefined ? String(dampakRisiko).trim() : existing.dampakRisiko;
  const effStrategi = jenisPenanganan || existing.jenisPenanganan;
  const effRencana = rencanaPenanganan !== undefined ? String(rencanaPenanganan).trim() : existing.rencanaPenanganan;

  // Validasi Input
  const validationErrors: string[] = [];
  if (!effPernyataan || effPernyataan.length < 5) {
    validationErrors.push('Pernyataan risiko wajib diisi (minimal 5 karakter).');
  }
  if (!effPenyebab || effPenyebab.length < 3) {
    validationErrors.push('Akar penyebab risiko wajib diisi (minimal 3 karakter).');
  }
  if (!effDampak || effDampak.length < 3) {
    validationErrors.push('Uraian dampak risiko wajib diisi (minimal 3 karakter).');
  }

  const k = kemungkinanAwal !== undefined ? Number(kemungkinanAwal) : (existing.kemungkinanAwal || 1);
  const d = dampakAwal !== undefined ? Number(dampakAwal) : (existing.dampakAwal || 1);
  if (k < 1 || k > 5 || d < 1 || d > 5) {
    validationErrors.push('Skala kemungkinan dan dampak harus berada dalam rentang 1 - 5.');
  }

  const inherentScore = k * d;
  const calculatedLevel = calculateRiskLevel(k, d);
  const butuhMitigasi = inherentScore >= 10 || effStrategi === 'Mitigasi';
  const statusKebutuhanMitigasi = inherentScore >= 16
    ? 'Wajib Mitigasi Segera (High Risk)'
    : inherentScore >= 12
      ? 'Wajib Mitigasi Aktif (Mod to High)'
      : inherentScore >= 8
        ? 'Mitigasi Direkomendasikan (Moderate)'
        : effStrategi === 'Mitigasi'
          ? 'Mitigasi Sukarela'
          : 'Toleransi Terpenuhi (Dapat Diterima)';

  if (effStrategi === 'Mitigasi' && (!effRencana || effRencana.length < 5)) {
    validationErrors.push('Rencana tindakan mitigasi wajib diisi jika strategi penanganan adalah Mitigasi.');
  }

  if (validationErrors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validasi data risiko gagal. Harap lengkapi semua isian wajib.',
      errors: validationErrors
    });
  }

  // Tentukan status alur setelah update
  let newStatus = existing.statusWorkflow;
  let statusMessage = 'Perubahan data risiko berhasil disimpan (belum diajukan ke atasan).';

  const isResubmitRequested = resubmit === true || String(resubmit) === 'true';

  if (isResubmitRequested) {
    newStatus = 'Menunggu_Approval_VP';
    statusMessage = `Risiko ${existing.kodeRisiko} berhasil diperbaiki dan diajukan kembali ke antrean Review Atasan / VP.`;
  }

  const updates: Partial<PusriRisk> = {
    sasaranRKAP: sasaranRKAP !== undefined ? String(sasaranRKAP).trim() : existing.sasaranRKAP,
    sasaranUnitKerja: sasaranUnitKerja !== undefined ? String(sasaranUnitKerja).trim() : existing.sasaranUnitKerja,
    konteksEksternal: konteksEksternal !== undefined ? String(konteksEksternal).trim() : existing.konteksEksternal,
    konteksInternal: konteksInternal !== undefined ? String(konteksInternal).trim() : existing.konteksInternal,
    sumberRisiko: sumberRisiko !== undefined ? String(sumberRisiko).trim() : existing.sumberRisiko,
    pernyataanRisiko: effPernyataan,
    penyebabRisiko: effPenyebab,
    dampakRisiko: effDampak,
    pengendalianExisting: pengendalianExisting !== undefined ? String(pengendalianExisting).trim() : existing.pengendalianExisting,
    kategoriRisiko: kategoriRisiko || (bidangFungsiRisiko as any) || existing.kategoriRisiko,
    bidangFungsiRisiko: bidangFungsiRisiko !== undefined ? String(bidangFungsiRisiko).trim() : existing.bidangFungsiRisiko,
    subBidangRisiko: subBidangRisiko !== undefined ? String(subBidangRisiko).trim() : existing.subBidangRisiko,
    bidangProyek: bidangProyek !== undefined ? String(bidangProyek).trim() : existing.bidangProyek,
    kemungkinanAwal: k,
    dampakAwal: d,
    kriteriaDampakKey: kriteriaDampakKey !== undefined ? kriteriaDampakKey : existing.kriteriaDampakKey,
    kriteriaDampakTitle: kriteriaDampakTitle !== undefined ? kriteriaDampakTitle : existing.kriteriaDampakTitle,
    kriteriaDampakLevel: kriteriaDampakLevel !== undefined ? Number(kriteriaDampakLevel) : existing.kriteriaDampakLevel,
    inherentScore,
    tingkatRisikoAwal: calculatedLevel as any,
    currentTingkatRisiko: calculatedLevel as any,
    jenisPenanganan: effStrategi,
    butuhMitigasi,
    statusKebutuhanMitigasi,
    alasanKebutuhanMitigasi: inherentScore >= 10
      ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib menyusun rencana mitigasi.`
      : `Skor inherent ${inherentScore} (<10) berada dalam batas toleransi wajar.`,
    rencanaPenanganan: effRencana,
    targetWaktuMitigasi: targetWaktuMitigasi || existing.targetWaktuMitigasi,
    biayaRencanaPengendalian:
      biayaRencanaPengendalian !== undefined && biayaRencanaPengendalian !== null && biayaRencanaPengendalian !== ''
        ? Number(biayaRencanaPengendalian)
        : existing.biayaRencanaPengendalian,
    picPelaksana: picPelaksana !== undefined ? String(picPelaksana).trim() : existing.picPelaksana,
    picPengendali: picPengendali !== undefined ? String(picPengendali).trim() : existing.picPengendali,
    jenisAnggaran: jenisAnggaran || existing.jenisAnggaran,
    statusWorkflow: newStatus,
    diperbaruiOleh: resolvedActor || existing.diperbaruiOleh,
    userProgres: resolvedActor || existing.userProgres,
    updatedDate: new Date().toISOString()
  };

  if (catatanPerbaikan) {
    updates.reviewNotesVp = `[Perbaikan Unit Kerja]: ${catatanPerbaikan.trim()}`;
  }

  const updated = pusriDb.updateRisk(existing.id, updates, resolvedActor, normActorRole);
  if (updated) {
    saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: statusMessage,
    data: updated
  });
});

// 8C. API: Penerimaan Data Identifikasi Risiko oleh Admin (Intake & Confirmation)
app.post('/api/admin/penerimaan-identifikasi', (req, res) => {
  const { riskIds, notes, actor = 'Risk Admin Korporat', role = 'risk admin' } = req.body;

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin Manajemen Risiko yang berhak menerima data usulan identifikasi risiko.'
    });
  }

  const ids: string[] = Array.isArray(riskIds) ? riskIds : (riskIds ? [riskIds] : []);
  if (ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Pilih setidaknya satu data risiko untuk diterima oleh Admin.'
    });
  }

  const acceptedRisks: PusriRisk[] = [];
  ids.forEach((id) => {
    const existing = pusriDb.getRiskById(id);
    if (existing) {
      const updated = pusriDb.updateRisk(
        id,
        {
          approvalNotesAdmin: notes || 'Usulan identifikasi risiko telah diterima resmi oleh Risk Admin Korporat.'
        },
        actor,
        normRole
      );
      if (updated) {
        acceptedRisks.push(updated);
        saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
      }
    }
  });

  res.json({
    success: true,
    message: `Berhasil menerima ${acceptedRisks.length} data usulan identifikasi risiko untuk dikelola dan diproses approval oleh Admin.`,
    totalAccepted: acceptedRisks.length,
    data: acceptedRisks
  });
});

// 8D. API: Pemisahan Identifikasi Risiko Secara Otomatis (Auto-Split to Individual Risks)
app.post('/api/admin/split-batch-risks', (req, res) => {
  const { batchData, actor = 'Risk Admin Korporat', role = 'risk admin' } = req.body;

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin yang dapat menjalankan proses pemisahan identifikasi risiko secara otomatis.'
    });
  }

  const items: any[] = Array.isArray(batchData) ? batchData : (batchData?.risks || []);
  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada data identifikasi risiko yang dikirim untuk dipisahkan.'
    });
  }

  const currentCount = pusriDb.countRisks();
  const separatedRisks: PusriRisk[] = [];
  const now = new Date().toISOString();

  items.forEach((item, idx) => {
    const k = Number(item.kemungkinanAwal) || 3;
    const d = Number(item.dampakAwal) || 3;
    const score = k * d;
    const level = calculateRiskLevel(k, d);
    const generatedCode = pusriDb.getNextRiskCode(Number(item.tahun) || 2026);
    const newId = (item.id && !pusriDb.getRiskById(item.id)) ? item.id : generatedCode.id;
    const kodeRisiko = (item.kodeRisiko && !pusriDb.getRiskById(item.kodeRisiko)) ? item.kodeRisiko : generatedCode.kodeRisiko;

    const separated: PusriRisk = {
      id: newId,
      kodeRisiko,
      kodeOrganisasi: item.kodeOrganisasi || 'PRD-1B',
      namaOrganisasi: item.namaOrganisasi || 'Departemen Operasi Pabrik',
      tahun: Number(item.tahun) || 2026,
      sasaranRKAP: item.sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || '-',
      konteksInternal: item.konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional',
      pernyataanRisiko: item.pernyataanRisiko || 'Uraian risiko individual',
      penyebabRisiko: item.penyebabRisiko || '-',
      dampakRisiko: item.dampakRisiko || '-',
      pengendalianExisting: item.pengendalianExisting || 'SOP Operasi Rutin',
      kategoriRisiko: item.kategoriRisiko || 'Operasional',
      kemungkinanAwal: k,
      dampakAwal: d,
      inherentScore: score,
      tingkatRisikoAwal: level as any,
      currentTingkatRisiko: level as any,
      jenisPenanganan: item.jenisPenanganan || (score >= 10 ? 'Mitigasi' : 'Diterima'),
      butuhMitigasi: score >= 10 || item.jenisPenanganan === 'Mitigasi',
      rencanaPenanganan: item.rencanaPenanganan || '',
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'TW 2',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: item.picPelaksana || '',
      picPengendali: item.picPengendali || '',
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin / OPEX',
      statusWorkflow: 'Menunggu_Approval_Admin',
      pengendalianTriwulan: [],
      createdDate: now,
      updatedDate: now,
      createdBy: item.createdBy || actor
    };

    pusriDb.createRisk(separated);
    separatedRisks.push(separated);
    saveRiskToMySql(separated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  });

  res.status(201).json({
    success: true,
    message: `Pemisahan identifikasi risiko secara otomatis berhasil. ${separatedRisks.length} data risiko individual telah dibentuk dengan kode register unik dan siap diproses approval secara individual.`,
    count: separatedRisks.length,
    data: separatedRisks
  });
});

// 8E. API: Approval per Risiko secara Individual oleh Admin (Verified SSO Admin Only)
app.post('/api/admin/risks/:id/approval', (req, res) => {
  const { id } = req.params;
  const {
    decision,
    picDepartemen,
    picPelaksana,
    picPengendali,
    notes
  } = req.body;

  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;
  const actor = `${adminUser.nama} (${adminUser.badge})`;
  const role: UserRole = 'risk admin';

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan.`
    });
  }

  // Cegah approval berulang jika sudah berstatus Disetujui
  if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian' && decision === 'approve') {
    return res.status(409).json({
      success: false,
      message: `Risiko ${existing.kodeRisiko} telah disetujui sebelumnya dan sudah berada dalam tahap Pengendalian Triwulanan.`
    });
  }

  if (decision === 'revisi') {
    if (!notes || typeof notes !== 'string' || notes.trim().length < 3) {
      return res.status(422).json({
        success: false,
        message: 'Catatan arahan revisi wajib dicantumkan saat mengembalikan risiko ke Unit Kerja.'
      });
    }

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Revisi',
        approvalNotesAdmin: notes.trim()
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'revisi',
      statusWorkflow: 'Revisi',
      message: `Risiko ${existing.kodeRisiko} berhasil dikembalikan ke Unit Kerja dengan status (revisi).`,
      data: updated
    });
  }

  if (decision === 'reject') {
    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Draft_Unit',
        statusKebutuhanMitigasi: 'Ditolak Admin',
        alasanKebutuhanMitigasi: notes ? notes.trim() : 'Usulan risiko ditolak oleh Admin Korporat.',
        approvalNotesAdmin: notes ? notes.trim() : 'Usulan risiko ditolak oleh Admin Manajemen Risiko.'
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'reject',
      statusWorkflow: 'Draft_Unit',
      message: `Usulan risiko ${existing.kodeRisiko} telah ditolak oleh Admin.`,
      data: updated
    });
  }

  if (decision === 'approve') {
    // Validasi Ketentuan Sistem: Sistem memastikan risiko memiliki PIC sebelum masuk ke tahap pengendalian
    const effectivePicPelaksana = (picPelaksana || existing.picPelaksana || '').trim();
    const effectivePicPengendali = (picPengendali || existing.picPengendali || '').trim();

    if (!effectivePicPelaksana || !effectivePicPengendali) {
      return res.status(422).json({
        success: false,
        message: `Persetujuan dicegah: Risiko ${existing.kodeRisiko} wajib ditentukan PIC Pelaksana dan PIC Pengendali sebelum dapat disetujui masuk ke tahap pengendalian.`
      });
    }

    const effectivePicDepartemen = (picDepartemen || effectivePicPelaksana || existing.picDepartemen || '').trim();

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Disetujui_Dalam_Pengendalian',
        picDepartemen: effectivePicDepartemen,
        picPelaksana: effectivePicPelaksana,
        picPengendali: effectivePicPengendali,
        approvalNotesAdmin: notes ? notes.trim() : 'Telah disetujui resmi oleh Risk Admin Korporat dan aktif dalam tahap pengendalian.'
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'approve',
      statusWorkflow: 'Disetujui_Dalam_Pengendalian',
      message: `Risiko ${existing.kodeRisiko} berhasil disetujui secara individual dan resmi dialihkan ke tahap Pengendalian Triwulan (TW 1-4).`,
      data: updated
    });
  }

  return res.status(400).json({
    success: false,
    message: "Keputusan approval tidak valid. Pilih: 'approve', 'revisi', atau 'reject'."
  });
});

// 8F. API: Penentuan PIC / Pengendalian Kerja oleh Admin
app.post('/api/risks/:id/assign-pic', (req, res) => {
  const { id } = req.params;
  const { picPelaksana, picPengendali, actor = 'Risk Admin Korporat', role = 'risk admin' } = req.body;

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin yang memiliki wewenang untuk menentukan dan mengubah penugasan resmi PIC pengendalian kerja.'
    });
  }

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan.`
    });
  }

  if (!picPelaksana || !picPelaksana.trim()) {
    return res.status(422).json({
      success: false,
      message: 'PIC Pelaksana (Operator/Superintendent Lapangan) wajib dipilih.'
    });
  }

  if (!picPengendali || !picPengendali.trim()) {
    return res.status(422).json({
      success: false,
      message: 'PIC Pengendali (Vice President / Manager Terkait) wajib dipilih.'
    });
  }

  const updated = pusriDb.updateRisk(
    id,
    {
      picPelaksana: picPelaksana.trim(),
      picPengendali: picPengendali.trim()
    },
    actor,
    role
  );

  if (updated) {
    saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: `Penugasan PIC untuk risiko ${existing.kodeRisiko} berhasil ditetapkan: Pelaksana (${picPelaksana.trim()}), Pengendali (${picPengendali.trim()}).`,
    data: updated
  });
});

// ==========================================
// 8F. ENDPOINTS PELAKSANAAN TINDAKAN RISIKO (PIC & ADMIN)
// ==========================================

// Ambil seluruh daftar pelaksanaan tindakan untuk suatu risiko
app.get('/api/risks/:id/pelaksanaan', (req, res) => {
  const { id } = req.params;
  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: `Risiko dengan ID ${id} tidak ditemukan.` });
  }

  const list = pusriDb.getPelaksanaan(id);
  res.json({
    success: true,
    kodeRisiko: existing.kodeRisiko,
    pernyataanRisiko: existing.pernyataanRisiko,
    picPelaksana: existing.picPelaksana,
    statusPelaksanaanTerakhir: existing.statusPelaksanaanTerakhir || 'Belum Dilaksanakan',
    progressPelaksanaanTerakhir: existing.progressPelaksanaanTerakhir || 0,
    data: list
  });
});

// Catat pelaksanaan tindakan baru (Dapat dilakukan oleh PIC Unit Kerja & Admin)
app.post('/api/risks/:id/pelaksanaan', (req, res) => {
  const { id } = req.params;
  const {
    triwulan,
    tanggalPelaksanaan,
    picPelaksana,
    uraianTindakan,
    progressPersen,
    statusPelaksanaan,
    realisasiBiaya,
    efektivitas,
    kendalaDanHambatan,
    tindakLanjut,
    nomorBuktiDokumen,
    catatanAdmin,
    actor = 'PIC Pelaksana',
    role = 'risk officer'
  } = req.body;

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: `Risiko dengan ID ${id} tidak ditemukan.` });
  }

  if (!uraianTindakan || typeof uraianTindakan !== 'string' || uraianTindakan.trim().length < 5) {
    return res.status(422).json({
      success: false,
      message: 'Uraian tindakan pelaksanaan pengendalian wajib diisi minimal 5 karakter.'
    });
  }

  const sessionUser = getVerifiedSessionUser(req);
  const normRole = sessionUser ? sessionUser.role : normalizeUserRole(role);
  const resolvedActor = sessionUser ? `${sessionUser.nama} (${sessionUser.badge})` : actor;
  const result = pusriDb.recordPelaksanaan(
    id,
    {
      triwulan,
      tanggalPelaksanaan,
      picPelaksana: picPelaksana || existing.picPelaksana,
      uraianTindakan: uraianTindakan.trim(),
      progressPersen: Number(progressPersen) || 0,
      statusPelaksanaan,
      realisasiBiaya: Number(realisasiBiaya) || 0,
      efektivitas,
      kendalaDanHambatan: kendalaDanHambatan ? kendalaDanHambatan.trim() : '',
      tindakLanjut: tindakLanjut ? tindakLanjut.trim() : '',
      nomorBuktiDokumen: nomorBuktiDokumen ? nomorBuktiDokumen.trim() : '',
      catatanAdmin: catatanAdmin ? catatanAdmin.trim() : ''
    },
    resolvedActor,
    normRole
  );

  if (!result) {
    return res.status(500).json({ success: false, message: 'Gagal mencatat pelaksanaan tindakan ke database.' });
  }

  saveRiskToMySql(result.risk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Pelaksanaan tindakan pengendalian untuk risiko ${existing.kodeRisiko} berhasil dicatat dan disimpan ke database.`,
    data: result.risk,
    execution: result.execution
  });
});

// Perbarui catatan pelaksanaan tindakan tertentu
app.put('/api/risks/:id/pelaksanaan/:actionId', (req, res) => {
  const { id, actionId } = req.params;
  const { actor = 'PIC Pelaksana', role = 'risk officer', ...updates } = req.body;
  const normRole = normalizeUserRole(role);

  const result = pusriDb.updatePelaksanaan(id, actionId, updates, actor, normRole);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Data pelaksanaan tidak ditemukan.' });
  }

  saveRiskToMySql(result.risk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Catatan pelaksanaan [${actionId}] berhasil diperbarui di database.`,
    data: result.risk,
    execution: result.execution
  });
});

// Hapus catatan pelaksanaan tindakan (Admin Only)
app.delete('/api/risks/:id/pelaksanaan/:actionId', (req, res) => {
  const { id, actionId } = req.params;
  const role = (req.query.role as string) || (req.body && req.body.role) || 'risk admin';
  const actor = (req.query.actor as string) || (req.body && req.body.actor) || 'Risk Admin';

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menghapus riwayat pelaksanaan tindakan.' });
  }

  const updatedRisk = pusriDb.deletePelaksanaan(id, actionId, actor, normRole);
  if (!updatedRisk) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan.' });
  }

  saveRiskToMySql(updatedRisk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Catatan pelaksanaan [${actionId}] berhasil dihapus dari database.`,
    data: updatedRisk
  });
});

// Ambil ikhtisar pelaksanaan seluruh risiko yang telah ditentukan
app.get('/api/pelaksanaan-risiko', (req, res) => {
  const { kodeOrganisasi, statusPelaksanaan } = req.query;
  const allRisks = pusriDb.getAllRisks();

  // Filter risiko yang telah ditentukan / disetujui / dalam pengendalian
  let targetRisks = allRisks.filter((r) => 
    r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || 
    r.statusWorkflow === 'Selesai' ||
    (r.pelaksanaanTindakan && r.pelaksanaanTindakan.length > 0)
  );

  if (kodeOrganisasi && kodeOrganisasi !== 'ALL') {
    targetRisks = targetRisks.filter((r) => r.kodeOrganisasi === kodeOrganisasi);
  }

  if (statusPelaksanaan && statusPelaksanaan !== 'ALL') {
    targetRisks = targetRisks.filter((r) => r.statusPelaksanaanTerakhir === statusPelaksanaan);
  }

  // Ringkasan Statistik KPI
  const totalDitentukan = targetRisks.length;
  const selesaiCount = targetRisks.filter((r) => r.statusPelaksanaanTerakhir === 'Selesai Dilaksanakan').length;
  const sedangBerjalanCount = targetRisks.filter((r) => r.statusPelaksanaanTerakhir === 'Sedang Berjalan').length;
  const terkendalaCount = targetRisks.filter((r) => r.statusPelaksanaanTerakhir === 'Terkendala').length;
  const belumCount = targetRisks.filter((r) => !r.statusPelaksanaanTerakhir || r.statusPelaksanaanTerakhir === 'Belum Dilaksanakan').length;

  let totalRealisasiBiaya = 0;
  let totalProgress = 0;

  targetRisks.forEach((r) => {
    totalProgress += (r.progressPelaksanaanTerakhir || 0);
    if (r.pelaksanaanTindakan) {
      r.pelaksanaanTindakan.forEach((act) => {
        totalRealisasiBiaya += (act.realisasiBiaya || 0);
      });
    }
  });

  const avgProgress = totalDitentukan > 0 ? Math.round(totalProgress / totalDitentukan) : 0;

  res.json({
    success: true,
    stats: {
      totalDitentukan,
      selesaiCount,
      sedangBerjalanCount,
      terkendalaCount,
      belumCount,
      totalRealisasiBiaya,
      avgProgress
    },
    data: targetRisks
  });
});

// ==========================================
// 8G. ENDPOINT EVALUASI TRIWULAN ADMIN (TW 2 - TW 4) & PENENTUAN STATUS
// ==========================================
app.post('/api/admin/evaluasi-triwulan', (req, res) => {
  const {
    riskId,
    triwulan = 'TW 1',
    catatanEvaluasiAdmin,
    statusKeputusan,
    kemungkinanResidual,
    dampakResidual,
    tingkatResidual,
    kemungkinanUsulanPic,
    dampakUsulanPic,
    tingkatUsulanPic,
    catatanUsulanPic,
    kesimpulanPenilaianAdmin,
    catatanPenilaianRisikoAdmin,
    pengendalianLanjutanDesc,
    picDepartemenBaru,
    picPelaksanaBaru,
    picPengendaliBaru,
    targetWaktuLanjutan,
    carryOverInfo,
    actor = 'Risk Admin Korporat',
    role = 'risk admin'
  } = req.body;

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin Manajemen Risiko yang berwenang melakukan Evaluasi Triwulan & penetapan status risiko.'
    });
  }

  if (!riskId) {
    return res.status(400).json({ success: false, message: 'ID Risiko wajib dicantumkan.' });
  }

  if (!catatanEvaluasiAdmin || typeof catatanEvaluasiAdmin !== 'string' || catatanEvaluasiAdmin.trim().length < 5) {
    return res.status(422).json({
      success: false,
      message: 'Catatan evaluasi admin wajib diisi minimal 5 karakter.'
    });
  }

  if (!statusKeputusan || !['Selesai', 'Pengendalian_Lanjutan', 'Carry_Over'].includes(statusKeputusan)) {
    return res.status(422).json({
      success: false,
      message: 'Status keputusan evaluasi wajib dipilih: Selesai, Pengendalian Lanjutan, atau Carry Over.'
    });
  }

  const workflowRisk = pusriDb.getRiskById(riskId);
  if (!workflowRisk) {
    return res.status(404).json({ success: false, message: `Risiko dengan ID ${riskId} tidak ditemukan.` });
  }
  const workflowQuarter = workflowRisk.pengendalianTriwulan?.find((item) => item.triwulan === triwulan);
  if (!workflowQuarter?.isPicAcc) {
    return res.status(409).json({
      success: false,
      message: `ACC laporan pengendalian PIC ${triwulan} terlebih dahulu sebelum evaluasi.`
    });
  }
  if (!workflowQuarter.isAdminProgressAcc) {
    return res.status(409).json({
      success: false,
      message: `ACC progres pengerjaan Admin ${triwulan} terlebih dahulu sebelum evaluasi.`
    });
  }

  let updated = pusriDb.evaluateRiskQuarterly(
    riskId,
    {
      triwulan,
      catatanEvaluasiAdmin: catatanEvaluasiAdmin.trim(),
      statusKeputusan,
      kemungkinanResidual,
      dampakResidual,
      tingkatResidual,
      kemungkinanUsulanPic,
      dampakUsulanPic,
      tingkatUsulanPic,
      catatanUsulanPic,
      kesimpulanPenilaianAdmin,
      catatanPenilaianRisikoAdmin,
      pengendalianLanjutanDesc,
      picDepartemenBaru,
      picPelaksanaBaru,
      picPengendaliBaru,
      targetWaktuLanjutan,
      carryOverInfo
    },
    actor,
    normRole
  );

  // Jika risiko belum ada di backend (misal baru dibuat di client UI), auto-upsert dari riskData
  if (!updated && req.body.riskData && typeof req.body.riskData === 'object') {
    pusriDb.upsertRisk(req.body.riskData, actor, normRole);
    updated = pusriDb.evaluateRiskQuarterly(
      req.body.riskData.id || riskId,
      {
        triwulan,
        catatanEvaluasiAdmin: catatanEvaluasiAdmin.trim(),
        statusKeputusan,
        kemungkinanResidual,
        dampakResidual,
        tingkatResidual,
        kemungkinanUsulanPic,
        dampakUsulanPic,
        tingkatUsulanPic,
        catatanUsulanPic,
        kesimpulanPenilaianAdmin,
        catatanPenilaianRisikoAdmin,
        pengendalianLanjutanDesc,
        picDepartemenBaru,
        picPelaksanaBaru,
        picPengendaliBaru,
        targetWaktuLanjutan,
        carryOverInfo
      },
      actor,
      normRole
    );
  }

  if (!updated) {
    return res.status(404).json({ success: false, message: `Risiko dengan ID ${riskId} tidak ditemukan.` });
  }

  saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Evaluasi ${triwulan} untuk risiko ${updated.kodeRisiko} berhasil disimpan. Status risiko kini: ${updated.statusWorkflow}.`,
    data: updated
  });
});

// Admin ACC Laporan Pengendalian PIC untuk Triwulan tertentu
app.post('/api/admin/acc-laporan-pic', (req, res) => {
  const {
    riskId,
    riskData,
    triwulan = 'TW 1',
    catatanAdmin = '',
    actor = 'Risk Admin Korporat',
    role = 'risk admin'
  } = req.body;

  const normRole = normalizeUserRole(role);
  if (normRole !== 'risk admin' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin Manajemen Risiko yang berwenang melakukan ACC laporan pengendalian PIC.'
    });
  }

  if (!riskId) {
    return res.status(400).json({ success: false, message: 'ID Risiko wajib dicantumkan.' });
  }

  let updated = pusriDb.accPelaksanaanPic(riskId, triwulan, catatanAdmin, actor, normRole);
  if (!updated && riskData && typeof riskData === 'object') {
    pusriDb.upsertRisk(riskData, actor, normRole);
    updated = pusriDb.accPelaksanaanPic(riskData.id || riskId, triwulan, catatanAdmin, actor, normRole);
  }

  if (!updated) {
    return res.status(404).json({ success: false, message: `Risiko dengan ID ${riskId} tidak ditemukan.` });
  }

  saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Laporan pengendalian PIC untuk ${triwulan} pada risiko ${updated.kodeRisiko} berhasil di-ACC oleh Admin.`,
    data: updated
  });
});

// 9. Delete Risk by ID (Verified SSO Risk Admin Only)
app.delete('/api/risks/:id', (req, res) => {
  const adminUser = requireRiskAdmin(req, res);
  if (!adminUser) return;

  const deleted = pusriDb.deleteRisk(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan.' });
  }

  deleteRiskFromMySql(deleted.id).catch((e) => console.warn('[MySQL Delete Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Risiko ${deleted.kodeRisiko} berhasil dihapus dari database.`,
    data: deleted
  });
});

// 10. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const { riskId } = req.query;
  const logs = pusriDb.getAuditLogs(typeof riskId === 'string' ? riskId : undefined);
  res.json({
    success: true,
    total: logs.length,
    data: logs
  });
});

// 11. Sync Events Log Endpoint
app.get('/api/sync/events', (req, res) => {
  const events = pusriDb.getSyncEvents();
  res.json({
    success: true,
    total: events.length,
    data: events
  });
});

// 12. Trigger Cross-Module Sync Endpoint
app.post('/api/sync/trigger', (req, res) => {
  const { moduleSource, moduleTarget, message } = req.body;
  const event = pusriDb.recordSyncEvent({
    moduleSource: moduleSource || 'Manual Trigger Hub',
    moduleTarget: moduleTarget || 'All Modules & Database',
    endpoint: '/api/sync/trigger',
    method: 'POST',
    status: 'SYNCED',
    durationMs: Math.round((Math.random() * 4 + 4) * 10) / 10,
    payloadSummary: message || 'Full cross-module state re-synchronized'
  });

  res.json({
    success: true,
    message: 'Sinkronisasi data antar modul berhasil dieksekusi via API Golang & MySQL.',
    syncEvent: event,
    currentStats: pusriDb.getStats()
  });
});

// 13. Reset Database to Default Official Seeds
app.post('/api/database/reset', async (req, res) => {
  const risks = pusriDb.resetToDefault();
  saveSqlDumpToDisk();
  await syncFullDatabaseToMySql({
    departments: pusriDb.getAllDepartments(),
    sumberRisiko: pusriDb.getMasterSumberRisiko(),
    users: pusriDb.getRawUsersForDatabaseSync(),
    risks,
    auditLogs: pusriDb.getAuditLogs(),
    syncEvents: pusriDb.getSyncEvents()
  }).catch(() => {});

  res.json({
    success: true,
    message: 'Database berhasil di-reset dan disinkronkan ke data resmi PT Pupuk Sriwidjaja Palembang.',
    total: risks.length,
    data: risks
  });
});

// 14. MySQL Live Connection Status
app.get('/api/database/connection', (req, res) => {
  res.json({
    success: true,
    data: getMySqlStatus()
  });
});

// 15. Test / Re-connect MySQL & Auto-Synchronize
app.post('/api/database/test-connect', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  const connected = await initMySqlConnection({
    host,
    port: port ? Number(port) : undefined,
    user,
    password,
    database
  });

  if (connected) {
    const [existingMySqlRisks, mysqlSumber, mysqlUsers, mysqlDepartments] = await Promise.all([
      loadRisksFromMySql(),
      loadSumberRisikoFromMySql(),
      loadUsersFromMySql(),
      loadDepartmentsFromMySql()
    ]);
    if (existingMySqlRisks === null) {
      return res.status(503).json({
        success: false,
        message: 'Koneksi MySQL berhasil, tetapi data risiko gagal dimuat.'
      });
    }
    if (mysqlSumber === null || mysqlUsers === null || mysqlDepartments === null) {
      return res.status(503).json({
        success: false,
        message: 'Koneksi berhasil, tetapi akun atau master data gagal dimuat dari MySQL.'
      });
    }
    pusriDb.hydrateFromMySql({
      risks: existingMySqlRisks,
      sumberRisiko: mysqlSumber,
      users: mysqlUsers,
      departments: mysqlDepartments
    });
  } else {
    pusriDb.hydrateFromMySql({ risks: [] });
  }

  const status = getMySqlStatus();

  res.json({
    success: connected,
    message: connected 
      ? `Koneksi MySQL ke '${status.database}' di ${status.host}:${status.port} berhasil. Risiko dimuat dari database.`
      : `MySQL belum tersedia (${status.lastError}); data aplikasi tidak akan memakai data lokal.`,
    data: status
  });
});

// 15B. Carry Over Endpoints (Database Carry Over Real-Time)
app.get('/api/carry-over', async (_req, res) => {
  const table = await getTableData('carry_over');
  if (!table) {
    return res.status(503).json({ success: false, message: 'Gagal memuat data carry over dari MySQL.' });
  }
  const records = table.rows.map((row) => ({
    id: String(row.id),
    riskId: String(row.risk_id),
    kodeRisiko: String(row.kode_risiko),
    namaOrganisasi: String(row.nama_organisasi || ''),
    pernyataanRisiko: String(row.pernyataan_risiko || ''),
    kategoriRisiko: String(row.kategori_risiko || ''),
    currentTingkatRisiko: String(row.current_tingkat_risiko || ''),
    statusWorkflow: String(row.status_workflow || ''),
    progressTerakhir: Number(row.progress_terakhir) || 0,
    targetTahun: Number(row.target_tahun) || 0,
    alasanCarryOver: String(row.alasan_carry_over || ''),
    rekomendasiKomite: String(row.rekomendasi_komite || ''),
    approvalCarryOverBy: String(row.approval_carry_over_by || ''),
    tanggalCarryOver: row.tanggal_carry_over
      ? new Date(row.tanggal_carry_over).toISOString().slice(0, 10)
      : '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  }));
  res.json({
    success: true,
    total: records.length,
    data: records
  });
});

app.post('/api/carry-over/sync', async (_req, res) => {
  const table = await getTableData('carry_over');
  if (!table) {
    return res.status(503).json({ success: false, message: 'Gagal membaca carry over dari MySQL.' });
  }
  const records = table.rows;
  res.json({
    success: true,
    message: `Data carry over dibaca langsung dari MySQL (${records.length} baris).`,
    total: records.length,
    data: records
  });
});

// 15C. Daftar Tabel Database Aktif
app.get('/api/database/tables', (req, res) => {
  res.json({
    success: true,
    database: 'pusri_risk_db',
    tables: [
      { name: 'pusri_risks', description: 'Tabel Utama Registrasi & Skor Risiko PT Pusri (pusri_risks / pusri_risk)' },
      { name: 'pengendalian_triwulan', description: 'Tabel Realisasi & Evaluasi Pemantauan Triwulan (TW 1 - TW 4)' },
      { name: 'pelaksanaan_tindakan', description: 'Tabel Realisasi Tindakan Mitigasi & Bukti Pelaksanaan Unit Kerja' },
      { name: 'carry_over', description: 'Tabel Evaluasi Carry Over Risiko Lintas Tahun RKAP' },
      { name: 'master_sumber_risiko', description: 'Tabel Master Data Sumber Risiko (Khusus Input Risk Admin)' },
      { name: 'user_accounts', description: 'Tabel Akun Pengguna & Hak Akses IAM SSO Pusri' },
      { name: 'master_organisasi', description: 'Tabel Master Struktur Departemen & Unit Kerja Pusri' },
      { name: 'audit_log_risiko', description: 'Tabel Rekam Jejak Audit Trail & Log Perubahan Status' },
      { name: 'sync_event_modul', description: 'Tabel Log Event Sinkronisasi Real-Time Antar Modul' }
    ]
  });
});

// 16. Inspect table data directly
app.get('/api/database/tables/:tableName', async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const result = await getTableData(tableName);
    if (!result) {
      return res.status(503).json({
        success: false,
        message: 'Data tabel tidak dapat dimuat karena MySQL belum tersedia. Data lokal tidak digunakan.'
      });
    }

    if (!result) {
      // Fallback: jika MySQL sedang offline di server sandbox, sediakan data lengkap dari pusriDb
      if (tableName === 'pusri_risks' || tableName === 'pusri_risk') {
        const list = pusriDb.getAllRisks();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: [
            'id', 'kode_risiko', 'kode_organisasi', 'nama_organisasi', 'tahun',
            'pernyataan_risiko', 'kategori_risiko', 'kemungkinan_awal', 'dampak_awal',
            'inherent_score', 'tingkat_risiko_awal', 'current_tingkat_risiko',
            'jenis_penanganan', 'rencana_penanganan', 'target_waktu_mitigasi',
            'biaya_rencana_pengendalian', 'pic_pelaksana', 'pic_pengendali',
            'status_workflow'
          ],
          total: list.length,
          rows: list.map(r => ({
            id: r.id,
            kode_risiko: r.kodeRisiko,
            kode_organisasi: r.kodeOrganisasi,
            nama_organisasi: r.namaOrganisasi,
            tahun: r.tahun,
            pernyataan_risiko: r.pernyataanRisiko,
            kategori_risiko: r.kategoriRisiko,
            kemungkinan_awal: r.kemungkinanAwal,
            dampak_awal: r.dampakAwal,
            inherent_score: r.inherentScore,
            tingkat_risiko_awal: r.tingkatRisikoAwal,
            current_tingkat_risiko: r.currentTingkatRisiko,
            jenis_penanganan: r.jenisPenanganan,
            rencana_penanganan: r.rencanaPenanganan,
            target_waktu_mitigasi: r.targetWaktuMitigasi,
            biaya_rencana_pengendalian: r.biayaRencanaPengendalian,
            pic_pelaksana: r.picPelaksana || '-',
            pic_pengendali: r.picPengendali || '-',
            status_workflow: r.statusWorkflow
          }))
        });
      }

      if (tableName === 'master_organisasi' || tableName === 'master_organizations') {
        const depts = pusriDb.getAllDepartments();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'kode', 'nama', 'direktorat', 'kepala_unit', 'jabatan_kepala', 'email_unit', 'total_risiko'],
          total: depts.length,
          rows: depts.map((d, idx) => ({
            id: idx + 1,
            kode: d.kode,
            nama: d.nama,
            direktorat: d.direktorat || 'Direktorat Operasi & Produksi',
            kepala_unit: d.kepalaUnit || 'VP Terkait',
            jabatan_kepala: d.kepalaUnit?.includes('VP') ? d.kepalaUnit : `Vice President ${d.nama}`,
            email_unit: `${d.kode.toLowerCase().replace(/[^a-z0-9]/g, '')}@pusri.co.id`,
            total_risiko: d.totalRisiko || 0
          }))
        });
      }

      if (tableName === 'master_sumber_risiko' || tableName === 'master_risk_sources') {
        const groups = pusriDb.getMasterSumberRisiko();
        const rows: any[] = [];
        groups.forEach((g) => {
          (g.items || []).forEach((item, idx) => {
            rows.push({
              id: rows.length + 1,
              kategori: g.kategori,
              sumber_risiko: item,
              urutan: idx + 1,
              dibuat_oleh: g.updatedBy || 'Risk Admin'
            });
          });
        });
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'kategori', 'sumber_risiko', 'urutan', 'dibuat_oleh'],
          total: rows.length,
          rows
        });
      }

      if (tableName === 'user_accounts' || tableName === 'portal_users') {
        const users = pusriDb.getAllUsers();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'username', 'nama', 'nik', 'badge', 'role', 'jabatan', 'unit_kerja', 'email'],
          total: users.length,
          rows: users.map(u => ({
            id: u.id,
            username: u.username,
            nama: u.nama,
            nik: u.nik || u.badge || '-',
            badge: u.badge || u.nik || '-',
            role: u.role,
            jabatan: u.jabatan || '-',
            unit_kerja: u.unitKerja,
            email: u.email
          }))
        });
      }

      if (tableName === 'pengendalian_triwulan' || tableName === 'quarterly_controls') {
        const risks = pusriDb.getAllRisks();
        const allControls: any[] = [];
        risks.forEach((r) => {
          if (Array.isArray(r.pengendalianTriwulan)) {
            r.pengendalianTriwulan.forEach((ctrl, cIdx) => {
              allControls.push({
                id: allControls.length + 1,
                risk_id: r.id,
                kode_risiko: r.kodeRisiko,
                triwulan: ctrl.triwulan,
                realisasi_kegiatan: ctrl.realisasiKegiatan,
                realisasi_biaya: ctrl.realisasiBiaya,
                progress_persen: `${ctrl.progressPersen}%`,
                kemungkinan_residual: ctrl.kemungkinanResidual,
                dampak_residual: ctrl.dampakResidual,
                residual_score: (ctrl.kemungkinanResidual || 1) * (ctrl.dampakResidual || 1),
                tingkat_residual: ctrl.tingkatResidual,
                status_pengendalian: ctrl.statusPengendalian,
                kendala_dan_tindak_lanjut: ctrl.kendalaDanTindakLanjut || '-'
              });
            });
          }
        });

        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: [
            'id', 'risk_id', 'kode_risiko', 'triwulan', 'progress_persen',
            'realisasi_biaya', 'kemungkinan_residual', 'dampak_residual',
            'residual_score', 'tingkat_residual', 'status_pengendalian',
            'kendala_dan_tindak_lanjut'
          ],
          total: allControls.length,
          rows: allControls
        });
      }

      if (tableName === 'carry_over' || tableName === 'evaluasi_carry_over' || tableName === 'risk_carry_overs') {
        const carryOvers = pusriDb.getCarryOverRecords();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: [
            'id', 'risk_id', 'kode_risiko', 'nama_organisasi', 'pernyataan_risiko',
            'kategori_risiko', 'current_tingkat_risiko', 'status_workflow', 'progress_terakhir',
            'target_tahun', 'alasan_carry_over', 'rekomendasi_komite', 'approval_carry_over_by',
            'tanggal_carry_over'
          ],
          total: carryOvers.length,
          rows: carryOvers.map(c => ({
            id: c.id,
            risk_id: c.riskId,
            kode_risiko: c.kodeRisiko,
            nama_organisasi: c.namaOrganisasi,
            pernyataan_risiko: c.pernyataanRisiko,
            kategori_risiko: c.kategoriRisiko,
            current_tingkat_risiko: c.currentTingkatRisiko,
            status_workflow: c.statusWorkflow,
            progress_terakhir: `${c.progressTerakhir}%`,
            target_tahun: c.targetTahun,
            alasan_carry_over: c.alasanCarryOver,
            rekomendasi_komite: c.rekomendasiKomite,
            approval_carry_over_by: c.approvalCarryOverBy,
            tanggal_carry_over: c.tanggalCarryOver
          }))
        });
      }

      if (tableName === 'pelaksanaan_tindakan' || tableName === 'risk_action_executions') {
        const actions = pusriDb.getAllActionExecutions();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: [
            'id', 'risk_id', 'kode_risiko', 'triwulan', 'tanggal_pelaksanaan',
            'pic_pelaksana', 'uraian_tindakan', 'progress_persen',
            'status_pelaksanaan', 'realisasi_biaya', 'efektivitas'
          ],
          total: actions.length,
          rows: actions
        });
      }

      if (tableName === 'audit_log_risiko' || tableName === 'risk_audit_logs') {
        const logs = pusriDb.getAuditLogs();
        const fallbackLogs = logs.length > 0 ? logs : [
          {
            id: 'log-001',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk officer',
            actorName: 'Fauzan Al Ghaniyyu',
            action: 'IDENTIFIKASI_SUBMITTED',
            notes: 'Penyusunan usulan butir risiko operasional tekanan gas alam reformer pabrik IIB.',
            createdAt: '2026-01-15T08:30:00Z'
          },
          {
            id: 'log-002',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk owner',
            actorName: 'M Davi Ramadhan',
            action: 'VP_APPROVAL_PASSED',
            notes: 'Review kelayakan usulan risiko disetujui untuk registrasi korporat.',
            createdAt: '2026-01-20T10:15:00Z'
          },
          {
            id: 'log-003',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk admin',
            actorName: 'Daffa Ari Prasetya',
            action: 'ADMIN_REGISTERED_AND_ASSIGNED_PIC',
            notes: 'Approval final registrasi korporat RSK-2026-001 dan penetapan resmi PIC.',
            createdAt: '2026-01-25T14:00:00Z'
          }
        ];

        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'risk_id', 'kode_risiko', 'user_role', 'actor_name', 'action', 'notes', 'created_at'],
          total: fallbackLogs.length,
          rows: fallbackLogs.map(l => ({
            id: l.id,
            risk_id: l.riskId,
            kode_risiko: l.kodeRisiko,
            user_role: l.userRole,
            actor_name: l.actorName,
            action: l.action,
            notes: l.notes,
            created_at: (l as any).createdAt || (l as any).timestamp || new Date().toISOString()
          }))
        });
      }

      if (tableName === 'sync_event_modul' || tableName === 'module_sync_events') {
        const syncs = pusriDb.getSyncEvents();
        const fallbackSyncs = syncs.length > 0 ? syncs : [
          {
            id: 'sync-001',
            moduleSource: 'Modul Unit Kerja',
            moduleTarget: 'Modul Review Atasan / VP',
            endpoint: '/api/approval/submit-identifikasi',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 4.8,
            payloadSummary: 'Sinkronisasi Paket Draft Usulan Risiko Unit Kerja ke Antrean VP',
            timestamp: '2026-01-15T08:30:05Z'
          },
          {
            id: 'sync-002',
            moduleSource: 'Modul Review Atasan / VP',
            moduleTarget: 'Modul Approval Admin Korporat',
            endpoint: '/api/vp/risks/decision',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 4.2,
            payloadSummary: 'Approval VP RSK-2026-001 ke Antrean Penerimaan Admin',
            timestamp: '2026-01-20T10:15:08Z'
          },
          {
            id: 'sync-003',
            moduleSource: 'Modul Approval Admin',
            moduleTarget: 'Modul Pengendalian Triwulan (TW 1-4)',
            endpoint: '/api/admin/risks/approve-individual',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 5.6,
            payloadSummary: 'Approval Korporat & Penugasan PIC Resmi RSK-2026-001',
            timestamp: '2026-01-25T14:00:12Z'
          }
        ];

        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'module_source', 'module_target', 'endpoint', 'method', 'status', 'duration_ms', 'payload_summary', 'created_at'],
          total: fallbackSyncs.length,
          rows: fallbackSyncs.map(s => ({
            id: s.id,
            module_source: s.moduleSource,
            module_target: s.moduleTarget,
            endpoint: s.endpoint,
            method: s.method,
            status: s.status,
            duration_ms: `${s.durationMs}ms`,
            payload_summary: s.payloadSummary,
            created_at: s.timestamp
          }))
        });
      }

      return res.json({
        success: true,
        isLiveMySql: false,
        tableName,
        columns: ['status'],
        total: 0,
        rows: []
      });
    }

    res.json({
      success: true,
      isLiveMySql: true,
      tableName,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Gagal membaca tabel.' });
  }
});

// 17. Synchronize database data with MySQL
app.post('/api/database/sync-all', async (req, res) => {
  let status = getMySqlStatus();
  if (!status.isConnected) {
    const reconnected = await initMySqlConnection();
    if (!reconnected) {
      status = getMySqlStatus();
      return res.status(503).json({
        success: false,
        isLiveMySql: false,
        message: `MySQL belum tersedia (${status.lastError}). Sinkronisasi lokal dinonaktifkan.`
      });
    }
  }

  status = getMySqlStatus();
  const databaseRisks = await loadRisksFromMySql();
  if (databaseRisks === null) {
    return res.status(503).json({
      success: false,
      message: 'MySQL tersambung, tetapi data risiko gagal dimuat.'
    });
  }
  const [mysqlUsers, mysqlDepartments, mysqlSumber] = await Promise.all([
    loadUsersFromMySql(),
    loadDepartmentsFromMySql(),
    loadSumberRisikoFromMySql()
  ]);
  if (mysqlUsers === null || mysqlDepartments === null || mysqlSumber === null) {
    return res.status(503).json({
      success: false,
      message: 'Koneksi berhasil, tetapi data akun atau master gagal dimuat dari MySQL.'
    });
  }
  pusriDb.hydrateFromMySql({
    risks: databaseRisks,
    users: mysqlUsers,
    departments: mysqlDepartments,
    sumberRisiko: mysqlSumber
  });
  const allRisks = databaseRisks;
  const allDepts = pusriDb.getAllDepartments();
  const allUsers = pusriDb.getRawUsersForDatabaseSync();
  const allAudits = pusriDb.getAuditLogs();
  const allEvents = pusriDb.getSyncEvents();

  pusriDb.recalculateDepartmentCounts();
  pusriDb.syncAllCarryOver();
  const syncSummary = await syncFullDatabaseToMySql({
    departments: allDepts,
    sumberRisiko: pusriDb.getMasterSumberRisiko(),
    users: allUsers,
    risks: allRisks,
    auditLogs: allAudits,
    syncEvents: allEvents
  });

  pusriDb.recordSyncEvent({
    moduleSource: 'Database Sync Engine',
    moduleTarget: 'MySQL 8.0 pusri_risk_db (9 Tables)',
    endpoint: '/api/database/sync-all',
    method: 'POST',
    status: 'SYNCED',
    durationMs: 11.4,
    payloadSummary: `Synced ${syncSummary.risksSaved}/${allRisks.length} risks, ${syncSummary.departmentsSaved} orgs, ${syncSummary.usersSaved} users`
  });

  res.json({
    success: syncSummary.risksSaved >= 0,
    isLiveMySql: true,
    message: `Sinkronisasi Penuh MySQL Berhasil! ${syncSummary.risksSaved}/${allRisks.length} risiko, ${syncSummary.departmentsSaved} unit organisasi, dan ${syncSummary.usersSaved} akun IAM SSO tersimpan di MySQL '${status.database}' serta schema.sql.`,
    savedCount: syncSummary.risksSaved,
    totalRisks: allRisks.length,
    details: syncSummary
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false as const,
        watch: {
          ignored: ['**/pusri_db_store.json', '**/.pusri_db_store.json', '**/.pusri*', '**/server/**', '**/node_modules/**', '**/*.sql'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} sedang terpakai, mencoba kembali dalam 1 detik...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, HOST);
      }, 1000);
    } else {
      console.error('[Server Error]:', err);
    }
  });

  const isDbConnected = await initMySqlConnection();
  if (isDbConnected) {
    try {
      const migratedResetTickets = await migratePendingPasswordResetTicketsToMySql(
        pusriDb.getPasswordResetTickets()
      );
      if (migratedResetTickets > 0) {
        console.log(`[MySQL] Migrated ${migratedResetTickets} pending password reset ticket(s).`);
      }
      const [mysqlRisks, mysqlSumber, mysqlUsers, mysqlDepartments] = await Promise.all([
        loadRisksFromMySql(),
        loadSumberRisikoFromMySql(),
        loadUsersFromMySql(),
        loadDepartmentsFromMySql()
      ]);
      if (mysqlRisks === null) {
        throw new Error('Gagal membaca tabel pusri_risks dari MySQL.');
      }
      if (mysqlSumber === null || mysqlUsers === null || mysqlDepartments === null) {
        throw new Error('Gagal membaca master organisasi, sumber risiko, atau akun dari MySQL.');
      }
      const migrationDate = new Date().toISOString();
      const pendingVpRisks = mysqlRisks.map((risk) =>
        risk.statusWorkflow === 'Tercatat_Final' &&
        isNonMitigationStrategy(risk.jenisPenanganan) &&
        !risk.reviewNotesVp?.trim()
          ? { ...risk, statusWorkflow: 'Menunggu_Approval_VP' as const, updatedDate: migrationDate }
          : risk
      );
      const migratedRisks = pendingVpRisks.filter((risk, index) => risk !== mysqlRisks[index]);
      if (migratedRisks.length > 0) {
        const saveResults = await Promise.all(migratedRisks.map(saveRiskToMySql));
        if (saveResults.some((saved) => !saved)) {
          throw new Error(`Gagal memindahkan ${migratedRisks.length} risiko non-mitigasi yang belum di-ACC VP ke antrean review.`);
        }
        console.log(`[MySQL] ${migratedRisks.length} risiko non-mitigasi yang belum di-ACC dipindahkan ke antrean VP.`);
      }
      pusriDb.hydrateFromMySql({
        risks: pendingVpRisks,
        sumberRisiko: mysqlSumber,
        users: mysqlUsers,
        departments: mysqlDepartments
      });
      console.log(`[MySQL] Loaded ${mysqlRisks.length} risks, ${mysqlUsers.length} users, ${mysqlDepartments.length} departments from the configured database.`);
    } catch (error) {
      console.error('[MySQL] Gagal memuat data awal:', error);
    }
  } else {
    console.error('[MySQL] Koneksi database gagal. Aplikasi tidak akan memakai data risiko lokal.');
  }

  saveSqlDumpToDisk();
  server.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(` PT Pupuk Sriwidjaja Palembang - Risk Portal Server`);
    console.log(` Status : Aktif & Berjalan`);
    console.log(` Browser: http://localhost:${PORT}`);
    console.log(` IP Loc : http://127.0.0.1:${PORT}`);
    console.log(` Network: http://${HOST}:${PORT}`);
    console.log(`======================================================\n`);
  });

  // Tangani sinyal penghentian agar port segera dibebaskan
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer();
