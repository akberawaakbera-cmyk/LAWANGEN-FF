const API_BASE = "";

const state = {
  mode: "admin",
  admin: null,
  developer: false,

  dashboard: null,
  keys: [],
  users: [],
  services: [],
  activity: [],

  branding: {
    developer_label: "DEVELOPER",
    developer_name: "LAWANGEN",
    admin_name: "ROKHAN SYED",
    logo_data: ""
  },

  hasExistingSession: false,
  existingSession: null
};


/* =========================================
   ELEMENT HELPER
========================================= */

const $ = id => document.getElementById(id);


/* =========================================
   ELEMENTS
========================================= */

const splash = $("splash");

const loginScreen = $("loginScreen");
const adminLoginForm = $("adminLoginForm");
const developerLoginScreen = $("developerLoginScreen");

const appScreen = $("appScreen");

const adminAccessButton = $("adminAccessButton");
const developerLoginButton = $("developerLoginButton");
const backToAccess = $("backToAccess");
const backToAdminLogin = $("backToAdminLogin");

const adminKey = $("adminKey");
const loginButton = $("loginButton");
const loginMessage = $("loginMessage");
const showKey = $("showKey");

const developerToken = $("developerToken");
const developerEnterButton = $("developerEnterButton");
const developerLoginMessage = $("developerLoginMessage");
const showDeveloperToken = $("showDeveloperToken");

const keyModal = $("keyModal");
const closeModal = $("closeModal");
const generateKeyButton = $("generateKeyButton");
const generateFromHome = $("generateFromHome");
const createKeyButton = $("createKeyButton");

const logoutButton = $("logoutButton");

const soundToggle = $("soundToggle");
const animationToggle = $("animationToggle");

const keyList = $("keyList");
const userList = $("userList");
const keySearch = $("keySearch");

const activeKeys = $("activeKeys");
const totalUsers = $("totalUsers");
const totalServices = $("totalServices");

const userCount = $("userCount");
const activeUserCount = $("activeUserCount");
const expiredUserCount = $("expiredUserCount");

const gameList = $("gameList");
const activityList = $("activityList");
const gameSelect = $("gameSelect");

const developerTools = $("developerTools");

const selectLogoButton = $("selectLogoButton");
const logoFileInput = $("logoFileInput");
const removeLogoButton = $("removeLogoButton");

const createAdminKeyButton = $("createAdminKeyButton");
const newAdminKeyBox = $("newAdminKeyBox");
const newAdminKey = $("newAdminKey");
const copyAdminKeyButton = $("copyAdminKeyButton");


/* =========================================
   SERVER LIST
========================================= */

const CONTROL_SERVERS = [
  {
    name: "India",
    code: "IN",
    flag: "🇮🇳"
  },
  {
    name: "Bangladesh",
    code: "BD",
    flag: "🇧🇩"
  },
  {
    name: "Pakistan",
    code: "PK",
    flag: "🇵🇰"
  },
  {
    name: "Singapore",
    code: "SG",
    flag: "🇸🇬"
  },
  {
    name: "Indonesia",
    code: "ID",
    flag: "🇮🇩"
  },
  {
    name: "Thailand",
    code: "TH",
    flag: "🇹🇭"
  },
  {
    name: "Vietnam",
    code: "VN",
    flag: "🇻🇳"
  },
  {
    name: "Taiwan",
    code: "TW",
    flag: "🇹🇼"
  },
  {
    name: "Middle East",
    code: "MENA",
    flag: "🌍"
  },
  {
    name: "Europe",
    code: "EU",
    flag: "🇪🇺"
  },
  {
    name: "Russia",
    code: "CIS",
    flag: "🇷🇺"
  },
  {
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷"
  },
  {
    name: "North America",
    code: "NA",
    flag: "🇺🇸"
  },
  {
    name: "South America",
    code: "LATAM",
    flag: "🌎"
  },
  {
    name: "Africa",
    code: "AF",
    flag: "🌍"
  }
];


/* =========================================
   LOCAL LOGO
========================================= */

const savedLogo =
  localStorage.getItem("lawangenLogo");

if (savedLogo) {
  applyLogoToUI(savedLogo);
}


/* =========================================
   SPLASH CONTROL
========================================= */

let splashFinished = false;

