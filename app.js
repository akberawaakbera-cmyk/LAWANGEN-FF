/* =========================================
   LAWANGIN ADMIN PANEL
   Frontend V1
========================================= */


/* -----------------------------------------
   DEMO DATA
   -----------------------------------------
   IMPORTANT:
   This is only frontend demo data.
   Real authentication must be done by
   your backend / Cloudflare Worker.
----------------------------------------- */

const state = {

  admin: {
    name: "ROKHAN SYED",
    role: "ADMIN"
  },

  keys: [
    {
      key: "LAW-7F9A-2K81",
      game: "Game Service 01",
      status: "active",
      expiry: "30 days"
    },
    {
      key: "LAW-4D21-8M72",
      game: "Game Service 01",
      status: "active",
      expiry: "18 days"
    },
    {
      key: "LAW-9P42-1X88",
      game: "Game Service 02",
      status: "expired",
      expiry: "Expired"
    },
    {
      key: "LAW-3K91-6Q24",
      game: "Game Service 02",
      status: "active",
      expiry: "7 days"
    }
  ],

  users: [
    {
      name: "User 001",
      key: "LAW-7F9A-2K81",
      status: "Active"
    },
    {
      name: "User 002",
      key: "LAW-4D21-8M72",
      status: "Active"
    },
    {
      name: "User 003",
      key: "LAW-9P42-1X88",
      status: "Expired"
    },
    {
      name: "User 004",
      key: "LAW-3K91-6Q24",
      status: "Active"
    }
  ]

};


/* -----------------------------------------
   ELEMENTS
----------------------------------------- */

const splash = document.getElementById("splash");
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const adminKey = document.getElementById("adminKey");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const showKey = document.getElementById("showKey");

const keyModal = document.getElementById("keyModal");
const closeModal = document.getElementById("closeModal");

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

const userCount =
  document.getElementById("userCount");


/* -----------------------------------------
   SPLASH
----------------------------------------- */

setTimeout(() => {

  splash.classList.add("hidden");
  loginScreen.classList.remove("hidden");

}, 3300);


/* -----------------------------------------
   SIMPLE SOUND
----------------------------------------- */

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

  } catch (error) {
    // Audio is optional.
  }
}


/* -----------------------------------------
   SHOW / HIDE KEY
----------------------------------------- */

showKey.addEventListener("click", () => {

  playSound();

  if (adminKey.type === "password") {

    adminKey.type = "text";
    showKey.textContent = "○";

  } else {

    adminKey.type = "password";
    showKey.textContent = "◉";

  }

});


/* -----------------------------------------
   LOGIN
----------------------------------------- */

loginButton.addEventListener("click", login);

adminKey.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    login();
  }

});


function login() {

  playSound();

  /*
    DEMO ONLY

    Replace this later with:

    fetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        key: adminKey.value
      })
    })

    The real key must NEVER be stored
    permanently inside app.js.
  */

  const entered =
    adminKey.value.trim();

  if (!entered) {

    loginMessage.textContent =
      "Please enter your Admin Key.";

    playSound("error");

    return;
  }


  /*
    Temporary demo login.

    For testing you can enter:
    ADMIN-DEMO-444

    This will be removed when backend
    authentication is connected.
  */

  if (entered !== "ADMIN-DEMO-444") {

    loginMessage.textContent =
      "Invalid or expired Admin Key.";

    playSound("error");

    return;
  }


  loginMessage.textContent =
    "✓ Access verified";

  loginMessage.style.color =
    "#35ff9b";

  playSound("success");


  setTimeout(() => {

    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    renderKeys();
    renderUsers();

  }, 650);

}


/* -----------------------------------------
   NAVIGATION
----------------------------------------- */

const navItems =
  document.querySelectorAll(".nav-item");

const pages =
  document.querySelectorAll(".page");


navItems.forEach(item => {

  item.addEventListener("click", () => {

    playSound();

    const pageId =
      item.dataset.page;

    pages.forEach(page => {
      page.classList.remove("active");
    });

    navItems.forEach(nav => {
      nav.classList.remove("active");
    });

    document
      .getElementById(pageId)
      .classList.add("active");

    item.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


/* -----------------------------------------
   OPEN KEYS FROM HOME
----------------------------------------- */

document
  .getElementById("viewKeys")
  .addEventListener("click", () => {

    playSound();

    switchPage("keysPage");

  });


function switchPage(pageId) {

  pages.forEach(page => {
    page.classList.remove("active");
  });

  navItems.forEach(nav => {
    nav.classList.remove("active");
  });

  document
    .getElementById(pageId)
    .classList.add("active");

  const activeNav =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );

  if (activeNav) {
    activeNav.classList.add("active");
  }

}


/* -----------------------------------------
   KEY MODAL
----------------------------------------- */

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

  keyModal.classList.remove("hidden");

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

  keyModal.classList.add("hidden");

}


/* -----------------------------------------
   GENERATE KEY
----------------------------------------- */

createKeyButton.addEventListener(
  "click",
  () => {

    playSound("success");

    const game =
      document.getElementById("gameSelect").value;

    const days =
      document.getElementById("expirySelect").value;


    const newKey = {

      key: generateRandomKey(),

      game: game,

      status: "active",

      expiry: `${days} days`

    };


    state.keys.unshift(newKey);

    updateStats();

    renderKeys();

    closeKeyModal();

    switchPage("keysPage");

  }
);


function generateRandomKey() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function part(length) {

    let result = "";

    for (let i = 0; i < length; i++) {

      result +=
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ];

    }

    return result;

  }

  return `LAW-${part(4)}-${part(4)}`;

}


