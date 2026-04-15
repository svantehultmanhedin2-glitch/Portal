import { kv } from "./_kv.js";

const KEY = "catalog:leaderclothes";

export default async function handler(req, res) {
  try {
    // ===== READ: alla får läsa =====
    if (req.method === "GET") {
      const data = await kv.get(KEY);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    // ===== WRITE: endast admin =====
    if (req.method === "POST") {
      const { items, userRole } = req.body || {};

      // Behörighetskontroll
      if (userRole !== "admin") {
        return res.status(403).json({
          error: "Forbidden: insufficient privileges",
        });
      }

      // Validering
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Missing or invalid items" });
      }

      // Spara
      await kv.set(KEY, items);
      return res.status(200).json({ ok: true });
    }

    // ===== Unsupported methods =====
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Catalog API error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}