function finishSplash() {

  if (splashFinished) {
    return;
  }

  splashFinished = true;

  splash.classList.add("splash-exit");

  setTimeout(async () => {

    splash.classList.add("hidden");

    if (
      state.existingSession === "developer"
    ) {

      await openDeveloperPanel();
      return;

    }

    if (
      state.existingSession === "admin"
    ) {

      await openAdminPanel();
      return;

    }

    showAccessScreen();

  }, 650);

}


/*
  Professional startup screen.
*/

setTimeout(
  finishSplash,
  6200
);


/* =========================================
   SCREEN CONTROL
========================================= */

function hideAllEntryScreens() {

  loginScreen.classList.add("hidden");
  adminLoginForm.classList.add("hidden");
  developerLoginScreen.classList.add("hidden");

}


function showAccessScreen() {

  hideAllEntryScreens();

  appScreen.classList.add("hidden");

  loginScreen.classList.remove("hidden");

}


function showAdminLogin() {

  hideAllEntryScreens();

  appScreen.classList.add("hidden");

  adminLoginForm.classList.remove("hidden");

  setTimeout(() => {
    adminKey?.focus();
  }, 250);

}


function showDeveloperLogin() {

  hideAllEntryScreens();

  appScreen.classList.add("hidden");

  developerLoginScreen.classList.remove("hidden");

  setTimeout(() => {
    developerToken?.focus();
  }, 250);

}


/* =========================================
   SOUND
========================================= */

function playSound(type = "click") {

  if (
    !soundToggle ||
    !soundToggle.checked
  ) {
    return;
  }

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audio =
      new AudioContext();

    const oscillator =
      audio.createOscillator();

    const gain =
      audio.createGain();

    oscillator.connect(gain);
    gain.connect(audio.destination);

    if (type === "success") {
      oscillator.frequency.value = 720;
    } else if (type === "error") {
      oscillator.frequency.value = 180;
    } else {
      oscillator.frequency.value = 430;
    }

    gain.gain.setValueAtTime(
      0.0001,
      audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.045,
      audio.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + 0.10
    );

    oscillator.start();

    oscillator.stop(
      audio.currentTime + 0.11
    );

  } catch {}

}


/* =========================================
   API
========================================= */

async function api(
  path,
  options = {}
) {

  const response =
    await fetch(
      API_BASE + path,
      {
        credentials: "include",
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {

    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );

  }

  return data;

}


/* =========================================
   BRANDING
========================================= */

async function loadPublicBranding() {

  try {

    const result =
      await api(
        "/api/admin/branding"
      );

    if (result.branding) {

      state.branding = {
        ...state.branding,
        ...result.branding
      };

      if (
        state.branding.logo_data
      ) {

        localStorage.setItem(
          "lawangenLogo",
          state.branding.logo_data
        );

        applyLogoToUI(
          state.branding.logo_data
        );

      }

    }

  } catch (error) {

    console.log(
      "Branding:",
      error
    );

  }

}


function applyLogoToUI(logo) {

  if (!logo) {
    return;
  }

  const ids = [
    "splashLogo",
    "loginLogo",
    "adminFormLogo",
    "developerLoginLogo"
  ];

  ids.forEach(id => {

    const element = $(id);

    if (!element) {
      return;
    }

    element.innerHTML = "";

    const img =
      document.createElement("img");

    img.src = logo;
    img.alt = "LAWANGEN Logo";

    element.appendChild(img);

  });

}


/* =========================================
   ACCESS OPTIONS
========================================= */

adminAccessButton.addEventListener(
  "click",
  () => {

    playSound();
    showAdminLogin();

  }
);


developerLoginButton.addEventListener(
  "click",
  () => {

    playSound();
    showDeveloperLogin();

  }
);


backToAccess.addEventListener(
  "click",
  () => {

    playSound();

    adminKey.value = "";
    loginMessage.textContent = "";

    showAccessScreen();

  }
);


backToAdminLogin.addEventListener(
  "click",
  () => {

    playSound();

    developerToken.value = "";
    developerLoginMessage.textContent = "";

    showAccessScreen();

  }
);


/* =========================================
   ADMIN KEY VISIBILITY
========================================= */

showKey.addEventListener(
  "click",
  () => {

    playSound();

    if (
      adminKey.type === "password"
    ) {

      adminKey.type = "text";
      showKey.textContent = "○";

    } else {

      adminKey.type = "password";
      showKey.textContent = "◉";

    }

  }
);


/* =========================================
   ADMIN LOGIN
========================================= */

loginButton.addEventListener(
  "click",
  login
);


adminKey.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      login();
    }

  }
);


