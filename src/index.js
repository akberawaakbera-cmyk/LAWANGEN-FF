export default {
  async fetch(request, env) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "ROKHAN Worker is connected",
        database: "rokhan",
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