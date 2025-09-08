import "dotenv/config";  // loads .env locally
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  let text = "";
  try {
    const body = req.body;
    if (typeof body === "string") {
      text = JSON.parse(body).text;
    } else {
      text = body.text;
    }
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
   const hfRes = await fetch(
  "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
    },
    body: JSON.stringify({ inputs: text }),
  }
);


    const raw = await hfRes.json();
    const top = Array.isArray(raw) && raw[0] ? raw[0] : { label: "NEUTRAL", score: 0.5 };

    const label = String(top.label || "NEUTRAL").toUpperCase().includes("POS")
      ? "POSITIVE"
      : String(top.label || "").toUpperCase().includes("NEG")
      ? "NEGATIVE"
      : "NEUTRAL";

    res.status(200).json({ label, score: Number(top.score || 0.5) });
  } catch (e) {
    console.error("Error in Hugging Face call:", e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
