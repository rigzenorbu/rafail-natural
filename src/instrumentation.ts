// Next.js runs this once when the server starts, before it serves any page.
export async function register() {
  // Written as an if-block (not an early return) so Next.js leaves this out of its edge build.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { bootstrap } = await import("./lib/bootstrap");
      await bootstrap();
    } catch (err) {
      console.error("[setup] Could not prepare the database:", err);
    }
  }
}
