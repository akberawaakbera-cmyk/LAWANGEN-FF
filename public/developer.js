/* =========================================
   LAWANGEN — DEVELOPER KEY GENERATOR
   ========================================= */

(function () {

  function isDeveloper() {
    return window.state && window.state.mode === "developer";
  }

  function openKeyModal() {

    if (!isDeveloper()) return;

    const modal = document.getElementById("keyModal");

    if (!modal) {
      console.error("LAWANGEN: keyModal not found");
      return;
    }

    modal.classList.remove("hidden");

    loadGames();
  }

  async function loadGames() {

    const select = document.getElementById("gameSelect");

    if (!select) return;

    select.innerHTML =
      '<option value="">Loading games...</option>';

    try {

      const response =
        await fetch("/api/developer/services", {
          credentials: "include"
        });

      const result =
        await response.json();

      const games =
        result.services ||
        result.games ||
        result.data ||
        [];

      select.innerHTML =
        '<option value="">Select Game</option>';

      if (!Array.isArray(games)) return;

      games.forEach(game => {

        if (game.status === "inactive") return;

        const name =
          game.name ||
          game.service;

        if (!name) return;

        const option =
          document.createElement("option");

        option.value = name;
        option.textContent = name;

        select.appendChild(option);
      });

    } catch (error) {

      console.error(
        "LAWANGEN Game Loading:",
        error
      );

      select.innerHTML =
        '<option value="">Unable to load games</option>';
    }
  }

  async function createKey() {

    if (!isDeveloper()) return;

    const game =
      document.getElementById("gameSelect")?.value;

    const days =
      document.getElementById("expirySelect")?.value;

    if (!game) {
      alert("Please select a game.");
      return;
    }

    try {

      const button =
        document.getElementById("createKeyButton");

      if (button) {
        button.disabled = true;
        button.innerHTML =
          "CREATING KEY...";
      }

      const response =
        await fetch(
          "/api/developer/keys",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              service: game,
              days: Number(days)
            })
          }
        );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.error ||
          result.message ||
          "Key creation failed"
        );
      }

      const key =
        result.api_key ||
        result.key;

      if (!key) {
        throw new Error(
          "Server did not return a key."
        );
      }

      alert(
        "KEY CREATED\n\n" +
        key +
        "\n\nGame: " +
        game +
        "\nExpiry: " +
        days +
        " days"
      );

      document
        .getElementById("keyModal")
        ?.classList.add("hidden");

    } catch (error) {

      console.error(
        "LAWANGEN Key Generator:",
        error
      );

      alert(
        error.message ||
        "Unable to create key."
      );

    } finally {

      const button =
        document.getElementById("createKeyButton");

      if (button) {
        button.disabled = false;
        button.innerHTML =
          'CREATE KEY <b>→</b>';
      }
    }
  }

  function connectButtons() {

    const generate =
      document.getElementById(
        "generateKeyButton"
      );

    const homeGenerate =
      document.getElementById(
        "generateFromHome"
      );

    const create =
      document.getElementById(
        "createKeyButton"
      );

    /*
     * CAPTURE PHASE
     * This runs before the old app.js
     * click handler.
     */

    if (generate) {

      generate.addEventListener(
        "click",
        function (event) {

          if (!isDeveloper()) return;

          event.preventDefault();
          event.stopImmediatePropagation();

          openKeyModal();

        },
        true
      );
    }

    if (homeGenerate) {

      homeGenerate.addEventListener(
        "click",
        function (event) {

          if (!isDeveloper()) return;

          event.preventDefault();
          event.stopImmediatePropagation();

          openKeyModal();

        },
        true
      );
    }

    if (create) {

      create.addEventListener(
        "click",
        function (event) {

          if (!isDeveloper()) return;

          event.preventDefault();
          event.stopImmediatePropagation();

          createKey();

        },
        true
      );
    }

    console.log(
      "LAWANGEN Developer Key Generator Connected"
    );
  }

  function start() {

    connectButtons();

    setTimeout(
      connectButtons,
      1000
    );

    setTimeout(
      connectButtons,
      2500
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();
  }

})();