async function login() {

  const entered =
    adminKey.value.trim();

  if (!entered) {

    loginMessage.textContent =
      "Please enter your Admin Key.";

    playSound("error");

    return;

  }

  loginButton.disabled = true;

  const buttonText =
    loginButton.querySelector("span");

  if (buttonText) {
    buttonText.textContent = "VERIFYING...";
  }

  try {

    const result =
      await api(
        "/api/admin/login",
        {
          method: "POST",

          body: JSON.stringify({
            admin_key: entered
          })
        }
      );

    if (!result.success) {

      throw new Error(
        result.error ||
        "Login failed."
      );

    }

    state.mode = "admin";
    state.admin = result.admin;
    state.developer = false;

    loginMessage.textContent =
      "✓ Access verified";

    loginMessage.style.color =
      "#35ff9b";

    playSound("success");

    await openAdminPanel();

  } catch (error) {

    loginMessage.textContent =
      error.message ||
      "Invalid or expired Admin Key.";

    loginMessage.style.color = "";

    playSound("error");

  } finally {

    loginButton.disabled = false;

    if (buttonText) {
      buttonText.textContent =
        "ENTER ADMIN PANEL";
    }

  }

}


/* =========================================
   DEVELOPER TOKEN VISIBILITY
========================================= */

showDeveloperToken.addEventListener(
  "click",
  () => {

    playSound();

    if (
      developerToken.type === "password"
    ) {

      developerToken.type = "text";
      showDeveloperToken.textContent = "○";

    } else {

      developerToken.type = "password";
      showDeveloperToken.textContent = "◉";

    }

  }
);


/* =========================================
   DEVELOPER LOGIN
========================================= */

developerEnterButton.addEventListener(
  "click",
  developerLogin
);


developerToken.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      developerLogin();
    }

  }
);


async function developerLogin() {

  const token =
    developerToken.value.trim();

  if (!token) {

    developerLoginMessage.textContent =
      "Developer access denied.";

    playSound("error");

    return;

  }

  developerEnterButton.disabled = true;

  const buttonText =
    developerEnterButton.querySelector(
      "span"
    );

  if (buttonText) {
    buttonText.textContent =
      "VERIFYING...";
  }

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

    if (!result.success) {

      throw new Error(
        result.error ||
        "Developer access denied."
      );

    }

    state.mode = "developer";
    state.developer = true;
    state.admin = null;

    developerLoginMessage.textContent =
      "✓ Developer access verified";

    developerLoginMessage.style.color =
      "#35ff9b";

    playSound("success");

    await openDeveloperPanel();

  } catch (error) {

    developerLoginMessage.textContent =
      "Developer access denied.";

    developerLoginMessage.style.color = "";

    playSound("error");

  } finally {

    developerEnterButton.disabled = false;

    if (buttonText) {
      buttonText.textContent =
        "ENTER DEVELOPER PANEL";
    }

  }

}


/* =========================================
   OPEN ADMIN PANEL
========================================= */

async function openAdminPanel() {

  try {

    const me =
      await api(
        "/api/admin/me"
      );

    if (!me.success) {
      throw new Error("Session expired.");
    }

    state.admin = me.admin;
    state.mode = "admin";
    state.developer = false;

    developerTools.classList.add("hidden");

    $("topRole").textContent =
      "RESELLER CONTROL";

    $("profileRole").textContent =
      "AUTHORIZED ADMIN";

    $("homeDescription").textContent =
      "Admin control center";

    const welcome =
      document.querySelector(".welcome h1");

    if (welcome) {

      welcome.innerHTML =
        "ROKHAN <span>SYED</span>";

    }

    hideAllEntryScreens();

    appScreen.classList.remove("hidden");

    updateAdminIdentity();

    await loadAll();

    switchPage("homePage");

  } catch (error) {

    appScreen.classList.add("hidden");

    showAdminLogin();

    loginMessage.textContent =
      error.message ||
      "Unable to open admin panel.";

  }

}


