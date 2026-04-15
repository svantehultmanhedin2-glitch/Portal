import { kv } from "./_kv.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const list = await kv.get(`notifications:${userId}`);
      return res.status(200).json(Array.isArray(list) ? list : []);
    }

    if (req.method === "POST") {
      const { userId, message } = req.body || {};
      if (!userId || !message) {
        return res.status(400).json({ error: "Missing data" });
      }

      const key = `notifications:${userId}`;
      const list = (await kv.get(key)) ?? [];

      const next = [
        {
          id: crypto.randomUUID(),
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...(Array.isArray(list) ? list : []),
      ];

      await kv.set(key, next);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const { userId, notifId } = req.body || {};
      if (!userId || !notifId) {
        return res.status(400).json({ error: "Missing data" });
      }

      const key = `notifications:${userId}`;
      const list = (await kv.get(key)) ?? [];

      const next = (Array.isArray(list) ? list : []).map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      );

      await kv.set(key, next);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
