export default {
  async fetch(request, env) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "ROKHAN Worker is connected",
        database: "Rokhan",
        d1: !!env.DB
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};