/* =========================================
   OPEN DEVELOPER PANEL
========================================= */

async function openDeveloperPanel() {

  try {

    const result =
      await api(
        "/api/developer/me"
      );

    if (!result.success) {
      throw new Error(
        "Developer session expired."
      );
    }

    state.mode = "developer";
    state.developer = true;

    developerTools.classList.remove(
      "hidden"
    );

    $("topRole").textContent =
      "DEVELOPER CONTROL";

    $("profileRole").textContent =
      "AUTHORIZED DEVELOPER";

    $("homeDescription").textContent =
      "Developer control center";

    const welcome =
      document.querySelector(".welcome h1");

    if (welcome) {

      welcome.innerHTML =
        "LAWANGEN <span>DEVELOPER</span>";

    }

    hideAllEntryScreens();

    appScreen.classList.remove("hidden");

    await loadPublicBranding();

    await loadServices();

    renderServerControl();

    switchPage("settingsPage");

  } catch (error) {

    appScreen.classList.add("hidden");

    showDeveloperLogin();

    developerLoginMessage.textContent =
      error.message ||
      "Developer session expired.";

  }

}


/* =========================================
   LOAD ALL
========================================= */

async function loadAll() {

  await Promise.allSettled([

    loadDashboard(),
    loadKeys(),
    loadUsers(),
    loadServices(),
    loadActivity(),
    loadPublicBranding()

  ]);

  renderServerControl();

}


/* =========================================
   ADMIN IDENTITY
========================================= */

function updateAdminIdentity() {

  const name =
    state.admin?.name ||
    "ROKHAN SYED";

  const welcome =
    document.querySelector(
      ".welcome h1"
    );

  if (welcome) {

    const parts =
      name.split(" ");

    welcome.innerHTML =
      `${escapeHTML(
        parts[0] || ""
      )}
      <span>
        ${escapeHTML(
          parts.slice(1).join(" ")
        )}
      </span>`;

  }

  const profileName =
    document.querySelector(
      ".profile-name"
    );

  if (profileName) {
    profileName.textContent = name;
  }

  const profileAvatar =
    $("profileAvatar");

  if (profileAvatar) {

    profileAvatar.textContent =
      name
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  }

}


/* =========================================
   DASHBOARD
========================================= */

async function loadDashboard() {

  try {

    const result =
      await api(
        "/api/admin/dashboard"
      );

    if (!result.success) {
      return;
    }

    state.dashboard = result;

    activeKeys.textContent =
      result.stats?.active_keys ?? 0;

    totalUsers.textContent =
      result.stats?.users ?? 0;

    totalServices.textContent =
      result.stats?.services ?? 0;

    renderActivity(
      result.activity || []
    );

  } catch (error) {

    console.error(
      "Dashboard:",
      error
    );

  }

}


/* =========================================
   KEYS
========================================= */

async function loadKeys() {

  try {

    const result =
      await api(
        "/api/admin/keys"
      );

    state.keys =
      result.keys || [];

    renderKeys(
      keySearch.value
    );

  } catch (error) {

    console.error(
      "Keys:",
      error
    );

  }

}


function renderKeys(filter = "") {

  const search =
    filter.toLowerCase().trim();

  const filtered =
    state.keys.filter(item => {

      return (
        String(item.api_key || "")
          .toLowerCase()
          .includes(search)

        ||

        String(item.service || "")
          .toLowerCase()
          .includes(search)
      );

    });

  keyList.innerHTML = "";

  if (!filtered.length) {

    keyList.innerHTML = `
      <div class="key-card glass">
        <div style="
          text-align:center;
          color:#777;
          padding:20px;
        ">
          No keys found
        </div>
      </div>
    `;

    return;

  }

  filtered.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "key-card glass";

    const key =
      item.api_key || "";

    const service =
      item.service || "Service";

    const status =
      String(
        item.status || "active"
      ).toLowerCase();

    const expiry =
      formatExpiry(
        item.expires_at
      );

    card.innerHTML = `

      <div class="key-top">

        <span class="key-value">
          ${escapeHTML(key)}
        </span>

        <span class="badge ${escapeHTML(status)}">
          ${escapeHTML(
            status.toUpperCase()
          )}
        </span>

      </div>

      <div class="key-bottom">

        <span>
          ${escapeHTML(service)}
        </span>

        <span>
          ${escapeHTML(expiry)}
        </span>

      </div>

      <div class="key-actions">

        <button
          class="small-button copy-button"
          data-key="${escapeAttribute(key)}"
          type="button"
        >
          COPY
        </button>

        ${
          status === "active"
          ? `
            <button
              class="small-button revoke"
              data-id="${item.id}"
              type="button"
            >
              REVOKE
            </button>
          `
          : `
            <button
              class="small-button activate"
              data-id="${item.id}"
              type="button"
            >
              ACTIVATE
            </button>
          `
        }

      </div>
    `;

    keyList.appendChild(card);

  });

  attachKeyActions();

}


