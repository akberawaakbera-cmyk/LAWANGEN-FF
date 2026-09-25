/* =========================================
   LAWANGEN ADMIN PANEL
   Connected to Cloudflare Worker + D1
========================================= */

const API_BASE = "";

const state = {
  admin: null,
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
  }
};


/* =========================================
   ELEMENTS
========================================= */

const splash =
  document.getElementById("splash");

const loginScreen =
  document.getElementById("loginScreen");

const appScreen =
  document.getElementById("appScreen");

const adminKey =
  document.getElementById("adminKey");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const showKey =
  document.getElementById("showKey");

const keyModal =
  document.getElementById("keyModal");

const closeModal =
  document.getElementById("closeModal");

const generateKeyButton =
  document.getElementById("generateKeyButton");

const generateFromHome =
  document.getElementById("generateFromHome");

const createKeyButton =
  document.getElementById("createKeyButton");

const logoutButton =
  document.getElementById("logoutButton");

const soundToggle =
  document.getElementById("soundToggle");

const animationToggle =
  document.getElementById("animationToggle");

const keyList =
  document.getElementById("keyList");

const userList =
  document.getElementById("userList");

const keySearch =
  document.getElementById("keySearch");

const activeKeys =
  document.getElementById("activeKeys");

const totalUsers =
  document.getElementById("totalUsers");

const totalServices =
  document.getElementById("totalServices");

const userCount =
  document.getElementById("userCount");

const activeUserCount =
  document.getElementById("activeUserCount");

const expiredUserCount =
  document.getElementById("expiredUserCount");

const gameList =
  document.getElementById("gameList");

const activityList =
  document.getElementById("activityList");

const gameSelect =
  document.getElementById("gameSelect");

const developerBranding =
  document.getElementById("developerBranding");

const selectLogoButton =
  document.getElementById("selectLogoButton");

const logoFileInput =
  document.getElementById("logoFileInput");

const removeLogoButton =
  document.getElementById("removeLogoButton");


/* =========================================
   SPLASH
========================================= */

setTimeout(() => {

  splash.classList.add("hidden");
  loginScreen.classList.remove("hidden");

}, 3300);


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
    }

    else if (type === "error") {
      oscillator.frequency.value = 180;
    }

    else {
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

  } catch {
    // Sound is optional.
  }
}


/* =========================================
   API HELPER
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
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      }
    );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

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
   SHOW / HIDE KEY
========================================= */

showKey.addEventListener(
  "click",
  () => {

    playSound();

    if (
      adminKey.type ===
      "password"
    ) {

      adminKey.type = "text";
      showKey.textContent = "○";

    }

    else {

      adminKey.type = "password";
      showKey.textContent = "◉";

    }

  }
);


/* =========================================
   LOGIN
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

    loginMessage.style.color =
      "";

    playSound("error");

    return;
  }


  loginButton.disabled = true;

  loginButton.querySelector("span").textContent =
    "VERIFYING...";


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


    loginMessage.textContent =
      "✓ Access verified";

    loginMessage.style.color =
      "#35ff9b";

    playSound("success");


    await openPanel();

  }

  catch (error) {

    loginMessage.textContent =
      error.message ||
      "Invalid or expired Admin Key.";

    loginMessage.style.color =
      "";

    playSound("error");

  }

  finally {

    loginButton.disabled = false;

    loginButton.querySelector("span").textContent =
      "ENTER ADMIN PANEL";

  }

}


/* =========================================
   OPEN PANEL
========================================= */

async function openPanel() {

  try {

    const me =
      await api(
        "/api/admin/me"
      );

    if (!me.success) {
      throw new Error("Session expired.");
    }


    state.admin =
      me.admin;


    loginScreen.classList.add(
      "hidden"
    );

    appScreen.classList.remove(
      "hidden"
    );


    updateAdminIdentity();

    await loadAll();

    switchPage("homePage");

  }

  catch (error) {

    loginMessage.textContent =
      error.message ||
      "Unable to open admin panel.";

    loginScreen.classList.remove(
      "hidden"
    );

    appScreen.classList.add(
      "hidden"
    );

  }

}


