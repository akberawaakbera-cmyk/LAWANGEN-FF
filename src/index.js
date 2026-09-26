const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...extraHeaders
    }
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
  const data = new TextEncoder().encode(String(value));

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomString(length = 32) {
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return [...bytes]
    .map(b =>
      b.toString(16).padStart(2, "0")
    )
    .join("");
}

function makeKey(prefix = "RK") {
  return `${prefix}-${randomString(12).toUpperCase()}`;
}

function getCookie(request, name) {
  const cookie =
    request.headers.get("Cookie") || "";

  const found = cookie
    .split(";")
    .map(x => x.trim())
    .find(
      x => x.startsWith(`${name}=`)
    );

  return found
    ? decodeURIComponent(
        found.substring(name.length + 1)
      )
    : null;
}

function setAdminSessionCookie(token) {
  return [
    `rokhan_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=604800"
  ].join("; ");
}

function clearAdminSessionCookie() {
  return [
    "rokhan_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}

function setDeveloperSessionCookie(token) {
  return [
    `lawangen_developer_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=604800"
  ].join("; ");
}

function clearDeveloperSessionCookie() {
  return [
    "lawangen_developer_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}

function futureDate(days) {
  const d = new Date();

  const safeDays = Number(days || 30);

  d.setDate(
    d.getDate() +
    (
      Number.isFinite(safeDays) && safeDays > 0
        ? safeDays
        : 30
    )
  );

  return d.toISOString();
}

function isExpired(date) {
  if (!date) return false;

  return (
    new Date(date).getTime() <=
    Date.now()
  );
}

function normalizeDays(value, fallback = 30) {
  const days = Number(value);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    return fallback;
  }

  return Math.floor(days);
}


/* =========================================
   LOGO VALIDATION
========================================= */

const MAX_LOGO_DATA_LENGTH = 6_000_000;

function validLogoData(value) {
  if (!value) return true;

  const logo = String(value);

  if (logo.length > MAX_LOGO_DATA_LENGTH) {
    return false;
  }

  if (!logo.startsWith("data:image/")) {
    return false;
  }

  return true;
}


/* =========================================
   ADMIN AUTH
========================================= */

async function requireAdmin(request, env) {
  const token = getCookie(
    request,
    "rokhan_session"
  );

  if (!token) {
    return {
      error: json(
        {
          success: false,
          error: "Not authenticated"
        },
        401
      )
    };
  }

  const tokenHash =
    await sha256(token);

  const session =
    await env.DB.prepare(`
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
        {
          success: false,
          error: "Invalid session"
        },
        401,
        {
          "Set-Cookie":
            clearAdminSessionCookie()
        }
      )
    };
  }

  if (isExpired(session.expires_at)) {
    await env.DB.prepare(`
      DELETE FROM admin_sessions
      WHERE id = ?
    `)
      .bind(session.session_id)
      .run();

    return {
      error: json(
        {
          success: false,
          error: "Session expired"
        },
        401,
        {
          "Set-Cookie":
            clearAdminSessionCookie()
        }
      )
    };
  }

  if (session.status !== "active") {
    return {
      error: json(
        {
          success: false,
          error: "Admin account is disabled"
        },
        403,
        {
          "Set-Cookie":
            clearAdminSessionCookie()
        }
      )
    };
  }

  if (
    isExpired(
      session.admin_expires_at
    )
  ) {
    return {
      error: json(
        {
          success: false,
          error: "Admin access has expired"
        },
        403,
        {
          "Set-Cookie":
            clearAdminSessionCookie()
        }
      )
    };
  }

  return {
    admin: session
  };
}


/* =========================================
   DEVELOPER AUTH
========================================= */

async function requireDeveloper(
  request,
  env
) {
  const token = getCookie(
    request,
    "lawangen_developer_session"
  );

  if (!token) {
    return {
      error: json(
        {
          success: false,
          error:
            "Developer authentication required"
        },
        401
      )
    };
  }

  const tokenHash =
    await sha256(token);

  const session =
    await env.DB.prepare(`
      SELECT
        id,
        expires_at
      FROM developer_sessions
      WHERE session_token_hash = ?
      LIMIT 1
    `)
      .bind(tokenHash)
      .first();

  if (!session) {
    return {
      error: json(
        {
          success: false,
          error:
            "Developer session invalid"
        },
        401,
        {
          "Set-Cookie":
            clearDeveloperSessionCookie()
        }
      )
    };
  }

  if (
    isExpired(
      session.expires_at
    )
  ) {
    await env.DB.prepare(`
      DELETE FROM developer_sessions
      WHERE id = ?
    `)
      .bind(session.id)
      .run();

    return {
      error: json(
        {
          success: false,
          error:
            "Developer session expired"
        },
        401,
        {
          "Set-Cookie":
            clearDeveloperSessionCookie()
        }
      )
    };
  }

  return {
    developer: true,
    session
  };
}


/* =========================================
   ACTIVITY
========================================= */

async function logActivity(
  env,
  adminId,
  action,
  details = ""
) {
  try {
    await env.DB.prepare(`
      INSERT INTO activity_logs
        (admin_id, action, details)
      VALUES (?, ?, ?)
    `)
      .bind(
        adminId || null,
        action,
        details
      )
      .run();
  } catch (error) {
    console.log(
      "Activity log failed:",
      error?.message
    );
  }
}


/* =========================================
   TABLES
========================================= */

async function ensureTables(env) {

  /* ---------- BRANDING ---------- */

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
      (
        id,
        developer_label,
        developer_name,
        admin_name
      )
    VALUES (
      1,
      'DEVELOPER',
      'LAWANGEN',
      'ROKHAN SYED'
    )
  `).run();


  /* ---------- DEVELOPER SESSIONS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS developer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- ADMINS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS reseller_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      admin_key_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- ADMIN SESSIONS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- USER KEYS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS reseller_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      service TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- USERS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS reseller_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      key_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- SERVICES ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- SERVICE LOGOS ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS service_logos (
      service_id INTEGER PRIMARY KEY,
      logo_data TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- ACTIVITY ---------- */

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();


  /* ---------- DEFAULT SERVICES ---------- */

  const defaultServices = [
    "Free Fire",
    "PUBG MOBILE",
    "Call of Duty: Mobile",
    "8 Ball Pool",
    "PUBG: New State",
    "Mobile Legends: Bang Bang",
    "Arena Breakout",
    "Fortnite",
    "Minecraft",
    "Roblox",
    "Apex Legends",
    "League of Legends: Wild Rift",
    "Valorant",
    "General"
  ];

  for (const service of defaultServices) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO services
        (name, status)
      VALUES (?, 'active')
    `)
      .bind(service)
      .run();
  }
}


/* =========================================
   REQUEST
========================================= */

async function handleRequest(
  request,
  env
) {

  const url =
    new URL(request.url);

  const path =
    url.pathname;

  const method =
    request.method;


  /* ---------- CORS ---------- */

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers:
        corsHeaders(request)
    });
  }


  /* ---------- DATABASE ---------- */

  if (!env.DB) {
    return json(
      {
        success: false,
        error:
          "D1 binding DB is missing"
      },
      500,
      corsHeaders(request)
    );
  }


  try {

    await ensureTables(env);


    /* =====================================
       HEALTH
    ===================================== */

    if (
      path === "/api/health" &&
      method === "GET"
    ) {
      return json(
        {
          success: true,
          worker: "lawangen-ff",
          database: "rokhan",
          d1: true
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER LOGIN
    ===================================== */

    if (
      path === "/api/developer/login" &&
      method === "POST"
    ) {

      const developerToken =
        request.headers.get(
          "X-Developer-Token"
        );

      if (!env.DEVELOPER_TOKEN) {
        return json(
          {
            success: false,
            error:
              "DEVELOPER_TOKEN secret is not configured"
          },
          500,
          corsHeaders(request)
        );
      }

      if (
        !developerToken ||
        developerToken !==
          env.DEVELOPER_TOKEN
      ) {
        return json(
          {
            success: false,
            error:
              "Developer access denied"
          },
          403,
          corsHeaders(request)
        );
      }


      const sessionToken =
        randomString(48);

      const sessionHash =
        await sha256(
          sessionToken
        );

      const expiresAt =
        futureDate(7);


      await env.DB.prepare(`
        INSERT INTO developer_sessions
          (
            session_token_hash,
            expires_at
          )
        VALUES (?, ?)
      `)
        .bind(
          sessionHash,
          expiresAt
        )
        .run();


      return json(
        {
          success: true,
          developer: true
        },
        200,
        {
          ...corsHeaders(request),
          "Set-Cookie":
            setDeveloperSessionCookie(
              sessionToken
            )
        }
      );
    }


    /* =====================================
       DEVELOPER ME
    ===================================== */

    if (
      path === "/api/developer/me" &&
      method === "GET"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      return json(
        {
          success: true,
          developer: true
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER LOGOUT
    ===================================== */

    if (
      path === "/api/developer/logout" &&
      method === "POST"
    ) {

      const token =
        getCookie(
          request,
          "lawangen_developer_session"
        );

      if (token) {

        const hash =
          await sha256(token);

        await env.DB.prepare(`
          DELETE FROM developer_sessions
          WHERE session_token_hash = ?
        `)
          .bind(hash)
          .run();
      }


      return json(
        {
          success: true
        },
        200,
        {
          ...corsHeaders(request),
          "Set-Cookie":
            clearDeveloperSessionCookie()
        }
      );
    }


    /* =====================================
       DEVELOPER CREATE ADMIN KEY
    ===================================== */

    if (
      path ===
        "/api/developer/create-admin" &&
      method === "POST"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const name =
        String(
          body.name ||
          "ROKHAN SYED"
        ).trim();


      const days =
        normalizeDays(
          body.days,
          30
        );


      if (!name) {
        return json(
          {
            success: false,
            error:
              "Admin name is required"
          },
          400,
          corsHeaders(request)
        );
      }


      const adminKey =
        makeKey("ADMIN");

      const adminKeyHash =
        await sha256(
          adminKey
        );

      const expiresAt =
        futureDate(days);


      const result =
        await env.DB.prepare(`
          INSERT INTO reseller_admins
            (
              name,
              admin_key_hash,
              status,
              expires_at
            )
          VALUES (?, ?, 'active', ?)
          RETURNING
            id,
            name,
            status,
            expires_at,
            created_at
        `)
          .bind(
            name,
            adminKeyHash,
            expiresAt
          )
          .first();


      return json(
        {
          success: true,
          admin: result,
          admin_key: adminKey
        },
        201,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER LIST ADMINS
    ===================================== */

    if (
      path ===
        "/api/developer/admins" &&
      method === "GET"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
          SELECT
            id,
            name,
            status,
            expires_at,
            created_at
          FROM reseller_admins
          ORDER BY id DESC
        `)
          .all();


      return json(
        {
          success: true,
          admins:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER REVOKE ADMIN
    ===================================== */

    const revokeAdminMatch =
      path.match(
        /^\/api\/developer\/admins\/(\d+)\/revoke$/
      );


    if (
      revokeAdminMatch &&
      method === "POST"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const adminId =
        Number(
          revokeAdminMatch[1]
        );


      const result =
        await env.DB.prepare(`
          UPDATE reseller_admins
          SET status = 'revoked'
          WHERE id = ?
        `)
          .bind(adminId)
          .run();


      await env.DB.prepare(`
        DELETE FROM admin_sessions
        WHERE admin_id = ?
      `)
        .bind(adminId)
        .run();


      return json(
        {
          success: true,
          changed:
            result.meta?.changes || 0
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER ACTIVATE ADMIN
    ===================================== */

    const activateAdminMatch =
      path.match(
        /^\/api\/developer\/admins\/(\d+)\/activate$/
      );


    if (
      activateAdminMatch &&
      method === "POST"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const adminId =
        Number(
          activateAdminMatch[1]
        );


      const admin =
        await env.DB.prepare(`
          SELECT
            id,
            status,
            expires_at
          FROM reseller_admins
          WHERE id = ?
          LIMIT 1
        `)
          .bind(adminId)
          .first();


      if (!admin) {
        return json(
          {
            success: false,
            error:
              "Admin not found"
          },
          404,
          corsHeaders(request)
        );
      }


      if (
        isExpired(
          admin.expires_at
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Admin access has expired. Create a new Admin Key or extend the expiry first."
          },
          403,
          corsHeaders(request)
        );
      }


      await env.DB.prepare(`
        UPDATE reseller_admins
        SET status = 'active'
        WHERE id = ?
      `)
        .bind(adminId)
        .run();


      return json(
        {
          success: true
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER SERVICES - LIST
    ===================================== */

    if (
      path ===
        "/api/developer/services" &&
      method === "GET"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
          SELECT
            s.id,
            s.name,
            s.status,
            s.created_at,
            sl.logo_data,
            sl.updated_at AS logo_updated_at
          FROM services s
          LEFT JOIN service_logos sl
            ON sl.service_id = s.id
          ORDER BY s.id DESC
        `)
          .all();


      return json(
        {
          success: true,
          services:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER SERVICES - CREATE
    ===================================== */

    if (
      path ===
        "/api/developer/services" &&
      method === "POST"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const name =
        String(
          body.name || ""
        ).trim();


      const status =
        body.status === "inactive"
          ? "inactive"
          : "active";


      const logoData =
        body.logo_data
          ? String(body.logo_data)
          : null;


      if (!name) {
        return json(
          {
            success: false,
            error:
              "Game name is required"
          },
          400,
          corsHeaders(request)
        );
      }


      if (
        logoData &&
        !validLogoData(logoData)
      ) {
        return json(
          {
            success: false,
            error:
              "Invalid or oversized game logo"
          },
          400,
          corsHeaders(request)
        );
      }


      try {

        const service =
          await env.DB.prepare(`
            INSERT INTO services
              (name, status)
            VALUES (?, ?)
            RETURNING
              id,
              name,
              status,
              created_at
          `)
            .bind(
              name,
              status
            )
            .first();


        if (logoData) {
          await env.DB.prepare(`
            INSERT INTO service_logos
              (
                service_id,
                logo_data,
                updated_at
              )
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `)
            .bind(
              service.id,
              logoData
            )
            .run();
        }


        return json(
          {
            success: true,
            service: {
              ...service,
              logo_data:
                logoData
            }
          },
          201,
          corsHeaders(request)
        );

      } catch {

        return json(
          {
            success: false,
            error:
              "Game already exists"
          },
          409,
          corsHeaders(request)
        );
      }
    }


    /* =====================================
       DEVELOPER SERVICES - UPDATE
    ===================================== */

    const developerServiceMatch =
      path.match(
        /^\/api\/developer\/services\/(\d+)$/
      );


    if (
      developerServiceMatch &&
      method === "PUT"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const serviceId =
        Number(
          developerServiceMatch[1]
        );


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const existing =
        await env.DB.prepare(`
          SELECT
            id,
            name,
            status
          FROM services
          WHERE id = ?
          LIMIT 1
        `)
          .bind(serviceId)
          .first();


      if (!existing) {
        return json(
          {
            success: false,
            error:
              "Game not found"
          },
          404,
          corsHeaders(request)
        );
      }


      const name =
        body.name !== undefined
          ? String(body.name).trim()
          : existing.name;


      const status =
        body.status !== undefined
          ? (
              body.status === "inactive"
                ? "inactive"
                : "active"
            )
          : existing.status;


      if (!name) {
        return json(
          {
            success: false,
            error:
              "Game name is required"
          },
          400,
          corsHeaders(request)
        );
      }


      if (
        body.logo_data !== undefined &&
        body.logo_data !== null &&
        body.logo_data !== "" &&
        !validLogoData(
          String(body.logo_data)
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Invalid or oversized game logo"
          },
          400,
          corsHeaders(request)
        );
      }


      try {

        await env.DB.prepare(`
          UPDATE services
          SET
            name = ?,
            status = ?
          WHERE id = ?
        `)
          .bind(
            name,
            status,
            serviceId
          )
          .run();

      } catch {

        return json(
          {
            success: false,
            error:
              "Game name already exists"
          },
          409,
          corsHeaders(request)
        );
      }


      /*
        logo_data omitted:
        keep existing logo.

        logo_data = "":
        remove logo.

        logo_data = null:
        remove logo.

        logo_data = data:image/...:
        replace logo.
      */

      if (
        body.logo_data !== undefined
      ) {

        const logo =
          body.logo_data
            ? String(body.logo_data)
            : null;


        if (logo) {

          await env.DB.prepare(`
            INSERT INTO service_logos
              (
                service_id,
                logo_data,
                updated_at
              )
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(service_id)
            DO UPDATE SET
              logo_data = excluded.logo_data,
              updated_at = CURRENT_TIMESTAMP
          `)
            .bind(
              serviceId,
              logo
            )
            .run();

        } else {

          await env.DB.prepare(`
            DELETE FROM service_logos
            WHERE service_id = ?
          `)
            .bind(serviceId)
            .run();
        }
      }


      const updated =
        await env.DB.prepare(`
          SELECT
            s.id,
            s.name,
            s.status,
            s.created_at,
            sl.logo_data,
            sl.updated_at AS logo_updated_at
          FROM services s
          LEFT JOIN service_logos sl
            ON sl.service_id = s.id
          WHERE s.id = ?
          LIMIT 1
        `)
          .bind(serviceId)
          .first();


      return json(
        {
          success: true,
          service: updated
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DEVELOPER SERVICES - DELETE
    ===================================== */

    if (
      developerServiceMatch &&
      method === "DELETE"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const serviceId =
        Number(
          developerServiceMatch[1]
        );


      const service =
        await env.DB.prepare(`
          SELECT
            id,
            name
          FROM services
          WHERE id = ?
          LIMIT 1
        `)
          .bind(serviceId)
          .first();


      if (!service) {
        return json(
          {
            success: false,
            error:
              "Game not found"
          },
          404,
          corsHeaders(request)
        );
      }


      /*
        Remove the game's logo first.
      */

      await env.DB.prepare(`
        DELETE FROM service_logos
        WHERE service_id = ?
      `)
        .bind(serviceId)
        .run();


      /*
        We keep old reseller keys untouched.
        This prevents historical key records
        from being destroyed.
      */

      await env.DB.prepare(`
        DELETE FROM services
        WHERE id = ?
      `)
        .bind(serviceId)
        .run();


      return json(
        {
          success: true,
          deleted: service
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       ADMIN LOGIN
    ===================================== */

    if (
      path === "/api/admin/login" &&
      method === "POST"
    ) {

      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const adminKey =
        String(
          body.admin_key || ""
        ).trim();


      if (!adminKey) {
        return json(
          {
            success: false,
            error:
              "Admin key is required"
          },
          400,
          corsHeaders(request)
        );
      }


      const keyHash =
        await sha256(
          adminKey
        );


      const admin =
        await env.DB.prepare(`
          SELECT
            id,
            name,
            status,
            expires_at
          FROM reseller_admins
          WHERE admin_key_hash = ?
          LIMIT 1
        `)
          .bind(keyHash)
          .first();


      if (!admin) {
        return json(
          {
            success: false,
            error:
              "Invalid Admin Key"
          },
          401,
          corsHeaders(request)
        );
      }


      if (
        admin.status !==
        "active"
      ) {
        return json(
          {
            success: false,
            error:
              "Admin account is disabled"
          },
          403,
          corsHeaders(request)
        );
      }


      if (
        isExpired(
          admin.expires_at
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Admin Key has expired"
          },
          403,
          corsHeaders(request)
        );
      }


      const sessionToken =
        randomString(48);

      const sessionHash =
        await sha256(
          sessionToken
        );

      const sessionExpiry =
        futureDate(7);


      await env.DB.prepare(`
        INSERT INTO admin_sessions
          (
            admin_id,
            session_token_hash,
            expires_at
          )
        VALUES (?, ?, ?)
      `)
        .bind(
          admin.id,
          sessionHash,
          sessionExpiry
        )
        .run();


      await logActivity(
        env,
        admin.id,
        "LOGIN",
        "Admin login successful"
      );


      return json(
        {
          success: true,
          admin: {
            id: admin.id,
            name: admin.name,
            expires_at:
              admin.expires_at
          }
        },
        200,
        {
          ...corsHeaders(request),
          "Set-Cookie":
            setAdminSessionCookie(
              sessionToken
            )
        }
      );
    }


    /* =====================================
       ADMIN LOGOUT
    ===================================== */

    if (
      path === "/api/admin/logout" &&
      method === "POST"
    ) {

      const token =
        getCookie(
          request,
          "rokhan_session"
        );


      if (token) {

        const hash =
          await sha256(token);


        const session =
          await env.DB.prepare(`
            SELECT admin_id
            FROM admin_sessions
            WHERE session_token_hash = ?
            LIMIT 1
          `)
            .bind(hash)
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
          .bind(hash)
          .run();
      }


      return json(
        {
          success: true
        },
        200,
        {
          ...corsHeaders(request),
          "Set-Cookie":
            clearAdminSessionCookie()
        }
      );
    }


    /* =====================================
       ADMIN ME
    ===================================== */

    if (
      path === "/api/admin/me" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      return json(
        {
          success: true,
          admin: {
            id:
              auth.admin.admin_id,
            name:
              auth.admin.name,
            expires_at:
              auth.admin.admin_expires_at
          }
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       DASHBOARD
    ===================================== */

    if (
      path ===
        "/api/admin/dashboard" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const adminId =
        auth.admin.admin_id;


      const keys =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM reseller_keys
          WHERE admin_id = ?
        `)
          .bind(adminId)
          .first();


      const activeKeys =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM reseller_keys
          WHERE admin_id = ?
          AND status = 'active'
          AND (
            expires_at IS NULL
            OR expires_at > CURRENT_TIMESTAMP
          )
        `)
          .bind(adminId)
          .first();


      const expiredKeys =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM reseller_keys
          WHERE admin_id = ?
          AND (
            status = 'expired'
            OR (
              expires_at IS NOT NULL
              AND expires_at <= CURRENT_TIMESTAMP
            )
          )
        `)
          .bind(adminId)
          .first();


      const users =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM reseller_users
          WHERE admin_id = ?
        `)
          .bind(adminId)
          .first();


      const services =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM services
          WHERE status = 'active'
        `)
          .first();


      const activity =
        await env.DB.prepare(`
          SELECT
            action,
            details,
            created_at
          FROM activity_logs
          WHERE admin_id = ?
          ORDER BY id DESC
          LIMIT 10
        `)
          .bind(adminId)
          .all();


      return json(
        {
          success: true,
          stats: {
            total_keys:
              Number(
                keys?.total || 0
              ),

            active_keys:
              Number(
                activeKeys?.total || 0
              ),

            expired_keys:
              Number(
                expiredKeys?.total || 0
              ),

            users:
              Number(
                users?.total || 0
              ),

            services:
              Number(
                services?.total || 0
              )
          },

          activity:
            activity.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       USER KEYS - CREATE
       ADMIN ONLY
    ===================================== */

    if (
      path === "/api/admin/keys" &&
      method === "POST"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const service =
        String(
          body.service ||
          "General"
        ).trim();


      const days =
        normalizeDays(
          body.days,
          30
        );


      const apiKey =
        makeKey("USER");


      const expiresAt =
        futureDate(days);


      const result =
        await env.DB.prepare(`
          INSERT INTO reseller_keys
            (
              admin_id,
              api_key,
              service,
              status,
              expires_at
            )
          VALUES (?, ?, ?, 'active', ?)
          RETURNING
            id,
            api_key,
            service,
            status,
            expires_at,
            created_at
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


      return json(
        {
          success: true,
          key: result
        },
        201,
        corsHeaders(request)
      );
    }


    /* =====================================
       USER KEYS - LIST
    ===================================== */

    if (
      path === "/api/admin/keys" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
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
          .bind(
            auth.admin.admin_id
          )
          .all();


      return json(
        {
          success: true,
          keys:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       USER KEY REVOKE
    ===================================== */

    const revokeMatch =
      path.match(
        /^\/api\/admin\/keys\/(\d+)\/revoke$/
      );


    if (
      revokeMatch &&
      method === "POST"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const id =
        Number(
          revokeMatch[1]
        );


      const result =
        await env.DB.prepare(`
          UPDATE reseller_keys
          SET status = 'revoked'
          WHERE id = ?
          AND admin_id = ?
        `)
          .bind(
            id,
            auth.admin.admin_id
          )
          .run();


      await logActivity(
        env,
        auth.admin.admin_id,
        "KEY_REVOKED",
        `Key ID: ${id}`
      );


      return json(
        {
          success: true,
          changed:
            result.meta?.changes || 0
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       USER KEY ACTIVATE
    ===================================== */

    const activateMatch =
      path.match(
        /^\/api\/admin\/keys\/(\d+)\/activate$/
      );


    if (
      activateMatch &&
      method === "POST"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const id =
        Number(
          activateMatch[1]
        );


      const key =
        await env.DB.prepare(`
          SELECT
            id,
            expires_at,
            status
          FROM reseller_keys
          WHERE id = ?
          AND admin_id = ?
          LIMIT 1
        `)
          .bind(
            id,
            auth.admin.admin_id
          )
          .first();


      if (!key) {
        return json(
          {
            success: false,
            error:
              "Key not found"
          },
          404,
          corsHeaders(request)
        );
      }


      if (
        isExpired(
          key.expires_at
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Key has expired"
          },
          403,
          corsHeaders(request)
        );
      }


      await env.DB.prepare(`
        UPDATE reseller_keys
        SET status = 'active'
        WHERE id = ?
        AND admin_id = ?
      `)
        .bind(
          id,
          auth.admin.admin_id
        )
        .run();


      await logActivity(
        env,
        auth.admin.admin_id,
        "KEY_ACTIVATED",
        `Key ID: ${id}`
      );


      return json(
        {
          success: true
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       USERS - LIST
    ===================================== */

    if (
      path === "/api/admin/users" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
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
          .bind(
            auth.admin.admin_id
          )
          .all();


      return json(
        {
          success: true,
          users:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       USERS - CREATE
    ===================================== */

    if (
      path === "/api/admin/users" &&
      method === "POST"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const name =
        String(
          body.name || ""
        ).trim();


      const keyId =
        body.key_id
          ? Number(body.key_id)
          : null;


      if (!name) {
        return json(
          {
            success: false,
            error:
              "User name is required"
          },
          400,
          corsHeaders(request)
        );
      }


      if (keyId) {

        const key =
          await env.DB.prepare(`
            SELECT id
            FROM reseller_keys
            WHERE id = ?
            AND admin_id = ?
            LIMIT 1
          `)
            .bind(
              keyId,
              auth.admin.admin_id
            )
            .first();


        if (!key) {
          return json(
            {
              success: false,
              error:
                "Key does not belong to this admin"
            },
            403,
            corsHeaders(request)
          );
        }
      }


      const result =
        await env.DB.prepare(`
          INSERT INTO reseller_users
            (
              admin_id,
              name,
              key_id,
              status
            )
          VALUES (?, ?, ?, 'active')
          RETURNING
            id,
            name,
            key_id,
            status,
            created_at
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


      return json(
        {
          success: true,
          user: result
        },
        201,
        corsHeaders(request)
      );
    }


    /* =====================================
       ADMIN SERVICES - LIST
       ADMIN READ ONLY
    ===================================== */

    if (
      path ===
        "/api/admin/services" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
          SELECT
            s.id,
            s.name,
            s.status,
            s.created_at,
            sl.logo_data,
            sl.updated_at AS logo_updated_at
          FROM services s
          LEFT JOIN service_logos sl
            ON sl.service_id = s.id
          ORDER BY s.id DESC
        `)
          .all();


      return json(
        {
          success: true,
          services:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       ADMIN SERVICES - WRITE BLOCKED
       ADMIN CANNOT CREATE GAMES
    ===================================== */

    if (
      path ===
        "/api/admin/services" &&
      (
        method === "POST" ||
        method === "PUT" ||
        method === "PATCH" ||
        method === "DELETE"
      )
    ) {

      return json(
        {
          success: false,
          error:
            "Developer access required"
        },
        403,
        corsHeaders(request)
      );
    }


    /* =====================================
       BRANDING GET
       PUBLIC
    ===================================== */

    if (
      path ===
        "/api/admin/branding" &&
      method === "GET"
    ) {

      const result =
        await env.DB.prepare(`
          SELECT
            developer_label,
            developer_name,
            admin_name,
            logo_data,
            updated_at
          FROM branding
          WHERE id = 1
          LIMIT 1
        `)
          .first();


      return json(
        {
          success: true,
          branding:
            result || {
              developer_label:
                "DEVELOPER",
              developer_name:
                "LAWANGEN",
              admin_name:
                "ROKHAN SYED",
              logo_data:
                null
            }
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       BRANDING UPDATE
       DEVELOPER ONLY
    ===================================== */

    if (
      path ===
        "/api/admin/branding" &&
      method === "PUT"
    ) {

      const auth =
        await requireDeveloper(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      let body = {};

      try {
        body =
          await request.json();
      } catch {
        body = {};
      }


      const developerLabel =
        body.developer_label !== undefined
          ? String(
              body.developer_label || ""
            ).trim()
          : "DEVELOPER";


      const developerName =
        body.developer_name !== undefined
          ? String(
              body.developer_name || ""
            ).trim()
          : "LAWANGEN";


      const adminName =
        body.admin_name !== undefined
          ? String(
              body.admin_name || ""
            ).trim()
          : "ROKHAN SYED";


      /*
        Important:

        If logo_data is omitted,
        existing logo is preserved.

        If logo_data is "",
        logo is removed.

        If logo_data contains a data:image,
        logo is permanently replaced.
      */

      const hasLogoField =
        Object.prototype.hasOwnProperty.call(
          body,
          "logo_data"
        );


      if (hasLogoField) {

        const logoData =
          body.logo_data
            ? String(body.logo_data)
            : "";


        if (
          logoData &&
          !validLogoData(logoData)
        ) {
          return json(
            {
              success: false,
              error:
                "Logo must be an image and must not exceed the allowed size"
            },
            400,
            corsHeaders(request)
          );
        }


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
            logoData || null
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


      return json(
        {
          success: true
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       ACTIVITY
       ADMIN ONLY
    ===================================== */

    if (
      path ===
        "/api/admin/activity" &&
      method === "GET"
    ) {

      const auth =
        await requireAdmin(
          request,
          env
        );

      if (auth.error)
        return auth.error;


      const result =
        await env.DB.prepare(`
          SELECT
            action,
            details,
            created_at
          FROM activity_logs
          WHERE admin_id = ?
          ORDER BY id DESC
          LIMIT 100
        `)
          .bind(
            auth.admin.admin_id
          )
          .all();


      return json(
        {
          success: true,
          activity:
            result.results || []
        },
        200,
        corsHeaders(request)
      );
    }


    /* =====================================
       STATIC FRONTEND
    ===================================== */

    if (
      method === "GET" &&
      !path.startsWith("/api/")
    ) {

      if (!env.ASSETS) {
        return json(
          {
            success: false,
            error:
              "ASSETS binding is missing"
          },
          500,
          corsHeaders(request)
        );
      }


      return env.ASSETS.fetch(
        request
      );
    }


    /* =====================================
       ROUTE NOT FOUND
    ===================================== */

    return json(
      {
        success: false,
        error: "Route not found"
      },
      404,
      corsHeaders(request)
    );


  } catch (error) {

    console.error(
      "Worker error:",
      error
    );

    return json(
      {
        success: false,
        error: "Server error",
        message:
          error?.message ||
          "Unknown error"
      },
      500,
      corsHeaders(request)
    );
  }
}


/* =========================================
   WORKER
========================================= */

export default {

  async fetch(
    request,
    env
  ) {

    return handleRequest(
      request,
      env
    );

  }

};