function attachKeyActions() {

  document
    .querySelectorAll(".copy-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          playSound();

          try {

            await navigator.clipboard.writeText(
              button.dataset.key
            );

            button.textContent =
              "COPIED ✓";

            setTimeout(() => {
              button.textContent = "COPY";
            }, 1000);

          } catch {}

        }
      );

    });


  document
    .querySelectorAll(".revoke")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          playSound();

          revokeKey(
            button.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(".activate")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          playSound();

          activateKey(
            button.dataset.id
          );

        }
      );

    });

}


async function revokeKey(id) {

  if (!id) {
    return;
  }

  try {

    await api(
      `/api/admin/keys/${encodeURIComponent(id)}/revoke`,
      {
        method: "POST"
      }
    );

    playSound("success");

    await loadKeys();
    await loadDashboard();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to revoke key."
    );

  }

}


async function activateKey(id) {

  if (!id) {
    return;
  }

  try {

    await api(
      `/api/admin/keys/${encodeURIComponent(id)}/activate`,
      {
        method: "POST"
      }
    );

    playSound("success");

    await loadKeys();
    await loadDashboard();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to activate key."
    );

  }

}


keySearch.addEventListener(
  "input",
  event => {

    renderKeys(
      event.target.value
    );

  }
);


/* =========================================
   USERS
========================================= */

async function loadUsers() {

  try {

    const result =
      await api(
        "/api/admin/users"
      );

    state.users =
      result.users || [];

    renderUsers();

  } catch (error) {

    console.error(
      "Users:",
      error
    );

  }

}


function renderUsers() {

  userList.innerHTML = "";

  let active = 0;
  let expired = 0;

  state.users.forEach(user => {

    const card =
      document.createElement("div");

    card.className =
      "user-card glass";

    const name =
      user.name ||
      `User ${user.id}`;

    const key =
      user.api_key || "";

    const rawStatus =
      String(
        user.status || "Active"
      );

    const isActive =
      rawStatus.toLowerCase() === "active";

    if (isActive) {
      active++;
    } else {
      expired++;
    }

    const initials =
      name
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    card.innerHTML = `

      <div class="user-avatar">
        ${escapeHTML(initials)}
      </div>

      <div class="user-info">

        <strong>
          ${escapeHTML(name)}
        </strong>

        <small>
          ${escapeHTML(key)}
        </small>

      </div>

      <span class="badge ${
        isActive
          ? "active"
          : "expired"
      }">
        ${escapeHTML(
          rawStatus.toUpperCase()
        )}
      </span>

    `;

    userList.appendChild(card);

  });

  userCount.textContent =
    state.users.length;

  activeUserCount.textContent =
    active;

  expiredUserCount.textContent =
    expired;

}


/* =========================================
   SERVICES
========================================= */

async function loadServices() {

  try {

    /*
      Developer and Admin use different
      service endpoints.
    */

    const endpoint =
      state.mode === "developer"
        ? "/api/developer/services"
        : "/api/admin/services";

    const result =
      await api(endpoint);

    state.services =
      result.services || [];

    renderServices();
    populateGameSelect();

    totalServices.textContent =
      state.services.length;

  } catch (error) {

    console.error(
      "Services:",
      error
    );

    /*
      If Developer API is not yet installed,
      keep the existing UI instead of crashing.
    */

    if (!state.services.length) {
      renderServices();
    }

  }

}


