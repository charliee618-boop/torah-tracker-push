const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const subscriptions = {};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { email, title, body } = req.body;
  if (!email || !subscriptions[email]) {
    return res.status(404).json({ error: "No subscription found" });
  }

  try {
    await webpush.sendNotification(
      subscriptions[email],
      JSON.stringify({ title, body })
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    delete subscriptions[email];
    return res.status(410).json({ error: "Subscription expired" });
  }
};