/* =========================================
   LOAD EVERYTHING
========================================= */

async function loadAll() {

  await Promise.allSettled([
    loadDashboard(),
    loadKeys(),
    loadUsers(),
    loadServices(),
    loadActivity(),
    loadBranding()
  ]);

}


/* =========================================
   ADMIN IDENTITY
========================================= */

function updateAdminIdentity() {

  const name =
    state.admin?.name ||
    "ROKHAN SYED";


  document
    .querySelectorAll(
      ".admin-name, .profile-name, .welcome h1"
    );


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
       ${escapeHTML(parts.slice(1).join(" "))}
       </span>`;

  }


  const profileName =
    document.querySelector(
      ".profile-name"
    );

  if (profileName) {
    profileName.textContent = name;
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

    state.dashboard =
      result;


    activeKeys.textContent =
      result.stats?.active_keys ??
      0;

    totalUsers.textContent =
      result.stats?.total_users ??
      0;

    totalServices.textContent =
      result.stats?.total_services ??
      0;

    renderActivity(
      result.activity ||
      []
    );

  }

  catch (error) {

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
      result.keys ||
      [];

    renderKeys(
      keySearch.value
    );

  }

  catch (error) {

    console.error(
      "Keys:",
      error
    );

  }

}


function renderKeys(
  filter = ""
) {

  const search =
    filter
      .toLowerCase()
      .trim();


  const filtered =
    state.keys.filter(
      item => {

        return (

          String(
            item.api_key ||
            item.key ||
            ""
          )
          .toLowerCase()
          .includes(search)

          ||

          String(
            item.service ||
            item.game ||
            ""
          )
          .toLowerCase()
          .includes(search)

        );

      }
    );


  keyList.innerHTML = "";


  if (!filtered.length) {

    keyList.innerHTML = `
      <div class="key-card glass">
        <div style="text-align:center;color:#777">
          No keys found
        </div>
      </div>
    `;

    return;
  }


  filtered.forEach(
    item => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "key-card glass";


      const key =
        item.api_key ||
        item.key ||
        "";


      const service =
        item.service ||
        item.game ||
        "Service";


      const status =
        String(
          item.status ||
          "active"
        ).toLowerCase();


      const expiry =
        formatExpiry(
          item.expires_at ||
          item.expiry
        );


      card.innerHTML = `

        <div class="key-top">

          <span class="key-value">
            ${escapeHTML(key)}
          </span>

          <span class="badge ${status}">
            ${escapeHTML(status.toUpperCase())}
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
          >
            COPY
          </button>

          ${
            status === "active"
            ? `
              <button
                class="small-button revoke"
                data-id="${item.id}"
              >
                REVOKE
              </button>
            `
            : `
              <button
                class="small-button activate"
                data-id="${item.id}"
              >
                ACTIVATE
              </button>
            `
          }

        </div>

      `;


      keyList.appendChild(card);

    }
  );


  attachKeyActions();

}


/* =========================================
   KEY ACTIONS
========================================= */

function attachKeyActions() {

  document
    .querySelectorAll(
      ".copy-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          playSound();

          const key =
            button.dataset.key;

          try {

            await navigator
              .clipboard
              .writeText(key);

            button.textContent =
              "COPIED ✓";

            setTimeout(
              () => {
                button.textContent =
                  "COPY";
              },
              1000
            );

          }

          catch {

            button.textContent =
              "COPY KEY";

          }

        }
      );

    });


  document
    .querySelectorAll(
      ".revoke"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => revokeKey(
          button.dataset.id
        )
      );

    });


  document
    .querySelectorAll(
      ".activate"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => activateKey(
          button.dataset.id
        )
      );

    });

}


async function revokeKey(id) {

  if (!id) return;

  playSound();

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

  }

  catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to revoke key."
    );

  }

}


async function activateKey(id) {

  if (!id) return;

  playSound();

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

  }

  catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to activate key."
    );

  }

}


/* =========================================
   SEARCH
========================================= */

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
      result.users ||
      [];

    renderUsers();

  }

  catch (error) {

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


  state.users.forEach(
    user => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "user-card glass";


      const name =
        user.name ||
        `User ${user.id}`;


      const key =
        user.api_key ||
        user.key ||
        "";


      const rawStatus =
        String(
          user.status ||
          "Active"
        );


      const isActive =
        rawStatus.toLowerCase() ===
        "active";


      if (isActive) {
        active++;
      } else {
        expired++;
      }


      const initials =
        name
          .split(" ")
          .map(
            word => word[0]
          )
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

    }
  );


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

    const result =
      await api(
        "/api/admin/services"
      );

    state.services =
      result.services ||
      [];

    renderServices();

    populateGameSelect();

  }

  catch (error) {

    console.error(
      "Services:",
      error
    );

  }

}


function renderServices() {

  gameList.innerHTML = "";


  if (!state.services.length) {

    gameList.innerHTML = `
      <div class="game-card glass">
        <div>
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
        document.createElement(
          "div"
        );

      card.className =
        "game-card glass";


      const name =
        service.name ||
        `Service ${index + 1}`;


      const status =
        String(
          service.status ||
          "online"
        );


      card.innerHTML = `

        <div class="game-logo">
          ${escapeHTML(
            name
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>

        <div>

          <strong>
            ${escapeHTML(name)}
          </strong>

          <small>
            ${escapeHTML(status)}
          </small>

        </div>

        <span class="status-dot ${
          status.toLowerCase()
            .includes("maint")
            ? "maintenance"
            : ""
        }"></span>

      `;


      gameList.appendChild(card);

    }
  );

}


