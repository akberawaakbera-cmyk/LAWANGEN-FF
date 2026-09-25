const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store"
};
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Developer-Token",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  };
}
async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function randomString(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function makeKey(prefix = "RK") {
  return `${prefix}-${randomString(12).toUpperCase()}`;
}
function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const found = cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.substring(name.length + 1)) : null;
}
function setSessionCookie(token) {
  return [
    `rokhan_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=604800"
  ].join("; ");
}
function clearSessionCookie() {
  return [
    "rokhan_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 30));
  return d.toISOString();
}
function isExpired(date) {
  if (!date) return false;
  return new Date(date).getTime() <= Date.now();
}
async function requireAdmin(request, env) {
  const token = getCookie(request, "rokhan_session");
  if (!token) {
    return { error: json({ success: false, error: "Not authenticated" }, 401) };
  }
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare(`
    SELECT
      s.id AS session_id,
      s.admin_id,
      s.expires_at,
      a.name,
      a.status,
      a.expires_at AS admin_expires_at
    FROM admin_sessions s
    JOIN reseller_admins a
      ON a.id = s.admin_id
    WHERE s.session_token_hash = ?
    LIMIT 1
  `)
    .bind(tokenHash)
    .first();
  if (!session) {
    return {
      error: json(
        { success: false, error: "Invalid session" },
        401,
        { "Set-Cookie": clearSessionCookie() }
      )
    };
  }
  if (isExpired(session.expires_at)) {
    await env.DB
      .prepare("DELETE FROM admin_sessions WHERE id = ?")
      .bind(session.session_id)
      .run();
    return {
      error: json(
        { success: false, error: "Session expired" },
        401,
        { "Set-Cookie": clearSessionCookie() }
      )
    };
  }
  if (session.status !== "active") {
    return {
      error: json(
        { success: false, error: "Admin account is disabled" },
        403
      )
    };
  }
  if (isExpired(session.admin_expires_at)) {
    return {
      error: json(
        { success: false, error: "Admin access has expired" },
        403
      )
    };
  }
  return { admin: session };
}
async function logActivity(env, adminId, action, details = "") {
  await env.DB.prepare(`
    INSERT INTO activity_logs
      (admin_id, action, details)
    VALUES (?, ?, ?)
  `)
    .bind(adminId || null, action, details)
    .run();
}
async function ensureTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS branding (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      developer_label TEXT NOT NULL DEFAULT 'DEVELOPER',
      developer_name TEXT NOT NULL DEFAULT 'LAWANGEN',
      admin_name TEXT NOT NULL DEFAULT 'ROKHAN SYED',
      logo_data TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO branding
      (id, developer_label, developer_name, admin_name)
    VALUES (1, 'DEVELOPER', 'LAWANGEN', 'ROKHAN SYED')
  `).run();
}
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request)
    });
  }
  if (!env.DB) {
    return json({
      success: false,
      error: "D1 binding DB is missing"
    }, 500, corsHeaders(request));
  }
  try {
    await ensureTables(env);
    // --------------------------------------------------
    // HEALTH
    // --------------------------------------------------
    if (path === "/" && method === "GET") {
      return json({
        success: true,
        message: "ROKHAN Worker is connected",
        database: "rokhan",
        d1: true
      }, 200, corsHeaders(request));
    }
    if (path === "/api/health" && method === "GET") {
      return json({
        success: true,
        worker: "lawangen-ff",
        database: "rokhan",
        d1: true
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // DEVELOPER: CREATE RESELLER ADMIN
    // Requires Cloudflare secret: DEVELOPER_TOKEN
    // --------------------------------------------------
    if (path === "/api/developer/create-admin" && method === "POST") {
      const developerToken =
        request.headers.get("X-Developer-Token");
      if (!env.DEVELOPER_TOKEN) {
        return json({
          success: false,
          error: "DEVELOPER_TOKEN secret is not configured"
        }, 500, corsHeaders(request));
      }
      if (!developerToken || developerToken !== env.DEVELOPER_TOKEN) {
        return json({
          success: false,
          error: "Developer authentication failed"
        }, 403, corsHeaders(request));
      }
      const body = await request.json();
      const name = String(body.name || "ROKHAN SYED").trim();
      const days = Number(body.days || 30);
      if (!name) {
        return json({
          success: false,
          error: "Admin name is required"
        }, 400, corsHeaders(request));
      }
      const adminKey = makeKey("ADMIN");
      const adminKeyHash = await sha256(adminKey);
      const expiresAt = futureDate(days);
      const result = await env.DB.prepare(`
        INSERT INTO reseller_admins
          (name, admin_key_hash, status, expires_at)
        VALUES (?, ?, 'active', ?)
        RETURNING id, name, status, expires_at, created_at
      `)
        .bind(name, adminKeyHash, expiresAt)
        .first();
      return json({
        success: true,
        admin: result,
        admin_key: adminKey
      }, 201, corsHeaders(request));
    }
    // --------------------------------------------------
    // ADMIN LOGIN
    // --------------------------------------------------
    if (path === "/api/admin/login" && method === "POST") {
      const body = await request.json();
      const adminKey = String(body.admin_key || "").trim();
      if (!adminKey) {
        return json({
          success: false,
          error: "Admin key is required"
        }, 400, corsHeaders(request));
      }
      const keyHash = await sha256(adminKey);
      const admin = await env.DB.prepare(`
        SELECT id, name, status, expires_at
        FROM reseller_admins
        WHERE admin_key_hash = ?
        LIMIT 1
      `)
        .bind(keyHash)
        .first();
      if (!admin) {
        return json({
          success: false,
          error: "Invalid Admin Key"
        }, 401, corsHeaders(request));
      }
      if (admin.status !== "active") {
        return json({
          success: false,
          error: "Admin account is disabled"
        }, 403, corsHeaders(request));
      }
      if (isExpired(admin.expires_at)) {
        return json({
          success: false,
          error: "Admin Key has expired"
        }, 403, corsHeaders(request));
      }
      const sessionToken = randomString(48);
      const sessionHash = await sha256(sessionToken);
      const sessionExpiry = futureDate(7);
      await env.DB.prepare(`
        INSERT INTO admin_sessions
          (admin_id, session_token_hash, expires_at)
        VALUES (?, ?, ?)
      `)
        .bind(admin.id, sessionHash, sessionExpiry)
        .run();
      await logActivity(
        env,
        admin.id,
        "LOGIN",
        "Admin login successful"
      );
      return json({
        success: true,
        admin: {
          id: admin.id,
          name: admin.name,
          expires_at: admin.expires_at
        }
      }, 200, {
        ...corsHeaders(request),
        "Set-Cookie": setSessionCookie(sessionToken)
      });
    }
    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------
    if (path === "/api/admin/logout" && method === "POST") {
      const token = getCookie(request, "rokhan_session");
      if (token) {
        const tokenHash = await sha256(token);
        const session = await env.DB.prepare(`
          SELECT admin_id
          FROM admin_sessions
          WHERE session_token_hash = ?
          LIMIT 1
        `)
          .bind(tokenHash)
          .first();
        if (session) {
          await logActivity(
            env,
            session.admin_id,
            "LOGOUT",
            "Admin logout"
          );
        }
        await env.DB.prepare(`
          DELETE FROM admin_sessions
          WHERE session_token_hash = ?
        `)
          .bind(tokenHash)
          .run();
      }
      return json({
        success: true
      }, 200, {
        ...corsHeaders(request),
        "Set-Cookie": clearSessionCookie()
      });
    }
    // --------------------------------------------------
    // AUTH / ME
    // --------------------------------------------------
    if (path === "/api/admin/me" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      return json({
        success: true,
        admin: {
          id: auth.admin.admin_id,
          name: auth.admin.name,
          expires_at: auth.admin.admin_expires_at
        }
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // DASHBOARD
    // --------------------------------------------------
    if (path === "/api/admin/dashboard" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const adminId = auth.admin.admin_id;
      const keys = await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM reseller_keys
        WHERE admin_id = ?
      `).bind(adminId).first();
      const activeKeys = await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM reseller_keys
        WHERE admin_id = ?
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      `).bind(adminId).first();
      const expiredKeys = await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM reseller_keys
        WHERE admin_id = ?
        AND (
          status = 'expired'
          OR (expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP)
        )
      `).bind(adminId).first();
      const users = await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM reseller_users
        WHERE admin_id = ?
      `).bind(adminId).first();
      const services = await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM services
        WHERE status = 'active'
      `).first();
      const activity = await env.DB.prepare(`
        SELECT action, details, created_at
        FROM activity_logs
        WHERE admin_id = ?
        ORDER BY id DESC
        LIMIT 10
      `).bind(adminId).all();
      return json({
        success: true,
        stats: {
          total_keys: Number(keys?.total || 0),
          active_keys: Number(activeKeys?.total || 0),
          expired_keys: Number(expiredKeys?.total || 0),
          users: Number(users?.total || 0),
          services: Number(services?.total || 0)
        },
        activity: activity.results || []
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // GENERATE USER KEY
    // --------------------------------------------------
    if (path === "/api/admin/keys" && method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const body = await request.json();
      const service = String(
        body.service || "General"
      ).trim();
      const days = Number(body.days || 30);
      const apiKey = makeKey("USER");
      const expiresAt = futureDate(days);
      const result = await env.DB.prepare(`
        INSERT INTO reseller_keys
          (admin_id, api_key, service, status, expires_at)
        VALUES (?, ?, ?, 'active', ?)
        RETURNING id, api_key, service, status, expires_at, created_at
      `)
        .bind(
          auth.admin.admin_id,
          apiKey,
          service,
          expiresAt
        )
        .first();
      await logActivity(
        env,
        auth.admin.admin_id,
        "KEY_GENERATED",
        `Service: ${service}`
      );
      return json({
        success: true,
        key: result
      }, 201, corsHeaders(request));
    }
    // --------------------------------------------------
    // LIST KEYS
    // --------------------------------------------------
    if (path === "/api/admin/keys" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const result = await env.DB.prepare(`
        SELECT
          id,
          api_key,
          service,
          status,
          expires_at,
          created_at
        FROM reseller_keys
        WHERE admin_id = ?
        ORDER BY id DESC
      `)
        .bind(auth.admin.admin_id)
        .all();
      return json({
        success: true,
        keys: result.results || []
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // REVOKE KEY
    // --------------------------------------------------
    const revokeMatch = path.match(
      /^\/api\/admin\/keys\/(\d+)\/revoke$/
    );
    if (revokeMatch && method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const id = Number(revokeMatch[1]);
      const result = await env.DB.prepare(`
        UPDATE reseller_keys
        SET status = 'revoked'
        WHERE id = ?
        AND admin_id = ?
      `)
        .bind(id, auth.admin.admin_id)
        .run();
      await logActivity(
        env,
        auth.admin.admin_id,
        "KEY_REVOKED",
        `Key ID: ${id}`
      );
      return json({
        success: true,
        changed: result.meta?.changes || 0
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // ACTIVATE KEY
    // --------------------------------------------------
    const activateMatch = path.match(
      /^\/api\/admin\/keys\/(\d+)\/activate$/
    );
    if (activateMatch && method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const id = Number(activateMatch[1]);
      await env.DB.prepare(`
        UPDATE reseller_keys
        SET status = 'active'
        WHERE id = ?
        AND admin_id = ?
      `)
        .bind(id, auth.admin.admin_id)
        .run();
      await logActivity(
        env,
        auth.admin.admin_id,
        "KEY_ACTIVATED",
        `Key ID: ${id}`
      );
      return json({
        success: true
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // USERS
    // --------------------------------------------------
    if (path === "/api/admin/users" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const result = await env.DB.prepare(`
        SELECT
          u.id,
          u.name,
          u.status,
          u.created_at,
          k.api_key,
          k.service,
          k.expires_at
        FROM reseller_users u
        LEFT JOIN reseller_keys k
          ON k.id = u.key_id
        WHERE u.admin_id = ?
        ORDER BY u.id DESC
      `)
        .bind(auth.admin.admin_id)
        .all();
      return json({
        success: true,
        users: result.results || []
      }, 200, corsHeaders(request));
    }
    if (path === "/api/admin/users" && method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const body = await request.json();
      const name = String(body.name || "").trim();
      const keyId = body.key_id ? Number(body.key_id) : null;
      if (!name) {
        return json({
          success: false,
          error: "User name is required"
        }, 400, corsHeaders(request));
      }
      if (keyId) {
        const key = await env.DB.prepare(`
          SELECT id
          FROM reseller_keys
          WHERE id = ?
          AND admin_id = ?
          LIMIT 1
        `)
          .bind(keyId, auth.admin.admin_id)
          .first();
        if (!key) {
          return json({
            success: false,
            error: "Key does not belong to this admin"
          }, 400, corsHeaders(request));
        }
      }
      const result = await env.DB.prepare(`
        INSERT INTO reseller_users
          (admin_id, name, key_id, status)
        VALUES (?, ?, ?, 'active')
        RETURNING id, name, key_id, status, created_at
      `)
        .bind(
          auth.admin.admin_id,
          name,
          keyId
        )
        .first();
      await logActivity(
        env,
        auth.admin.admin_id,
        "USER_ADDED",
        `User: ${name}`
      );
      return json({
        success: true,
        user: result
      }, 201, corsHeaders(request));
    }
    // --------------------------------------------------
    // SERVICES
    // --------------------------------------------------
    if (path === "/api/admin/services" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const result = await env.DB.prepare(`
        SELECT id, name, status, created_at
        FROM services
        ORDER BY id DESC
      `).all();
      return json({
        success: true,
        services: result.results || []
      }, 200, corsHeaders(request));
    }
    if (path === "/api/admin/services" && method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const body = await request.json();
      const name = String(body.name || "").trim();
      if (!name) {
        return json({
          success: false,
          error: "Service name is required"
        }, 400, corsHeaders(request));
      }
      try {
        const result = await env.DB.prepare(`
          INSERT INTO services
            (name, status)
          VALUES (?, 'active')
          RETURNING id, name, status, created_at
        `)
          .bind(name)
          .first();
        return json({
          success: true,
          service: result
        }, 201, corsHeaders(request));
      } catch {
        return json({
          success: false,
          error: "Service already exists"
        }, 409, corsHeaders(request));
      }
    }
    // --------------------------------------------------
    // BRANDING
    // --------------------------------------------------
    if (path === "/api/admin/branding" && method === "GET") {
      const result = await env.DB.prepare(`
        SELECT
          developer_label,
          developer_name,
          admin_name,
          logo_data,
          updated_at
        FROM branding
        WHERE id = 1
        LIMIT 1
      `).first();
      return json({
        success: true,
        branding: result
      }, 200, corsHeaders(request));
    }
    if (path === "/api/admin/branding" && method === "PUT") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const body = await request.json();
      const developerLabel =
        String(body.developer_label || "DEVELOPER").trim();
      const developerName =
        String(body.developer_name || "LAWANGEN").trim();
      const adminName =
        String(body.admin_name || "ROKHAN SYED").trim();
      const logoData =
        body.logo_data !== undefined
          ? String(body.logo_data || "")
          : null;
      if (logoData && logoData.length > 2_000_000) {
        return json({
          success: false,
          error: "Logo is too large"
        }, 400, corsHeaders(request));
      }
      if (logoData !== null) {
        await env.DB.prepare(`
          UPDATE branding
          SET
            developer_label = ?,
            developer_name = ?,
            admin_name = ?,
            logo_data = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `)
          .bind(
            developerLabel,
            developerName,
            adminName,
            logoData
          )
          .run();
      } else {
        await env.DB.prepare(`
          UPDATE branding
          SET
            developer_label = ?,
            developer_name = ?,
            admin_name = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `)
          .bind(
            developerLabel,
            developerName,
            adminName
          )
          .run();
      }
      await logActivity(
        env,
        auth.admin.admin_id,
        "BRANDING_UPDATED",
        "Branding settings updated"
      );
      return json({
        success: true
      }, 200, corsHeaders(request));
    }
    // --------------------------------------------------
    // ACTIVITY LOGS
    // --------------------------------------------------
    if (path === "/api/admin/activity" && method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return auth.error;
      const result = await env.DB.prepare(`
        SELECT action, details, created_at
        FROM activity_logs
        WHERE admin_id = ?
        ORDER BY id DESC
        LIMIT 100
      `)
        .bind(auth.admin.admin_id)
        .all();
      return json({
        success: true,
        activity: result.results || []
      }, 200, corsHeaders(request));
    }
    return json({
      success: false,
      error: "Route not found"
    }, 404, corsHeaders(request));
  } catch (error) {
    return json({
      success: false,
      error: "Server error",
      message: error?.message || "Unknown error"
    }, 500, corsHeaders(request));
  }
}
export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};