/* =========================================================
   LAWANGEN ADMIN PANEL
   APP.JS
   Compatible with current src/index.js
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     STATE
  ======================================================= */

  const state = {
    developer: false,
    admin: null,

    keys: [],
    users: [],
    services: [],
    activity: [],
    admins: [],

    currentPage: "homePage",

    existingSession: false,
    sessionChecked: false,

    soundEnabled:
      localStorage.getItem("lawangen_sound") !== "false",

    animationsEnabled:
      localStorage.getItem("lawangen_animations") !== "false",

    logoData:
      localStorage.getItem("lawangen_logo") || ""
  };


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = id => document.getElementById(id);

  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return [...document.querySelectorAll(selector)];
  }

  function on(id, event, handler) {
    const element = $(id);

    if (element) {
      element.addEventListener(event, handler);
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(date) {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatDateTime(date) {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function isExpired(date) {
    if (!date) return false;

    const time = new Date(date).getTime();

    return (
      !Number.isNaN(time) &&
      time <= Date.now()
    );
  }

  function effectiveStatus(item) {
    if (!item) return "unknown";

    if (
      item.expires_at &&
      isExpired(item.expires_at)
    ) {
      return "expired";
    }

    return String(
      item.status || "unknown"
    ).toLowerCase();
  }

  function statusLabel(status) {
    return String(status || "unknown")
      .replaceAll("_", " ")
      .toUpperCase();
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return "RS";
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  /* =======================================================
     API
  ======================================================= */

  async function api(
    url,
    options = {}
  ) {
    const config = {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),
        ...(options.headers || {})
      }
    };

    const response =
      await fetch(url, config);

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error =
        new Error(
          data?.error ||
          data?.message ||
          `Request failed (${response.status})`
        );

      error.status =
        response.status;

      error.data = data;

      throw error;
    }

    return data;
  }


  /* =======================================================
     SOUND
  ======================================================= */

  let audioContext = null;

  function playClickSound(
    type = "click"
  ) {
    if (!state.soundEnabled) {
      return;
    }

    try {
      if (!audioContext) {
        audioContext =
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();
      }

      if (
        audioContext.state ===
        "suspended"
      ) {
        audioContext.resume().catch(
          () => {}
        );
      }

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(
        audioContext.destination
      );

      const now =
        audioContext.currentTime;

      oscillator.type =
        type === "success"
          ? "sine"
          : "triangle";

      oscillator.frequency.setValueAtTime(
        type === "success"
          ? 720
          : 520,
        now
      );

      gain.gain.setValueAtTime(
        0.0001,
        now
      );

      gain.gain.exponentialRampToValueAtTime(
        0.045,
        now + 0.01
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.075
      );

      oscillator.start(now);
      oscillator.stop(now + 0.08);
    } catch {
      /* Sound failure must never break UI */
    }
  }


  function installGlobalSound() {
    document.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "button"
          );

        if (!button) return;

        if (
          button.disabled ||
          button.dataset.noSound ===
            "true"
        ) {
          return;
        }

        playClickSound();
      },
      true
    );
  }


  /* =======================================================
     ANIMATIONS
  ======================================================= */

  function applyAnimationSetting() {
    document.body.classList.toggle(
      "no-animations",
      !state.animationsEnabled
    );
  }


  /* =======================================================
     LOGO
  ======================================================= */

  function applyLogoToUI(
    logo
  ) {
    if (!logo) {
      return;
    }

    const targets = [
      $("splashLogo"),
      $("loginLogo"),
      $("adminFormLogo"),
      $("developerLoginLogo"),
      $("profileAvatar")
    ];

    targets.forEach(element => {
      if (!element) return;

      if (
        element.id ===
        "profileAvatar"
      ) {
        element.style.backgroundImage =
          `url("${logo}")`;

        element.style.backgroundSize =
          "cover";

        element.style.backgroundPosition =
          "center";

        element.textContent = "";
      } else {
        element.style.backgroundImage =
          `url("${logo}")`;

        element.style.backgroundSize =
          "contain";

        element.style.backgroundRepeat =
          "no-repeat";

        element.style.backgroundPosition =
          "center";

        element.textContent = "";
      }
    });
  }


  /* =======================================================
     SESSION CHECK
  ======================================================= */

  async function checkExistingSession() {
    state.sessionChecked = false;

    try {
      const developer =
        await api(
          "/api/developer/me"
        );

      if (
        developer?.success &&
        developer?.developer
      ) {
        state.developer = true;
        state.existingSession = true;
        state.sessionChecked = true;

        return;
      }
    } catch {
      /* Not developer */
    }

    try {
      const admin =
        await api(
          "/api/admin/me"
        );

      if (admin?.success) {
        state.developer = false;
        state.admin =
          admin.admin || null;

        state.existingSession = true;
      }
    } catch {
      state.existingSession = false;
    }

    state.sessionChecked = true;
  }


  /* =======================================================
     SPLASH
  ======================================================= */

  function finishSplash() {
    const splash =
      $("splash");

    if (!splash) return;

    splash.classList.add(
      "hidden"
    );

    if (
      state.existingSession
    ) {
      openApplication();
    } else {
      showAccessScreen();
    }
  }


  function showAccessScreen() {
    [
      "loginScreen",
      "adminLoginForm",
      "developerLoginScreen"
    ].forEach(id => {
      const element = $(id);

      if (element) {
        element.classList.add(
          "hidden"
        );
      }
    });

    const login =
      $("loginScreen");

    if (login) {
      login.classList.remove(
        "hidden"
      );
    }
  }


  /* =======================================================
     LOGIN SCREENS
  ======================================================= */

  function showAdminLogin() {
    playClickSound();

    $("loginScreen")?.classList.add(
      "hidden"
    );

    $("developerLoginScreen")?.classList.add(
      "hidden"
    );

    $("adminLoginForm")?.classList.remove(
      "hidden"
    );

    $("adminKey")?.focus();
  }


  function showDeveloperLogin() {
    playClickSound();

    $("loginScreen")?.classList.add(
      "hidden"
    );

    $("adminLoginForm")?.classList.add(
      "hidden"
    );

    $("developerLoginScreen")?.classList.remove(
      "hidden"
    );

    $("developerToken")?.focus();
  }


  function backToAccess() {
    playClickSound();

    $("adminLoginForm")?.classList.add(
      "hidden"
    );

    $("developerLoginScreen")?.classList.add(
      "hidden"
    );

    $("loginScreen")?.classList.remove(
      "hidden"
    );

    clearLoginMessages();
  }


  function clearLoginMessages() {
    if ($("loginMessage")) {
      $("loginMessage").textContent =
        "";
    }

    if (
      $("developerLoginMessage")
    ) {
      $("developerLoginMessage")
        .textContent = "";
    }
  }


  function setLoginMessage(
    message,
    success = false
  ) {
    const element =
      $("loginMessage");

    if (!element) return;

    element.textContent =
      message;

    element.classList.toggle(
      "success",
      success
    );

    element.classList.toggle(
      "error",
      !success
    );
  }


  function setDeveloperLoginMessage(
    message,
    success = false
  ) {
    const element =
      $("developerLoginMessage");

    if (!element) return;

    element.textContent =
      message;

    element.classList.toggle(
      "success",
      success
    );

    element.classList.toggle(
      "error",
      !success
    );
  }


  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  async function loginAdmin() {
    const input =
      $("adminKey");

    const key =
      input?.value.trim();

    if (!key) {
      setLoginMessage(
        "Please enter your Admin Key."
      );

      input?.focus();

      return;
    }

    const button =
      $("loginButton");

    if (button) {
      button.disabled = true;
    }

    setLoginMessage(
      "Checking Admin Key...",
      true
    );

    try {
      const result =
        await api(
          "/api/admin/login",
          {
            method: "POST",
            body: JSON.stringify({
              admin_key: key
            })
          }
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            "Login failed"
        );
      }

      state.developer = false;
      state.admin =
        result.admin || null;

      state.existingSession = true;

      if (input) {
        input.value = "";
      }

      setLoginMessage(
        "Login successful.",
        true
      );

      setTimeout(
        () => {
          openApplication();
        },
        250
      );
    } catch (error) {
      setLoginMessage(
        error?.message ||
          "Invalid Admin Key."
      );
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }


  /* =======================================================
     DEVELOPER LOGIN
  ======================================================= */

  async function loginDeveloper() {
    const input =
      $("developerToken");

    const token =
      input?.value.trim();

    if (!token) {
      setDeveloperLoginMessage(
        "Please enter the Developer Token."
      );

      input?.focus();

      return;
    }

    const button =
      $("developerEnterButton");

    if (button) {
      button.disabled = true;
    }

    setDeveloperLoginMessage(
      "Checking Developer Token...",
      true
    );

    try {
      const result =
        await api(
          "/api/developer/login",
          {
            method: "POST",
            headers: {
              "X-Developer-Token":
                token
            }
          }
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            "Developer login failed"
        );
      }

      state.developer = true;
      state.admin = null;
      state.existingSession = true;

      if (input) {
        input.value = "";
      }

      setDeveloperLoginMessage(
        "Developer access granted.",
        true
      );

      setTimeout(
        () => {
          openApplication();
        },
        250
      );
    } catch (error) {
      setDeveloperLoginMessage(
        error?.message ||
          "Developer access denied."
      );
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }


  /* =======================================================
     APPLICATION
  ======================================================= */

  function openApplication() {
    $("splash")?.classList.add(
      "hidden"
    );

    $("loginScreen")?.classList.add(
      "hidden"
    );

    $("adminLoginForm")?.classList.add(
      "hidden"
    );

    $("developerLoginScreen")?.classList.add(
      "hidden"
    );

    $("appScreen")?.classList.remove(
      "hidden"
    );

    updateRoleUI();

    switchPage(
      state.developer
        ? "homePage"
        : "homePage"
    );

    loadApplicationData();
  }


  function updateRoleUI() {
    const role =
      $("topRole");

    const profileRole =
      $("profileRole");

    const homeDescription =
      $("homeDescription");

    if (state.developer) {
      if (role) {
        role.textContent =
          "DEVELOPER CONTROL";
      }

      if (profileRole) {
        profileRole.textContent =
          "AUTHORIZED DEVELOPER";
      }

      if (homeDescription) {
        homeDescription.textContent =
          "Developer control center";
      }
    } else {
      if (role) {
        role.textContent =
          "RESELLER CONTROL";
      }

      if (profileRole) {
        profileRole.textContent =
          "AUTHORIZED ADMIN";
      }

      if (homeDescription) {
        homeDescription.textContent =
          "Admin control center";
      }
    }

    const name =
      state.developer
        ? "ROKHAN SYED"
        : (
            state.admin?.name ||
            "ROKHAN SYED"
          );

    qsa(
      ".admin-name, .profile-name"
    ).forEach(element => {
      element.textContent =
        name;
    });

    const avatar =
      $("profileAvatar");

    if (
      avatar &&
      !state.logoData
    ) {
      avatar.textContent =
        initials(name);
    }

    const profileButton =
      $("profileButton");

    if (
      profileButton &&
      !state.logoData
    ) {
      profileButton.textContent =
        initials(name);
    }
  }


  /* =======================================================
     LOAD ALL
  ======================================================= */

  async function loadApplicationData() {
    await loadBranding();

    if (state.developer) {
      await Promise.allSettled([
        loadDeveloperKeys(),
        loadDeveloperServices(),
        loadDeveloperAdmins(),
        loadDeveloperActivity()
      ]);

      await loadDeveloperUsers();

      refreshDeveloperStats();
    } else {
      await Promise.allSettled([
        loadAdminDashboard(),
        loadAdminKeys(),
        loadAdminUsers(),
        loadAdminServices(),
        loadAdminActivity()
      ]);
    }

    renderCurrentPage();
  }


  /* =======================================================
     BRANDING
  ======================================================= */

  async function loadBranding() {
    try {
      const result =
        await api(
          "/api/admin/branding"
        );

      const branding =
        result?.branding;

      if (!branding) {
        return;
      }

      const logo =
        branding.logo_data;

      if (logo) {
        state.logoData = logo;

        try {
          localStorage.setItem(
            "lawangen_logo",
            logo
          );
        } catch {
          /* Storage quota */
        }

        applyLogoToUI(logo);
      }

      if (
        branding.developer_name
      ) {
        qsa(
          ".login-brand"
        ).forEach(element => {
          element.textContent =
            branding.developer_name;
        });
      }

      if (
        branding.developer_label
      ) {
        qsa(
          ".splash-developer"
        ).forEach(element => {
          element.textContent =
            branding.developer_label;
        });
      }
    } catch (error) {
      console.warn(
        "Branding load failed:",
        error?.message
      );
    }
  }


  /* =======================================================
     DASHBOARD
  ======================================================= */

  async function loadAdminDashboard() {
    try {
      const result =
        await api(
          "/api/admin/dashboard"
        );

      const stats =
        result?.stats || {};

      setText(
        "activeKeys",
        stats.active_keys ?? 0
      );

      setText(
        "totalUsers",
        stats.users ?? 0
      );

      setText(
        "totalServices",
        stats.services ?? 0
      );

      state.activity =
        Array.isArray(
          result?.activity
        )
          ? result.activity
          : [];

      renderActivity();

      return result;
    } catch (error) {
      console.warn(
        "Dashboard load failed:",
        error?.message
      );
    }
  }


  function refreshDeveloperStats() {
    const activeKeys =
      state.keys.filter(
        key =>
          effectiveStatus(key) ===
          "active"
      ).length;

    const users =
      state.users.length;

    const services =
      state.services.filter(
        service =>
          String(
            service.status
          ).toLowerCase() ===
          "active"
      ).length;

    setText(
      "activeKeys",
      activeKeys
    );

    setText(
      "totalUsers",
      users
    );

    setText(
      "totalServices",
      services
    );

    renderActivity();
  }


  function setText(
    id,
    value
  ) {
    const element = $(id);

    if (element) {
      element.textContent =
        String(value ?? 0);
    }
  }


  /* =======================================================
     KEYS
  ======================================================= */

  async function loadAdminKeys() {
    try {
      const result =
        await api(
          "/api/admin/keys"
        );

      state.keys =
        Array.isArray(
          result?.keys
        )
          ? result.keys
          : [];

      renderKeys();

      return result;
    } catch (error) {
      console.warn(
        "Admin keys load failed:",
        error?.message
      );

      state.keys = [];

      renderKeys(
        "Unable to load keys."
      );
    }
  }


  async function loadDeveloperKeys() {
    try {
      const result =
        await api(
          "/api/developer/keys"
        );

      state.keys =
        Array.isArray(
          result?.keys
        )
          ? result.keys
          : [];

      renderKeys();

      return result;
    } catch (error) {
      console.warn(
        "Developer keys load failed:",
        error?.message
      );

      state.keys = [];

      renderKeys(
        "Unable to load keys."
      );
    }
  }


  function renderKeys(
    errorMessage = ""
  ) {
    const container =
      $("keyList");

    if (!container) return;

    if (errorMessage) {
      container.innerHTML = `
        <div class="empty-state glass">
          <div class="empty-icon">⚠</div>
          <strong>${escapeHTML(
            errorMessage
          )}</strong>
        </div>
      `;

      return;
    }

    const search =
      (
        $("keySearch")?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const filtered =
      state.keys.filter(key => {
        if (!search) {
          return true;
        }

        return [
          key.api_key,
          key.service,
          key.status,
          key.admin_name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      });

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state glass">
          <div class="empty-icon">🔑</div>
          <strong>No keys found</strong>
          <small>Create a new user access key to see it here.</small>
        </div>
      `;

      return;
    }

    container.innerHTML =
      filtered
        .map(key => {
          const status =
            effectiveStatus(key);

          const canActivate =
            status === "revoked";

          const canRevoke =
            status === "active";

          return `
            <div class="key-card glass"
                 data-key-id="${Number(
                   key.id
                 )}">

              <div class="key-card-top">

                <div class="key-service-icon">
                  ${getServiceIcon(
                    key.service
                  )}
                </div>

                <div class="key-main">

                  <strong>
                    ${escapeHTML(
                      key.service ||
                        "General"
                    )}
                  </strong>

                  <span class="key-value">
                    ${escapeHTML(
                      key.api_key ||
                        "—"
                    )}
                  </span>

                  ${
                    state.developer &&
                    key.admin_name
                      ? `
                        <small>
                          Admin:
                          ${escapeHTML(
                            key.admin_name
                          )}
                        </small>
                      `
                      : ""
                  }

                </div>

                <span class="status-badge ${escapeHTML(
                  status
                )}">
                  ${statusLabel(
                    status
                  )}
                </span>

              </div>

              <div class="key-meta">

                <div>
                  <small>CREATED</small>
                  <span>
                    ${formatDate(
                      key.created_at
                    )}
                  </span>
                </div>

                <div>
                  <small>EXPIRES</small>
                  <span>
                    ${formatDate(
                      key.expires_at
                    )}
                  </span>
                </div>

              </div>

              <div class="key-actions">

                <button
                  type="button"
                  class="small-button copy-key-action"
                  data-key="${escapeHTML(
                    key.api_key || ""
                  )}"
                >
                  COPY KEY
                </button>

                ${
                  canRevoke
                    ? `
                      <button
                        type="button"
                        class="danger-button key-status-action"
                        data-action="revoke"
                        data-id="${Number(
                          key.id
                        )}"
                      >
                        REVOKE
                      </button>
                    `
                    : ""
                }

                ${
                  canActivate
                    ? `
                      <button
                        type="button"
                        class="small-button key-status-action"
                        data-action="activate"
                        data-id="${Number(
                          key.id
                        )}"
                      >
                        ACTIVATE
                      </button>
                    `
                    : ""
                }

              </div>

            </div>
          `;
        })
        .join("");
  }


  /* =======================================================
     KEY SEARCH
  ======================================================= */

  function filterKeys() {
    renderKeys();
  }


  /* =======================================================
     KEY MODAL
  ======================================================= */

  async function openKeyModal() {
    playClickSound();

    const modal =
      $("keyModal");

    if (!modal) return;

    modal.classList.remove(
      "hidden"
    );

    const select =
      $("gameSelect");

    if (select) {
      select.disabled = true;

      select.innerHTML = `
        <option value="">
          Loading games...
        </option>
      `;
    }

    await loadServicesForKeyModal();

    const expiry =
      $("expirySelect");

    if (expiry) {
      expiry.value = "30";
    }

    updateCreateKeyButton();
  }


  function closeKeyModal() {
    $("keyModal")?.classList.add(
      "hidden"
    );
  }


  async function loadServicesForKeyModal() {
    try {
      let services =
        state.services;

      if (!services.length) {
        if (state.developer) {
          await loadDeveloperServices();
        } else {
          await loadAdminServices();
        }

        services =
          state.services;
      }

      const activeServices =
        services.filter(
          service =>
            String(
              service.status
            ).toLowerCase() ===
            "active"
        );

      const select =
        $("gameSelect");

      if (!select) {
        return;
      }

      select.innerHTML = "";

      if (!activeServices.length) {
        select.innerHTML = `
          <option value="">
            No games available
          </option>
        `;

        select.disabled = true;

        updateCreateKeyButton();

        return;
      }

      activeServices.forEach(
        service => {
          const option =
            document.createElement(
              "option"
            );

          option.value =
            service.name;

          option.textContent =
            service.name;

          select.appendChild(
            option
          );
        }
      );

      select.disabled = false;

      /*
        Automatically select the first
        available game.
      */
      if (
        !select.value &&
        activeServices[0]
      ) {
        select.value =
          activeServices[0].name;
      }

      updateCreateKeyButton();

    } catch (error) {
      console.error(
        "Game selection load failed:",
        error
      );

      const select =
        $("gameSelect");

      if (select) {
        select.disabled = true;

        select.innerHTML = `
          <option value="">
            Failed to load games
          </option>
        `;
      }

      updateCreateKeyButton();
    }
  }


  function updateCreateKeyButton() {
    const button =
      $("createKeyButton");

    const game =
      $("gameSelect")?.value;

    if (!button) return;

    button.disabled =
      !game;
  }


  /* =======================================================
     CREATE USER KEY
  ======================================================= */

  async function createKey() {
    const game =
      $("gameSelect")?.value.trim();

    const days =
      Number(
        $("expirySelect")?.value ||
          30
      );

    if (!game) {
      showToast(
        "Please select a game first.",
        "error"
      );

      await loadServicesForKeyModal();

      return;
    }

    if (
      !Number.isFinite(days) ||
      days <= 0
    ) {
      showToast(
        "Please select a valid expiry.",
        "error"
      );

      return;
    }

    const button =
      $("createKeyButton");

    if (button) {
      button.disabled = true;

      button.innerHTML =
        `
          <span>CREATING KEY...</span>
        `;
    }

    try {
      const endpoint =
        state.developer
          ? "/api/developer/keys"
          : "/api/admin/keys";

      const result =
        await api(
          endpoint,
          {
            method: "POST",
            body: JSON.stringify({
              service: game,
              days
            })
          }
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            "Key creation failed"
        );
      }

      const generatedKey =
        result?.key?.api_key ||
        result?.api_key ||
        "";

      closeKeyModal();

      showGeneratedKey(
        generatedKey,
        game
      );

      if (state.developer) {
        await loadDeveloperKeys();
      } else {
        await loadAdminKeys();
      }

      if (state.developer) {
        refreshDeveloperStats();
      }

      switchPage(
        "keysPage"
      );

      showToast(
        "New key created successfully.",
        "success"
      );

      playClickSound(
        "success"
      );

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to create key.",
        "error"
      );
    } finally {
      if (button) {
        button.disabled =
          !Boolean(
            $("gameSelect")?.value
          );

        button.innerHTML =
          `
            CREATE KEY <b>→</b>
          `;
      }
    }
  }


  /* =======================================================
     GENERATED KEY POPUP
  ======================================================= */

  function showGeneratedKey(
    key,
    game
  ) {
    if (!key) {
      return;
    }

    const existing =
      $("generatedKeyOverlay");

    existing?.remove();

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "generatedKeyOverlay";

    overlay.className =
      "generated-key-overlay";

    overlay.innerHTML = `
      <div class="generated-key-card glass">

        <button
          type="button"
          class="generated-key-close"
          id="generatedKeyClose"
        >
          ×
        </button>

        <div class="generated-key-icon">
          🔑
        </div>

        <div class="small-label">
          KEY CREATED
        </div>

        <h2>
          ${escapeHTML(
            game || "General"
          )}
        </h2>

        <p>
          Your new user access key
        </p>

        <div class="generated-key-value">
          <span id="generatedKeyText">
            ${escapeHTML(key)}
          </span>
        </div>

        <div class="generated-key-actions">

          <button
            type="button"
            class="small-button"
            id="generatedKeyCopy"
          >
            COPY KEY
          </button>

          <button
            type="button"
            class="primary-button"
            id="generatedKeyDone"
          >
            DONE
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    $("generatedKeyClose")
      ?.addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );

    $("generatedKeyDone")
      ?.addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );

    $("generatedKeyCopy")
      ?.addEventListener(
        "click",
        async () => {
          await copyText(
            key
          );

          showToast(
            "Key copied.",
            "success"
          );
        }
      );

    setTimeout(
      () => {
        overlay.classList.add(
          "show"
        );
      },
      10
    );
  }


  /* =======================================================
     KEY ACTIONS
  ======================================================= */

  async function handleKeyAction(
    action,
    id
  ) {
    const keyId =
      Number(id);

    if (!keyId) {
      return;
    }

    const endpoint =
      state.developer
        ? `/api/developer/keys/${keyId}/${action}`
        : `/api/admin/keys/${keyId}/${action}`;

    try {
      await api(
        endpoint,
        {
          method: "POST"
        }
      );

      showToast(
        action === "revoke"
          ? "Key revoked."
          : "Key activated.",
        "success"
      );

      if (state.developer) {
        await loadDeveloperKeys();
      } else {
        await loadAdminKeys();
      }

      if (state.developer) {
        refreshDeveloperStats();
      }
    } catch (error) {
      showToast(
        error?.message ||
          "Unable to update key.",
        "error"
      );
    }
  }


  /* =======================================================
     USERS
  ======================================================= */

  async function loadAdminUsers() {
    try {
      const result =
        await api(
          "/api/admin/users"
        );

      state.users =
        Array.isArray(
          result?.users
        )
          ? result.users
          : [];

      renderUsers();

      return result;
    } catch (error) {
      console.warn(
        "Admin users load failed:",
        error?.message
      );

      state.users = [];

      renderUsers();
    }
  }


  async function loadDeveloperUsers() {
    /*
      Current src/index.js does not expose
      /api/developer/users.

      Developer user count is therefore
      calculated from the available key data
      if possible, while the Users page remains
      safe instead of calling a non-existing route.
    */

    state.users = [];

    renderUsers();

    /*
      If your backend later receives
      /api/developer/users, this function can
      be upgraded without changing the UI.
    */
  }


  function renderUsers() {
    const container =
      $("userList");

    if (!container) return;

    if (
      state.developer &&
      !state.users.length
    ) {
      container.innerHTML = `
        <div class="empty-state glass">
          <div class="empty-icon">👤</div>
          <strong>No user records</strong>
          <small>
            Customer keys can be managed from the Keys section.
          </small>
        </div>
      `;

      updateUserSummary();

      return;
    }

    if (!state.users.length) {
      container.innerHTML = `
        <div class="empty-state glass">
          <div class="empty-icon">👤</div>
          <strong>No users found</strong>
          <small>
            User records will appear here.
          </small>
        </div>
      `;

      updateUserSummary();

      return;
    }

    container.innerHTML =
      state.users
        .map(user => {
          const status =
            effectiveStatus(
              user
            );

          return `
            <div class="user-card glass">

              <div class="user-avatar">
                ${escapeHTML(
                  initials(
                    user.name
                  )
                )}
              </div>

              <div class="user-info">

                <strong>
                  ${escapeHTML(
                    user.name
                  )}
                </strong>

                <small>
                  ${
                    user.service
                      ? escapeHTML(
                          user.service
                        )
                      : "No game assigned"
                  }
                </small>

                <span>
                  ${
                    user.api_key
                      ? escapeHTML(
                          user.api_key
                        )
                      : "No key"
                  }
                </span>

              </div>

              <div class="user-status">

                <span class="status-badge ${escapeHTML(
                  status
                )}">
                  ${statusLabel(
                    status
                  )}
                </span>

                <small>
                  ${formatDate(
                    user.created_at
                  )}
                </small>

              </div>

            </div>
          `;
        })
        .join("");

    updateUserSummary();
  }


  function updateUserSummary() {
    const total =
      state.users.length;

    const active =
      state.users.filter(
        user =>
          effectiveStatus(
            user
          ) === "active"
      ).length;

    const expired =
      state.users.filter(
        user =>
          effectiveStatus(
            user
          ) === "expired"
      ).length;

    setText(
      "userCount",
      total
    );

    setText(
      "activeUserCount",
      active
    );

    setText(
      "expiredUserCount",
      expired
    );
  }


  /* =======================================================
     SERVICES / GAMES
  ======================================================= */

  async function loadAdminServices() {
    try {
      const result =
        await api(
          "/api/admin/services"
        );

      state.services =
        Array.isArray(
          result?.services
        )
          ? result.services
          : [];

      renderGames();

      return result;
    } catch (error) {
      console.warn(
        "Admin services load failed:",
        error?.message
      );

      state.services = [];

      renderGames();
    }
  }


  async function loadDeveloperServices() {
    try {
      const result =
        await api(
          "/api/developer/services"
        );

      state.services =
        Array.isArray(
          result?.services
        )
          ? result.services
          : [];

      renderGames();

      return result;
    } catch (error) {
      console.warn(
        "Developer services load failed:",
        error?.message
      );

      state.services = [];

      renderGames();
    }
  }


  function renderGames() {
    const container =
      $("gameList");

    if (!container) return;

    if (!state.services.length) {
      container.innerHTML = `
        <div class="empty-state glass">
          <div class="empty-icon">🎮</div>
          <strong>No games available</strong>
          <small>
            ${
              state.developer
                ? "Add a game from Developer Control."
                : "Games are managed by the Developer."
            }
          </small>
        </div>
      `;

      renderDeveloperGameManager();

      return;
    }

    container.innerHTML =
      state.services
        .map(service => {
          const active =
            String(
              service.status
            ).toLowerCase() ===
            "active";

          const logo =
            service.logo_data;

          return `
            <div
              class="game-card glass"
              data-game-id="${Number(
                service.id
              )}"
            >

              <div class="game-logo">
                ${
                  logo
                    ? `
                      <img
                        src="${escapeHTML(
                          logo
                        )}"
                        alt=""
                      >
                    `
                    : `
                      <span>
                        ${getServiceIcon(
                          service.name
                        )}
                      </span>
                    `
                }
              </div>

              <div class="game-info">

                <strong>
                  ${escapeHTML(
                    service.name
                  )}
                </strong>

                <small>
                  ${
                    active
                      ? "Service available"
                      : "Service inactive"
                  }
                </small>

              </div>

              <span class="status-badge ${
                active
                  ? "active"
                  : "inactive"
              }">
                ${
                  active
                    ? "ACTIVE"
                    : "INACTIVE"
                }
              </span>

            </div>
          `;
        })
        .join("");

    renderDeveloperGameManager();
  }


  /* =======================================================
     SERVICE ICON
  ======================================================= */

  function getServiceIcon(
    service
  ) {
    const name =
      String(
        service || ""
      ).toLowerCase();

    if (
      name.includes(
        "free fire"
      )
    ) {
      return "🔥";
    }

    if (
      name.includes(
        "pubg"
      )
    ) {
      return "🎯";
    }

    if (
      name.includes(
        "call of duty"
      )
    ) {
      return "⚔️";
    }

    if (
      name.includes(
        "8 ball"
      )
    ) {
      return "🎱";
    }

    if (
      name.includes(
        "mobile legends"
      )
    ) {
      return "⚡";
    }

    if (
      name.includes(
        "minecraft"
      )
    ) {
      return "⛏️";
    }

    if (
      name.includes(
        "roblox"
      )
    ) {
      return "🧱";
    }

    if (
      name.includes(
        "fortnite"
      )
    ) {
      return "🛡️";
    }

    if (
      name.includes(
        "valorant"
      )
    ) {
      return "🎯";
    }

    return "🎮";
  }


  /* =======================================================
     DEVELOPER GAME MANAGER
  ======================================================= */

  function renderDeveloperGameManager() {
    const existing =
      $("developerGameManager");

    if (existing) {
      existing.remove();
    }

    if (!state.developer) {
      return;
    }

    const gamesPage =
      $("gamesPage");

    if (!gamesPage) return;

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.id =
      "developerGameManager";

    wrapper.className =
      "developer-game-manager";

    wrapper.innerHTML = `
      <div class="settings-title">
        DEVELOPER GAME CONTROL
      </div>

      <div class="developer-game-create-card glass">

        <div class="developer-game-create-icon">
          🎮
        </div>

        <div class="developer-game-create-content">
          <strong>
            Add New Game
          </strong>

          <small>
            Developer only
          </small>
        </div>

        <button
          type="button"
          class="small-button"
          id="addGameButton"
        >
          ADD GAME
        </button>

      </div>
    `;

    gamesPage.appendChild(
      wrapper
    );

    $("addGameButton")
      ?.addEventListener(
        "click",
        openAddGameDialog
      );
  }


  function openAddGameDialog() {
    const overlay =
      createSimpleDialog(
        "Add New Game",
        `
          <label>
            GAME NAME
          </label>

          <input
            id="newGameName"
            class="dialog-input"
            type="text"
            placeholder="Enter game name"
            autocomplete="off"
          >

          <label>
            LOGO
          </label>

          <input
            id="newGameLogo"
            class="dialog-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
          >

          <small class="dialog-help">
            Maximum image size: 4 MB
          </small>

          <button
            id="saveNewGame"
            class="primary-button"
            type="button"
          >
            CREATE GAME <b>→</b>
          </button>
        `
      );

    $("saveNewGame")
      ?.addEventListener(
        "click",
        async () => {
          await createGame(
            overlay
          );
        }
      );
  }


  async function createGame(
    overlay
  ) {
    const name =
      $("newGameName")
        ?.value.trim();

    const file =
      $("newGameLogo")
        ?.files?.[0] ||
      null;

    if (!name) {
      showToast(
        "Game name is required.",
        "error"
      );

      return;
    }

    let logoData = null;

    if (file) {
      if (
        file.size >
        4 * 1024 * 1024
      ) {
        showToast(
          "Game logo must be 4 MB or smaller.",
          "error"
        );

        return;
      }

      logoData =
        await fileToDataURL(
          file
        );
    }

    const button =
      $("saveNewGame");

    if (button) {
      button.disabled = true;
    }

    try {
      await api(
        "/api/developer/services",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            status: "active",
            logo_data:
              logoData
          })
        }
      );

      overlay?.remove();

      showToast(
        "Game created successfully.",
        "success"
      );

      await loadDeveloperServices();

      await loadServicesForKeyModal();

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to create game.",
        "error"
      );
    } finally {
      if (button) {
        button.disabled =
          false;
      }
    }
  }


  /* =======================================================
     DEVELOPER ADMINS
  ======================================================= */

  async function loadDeveloperAdmins() {
    if (!state.developer) {
      return;
    }

    try {
      const result =
        await api(
          "/api/developer/admins"
        );

      state.admins =
        Array.isArray(
          result?.admins
        )
          ? result.admins
          : [];

      renderDeveloperAdminManager();

      return result;
    } catch (error) {
      console.warn(
        "Developer admins load failed:",
        error?.message
      );

      state.admins = [];

      renderDeveloperAdminManager();
    }
  }


  function renderDeveloperAdminManager() {
    const tools =
      $("developerTools");

    if (!tools) return;

    if (!state.developer) {
      return;
    }

    let manager =
      $("developerAdminManager");

    if (!manager) {
      manager =
        document.createElement(
          "div"
        );

      manager.id =
        "developerAdminManager";

      manager.className =
        "settings-group";

      tools.appendChild(
        manager
      );
    }

    manager.innerHTML = `
      <div class="settings-title">
        ADMIN ACCESS CONTROL
      </div>

      <div class="developer-admin-list">

        ${
          state.admins.length
            ? state.admins
                .map(admin => {
                  const status =
                    isExpired(
                      admin.expires_at
                    )
                      ? "expired"
                      : String(
                          admin.status ||
                            "unknown"
                        ).toLowerCase();

                  return `
                    <div
                      class="developer-admin-card glass"
                    >

                      <div class="developer-admin-avatar">
                        ${escapeHTML(
                          initials(
                            admin.name
                          )
                        )}
                      </div>

                      <div class="developer-admin-info">

                        <strong>
                          ${escapeHTML(
                            admin.name
                          )}
                        </strong>

                        <small>
                          Expires:
                          ${formatDate(
                            admin.expires_at
                          )}
                        </small>

                      </div>

                      <div class="developer-admin-actions">

                        <span class="status-badge ${escapeHTML(
                          status
                        )}">
                          ${statusLabel(
                            status
                          )}
                        </span>

                        ${
                          status ===
                          "active"
                            ? `
                              <button
                                type="button"
                                class="danger-button admin-access-action"
                                data-action="revoke"
                                data-id="${Number(
                                  admin.id
                                )}"
                              >
                                REVOKE
                              </button>
                            `
                            : status ===
                              "revoked"
                            ? `
                              <button
                                type="button"
                                class="small-button admin-access-action"
                                data-action="activate"
                                data-id="${Number(
                                  admin.id
                                )}"
                              >
                                ACTIVATE
                              </button>
                            `
                            : ""
                        }

                      </div>

                    </div>
                  `;
                })
                .join("")
            : `
              <div class="empty-state glass">
                <div class="empty-icon">
                  🔐
                </div>
                <strong>
                  No Admin Keys
                </strong>
                <small>
                  Create an Admin Key above.
                </small>
              </div>
            `
        }

      </div>
    `;
  }


  async function createAdminKey() {
    const button =
      $("createAdminKeyButton");

    if (button) {
      button.disabled = true;
      button.textContent =
        "CREATING...";
    }

    try {
      const result =
        await api(
          "/api/developer/create-admin",
          {
            method: "POST",
            body: JSON.stringify({
              name: "ROKHAN SYED",
              days: 30
            })
          }
        );

      const key =
        result?.admin_key ||
        "";

      if (!key) {
        throw new Error(
          "Admin Key was created but no key was returned."
        );
      }

      setText(
        "newAdminKey",
        key
      );

      $("newAdminKeyBox")
        ?.classList.remove(
          "hidden"
        );

      showGeneratedAdminKey(
        key
      );

      await loadDeveloperAdmins();

      showToast(
        "Admin Key created successfully.",
        "success"
      );

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to create Admin Key.",
        "error"
      );
    } finally {
      if (button) {
        button.disabled =
          false;

        button.textContent =
          "CREATE";
      }
    }
  }


  function showGeneratedAdminKey(
    key
  ) {
    const existing =
      $("generatedAdminKeyOverlay");

    existing?.remove();

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "generatedAdminKeyOverlay";

    overlay.className =
      "generated-key-overlay";

    overlay.innerHTML = `
      <div class="generated-key-card glass">

        <button
          type="button"
          class="generated-key-close"
          id="generatedAdminKeyClose"
        >
          ×
        </button>

        <div class="generated-key-icon">
          🔐
        </div>

        <div class="small-label">
          ADMIN KEY CREATED
        </div>

        <h2>
          Admin Access
        </h2>

        <p>
          Save this key securely.
        </p>

        <div class="generated-key-value">
          ${escapeHTML(key)}
        </div>

        <div class="generated-key-actions">

          <button
            type="button"
            class="small-button"
            id="generatedAdminKeyCopy"
          >
            COPY KEY
          </button>

          <button
            type="button"
            class="primary-button"
            id="generatedAdminKeyDone"
          >
            DONE
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    $("generatedAdminKeyClose")
      ?.addEventListener(
        "click",
        () => overlay.remove()
      );

    $("generatedAdminKeyDone")
      ?.addEventListener(
        "click",
        () => overlay.remove()
      );

    $("generatedAdminKeyCopy")
      ?.addEventListener(
        "click",
        async () => {
          await copyText(key);

          showToast(
            "Admin Key copied.",
            "success"
          );
        }
      );
  }


  async function handleAdminAccessAction(
    action,
    id
  ) {
    const adminId =
      Number(id);

    if (!adminId) return;

    try {
      await api(
        `/api/developer/admins/${adminId}/${action}`,
        {
          method: "POST"
        }
      );

      showToast(
        action === "revoke"
          ? "Admin access revoked."
          : "Admin access activated.",
        "success"
      );

      await loadDeveloperAdmins();

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to update Admin access.",
        "error"
      );
    }
  }


  /* =======================================================
     ACTIVITY
  ======================================================= */

  async function loadAdminActivity() {
    try {
      const result =
        await api(
          "/api/admin/activity"
        );

      state.activity =
        Array.isArray(
          result?.activity
        )
          ? result.activity
          : [];

      renderActivity();

      return result;
    } catch (error) {
      console.warn(
        "Admin activity load failed:",
        error?.message
      );

      state.activity = [];

      renderActivity();
    }
  }


  async function loadDeveloperActivity() {
    /*
      The current src/index.js does not expose
      /api/developer/activity.

      Developer activity is therefore populated
      from actions performed during this session
      when possible.
    */

    state.activity = [];

    renderActivity();
  }


  function renderActivity() {
    const container =
      $("activityList");

    if (!container) return;

    if (!state.activity.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            ◷
          </div>
          <strong>
            No recent activity
          </strong>
          <small>
            Recent actions will appear here.
          </small>
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.activity
        .map(item => {
          return `
            <div class="activity-item">

              <div class="activity-icon">
                ${activityIcon(
                  item.action
                )}
              </div>

              <div class="activity-content">

                <strong>
                  ${escapeHTML(
                    activityTitle(
                      item.action
                    )
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.details ||
                      ""
                  )}
                </small>

                <span>
                  ${formatDateTime(
                    item.created_at
                  )}
                </span>

              </div>

            </div>
          `;
        })
        .join("");
  }


  function activityIcon(
    action
  ) {
    const value =
      String(
        action || ""
      ).toUpperCase();

    if (
      value.includes(
        "LOGIN"
      )
    ) {
      return "🔐";
    }

    if (
      value.includes(
        "LOGOUT"
      )
    ) {
      return "↪";
    }

    if (
      value.includes(
        "KEY"
      )
    ) {
      return "🔑";
    }

    if (
      value.includes(
        "USER"
      )
    ) {
      return "👤";
    }

    return "⚡";
  }


  function activityTitle(
    action
  ) {
    return String(
      action ||
        "Activity"
    )
      .replaceAll(
        "_",
        " "
      );
  }


  /* =======================================================
     PAGE NAVIGATION
  ======================================================= */

  function switchPage(
    pageId
  ) {
    const pages =
      qsa(".page");

    pages.forEach(page => {
      page.classList.toggle(
        "active",
        page.id === pageId
      );
    });

    const navItems =
      qsa(".nav-item");

    navItems.forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.page ===
          pageId
      );
    });

    state.currentPage =
      pageId;

    renderCurrentPage();
  }


  function renderCurrentPage() {
    switch (
      state.currentPage
    ) {
      case "homePage":
        renderActivity();
        break;

      case "keysPage":
        renderKeys();
        break;

      case "usersPage":
        renderUsers();
        break;

      case "gamesPage":
        renderGames();
        break;

      case "settingsPage":
        updateRoleUI();

        if (state.developer) {
          renderDeveloperAdminManager();
        }

        break;
    }
  }


  /* =======================================================
     PROFILE BUTTON
  ======================================================= */

  function openProfile() {
    switchPage(
      "settingsPage"
    );
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    const endpoint =
      state.developer
        ? "/api/developer/logout"
        : "/api/admin/logout";

    try {
      await api(
        endpoint,
        {
          method: "POST"
        }
      );
    } catch {
      /* Local logout continues */
    }

    state.developer = false;
    state.admin = null;
    state.keys = [];
    state.users = [];
    state.services = [];
    state.activity = [];
    state.admins = [];
    state.existingSession = false;

    $("appScreen")?.classList.add(
      "hidden"
    );

    showAccessScreen();

    showToast(
      "Logged out successfully.",
      "success"
    );
  }


  /* =======================================================
     LOGO UPLOAD
  ======================================================= */

  async function selectLogo() {
    if (!state.developer) {
      showToast(
        "Developer access required.",
        "error"
      );

      return;
    }

    $("logoFileInput")?.click();
  }


  async function handleLogoFile(
    event
  ) {
    if (!state.developer) {
      return;
    }

    const file =
      event.target?.files?.[0];

    if (!file) return;

    if (
      file.size >
      4 * 1024 * 1024
    ) {
      showToast(
        "Logo must be 4 MB or smaller.",
        "error"
      );

      event.target.value =
        "";

      return;
    }

    try {
      const data =
        await fileToDataURL(
          file
        );

      await api(
        "/api/admin/branding",
        {
          method: "PUT",
          body: JSON.stringify({
            developer_label:
              "DEVELOPER",
            developer_name:
              "LAWANGEN",
            admin_name:
              "ROKHAN SYED",
            logo_data:
              data
          })
        }
      );

      state.logoData =
        data;

      try {
        localStorage.setItem(
          "lawangen_logo",
          data
        );
      } catch {
        /* Storage quota */
      }

      applyLogoToUI(
        data
      );

      showToast(
        "Application logo updated.",
        "success"
      );

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to upload logo.",
        "error"
      );
    }

    event.target.value =
      "";
  }


  async function removeLogo() {
    if (!state.developer) {
      showToast(
        "Developer access required.",
        "error"
      );

      return;
    }

    try {
      await api(
        "/api/admin/branding",
        {
          method: "PUT",
          body: JSON.stringify({
            developer_label:
              "DEVELOPER",
            developer_name:
              "LAWANGEN",
            admin_name:
              "ROKHAN SYED",
            logo_data: ""
          })
        }
      );

      state.logoData =
        "";

      try {
        localStorage.removeItem(
          "lawangen_logo"
        );
      } catch {}

      location.reload();

    } catch (error) {
      showToast(
        error?.message ||
          "Unable to remove logo.",
        "error"
      );
    }
  }


  /* =======================================================
     SETTINGS
  ======================================================= */

  function updateSettingsUI() {
    const sound =
      $("soundToggle");

    if (sound) {
      sound.checked =
        state.soundEnabled;
    }

    const animations =
      $("animationToggle");

    if (animations) {
      animations.checked =
        state.animationsEnabled;
    }

    const developerTools =
      $("developerTools");

    if (developerTools) {
      developerTools.classList.toggle(
        "hidden",
        !state.developer
      );
    }

    if (state.developer) {
      renderDeveloperAdminManager();
    }
  }


  function toggleSound(
    event
  ) {
    state.soundEnabled =
      Boolean(
        event.target.checked
      );

    localStorage.setItem(
      "lawangen_sound",
      state.soundEnabled
        ? "true"
        : "false"
    );

    if (
      state.soundEnabled
    ) {
      playClickSound(
        "success"
      );
    }
  }


  function toggleAnimations(
    event
  ) {
    state.animationsEnabled =
      Boolean(
        event.target.checked
      );

    localStorage.setItem(
      "lawangen_animations",
      state.animationsEnabled
        ? "true"
        : "false"
    );

    applyAnimationSetting();
  }


  /* =======================================================
     COPY
  ======================================================= */

  async function copyText(
    value
  ) {
    const text =
      String(value || "");

    if (!text) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    } catch {
      try {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        textarea.remove();

        return true;
      } catch {
        return false;
      }
    }
  }


  async function copyAdminKey() {
    const key =
      $("newAdminKey")
        ?.textContent.trim();

    if (!key) {
      showToast(
        "No Admin Key available.",
        "error"
      );

      return;
    }

    const copied =
      await copyText(key);

    showToast(
      copied
        ? "Admin Key copied."
        : "Unable to copy key.",
      copied
        ? "success"
        : "error"
    );
  }


  /* =======================================================
     TOAST
  ======================================================= */

  let toastTimer = null;

  function showToast(
    message,
    type = "info"
  ) {
    let toast =
      $("lawangenToast");

    if (!toast) {
      toast =
        document.createElement(
          "div"
        );

      toast.id =
        "lawangenToast";

      toast.className =
        "lawangen-toast";

      document.body.appendChild(
        toast
      );
    }

    toast.className =
      `lawangen-toast ${type}`;

    toast.textContent =
      message;

    clearTimeout(
      toastTimer
    );

    requestAnimationFrame(
      () => {
        toast.classList.add(
          "show"
        );
      }
    );

    toastTimer =
      setTimeout(
        () => {
          toast.classList.remove(
            "show"
          );
        },
        2800
      );
  }


  /* =======================================================
     SIMPLE DIALOG
  ======================================================= */

  function createSimpleDialog(
    title,
    content
  ) {
    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "generated-key-overlay";

    overlay.innerHTML = `
      <div class="generated-key-card glass">

        <button
          type="button"
          class="generated-key-close dialog-close"
        >
          ×
        </button>

        <div class="small-label">
          DEVELOPER CONTROL
        </div>

        <h2>
          ${escapeHTML(title)}
        </h2>

        <div class="dialog-content">
          ${content}
        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    overlay
      .querySelector(
        ".dialog-close"
      )
      ?.addEventListener(
        "click",
        () => overlay.remove()
      );

    return overlay;
  }


  /* =======================================================
     FILE READER
  ======================================================= */

  function fileToDataURL(
    file
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            String(
              reader.result
            )
          );

        reader.onerror =
          () =>
            reject(
              new Error(
                "Unable to read image."
              )
            );

        reader.readAsDataURL(
          file
        );
      }
    );
  }


  /* =======================================================
     EVENT DELEGATION
  ======================================================= */

  function installDelegatedEvents() {
    document.addEventListener(
      "click",
      async event => {

        const copyButton =
          event.target.closest(
            ".copy-key-action"
          );

        if (copyButton) {
          const key =
            copyButton.dataset.key;

          const copied =
            await copyText(key);

          showToast(
            copied
              ? "Key copied."
              : "Unable to copy key.",
            copied
              ? "success"
              : "error"
          );

          return;
        }


        const keyAction =
          event.target.closest(
            ".key-status-action"
          );

        if (keyAction) {
          await handleKeyAction(
            keyAction.dataset.action,
            keyAction.dataset.id
          );

          return;
        }


        const adminAction =
          event.target.closest(
            ".admin-access-action"
          );

        if (adminAction) {
          await handleAdminAccessAction(
            adminAction.dataset.action,
            adminAction.dataset.id
          );

          return;
        }
      }
    );
  }


  /* =======================================================
     CSS FOR DYNAMIC UI
  ======================================================= */

  function injectDynamicStyles() {
    if (
      $("lawangenDynamicStyles")
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "lawangenDynamicStyles";

    style.textContent = `
      body.no-animations *,
      body.no-animations *::before,
      body.no-animations *::after {
        animation: none !important;
        transition: none !important;
      }

      .generated-key-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 22px;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .generated-key-card {
        width: min(440px, 100%);
        padding: 28px;
        border-radius: 28px;
        position: relative;
        text-align: center;
        box-sizing: border-box;
      }

      .generated-key-close {
        position: absolute;
        top: 14px;
        right: 16px;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.08);
        color: #fff;
        font-size: 26px;
        cursor: pointer;
      }

      .generated-key-icon {
        width: 68px;
        height: 68px;
        margin: 0 auto 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 22px;
        background: rgba(255,255,255,.08);
        font-size: 30px;
      }

      .generated-key-card h2 {
        margin: 7px 0;
      }

      .generated-key-card p {
        opacity: .65;
        margin: 0 0 18px;
      }

      .generated-key-value {
        padding: 16px;
        border-radius: 16px;
        background: rgba(0,0,0,.32);
        border: 1px solid rgba(255,255,255,.08);
        font-family: monospace;
        font-size: 14px;
        word-break: break-all;
        line-height: 1.5;
        margin: 15px 0;
      }

      .generated-key-actions {
        display: flex;
        gap: 10px;
      }

      .generated-key-actions > * {
        flex: 1;
      }

      .lawangen-toast {
        position: fixed;
        left: 50%;
        bottom: 96px;
        z-index: 100000;
        transform: translate(-50%, 20px);
        opacity: 0;
        pointer-events: none;
        padding: 13px 18px;
        border-radius: 16px;
        background: rgba(18,18,22,.94);
        color: #fff;
        border: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 15px 45px rgba(0,0,0,.35);
        font-size: 13px;
        max-width: calc(100vw - 40px);
        text-align: center;
        transition: .25s ease;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
      }

      .lawangen-toast.show {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      .lawangen-toast.success {
        border-color: rgba(90,255,160,.25);
      }

      .lawangen-toast.error {
        border-color: rgba(255,80,100,.3);
      }

      .empty-state {
        padding: 32px 20px;
        text-align: center;
        border-radius: 22px;
      }

      .empty-icon {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .empty-state strong,
      .empty-state small {
        display: block;
      }

      .empty-state small {
        margin-top: 7px;
        opacity: .58;
      }

      .generated-key-overlay .dialog-content {
        text-align: left;
      }

      .dialog-content label {
        display: block;
        margin: 15px 0 7px;
        font-size: 11px;
        letter-spacing: .08em;
        opacity: .65;
      }

      .dialog-input {
        width: 100%;
        box-sizing: border-box;
        padding: 14px 15px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.055);
        color: #fff;
        outline: none;
        font-size: 14px;
      }

      .dialog-file {
        width: 100%;
        box-sizing: border-box;
        color: #fff;
        font-size: 13px;
      }

      .dialog-help {
        display: block;
        margin: 7px 0 17px;
        opacity: .55;
        font-size: 11px;
      }

      .dialog-content .primary-button {
        width: 100%;
      }

      .developer-game-manager {
        margin-top: 22px;
      }

      .developer-game-create-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        border-radius: 20px;
        margin-top: 10px;
      }

      .developer-game-create-icon {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        background: rgba(255,255,255,.07);
        font-size: 21px;
      }

      .developer-game-create-content {
        flex: 1;
        min-width: 0;
      }

      .developer-game-create-content strong,
      .developer-game-create-content small {
        display: block;
      }

      .developer-game-create-content small {
        margin-top: 4px;
        opacity: .55;
      }

      .developer-admin-list {
        display: grid;
        gap: 10px;
      }

      .developer-admin-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border-radius: 20px;
      }

      .developer-admin-avatar {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,.08);
        font-size: 12px;
        font-weight: 700;
      }

      .developer-admin-info {
        flex: 1;
        min-width: 0;
      }

      .developer-admin-info strong,
      .developer-admin-info small {
        display: block;
      }

      .developer-admin-info small {
        margin-top: 4px;
        opacity: .55;
        font-size: 11px;
      }

      .developer-admin-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 7px;
      }

      .developer-admin-actions .small-button,
      .developer-admin-actions .danger-button {
        min-width: 76px;
      }

      @media (max-width: 480px) {
        .developer-admin-card {
          align-items: flex-start;
        }

        .developer-admin-actions {
          margin-left: auto;
        }

        .generated-key-card {
          padding: 23px 18px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }


  /* =======================================================
     DOM EVENTS
  ======================================================= */

  function installEvents() {

    on(
      "adminAccessButton",
      "click",
      showAdminLogin
    );

    on(
      "developerLoginButton",
      "click",
      showDeveloperLogin
    );

    on(
      "backToAccess",
      "click",
      backToAccess
    );

    on(
      "backToAdminLogin",
      "click",
      backToAccess
    );

    on(
      "loginButton",
      "click",
      loginAdmin
    );

    on(
      "developerEnterButton",
      "click",
      loginDeveloper
    );

    on(
      "adminKey",
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          loginAdmin();
        }
      }
    );

    on(
      "developerToken",
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          loginDeveloper();
        }
      }
    );


    /* ---------- Password visibility ---------- */

    on(
      "showKey",
      "click",
      () => {
        const input =
          $("adminKey");

        if (!input) return;

        input.type =
          input.type ===
          "password"
            ? "text"
            : "password";
      }
    );

    on(
      "showDeveloperToken",
      "click",
      () => {
        const input =
          $("developerToken");

        if (!input) return;

        input.type =
          input.type ===
          "password"
            ? "text"
            : "password";
      }
    );


    /* ---------- Navigation ---------- */

    qsa(
      ".nav-item"
    ).forEach(item => {
      item.addEventListener(
        "click",
        () => {
          switchPage(
            item.dataset.page
          );
        }
      );
    });


    on(
      "profileButton",
      "click",
      openProfile
    );


    /* ---------- Generate key ---------- */

    on(
      "generateFromHome",
      "click",
      openKeyModal
    );

    on(
      "generateKeyButton",
      "click",
      openKeyModal
    );

    on(
      "closeModal",
      "click",
      closeKeyModal
    );

    on(
      "createKeyButton",
      "click",
      createKey
    );

    on(
      "gameSelect",
      "change",
      updateCreateKeyButton
    );

    on(
      "expirySelect",
      "change",
      updateCreateKeyButton
    );


    /* ---------- Modal backdrop ---------- */

    const backdrop =
      qs(".modal-backdrop");

    if (backdrop) {
      backdrop.addEventListener(
        "click",
        closeKeyModal
      );
    }


    /* ---------- Search ---------- */

    on(
      "keySearch",
      "input",
      filterKeys
    );


    /* ---------- View all ---------- */

    on(
      "viewKeys",
      "click",
      () => {
        switchPage(
          "keysPage"
        );
      }
    );


    /* ---------- Settings ---------- */

    on(
      "soundToggle",
      "change",
      toggleSound
    );

    on(
      "animationToggle",
      "change",
      toggleAnimations
    );

    on(
      "logoutButton",
      "click",
      logout
    );

    on(
      "createAdminKeyButton",
      "click",
      createAdminKey
    );

    on(
      "copyAdminKeyButton",
      "click",
      copyAdminKey
    );

    on(
      "selectLogoButton",
      "click",
      selectLogo
    );

    on(
      "logoFileInput",
      "change",
      handleLogoFile
    );

    on(
      "removeLogoButton",
      "click",
      removeLogo
    );


    /* ---------- Keyboard ---------- */

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Escape"
        ) {
          $("keyModal")?.classList.add(
            "hidden"
          );
        }
      }
    );
  }


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  async function init() {
    injectDynamicStyles();

    applyAnimationSetting();

    if (state.logoData) {
      applyLogoToUI(
        state.logoData
      );
    }

    updateSettingsUI();

    installEvents();

    installDelegatedEvents();

    installGlobalSound();

    /*
      Keep splash behavior.
    */
    const splash =
      $("splash");

    if (splash) {
      setTimeout(
        () => {
          finishSplash();
        },
        6350
      );
    }

    /*
      Check session while splash is visible.
    */
    await checkExistingSession();

    /*
      If session was discovered after
      the splash timeout, immediately
      continue to the application.
    */
    if (
      state.existingSession &&
      splash?.classList.contains(
        "hidden"
      )
    ) {
      openApplication();
    }
  }


  /* =======================================================
     START
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();