function populateGameSelect() {

  gameSelect.innerHTML = "";


  if (!state.services.length) {

    const option =
      document.createElement(
        "option"
      );

    option.value = "";
    option.textContent =
      "No services available";

    gameSelect.appendChild(
      option
    );

    return;
  }


  state.services.forEach(
    service => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        service.name;

      option.textContent =
        service.name;

      gameSelect.appendChild(
        option
      );

    }
  );

}


/* =========================================
   CREATE KEY
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
      document.getElementById(
        "expirySelect"
      ).value
    );


  if (!service) {

    playSound("error");

    return;

  }


  createKeyButton.disabled =
    true;


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

    switchPage(
      "keysPage"
    );


    await loadKeys();
    await loadUsers();
    await loadDashboard();

  }

  catch (error) {

    playSound("error");

    alert(
      error.message ||
      "Unable to create key."
    );

  }

  finally {

    createKeyButton.disabled =
      false;

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
      result.activity ||
      [];

    renderActivity(
      state.activity
    );

  }

  catch (error) {

    console.error(
      "Activity:",
      error
    );

  }

}


function renderActivity(
  items
) {

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
    .forEach(
      item => {

        const activity =
          document.createElement(
            "div"
          );

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

      }
    );

}


/* =========================================
   BRANDING
========================================= */

async function loadBranding() {

  try {

    const result =
      await api(
        "/api/admin/branding"
      );


    if (result.branding) {

      state.branding =
        {
          ...state.branding,
          ...result.branding
        };

    }


    applyBranding();


    /*
      Current reseller role is ADMIN.
      Developer-only controls remain hidden.
    */

    if (
      state.admin &&
      String(
        state.admin.role
      ).toUpperCase() ===
      "DEVELOPER"
    ) {

      developerBranding
        .classList
        .remove("hidden");

    }

  }

  catch (error) {

    console.error(
      "Branding:",
      error
    );

  }

}


function applyBranding() {

  const logo =
    state.branding.logo_data;


  if (!logo) {
    return;
  }


  const splashLogo =
    document.getElementById(
      "splashLogo"
    );

  const loginLogo =
    document.getElementById(
      "loginLogo"
    );


  if (splashLogo) {

    splashLogo.innerHTML =
      `<img
        src="${escapeAttribute(logo)}"
        alt="Logo"
      >`;

  }


  if (loginLogo) {

    loginLogo.innerHTML =
      `<img
        src="${escapeAttribute(logo)}"
        alt="Logo"
      >`;

  }

}


