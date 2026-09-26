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
  existingSession: null,

  gameLogoTarget: null
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
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Thailand", code: "TH", flag: "🇹🇭" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳" },
  { name: "Taiwan", code: "TW", flag: "🇹🇼" },
  { name: "Middle East", code: "MENA", flag: "🌍" },
  { name: "Europe", code: "EU", flag: "🇪🇺" },
  { name: "Russia", code: "CIS", flag: "🇷🇺" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "North America", code: "NA", flag: "🇺🇸" },
  { name: "South America", code: "LATAM", flag: "🌎" },
  { name: "Africa", code: "AF", flag: "🌍" }
];


/* =========================================
   EXTRA PREMIUM GAME CSS
   Injected by JS so style.css does not
   need to be replaced.
========================================= */

function injectGameManagerStyles() {

  if ($("lawangenGameManagerStyles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "lawangenGameManagerStyles";

  style.textContent = `
    .lawangen-game-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:16px;
    }

    .lawangen-add-game {
      border:1px solid rgba(255,255,255,.12);
      background:linear-gradient(
        135deg,
        rgba(255,255,255,.12),
        rgba(255,255,255,.04)
      );
      color:#fff;
      border-radius:14px;
      padding:11px 15px;
      font-weight:800;
      letter-spacing:.3px;
      cursor:pointer;
      box-shadow:0 8px 24px rgba(0,0,0,.18);
    }

    .lawangen-add-game:active {
      transform:scale(.97);
    }

    .game-card {
      position:relative;
    }

    .game-manager-actions {
      display:flex;
      flex-wrap:wrap;
      gap:7px;
      margin-top:11px;
    }

    .game-manager-actions button {
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.055);
      color:#fff;
      border-radius:10px;
      padding:7px 10px;
      font-size:10px;
      font-weight:800;
      letter-spacing:.4px;
      cursor:pointer;
    }

    .game-manager-actions button:active {
      transform:scale(.96);
    }

    .game-manager-actions .game-danger {
      color:#ff6b7d;
      border-color:rgba(255,80,100,.18);
      background:rgba(255,60,80,.07);
    }

    .game-manager-actions .game-primary {
      color:#75d7ff;
      border-color:rgba(70,190,255,.18);
      background:rgba(70,190,255,.07);
    }

    .game-manager-actions .game-success {
      color:#5dffad;
      border-color:rgba(50,255,150,.18);
      background:rgba(50,255,150,.07);
    }

    .lawangen-game-modal {
      position:fixed;
      inset:0;
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:22px;
    }

    .lawangen-game-modal.hidden {
      display:none;
    }

    .lawangen-game-modal-backdrop {
      position:absolute;
      inset:0;
      background:rgba(0,0,0,.72);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
    }

    .lawangen-game-dialog {
      position:relative;
      width:min(430px,100%);
      border:1px solid rgba(255,255,255,.12);
      border-radius:24px;
      background:linear-gradient(
        145deg,
        rgba(28,31,39,.98),
        rgba(10,12,17,.98)
      );
      box-shadow:
        0 30px 80px rgba(0,0,0,.55),
        inset 0 1px rgba(255,255,255,.05);
      padding:22px;
    }

    .lawangen-game-dialog h3 {
      margin:0 0 6px;
      color:#fff;
      font-size:21px;
    }

    .lawangen-game-dialog p {
      margin:0 0 18px;
      color:#8d929d;
      font-size:13px;
    }

    .lawangen-game-dialog label {
      display:block;
      margin:13px 0 7px;
      color:#858b96;
      font-size:10px;
      font-weight:800;
      letter-spacing:1px;
    }

    .lawangen-game-dialog input,
    .lawangen-game-dialog select {
      width:100%;
      box-sizing:border-box;
      border:1px solid rgba(255,255,255,.10);
      border-radius:13px;
      background:rgba(255,255,255,.055);
      color:#fff;
      padding:13px;
      outline:none;
    }

    .lawangen-game-dialog input:focus,
    .lawangen-game-dialog select:focus {
      border-color:rgba(80,190,255,.45);
    }

    .lawangen-game-dialog-buttons {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-top:20px;
    }

    .lawangen-game-dialog-buttons button {
      border:0;
      border-radius:13px;
      padding:13px;
      font-weight:800;
      cursor:pointer;
    }

    .lawangen-game-cancel {
      background:rgba(255,255,255,.07);
      color:#fff;
    }

    .lawangen-game-save {
      background:#fff;
      color:#090b10;
    }

    .lawangen-file-note {
      color:#777d88;
      font-size:10px;
      margin-top:7px;
      line-height:1.4;
    }

    .lawangen-logo-preview {
      width:70px;
      height:70px;
      border-radius:18px;
      overflow:hidden;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.10);
      display:flex;
      align-items:center;
      justify-content:center;
      margin-bottom:10px;
    }

    .lawangen-logo-preview img {
      width:100%;
      height:100%;
      object-fit:contain;
    }

    .lawangen-logo-preview span {
      color:#aaa;
      font-weight:900;
      font-size:20px;
    }

    .lawangen-top-logo {
      width:28px;
      height:28px;
      border-radius:8px;
      overflow:hidden;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      margin-right:8px;
      vertical-align:middle;
      background:rgba(255,255,255,.07);
    }

    .lawangen-top-logo img {
      width:100%;
      height:100%;
      object-fit:contain;
    }

    .game-logo img {
      object-fit:contain;
    }
  `;

  document.head.appendChild(style);
}

injectGameManagerStyles();


/* =========================================
   LOCAL LOGO CACHE
========================================= */

try {

  const cachedLogo =
    localStorage.getItem("lawangenLogo");

  if (cachedLogo) {
    applyLogoToUI(cachedLogo);
  }

} catch {}


/* =========================================
   SPLASH CONTROL
   Approximately 7 seconds total.
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

    if (state.existingSession === "developer") {
      await openDeveloperPanel();
      return;
    }

    if (state.existingSession === "admin") {
      await openAdminPanel();
      return;
    }

    showAccessScreen();

  }, 650);
}


/*
  6.35 sec + 0.65 sec fade
  = approximately 7 seconds.
*/

setTimeout(
  finishSplash,
  6350
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

  if (!soundToggle || !soundToggle.checked) {
    return;
  }

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audio = new AudioContext();

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

async function api(path, options = {}) {

  const response =
    await fetch(
      API_BASE + path,
      {
        credentials: "include",
        ...options,

        headers: {
          "Content-Type": "application/json",
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
      await api("/api/admin/branding");

    if (!result.branding) {
      return;
    }

    state.branding = {
      ...state.branding,
      ...result.branding
    };

    const logo =
      state.branding.logo_data || "";

    if (logo) {

      try {
        localStorage.setItem(
          "lawangenLogo",
          logo
        );
      } catch {}

      applyLogoToUI(logo);

    } else {

      clearLogoFromUI();

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

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    element.appendChild(img);

  });

  applyTopbarLogo(logo);

}


function clearLogoFromUI() {

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

    element.innerHTML = "";

  });

  const topLogo =
    $("lawangenTopLogo");

  if (topLogo) {
    topLogo.remove();
  }

}


function applyTopbarLogo(logo) {

  if (!logo) {
    return;
  }

  const topBrand =
    document.querySelector(".top-brand");

  if (!topBrand) {
    return;
  }

  let logoBox =
    $("lawangenTopLogo");

  if (!logoBox) {

    logoBox =
      document.createElement("span");

    logoBox.id =
      "lawangenTopLogo";

    logoBox.className =
      "lawangen-top-logo";

    topBrand.prepend(logoBox);

  }

  logoBox.innerHTML = "";

  const img =
    document.createElement("img");

  img.src = logo;
  img.alt = "LAWANGEN";

  logoBox.appendChild(img);

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

    if (adminKey.type === "password") {

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

    if (developerToken.type === "password") {

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
    developerEnterButton.querySelector("span");

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
            "X-Developer-Token": token
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
      await api("/api/admin/me");

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
      await api("/api/developer/me");

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
      `${escapeHTML(parts[0] || "")}
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
      result.stats?.services ??
      state.services.length ??
      0;

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

    renderServices();

  }

}


/* =========================================
   GAME MANAGER HEADER
========================================= */

function renderGameManagerHeader() {

  const heading =
    document.querySelector(
      "#gamesPage .page-heading"
    );

  if (!heading) {
    return;
  }

  let button =
    $("lawangenAddGameButton");

  if (!state.developer) {

    if (button) {
      button.remove();
    }

    return;

  }

  if (button) {
    return;
  }

  button =
    document.createElement("button");

  button.id =
    "lawangenAddGameButton";

  button.className =
    "lawangen-add-game";

  button.type =
    "button";

  button.textContent =
    "＋ ADD GAME";

  button.addEventListener(
    "click",
    () => {

      playSound();

      openGameEditor();

    }
  );

  heading.appendChild(button);

}


/* =========================================
   RENDER SERVICES
========================================= */

function renderServices() {

  gameList.innerHTML = "";

  renderGameManagerHeader();

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

      let logo = "";

      if (service.logo_data) {

        logo = `
          <div class="game-logo">
            <img
              src="${escapeAttribute(service.logo_data)}"
              alt="${escapeAttribute(name)}"
            >
          </div>
        `;

      } else {

        logo = `
          <div class="game-logo-placeholder">
            ${escapeHTML(initials)}
          </div>
        `;

      }


      const manager =
        state.developer
        ? `
          <div class="game-manager-actions">

            <button
              class="game-primary"
              data-game-action="rename"
              data-game-id="${service.id}"
            >
              RENAME
            </button>

            <button
              class="game-primary"
              data-game-action="logo"
              data-game-id="${service.id}"
            >
              CHANGE LOGO
            </button>

            ${
              service.logo_data
              ? `
                <button
                  data-game-action="remove-logo"
                  data-game-id="${service.id}"
                >
                  REMOVE LOGO
                </button>
              `
              : ""
            }

            <button
              class="game-danger"
              data-game-action="delete"
              data-game-id="${service.id}"
            >
              DELETE
            </button>

          </div>
        `
        : "";


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

          ${manager}

        </div>

      `;

      gameList.appendChild(card);

    }
  );


  attachGameManagerActions();

}


/* =========================================
   GAME MANAGER ACTIONS
========================================= */

function attachGameManagerActions() {

  document
    .querySelectorAll(
      "[data-game-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          if (!state.developer) {
            return;
          }

          playSound();

          const action =
            button.dataset.gameAction;

          const id =
            button.dataset.gameId;

          if (!id) {
            return;
          }

          if (action === "rename") {
            await renameGame(id);
          }

          if (action === "logo") {
            openGameLogoPicker(id);
          }

          if (action === "remove-logo") {
            await removeGameLogo(id);
          }

          if (action === "delete") {
            await deleteGame(id);
          }

        }
      );

    });

}