function renderServices() {

  gameList.innerHTML = "";

  /*
    Developer server-control information
    appears above the games list on Home.
  */

  if (!state.services.length) {

    gameList.innerHTML = `
      <div class="game-card glass">
        <div class="game-info">
          <strong>No services</strong>
          <small>No services available</small>
        </div>
      </div>
    `;

    return;

  }


  state.services.forEach(
    (service, index) => {

      const card =
        document.createElement("div");

      card.className =
        "game-card glass";

      const name =
        service.name ||
        `Service ${index + 1}`;

      const status =
        String(
          service.status || "active"
        );

      const initials =
        name
          .slice(0, 2)
          .toUpperCase();

      const logo =
        service.logo_data
          ? `
            <div class="game-logo">
              <img
                src="${escapeAttribute(service.logo_data)}"
                alt="${escapeAttribute(name)}"
              >
            </div>
          `
          : `
            <div class="game-logo-placeholder">
              ${escapeHTML(initials)}
            </div>
          `;

      card.innerHTML = `

        ${logo}

        <div class="game-info">

          <strong>
            ${escapeHTML(name)}
          </strong>

          <small>
            ${escapeHTML(status)}
          </small>

          <span class="game-status ${
            status.toLowerCase().includes("maint")
              ? "maintenance"
              : ""
          }">
            ${
              status.toLowerCase().includes("maint")
                ? "MAINTENANCE"
                : "AVAILABLE"
            }
          </span>

        </div>

      `;

      gameList.appendChild(card);

    }
  );

}


/* =========================================
   GAME SELECT
========================================= */

function populateGameSelect() {

  if (!gameSelect) {
    return;
  }

  gameSelect.innerHTML = "";

  if (!state.services.length) {

    const option =
      document.createElement("option");

    option.value = "";
    option.textContent =
      "No services available";

    gameSelect.appendChild(option);

    return;

  }

  state.services.forEach(service => {

    const option =
      document.createElement("option");

    option.value =
      service.name;

    option.textContent =
      service.name;

    gameSelect.appendChild(option);

  });

}


/* =========================================
   SERVER CONTROL
========================================= */

function renderServerControl() {

  const homePage =
    $("homePage");

  if (!homePage) {
    return;
  }

  let section =
    $("serverControlSection");

  if (!section) {

    section =
      document.createElement("section");

    section.id =
      "serverControlSection";

    section.className =
      "server-control-section";

    const stats =
      homePage.querySelector(".stats-grid");

    if (stats) {
      stats.after(section);
    } else {
      homePage.prepend(section);
    }

  }

  section.innerHTML = `

    <div class="server-control-header">

      <div class="server-control-label">
        SERVER ACCESS
      </div>

      <div class="server-control-title">
        THIS ADMIN CAN CONTROL
      </div>

      <div class="server-control-subtitle">
        THIS SERVER
      </div>

    </div>

    <div class="server-control-grid">

      ${CONTROL_SERVERS.map(server => `

        <div class="server-card">

          <div class="server-flag">
            ${server.flag}
          </div>

          <div class="server-details">

            <strong>
              ${escapeHTML(server.name)}
            </strong>

            <small>
              ${escapeHTML(server.code)} SERVER
            </small>

          </div>

          <div class="server-status">
            <span></span>
            CONTROL
          </div>

        </div>

      `).join("")}

    </div>

  `;

}


/* =========================================
   CREATE USER KEY
========================================= */

createKeyButton.addEventListener(
  "click",
  createKey
);


async function createKey() {

  const service =
    gameSelect.value;

  const days =
    Number(
      $("expirySelect").value
    );

  if (!service) {

    playSound("error");
    return;

  }

  createKeyButton.disabled = true;

  try {

    const result =
      await api(
        "/api/admin/keys",
        {
          method: "POST",

          body: JSON.stringify({
            service,
            days
          })
        }
      );

    if (!result.success) {

      throw new Error(
        result.error ||
        "Key creation failed."
      );

    }

    playSound("success");

    closeKeyModal();

    switchPage("keysPage");

    await loadKeys();
    await loadUsers();
    await loadDashboard();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to create key."
    );

  } finally {

    createKeyButton.disabled = false;

  }

}


/* =========================================
   ACTIVITY
========================================= */

async function loadActivity() {

  try {

    const result =
      await api(
        "/api/admin/activity"
      );

    state.activity =
      result.activity || [];

    renderActivity(
      state.activity
    );

  } catch (error) {

    console.error(
      "Activity:",
      error
    );

  }

}


