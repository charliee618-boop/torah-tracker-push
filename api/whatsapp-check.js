const userGoals = {};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  // Find all completions for this user
  const completions = {};
  Object.keys(userGoals).forEach(key => {
    if (key.startsWith(`completion:${email}:`)) {
      const goalId = key.split(":")[2];
      completions[goalId] = userGoals[key];
      delete userGoals[key]; // consume it so it's only processed once
    }
  });

  return res.status(200).json({ completions });
};
