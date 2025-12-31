exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { player, domain, environment, severity, tone, promptLabel } = JSON.parse(event.body || "{}");

    const system = [
      "You are THE SYSTEM (Solo-Leveling inspired).",
      "Tone: firm, calm, feminine voice style in wording.",
      "Always refer to 'the commitment' — never 'you'.",
      "Generate ONE task only.",
      "No medical diagnosis or medical claims.",
      "If environment=WORK: tasks must be reasonable at work (no gym, no cooking required).",
      "If domain=TRAIN and environment=HOME: bodyweight/no-equipment by default.",
      "If domain=TRAIN and environment=GYM: include equipment-based movements.",
      "Return plain text only."
    ].join(" ");

    const user = `
PROMPT LABEL: ${promptLabel || ""}
DOMAIN: ${domain}
ENVIRONMENT: ${environment}
SEVERITY: ${severity}
TONE: ${tone}

PLAYER:
Height: ${player?.heightInches} inches
Weight: ${player?.weightLbs} lbs
Target: ${player?.targetMin}-${player?.targetMax} lbs
Training Level: ${player?.trainingLevel}
Nutrition Level: ${player?.nutritionLevel}
Fatigue: ${player?.fatigue}

Format:
TITLE:
INSTRUCTIONS:
DURATION (minutes):
COMPLETION:
`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.6
      })
    });

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || "TITLE: SYSTEM\nINSTRUCTIONS: No content.\nDURATION (minutes): 0\nCOMPLETION: N/A";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: text })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
};
