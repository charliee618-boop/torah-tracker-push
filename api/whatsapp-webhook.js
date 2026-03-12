const twilio = require("twilio");

// Same in-memory store as whatsapp-send.js
// In production both files share state via Vercel KV
const userGoals = {};

module.exports = async function handler(req, res) {
  // Twilio sends webhook as POST with form data
  const from = req.body?.From?.replace("whatsapp:+972", "0").replace("whatsapp:+", "");
  const body = (req.body?.Body || "").trim();

  if (!from || !body) return res.status(400).end();

  const pending = userGoals[from];
  if (!pending) {
    // No pending goal for this number — ignore
    return res.status(200).send("<Response></Response>");
  }

  const isComplete = body.includes("הושלם") && !body.includes("לא הושלם");
  const isNotComplete = body.includes("לא הושלם") || body.includes("לא");

  if (!isComplete && !isNotComplete) {
    // Unrecognized reply — send clarification
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>לא הבנתי. אנא ענה *הושלם* או *לא הושלם*</Message>
</Response>`;
    return res.status(200).send(twiml);
  }

  if (isComplete) {
    // Notify the app to mark this goal complete
    // The app polls for completions or we write directly to storage
    // Store the completion so the app can pick it up on next load
    userGoals[`completion:${pending.userEmail}:${pending.goalId}`] = {
      completed: true,
      timestamp: Date.now(),
    };

    delete userGoals[from];

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>כל הכבוד! 🎉 ${pending.goalName} סומן כהושלם. כך מעלים!</Message>
</Response>`;
    return res.status(200).send(twiml);
  }

  if (isNotComplete) {
    delete userGoals[from];

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>בסדר, בהצלחה בלימוד! 📖 עוד יש זמן היום.</Message>
</Response>`;
    return res.status(200).send(twiml);
  }

  return res.status(200).send("<Response></Response>");
};
