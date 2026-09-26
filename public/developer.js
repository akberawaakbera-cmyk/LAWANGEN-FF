/* =========================================
   LAWANGEN — DEVELOPER KEY MODULE
   ========================================= */

(function () {

  function getState() {
    return window.state || {};
  }

  function isDeveloper() {
    return getState().mode === "developer";
  }

  function api(url, options = {}) {
    if (typeof window.api === "function") {
      return window.api(url, options);
    }

    return fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }).then(async response => {
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    });
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* -----------------------------------------
     OPEN GENERATE MODAL
     ----------------------------------------- */

  async function openDeveloperKeyGenerator() {

    if (!isDeveloper()) {
      return;
    }

    const modal = document.getElementById("keyModal");

    if (!modal) {
      console.error("LAWANGEN: keyModal not found");
      return;
    }

    modal.classList.remove("hidden");

    await loadDeveloperGames();
  }

  /* -----------------------------------------
     LOAD GAMES
     ----------------------------------------- */

  async function loadDeveloperGames() {

    const select = document.getElementById("gameSelect");

    if (!select) return;

    select.innerHTML =
      `<option value="">Loading games...</option>`;

    try {

      const result =
        await api("/api/developer/services");

      const games =
        result.services ||
        result.games ||
        result.data ||
        [];

      if (!Array.isArray(games) || games.length === 0) {

        select.innerHTML =
          `<option value="">No games available</option>`;

        return;
      }

      select.innerHTML =
        `<option value="">Select Game</option>`;

      games.forEach(game => {

        if (game.status === "inactive") {
          return;
        }

        const option =
          document.createElement("option");

        option.value =
          game.name || game.service || "";

        option.textContent =
          game.name || game.service || "Unknown Game";

        select.appendChild(option);
      });

    } catch (error) {

      console.error(
        "LAWANGEN games:",
        error
      );

      select.innerHTML =
        `<option value="">Failed to load games</option>`;
    }
  }

  /* -----------------------------------------
     CREATE DEVELOPER USER KEY
     ----------------------------------------- */

  async function createDeveloperKey() {

    if (!isDeveloper()) {
      return;
    }

    const gameSelect =
      document.getElementById("gameSelect");

    const expirySelect =
      document.getElementById("expirySelect");

    const button =
      document.getElementById("createKeyButton");

    if (!gameSelect || !expirySelect) {
      return;
    }

    const game =
      gameSelect.value.trim();

    const days =
      Number(expirySelect.value);

    if (!game) {

      showMessage(
        "Please select a game first.",
        "error"
      );

      return;
    }

    if (!days || days < 1) {

      showMessage(
        "Please select a valid expiry.",
        "error"
      );

      return;
    }

    const oldText =
      button ? button.innerHTML : "";

    if (button) {
      button.disabled = true;
      button.innerHTML =
        `CREATING KEY <b>…</b>`;
    }

    try {

      const result =
        await api(
          "/api/developer/keys",
          {
            method: "POST",
            body: JSON.stringify({
              service: game,
              days: days
            })
          }
        );

      const generatedKey =
        result.api_key ||
        result.key ||
        result.access_key ||
        result.data?.api_key;

      if (!generatedKey) {

        throw new Error(
          "Server did not return a generated key."
        );
      }

      closeModal();

      showGeneratedKey(
        generatedKey,
        game,
        days
      );

      if (typeof window.loadKeys === "function") {
        await window.loadKeys();
      }

      if (typeof window.loadDashboard === "function") {
        await window.loadDashboard();
      }

    } catch (error) {

      console.error(
        "LAWANGEN Developer Key:",
        error
      );

      showMessage(
        error.message ||
        "Unable to create key.",
        "error"
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.innerHTML = oldText;
      }

    }
  }

  /* -----------------------------------------
     GENERATED KEY RESULT
     ----------------------------------------- */

  function showGeneratedKey(
    key,
    game,
    days
  ) {

    const existing =
      document.getElementById(
        "developerGeneratedKey"
      );

    if (existing) {
      existing.remove();
    }

    const box =
      document.createElement("div");

    box.id =
      "developerGeneratedKey";

    box.innerHTML = `
      <div class="developer-key-backdrop"></div>

      <div class="developer-key-card">

        <div class="developer-key-icon">
          🔑
        </div>

        <div class="developer-key-title">
          KEY GENERATED
        </div>

        <div class="developer-key-game">
          ${escapeHTML(game)}
        </div>

        <div class="developer-key-expiry">
          Expires in ${days} day${days == 1 ? "" : "s"}
        </div>

        <div class="developer-key-value">
          ${escapeHTML(key)}
        </div>

        <button
          type="button"
          id="copyDeveloperGeneratedKey"
          class="developer-key-copy"
        >
          COPY KEY
        </button>

        <button
          type="button"
          id="closeDeveloperGeneratedKey"
          class="developer-key-close"
        >
          DONE
        </button>

      </div>
    `;

    document.body.appendChild(box);

    document
      .getElementById(
        "copyDeveloperGeneratedKey"
      )
      ?.addEventListener(
        "click",
        async () => {

          try {

            await navigator.clipboard.writeText(
              key
            );

            const btn =
              document.getElementById(
                "copyDeveloperGeneratedKey"
              );

            if (btn) {
              btn.textContent =
                "COPIED ✓";

              setTimeout(() => {
                btn.textContent =
                  "COPY KEY";
              }, 1500);
            }

          } catch (error) {

            console.error(
              "Copy failed:",
              error
            );
          }
        }
      );

    document
      .getElementById(
        "closeDeveloperGeneratedKey"
      )
      ?.addEventListener(
        "click",
        () => {
          box.remove();
        }
      );

    box
      .querySelector(
        ".developer-key-backdrop"
      )
      ?.addEventListener(
        "click",
        () => {
          box.remove();
        }
      );
  }

  /* -----------------------------------------
     CLOSE MODAL
     ----------------------------------------- */

  function closeModal() {

    const modal =
      document.getElementById("keyModal");

    if (modal) {
      modal.classList.add("hidden");
    }
  }

  /* -----------------------------------------
     MESSAGE
     ----------------------------------------- */

  function showMessage(
    message,
    type = "error"
  ) {

    let box =
      document.getElementById(
        "developerKeyMessage"
      );

    if (!box) {

      box =
        document.createElement("div");

      box.id =
        "developerKeyMessage";

      document.body.appendChild(box);
    }

    box.className =
      `developer-key-message ${type}`;

    box.textContent =
      message;

    setTimeout(() => {

      box.classList.add("hidden");

    }, 3000);
  }

  /* -----------------------------------------
     EVENTS
     ----------------------------------------- */

  function setupEvents() {

    const generateButton =
      document.getElementById(
        "generateKeyButton"
      );

    const homeGenerate =
      document.getElementById(
        "generateFromHome"
      );

    const createButton =
      document.getElementById(
        "createKeyButton"
      );

    const closeButton =
      document.getElementById(
        "closeModal"
      );

    if (generateButton) {

      generateButton.addEventListener(
        "click",
        () => {

          if (isDeveloper()) {
            openDeveloperKeyGenerator();
          }

        }
      );
    }

    if (homeGenerate) {

      homeGenerate.addEventListener(
        "click",
        () => {

          if (isDeveloper()) {
            openDeveloperKeyGenerator();
          }

        }
      );
    }

    if (createButton) {

      createButton.addEventListener(
        "click",
        createDeveloperKey
      );
    }

    if (closeButton) {

      closeButton.addEventListener(
        "click",
        closeModal
      );
    }

  }

  /* -----------------------------------------
     EXTRA UI STYLE
     ----------------------------------------- */

  function injectStyles() {

    if (
      document.getElementById(
        "developerKeyStyles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "developerKeyStyles";

    style.textContent = `

      .developer-key-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      #developerGeneratedKey {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .developer-key-card {
        width: min(420px, 100%);
        padding: 28px 22px;
        border-radius: 28px;
        background:
          linear-gradient(
            145deg,
            rgba(28,31,40,.98),
            rgba(10,12,17,.98)
          );
        border: 1px solid rgba(255,255,255,.12);
        box-shadow:
          0 30px 90px rgba(0,0,0,.6);
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .developer-key-icon {
        font-size: 42px;
        margin-bottom: 12px;
      }

      .developer-key-title {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: .8px;
      }

      .developer-key-game {
        margin-top: 8px;
        font-size: 14px;
        opacity: .7;
      }

      .developer-key-expiry {
        margin-top: 5px;
        font-size: 12px;
        opacity: .55;
      }

      .developer-key-value {
        margin: 22px 0 14px;
        padding: 15px;
        border-radius: 15px;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.1);
        font-family: monospace;
        font-size: 15px;
        font-weight: 700;
        word-break: break-all;
        user-select: all;
      }

      .developer-key-copy,
      .developer-key-close {
        width: 100%;
        border: 0;
        border-radius: 14px;
        padding: 14px;
        font-weight: 800;
        cursor: pointer;
      }

      .developer-key-copy {
        background: #fff;
        color: #05070a;
        margin-bottom: 9px;
      }

      .developer-key-close {
        background: rgba(255,255,255,.08);
        color: #fff;
      }

      #developerKeyMessage {
        position: fixed;
        left: 50%;
        bottom: 110px;
        transform: translateX(-50%);
        z-index: 100000;
        padding: 12px 18px;
        border-radius: 14px;
        background: rgba(20,20,25,.95);
        border: 1px solid rgba(255,255,255,.1);
        font-size: 13px;
        box-shadow: 0 15px 40px rgba(0,0,0,.4);
      }

      #developerKeyMessage.error {
        border-color: rgba(255,80,80,.35);
      }

      #developerKeyMessage.hidden {
        display: none;
      }

    `;

    document.head.appendChild(style);
  }

  /* -----------------------------------------
     INIT
     ----------------------------------------- */

  function init() {

    injectStyles();
    setupEvents();

    console.log(
      "LAWANGEN Developer Key Module Ready"
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

  /* Public functions */

  window.LAWANGEN_DEVELOPER = {

    init,
    openDeveloperKeyGenerator,
    loadDeveloperGames,
    createDeveloperKey

  };

})();