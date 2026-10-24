module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { prompt, system, code } = req.body || {};
  if (!prompt || prompt.length > 8000) return res.status(400).json({ error: "Bad prompt" });

  const text = code ? `${prompt}\n\nMy current code:\n\`\`\`\n${code}\n\`\`\`` : prompt;

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          ...(system && { systemInstruction: { parts: [{ text: system }] } }),
          contents: [{ role: "user", parts: [{ text }] }],
        }),
      }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Gemini error");
    const reply = d.candidates[0].content.parts.map((p) => p.text || "").join("");
    return res.json({ text: reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