/* -----------------------------------------
   RENDER KEYS
----------------------------------------- */

function renderKeys(filter = "") {

  const search =
    filter.toLowerCase().trim();


  const filtered =
    state.keys.filter(item => {

      return (
        item.key.toLowerCase().includes(search) ||
        item.game.toLowerCase().includes(search)
      );

    });


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


  filtered.forEach((item, index) => {

    const card =
      document.createElement("div");

    card.className =
      "key-card glass";


    card.innerHTML = `

      <div class="key-top">

        <span class="key-value">
          ${item.key}
        </span>

        <span class="badge ${item.status}">
          ${item.status.toUpperCase()}
        </span>

      </div>

      <div class="key-bottom">

        <span>
          ${item.game}
        </span>

        <span>
          ${item.expiry}
        </span>

      </div>

      <div class="key-actions">

        <button
          class="small-button copy-button"
          data-key="${item.key}"
        >
          COPY
        </button>

        <button
          class="small-button revoke"
          data-index="${index}"
        >
          REVOKE
        </button>

      </div>

    `;


    keyList.appendChild(card);

  });


  attachKeyActions();

}


/* -----------------------------------------
   KEY ACTIONS
----------------------------------------- */

function attachKeyActions() {

  document
    .querySelectorAll(".copy-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          playSound();

          const key =
            button.dataset.key;

          try {

            await navigator.clipboard.writeText(key);

            button.textContent = "COPIED ✓";

            setTimeout(() => {
              button.textContent = "COPY";
            }, 1000);

          } catch {

            button.textContent = "COPY KEY";

          }

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

          const index =
            Number(button.dataset.index);

          state.keys[index].status =
            "expired";

          state.keys[index].expiry =
            "Revoked";

          renderKeys();

          updateStats();

        }
      );

    });

}


/* -----------------------------------------
   SEARCH
----------------------------------------- */

keySearch.addEventListener(
  "input",
  event => {

    renderKeys(event.target.value);

  }
);


/* -----------------------------------------
   RENDER USERS
----------------------------------------- */

function renderUsers() {

  userList.innerHTML = "";


  state.users.forEach(user => {

    const card =
      document.createElement("div");

    card.className =
      "user-card glass";


    const initials =
      user.name
        .split(" ")
        .map(word => word[0])
        .join("");


    card.innerHTML = `

      <div class="user-avatar">
        ${initials}
      </div>

      <div class="user-info">

        <strong>
          ${user.name}
        </strong>

        <small>
          ${user.key}
        </small>

      </div>

      <span
        class="badge ${
          user.status === "Active"
            ? "active"
            : "expired"
        }"
      >
        ${user.status.toUpperCase()}
      </span>

    `;


    userList.appendChild(card);

  });

}


/* -----------------------------------------
   STATS
----------------------------------------- */

function updateStats() {

  const active =
    state.keys.filter(
      item => item.status === "active"
    ).length;

  activeKeys.textContent =
    active;

  totalUsers.textContent =
    state.users.length;

  userCount.textContent =
    state.users.length;

}


/* -----------------------------------------
   SOUND SETTING
----------------------------------------- */

soundToggle.addEventListener(
  "change",
  () => {

    if (soundToggle.checked) {
      playSound("success");
    }

  }
);


/* -----------------------------------------
   ANIMATION SETTING
----------------------------------------- */

animationToggle.addEventListener(
  "change",
  () => {

    if (!animationToggle.checked) {

      document
        .querySelectorAll("*")
        .forEach(element => {

          element.style.animation =
            "none";

          element.style.transition =
            "none";

        });

    } else {

      location.reload();

    }

  }
);


/* -----------------------------------------
   LOGOUT
----------------------------------------- */

logoutButton.addEventListener(
  "click",
  () => {

    playSound();

    appScreen.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    adminKey.value = "";

    loginMessage.textContent = "";

    switchPage("homePage");

  }
);


/* -----------------------------------------
   INITIALIZE
----------------------------------------- */

updateStats();