function renderActivity(items) {

  activityList.innerHTML = "";

  if (!items.length) {

    activityList.innerHTML = `
      <div class="activity">

        <div class="activity-icon blue">
          •
        </div>

        <div>

          <strong>
            No activity yet
          </strong>

          <small>
            Your activity will appear here
          </small>

        </div>

      </div>
    `;

    return;

  }

  items
    .slice(0, 8)
    .forEach(item => {

      const activity =
        document.createElement("div");

      activity.className =
        "activity";

      activity.innerHTML = `

        <div class="activity-icon blue">
          •
        </div>

        <div>

          <strong>
            ${escapeHTML(
              item.action ||
              "Activity"
            )}
          </strong>

          <small>
            ${escapeHTML(
              formatDate(
                item.created_at
              )
            )}
          </small>

        </div>

      `;

      activityList.appendChild(
        activity
      );

    });

}


/* =========================================
   DEVELOPER CREATE ADMIN KEY
========================================= */

createAdminKeyButton.addEventListener(
  "click",
  createAdminKey
);


async function createAdminKey() {

  if (!state.developer) {

    alert(
      "Developer access required."
    );

    return;

  }

  createAdminKeyButton.disabled = true;

  createAdminKeyButton.textContent =
    "WAIT...";

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

    if (!result.success) {

      throw new Error(
        result.error ||
        "Unable to create Admin Key."
      );

    }

    newAdminKey.textContent =
      result.admin_key;

    newAdminKeyBox.classList.remove(
      "hidden"
    );

    playSound("success");

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Developer authorization required."
    );

  } finally {

    createAdminKeyButton.disabled =
      false;

    createAdminKeyButton.textContent =
      "CREATE";

  }

}


/* =========================================
   COPY ADMIN KEY
========================================= */

copyAdminKeyButton.addEventListener(
  "click",
  async () => {

    const key =
      newAdminKey.textContent.trim();

    if (!key) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        key
      );

      playSound();

      copyAdminKeyButton.textContent =
        "COPIED ✓";

      setTimeout(() => {

        copyAdminKeyButton.textContent =
          "COPY KEY";

      }, 1200);

    } catch {}

  }
);


/* =========================================
   DEVELOPER LOGO
========================================= */

selectLogoButton.addEventListener(
  "click",
  () => {

    if (!state.developer) {

      alert(
        "Developer access required."
      );

      return;

    }

    playSound();

    logoFileInput.click();

  }
);


logoFileInput.addEventListener(
  "change",
  async event => {

    if (!state.developer) {
      return;
    }

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
      Frontend maximum: 4 MB.
    */

    if (
      file.size >
      4 * 1024 * 1024
    ) {

      alert(
        "Please select a logo smaller than 4 MB."
      );

      logoFileInput.value = "";

      return;

    }

    try {

      const data =
        await fileToDataURL(file);

      await api(
        "/api/admin/branding",
        {
          method: "PUT",

          body: JSON.stringify({
            logo_data: data
          })
        }
      );

      state.branding.logo_data =
        data;

      localStorage.setItem(
        "lawangenLogo",
        data
      );

      applyLogoToUI(data);

      playSound("success");

    } catch (error) {

      playSound("error");

      alert(
        error.message ||
        "Unable to save logo."
      );

    } finally {

      logoFileInput.value = "";

    }

  }
);


/* =========================================
   REMOVE LOGO
========================================= */

removeLogoButton.addEventListener(
  "click",
  async () => {

    if (!state.developer) {

      alert(
        "Developer access required."
      );

      return;

    }

    try {

      await api(
        "/api/admin/branding",
        {
          method: "PUT",

          body: JSON.stringify({
            logo_data: ""
          })
        }
      );

      localStorage.removeItem(
        "lawangenLogo"
      );

      playSound("success");

      location.reload();

    } catch (error) {

      playSound("error");

      alert(
        error.message ||
        "Unable to remove logo."
      );

    }

  }
);


/* =========================================
   NAVIGATION
========================================= */

const navItems =
  document.querySelectorAll(
    ".nav-item"
  );

const pages =
  document.querySelectorAll(
    ".page"
  );


navItems.forEach(item => {

  item.addEventListener(
    "click",
    () => {

      playSound();

      switchPage(
        item.dataset.page
      );

    }
  );

});