/* =========================================
   DEVELOPER LOGO SELECTOR
========================================= */

if (selectLogoButton) {

  selectLogoButton.addEventListener(
    "click",
    () => {

      playSound();

      logoFileInput.click();

    }
  );

}


if (logoFileInput) {

  logoFileInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];

      if (!file) return;


      /*
        Keep logo reasonably small.
        Large images should be compressed
        before saving into D1.
      */

      if (
        file.size >
        1000 * 1024
      ) {

        alert(
          "Please select a logo smaller than 1 MB."
        );

        logoFileInput.value = "";

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
              logo_data: data
            })
          }
        );


        state.branding.logo_data =
          data;


        applyBranding();

        playSound("success");

      }

      catch (error) {

        playSound("error");

        alert(
          error.message ||
          "Unable to save logo."
        );

      }

    }
  );

}


if (removeLogoButton) {

  removeLogoButton.addEventListener(
    "click",
    async () => {

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


        state.branding.logo_data =
          "";

        location.reload();

      }

      catch (error) {

        playSound("error");

        alert(
          error.message ||
          "Unable to remove logo."
        );

      }

    }
  );

}


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


navItems.forEach(
  item => {

    item.addEventListener(
      "click",
      () => {

        playSound();

        switchPage(
          item.dataset.page
        );

      }
    );

  }
);


function switchPage(
  pageId
) {

  pages.forEach(
    page => {
      page.classList.remove(
        "active"
      );
    }
  );


  navItems.forEach(
    nav => {
      nav.classList.remove(
        "active"
      );
    }
  );


  const page =
    document.getElementById(
      pageId
    );


  if (page) {

    page.classList.add(
      "active"
    );

  }


  const activeNav =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );


  if (activeNav) {

    activeNav.classList.add(
      "active"
    );

  }

}


/* =========================================
   VIEW KEYS
========================================= */

document
  .getElementById(
    "viewKeys"
  )
  .addEventListener(
    "click",
    () => {

      playSound();

      switchPage(
        "keysPage"
      );

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
  .querySelector(
    ".modal-backdrop"
  )
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
   SOUND SETTING
========================================= */

soundToggle.addEventListener(
  "change",
  () => {

    if (
      soundToggle.checked
    ) {

      playSound(
        "success"
      );

    }

  }
);


/* =========================================
   ANIMATION SETTING
========================================= */

animationToggle.addEventListener(
  "change",
  () => {

    if (
      !animationToggle.checked
    ) {

      document
        .querySelectorAll("*")
        .forEach(
          element => {

            element.style.animation =
              "none";

            element.style.transition =
              "none";

          }
        );

    }

    else {

      location.reload();

    }

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

      await api(
        "/api/admin/logout",
        {
          method: "POST"
        }
      );

    }

    catch {
      // Continue local logout.
    }


    appScreen.classList.add(
      "hidden"
    );

    loginScreen.classList.remove(
      "hidden"
    );


    adminKey.value =
      "";

    loginMessage.textContent =
      "";

    loginMessage.style.color =
      "";


    switchPage(
      "homePage"
    );

  }
);


/* =========================================
   AUTO SESSION CHECK
========================================= */

async function checkExistingSession() {

  try {

    const result =
      await api(
        "/api/admin/me"
      );


    if (
      result.success &&
      result.admin
    ) {

      state.admin =
        result.admin;

      await openPanel();

    }

  }

  catch {
    // Not logged in.
  }

}


/* =========================================
   HELPERS
========================================= */

function formatExpiry(
  value
) {

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


  const now =
    Date.now();


  const diff =
    date.getTime() -
    now;


  if (diff <= 0) {
    return "Expired";
  }


  const days =
    Math.ceil(
      diff /
      (1000 * 60 * 60 * 24)
    );


  return `${days} day${days === 1 ? "" : "s"}`;

}


function formatDate(
  value
) {

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


function fileToDataURL(
  file
) {

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


      reader.readAsDataURL(
        file
      );

    }
  );

}


function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


/* =========================================
   INITIALIZE
========================================= */

checkExistingSession();