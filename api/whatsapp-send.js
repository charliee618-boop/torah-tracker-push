const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory store — same limitation as before, upgrade to Vercel KV for production
const userGoals = {};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { phone, goalName, goalSubtitle, userEmail, goalId } = req.body;
  if (!phone || !goalName) return res.status(400).json({ error: "Missing fields" });

  const message = `📖 מעקב לימוד תורה\n\nתזכורת: *${goalName}*${goalSubtitle ? `\n${goalSubtitle}` : ""}\n\nהאם השלמת את הלימוד היום?\nענה *הושלם* או *לא הושלם*`;

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+972${phone.replace(/^0/, "")}`,
      body: message,
    });

    // Store pending response so webhook knows who replied
    userGoals[phone] = { userEmail, goalId, goalName, timestamp: Date.now() };

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return res.status(500).json({ error: err.message });
  }
};
