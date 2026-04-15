import { kv } from "./_kv.js";

const KEY = "teams";

export default async function handler(req, res) {
  try {
    /* ===== READ: alla får läsa teams ===== */
    if (req.method === "GET") {
      const data = await kv.get(KEY);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    /* ===== WRITE: endast admin ===== */
    if (req.method === "POST") {
      const { teams, userRole } = req.body || {};

      // Behörighetskontroll
      if (userRole !== "admin") {
        return res.status(403).json({
          error: "Forbidden: insufficient privileges",
        });
      }

      if (!Array.isArray(teams)) {
        return res.status(400).json({ error: "Missing or invalid teams" });
      }

      await kv.set(KEY, teams);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Teams API error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}