function switchPage(pageId) {

  pages.forEach(page => {

    page.classList.remove("active");

  });

  navItems.forEach(nav => {

    nav.classList.remove("active");

  });

  const page =
    $(pageId);

  if (page) {
    page.classList.add("active");
  }

  const activeNav =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );

  if (activeNav) {
    activeNav.classList.add("active");
  }

  /*
    Refresh server control when returning Home.
  */

  if (pageId === "homePage") {
    renderServerControl();
  }

}


/* =========================================
   VIEW KEYS
========================================= */

$("viewKeys").addEventListener(
  "click",
  () => {

    playSound();

    switchPage("keysPage");

  }
);


/* =========================================
   KEY MODAL
========================================= */

generateKeyButton.addEventListener(
  "click",
  openKeyModal
);


generateFromHome.addEventListener(
  "click",
  openKeyModal
);


function openKeyModal() {

  playSound();

  keyModal.classList.remove(
    "hidden"
  );

}


closeModal.addEventListener(
  "click",
  closeKeyModal
);


document
  .querySelector(".modal-backdrop")
  .addEventListener(
    "click",
    closeKeyModal
  );


function closeKeyModal() {

  playSound();

  keyModal.classList.add(
    "hidden"
  );

}


/* =========================================
   SETTINGS
========================================= */

soundToggle.addEventListener(
  "change",
  () => {

    if (soundToggle.checked) {
      playSound("success");
    }

  }
);


animationToggle.addEventListener(
  "change",
  () => {

    if (!animationToggle.checked) {

      document
        .querySelectorAll("*")
        .forEach(element => {

          element.style.animation = "none";
          element.style.transition = "none";

        });

    } else {

      location.reload();

    }

  }
);


/* =========================================
   PROFILE BUTTON
========================================= */

$("profileButton").addEventListener(
  "click",
  () => {

    playSound();

    switchPage(
      "settingsPage"
    );

  }
);


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    playSound();

    try {

      if (
        state.mode === "developer"
      ) {

        await api(
          "/api/developer/logout",
          {
            method: "POST"
          }
        );

      } else {

        await api(
          "/api/admin/logout",
          {
            method: "POST"
          }
        );

      }

    } catch {}

    state.mode = "admin";
    state.admin = null;
    state.developer = false;
    state.hasExistingSession = false;
    state.existingSession = null;

    appScreen.classList.add("hidden");

    developerTools.classList.add(
      "hidden"
    );

    adminKey.value = "";
    developerToken.value = "";

    loginMessage.textContent = "";
    developerLoginMessage.textContent = "";

    showAccessScreen();

  }
);


/* =========================================
   SESSION CHECK
========================================= */

async function checkExistingSession() {

  let existingMode = null;

  try {

    const developer =
      await api(
        "/api/developer/me"
      );

    if (
      developer.success &&
      developer.developer
    ) {

      existingMode =
        "developer";

    }

  } catch {}


  if (!existingMode) {

    try {

      const admin =
        await api(
          "/api/admin/me"
        );

      if (
        admin.success &&
        admin.admin
      ) {

        existingMode =
          "admin";

        state.admin =
          admin.admin;

      }

    } catch {}

  }


  if (
    existingMode === "developer"
  ) {

    state.mode =
      "developer";

    state.developer =
      true;

    state.admin =
      null;

    state.hasExistingSession =
      true;

    state.existingSession =
      "developer";

    return;

  }


  if (
    existingMode === "admin"
  ) {

    state.mode =
      "admin";

    state.developer =
      false;

    state.hasExistingSession =
      true;

    state.existingSession =
      "admin";

    return;

  }


  state.hasExistingSession =
    false;

  state.existingSession =
    null;

}


/* =========================================
   HELPERS
========================================= */

function formatExpiry(value) {

  if (!value) {
    return "No expiry";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  const diff =
    date.getTime() -
    Date.now();

  if (diff <= 0) {
    return "Expired";
  }

  const days =
    Math.ceil(
      diff /
      (1000 * 60 * 60 * 24)
    );

  return `
    ${days}
    day${days === 1 ? "" : "s"}
  `.trim();

}


function formatDate(value) {

  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {
  return escapeHTML(value);
}


/* =========================================
   INITIALIZE
========================================= */

loadPublicBranding();

checkExistingSession();