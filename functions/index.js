const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cors = require("cors")({ origin: true });

// Hugging Face model
const HF_MODEL = "distilbert-base-uncased-finetuned-sst-2-english";

exports.analyzeSentiment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
      const { text } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ error: "No text provided" });

      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${functions.config().huggingface.key}`
        },
        body: JSON.stringify({ inputs: text })
      });

      const raw = await hfRes.json();
      const top = Array.isArray(raw) && raw[0] ? raw[0] : { label: "NEUTRAL", score: 0.5 };

      const label = String(top.label || "NEUTRAL").toUpperCase().includes("POS")
        ? "POSITIVE"
        : String(top.label || "").toUpperCase().includes("NEG")
        ? "NEGATIVE"
        : "NEUTRAL";

      return res.json({ label, score: Number(top.score || 0.5) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Server error" });
    }
  });
});