/* =========================================
   GAME EDITOR MODAL
========================================= */

function createGameEditorModal() {

  let modal =
    $("lawangenGameEditor");

  if (modal) {
    return modal;
  }

  modal =
    document.createElement("div");

  modal.id =
    "lawangenGameEditor";

  modal.className =
    "lawangen-game-modal hidden";

  modal.innerHTML = `

    <div
      class="lawangen-game-modal-backdrop"
      data-close-game-editor="true"
    ></div>

    <div class="lawangen-game-dialog">

      <h3 id="lawangenGameEditorTitle">
        Add Game
      </h3>

      <p>
        Create a new game/service for the panel.
      </p>

      <label>
        GAME NAME
      </label>

      <input
        id="lawangenGameName"
        type="text"
        maxlength="100"
        placeholder="Enter game name"
        autocomplete="off"
      >

      <label>
        STATUS
      </label>

      <select id="lawangenGameStatus">

        <option value="active">
          Active
        </option>

        <option value="maintenance">
          Maintenance
        </option>

      </select>

      <label>
        GAME LOGO
      </label>

      <div
        id="lawangenGameLogoPreview"
        class="lawangen-logo-preview"
      >
        <span>LOGO</span>
      </div>

      <input
        id="lawangenGameLogoFile"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        hidden
      >

      <button
        id="lawangenChooseGameLogo"
        class="small-button"
        type="button"
      >
        SELECT LOGO
      </button>

      <div class="lawangen-file-note">
        Maximum logo size: 4 MB
      </div>

      <div class="lawangen-game-dialog-buttons">

        <button
          id="lawangenCancelGame"
          class="lawangen-game-cancel"
          type="button"
        >
          CANCEL
        </button>

        <button
          id="lawangenSaveGame"
          class="lawangen-game-save"
          type="button"
        >
          SAVE GAME
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  $("lawangenCancelGame")
    .addEventListener(
      "click",
      closeGameEditor
    );


  modal
    .querySelector(
      "[data-close-game-editor]"
    )
    .addEventListener(
      "click",
      closeGameEditor
    );


  $("lawangenChooseGameLogo")
    .addEventListener(
      "click",
      () => {

        playSound();

        $("lawangenGameLogoFile").click();

      }
    );


  $("lawangenGameLogoFile")
    .addEventListener(
      "change",
      handleNewGameLogo
    );


  $("lawangenSaveGame")
    .addEventListener(
      "click",
      saveNewGame
    );


  return modal;
}


let pendingNewGameLogo = "";


function openGameEditor() {

  if (!state.developer) {
    return;
  }

  const modal =
    createGameEditorModal();

  $("lawangenGameEditorTitle").textContent =
    "Add Game";

  $("lawangenGameName").value = "";

  $("lawangenGameStatus").value =
    "active";

  $("lawangenGameLogoFile").value =
    "";

  pendingNewGameLogo = "";

  $("lawangenGameLogoPreview").innerHTML =
    "<span>LOGO</span>";

  modal.classList.remove("hidden");

  setTimeout(() => {
    $("lawangenGameName")?.focus();
  }, 150);

}


function closeGameEditor() {

  const modal =
    $("lawangenGameEditor");

  if (modal) {
    modal.classList.add("hidden");
  }

}


async function handleNewGameLogo(event) {

  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (file.size > 4 * 1024 * 1024) {

    alert(
      "Please select a logo smaller than 4 MB."
    );

    event.target.value = "";

    return;

  }

  try {

    pendingNewGameLogo =
      await fileToDataURL(file);

    $("lawangenGameLogoPreview").innerHTML = `
      <img
        src="${escapeAttribute(pendingNewGameLogo)}"
        alt="Game Logo"
      >
    `;

  } catch {

    pendingNewGameLogo = "";

    alert(
      "Unable to read the selected logo."
    );

  }

}


async function saveNewGame() {

  if (!state.developer) {
    return;
  }

  const name =
    $("lawangenGameName")
      .value
      .trim();

  const status =
    $("lawangenGameStatus")
      .value;

  if (!name) {

    playSound("error");

    alert(
      "Please enter a game name."
    );

    return;

  }


  const duplicate =
    state.services.some(
      service =>
        String(service.name || "")
          .toLowerCase()
          .trim() ===
        name.toLowerCase()
    );

  if (duplicate) {

    playSound("error");

    alert(
      "This game already exists."
    );

    return;

  }


  const button =
    $("lawangenSaveGame");

  button.disabled =
    true;

  button.textContent =
    "SAVING...";


  try {

    const body = {
      name,
      status
    };

    if (pendingNewGameLogo) {
      body.logo_data =
        pendingNewGameLogo;
    }


    const result =
      await api(
        "/api/developer/services",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );


    if (!result.success) {

      throw new Error(
        result.error ||
        "Unable to create game."
      );

    }


    playSound("success");

    closeGameEditor();

    await loadServices();
    await loadDashboard();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to create game."
    );

  } finally {

    button.disabled =
      false;

    button.textContent =
      "SAVE GAME";

  }

}


/* =========================================
   RENAME GAME
========================================= */

async function renameGame(id) {

  if (!state.developer) {
    return;
  }

  const service =
    state.services.find(
      item => String(item.id) === String(id)
    );

  if (!service) {
    return;
  }

  const oldName =
    service.name || "";

  const newName =
    window.prompt(
      "Enter new game name:",
      oldName
    );

  if (newName === null) {
    return;
  }

  const name =
    newName.trim();

  if (!name) {

    playSound("error");

    alert(
      "Game name cannot be empty."
    );

    return;

  }

  if (
    name.toLowerCase() !==
    oldName.toLowerCase()
  ) {

    const duplicate =
      state.services.some(
        item =>
          String(item.id) !== String(id) &&
          String(item.name || "")
            .toLowerCase()
            .trim() ===
          name.toLowerCase()
      );

    if (duplicate) {

      playSound("error");

      alert(
        "This game already exists."
      );

      return;

    }

  }


  try {

    await api(
      `/api/developer/services/${encodeURIComponent(id)}`,
      {
        method: "PUT",

        body: JSON.stringify({
          name
        })
      }
    );

    playSound("success");

    await loadServices();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to rename game."
    );

  }

}


/* =========================================
   GAME LOGO PICKER
========================================= */

function getGameLogoInput() {

  let input =
    $("lawangenGameLogoManagerInput");

  if (input) {
    return input;
  }

  input =
    document.createElement("input");

  input.id =
    "lawangenGameLogoManagerInput";

  input.type =
    "file";

  input.accept =
    "image/png,image/jpeg,image/webp,image/*";

  input.hidden =
    true;

  document.body.appendChild(input);

  input.addEventListener(
    "change",
    handleManagerGameLogo
  );

  return input;

}


function openGameLogoPicker(id) {

  if (!state.developer) {
    return;
  }

  state.gameLogoTarget =
    String(id);

  const input =
    getGameLogoInput();

  input.value = "";

  input.click();

}


async function handleManagerGameLogo(event) {

  if (!state.developer) {
    return;
  }

  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  const id =
    state.gameLogoTarget;

  if (!id) {
    return;
  }


  if (file.size > 4 * 1024 * 1024) {

    alert(
      "Please select a logo smaller than 4 MB."
    );

    event.target.value = "";

    return;

  }


  try {

    const data =
      await fileToDataURL(file);

    await api(
      `/api/developer/services/${encodeURIComponent(id)}`,
      {
        method: "PUT",

        body: JSON.stringify({
          logo_data: data
        })
      }
    );

    playSound("success");

    await loadServices();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to save game logo."
    );

  } finally {

    event.target.value = "";

  }

}


/* =========================================
   REMOVE GAME LOGO
========================================= */

async function removeGameLogo(id) {

  if (!state.developer) {
    return;
  }

  const service =
    state.services.find(
      item => String(item.id) === String(id)
    );

  if (!service) {
    return;
  }

  const confirmed =
    window.confirm(
      `Remove logo from "${service.name}"?`
    );

  if (!confirmed) {
    return;
  }


  try {

    await api(
      `/api/developer/services/${encodeURIComponent(id)}`,
      {
        method: "PUT",

        body: JSON.stringify({
          logo_data: ""
        })
      }
    );

    playSound("success");

    await loadServices();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to remove game logo."
    );

  }

}


/* =========================================
   DELETE GAME
========================================= */

async function deleteGame(id) {

  if (!state.developer) {
    return;
  }

  const service =
    state.services.find(
      item => String(item.id) === String(id)
    );

  if (!service) {
    return;
  }

  const confirmed =
    window.confirm(
      `Delete "${service.name}" permanently?`
    );

  if (!confirmed) {
    return;
  }


  try {

    await api(
      `/api/developer/services/${encodeURIComponent(id)}`,
      {
        method: "DELETE"
      }
    );

    playSound("success");

    await loadServices();
    await loadDashboard();

  } catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to delete game."
    );

  }

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
      homePage.querySelector(
        ".stats-grid"
      );

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
   DEVELOPER APP LOGO
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


    if (file.size > 4 * 1024 * 1024) {

      alert(
        "Please select a logo smaller than 4 MB."
      );

      logoFileInput.value = "";

      return;

    }


    try {

      const data =
        await fileToDataURL(file);

      const result =
        await api(
          "/api/admin/branding",
          {
            method: "PUT",

            body: JSON.stringify({
              logo_data: data
            })
          }
        );


      if (
        result &&
        result.success === false
      ) {

        throw new Error(
          result.error ||
          "Unable to save logo."
        );

      }


      /*
        IMPORTANT:
        Only save to local cache after
        server successfully accepts it.
      */

      state.branding.logo_data =
        data;

      try {

        localStorage.setItem(
          "lawangenLogo",
          data
        );

      } catch {}


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
   REMOVE APP LOGO
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


    const confirmed =
      window.confirm(
        "Remove the LAWANGEN application logo?"
      );

    if (!confirmed) {
      return;
    }


    try {

      const result =
        await api(
          "/api/admin/branding",
          {
            method: "PUT",

            body: JSON.stringify({
              logo_data: ""
            })
          }
        );


      if (
        result &&
        result.success === false
      ) {

        throw new Error(
          result.error ||
          "Unable to remove logo."
        );

      }


      state.branding.logo_data =
        "";

      try {

        localStorage.removeItem(
          "lawangenLogo"
        );

      } catch {}


      clearLogoFromUI();

      playSound("success");


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


  if (pageId === "homePage") {
    renderServerControl();
  }


  if (pageId === "gamesPage") {
    renderServices();
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

  populateGameSelect();

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
   FILE TO DATA URL
========================================= */

function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          String(reader.result || "")
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

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

/*
  Start these immediately.
  Branding is fetched from D1, while the
  splash timer continues independently.
*/

loadPublicBranding();

checkExistingSession();