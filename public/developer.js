/* =========================================
   LAWANGEN — DEVELOPER MODULE
   ========================================= */

window.LAWANGEN_DEVELOPER = {

  init() {
    console.log("LAWANGEN Developer Module Loaded");
  },

  isDeveloper() {
    return window.state?.mode === "developer";
  }

};