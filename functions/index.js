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

// AI Mood Classification: Combines diary text and manual mood selection using OpenAI
// Returns one of: Happy, Sad, Angry, Stressed, Calm, Neutral
exports.classifyMood = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
      
      const { diaryText, manualMood } = req.body || {};
      if (!diaryText || !diaryText.trim()) {
        // If no diary text, use manual mood as fallback
        if (manualMood) {
          const mappedMood = mapManualMoodToFinal(manualMood);
          return res.json({ finalMood: mappedMood, confidence: 0.7 });
        }
        return res.status(400).json({ error: "No diary text or manual mood provided" });
      }

      // Clean diary text (remove HTML tags for better analysis)
      const cleanText = diaryText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      
      // Try OpenAI API first if available
      const openaiKey = functions.config().openai?.key;
      if (openaiKey) {
        try {
          const openaiResponse = await classifyMoodWithOpenAI(cleanText, manualMood, openaiKey);
          if (openaiResponse) {
            return res.json(openaiResponse);
          }
        } catch (openaiError) {
          console.warn("OpenAI API failed, falling back to manual mapping:", openaiError);
        }
      }

      // Fallback to manual mood mapping if OpenAI is not available
      const mappedMood = mapManualMoodToFinal(manualMood || "");
      return res.json({ finalMood: mappedMood || "Neutral", confidence: 0.6 });
    } catch (e) {
      console.error("Error in classifyMood:", e);
      // Final fallback
      const mappedMood = mapManualMoodToFinal(req.body?.manualMood || "");
      return res.json({ finalMood: mappedMood || "Neutral", confidence: 0.5 });
    }
  });
});

// Helper: Classify mood using OpenAI API
async function classifyMoodWithOpenAI(diaryText, manualMood, apiKey) {
  try {
    const prompt = `Given the diary entry text and the user-selected mood, classify the final emotional state as one of: Happy, Sad, Angry, Stressed, Calm, or Neutral. Return only one word.

Diary entry text: "${diaryText}"
User-selected mood: "${manualMood || "Not specified"}"`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a mood classification assistant. Return only one word from the list: Happy, Sad, Angry, Stressed, Calm, or Neutral."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const moodText = data?.choices?.[0]?.message?.content?.trim() || "";
    
    // Validate and normalize the response
    const validMoods = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];
    const normalizedMood = validMoods.find(m => 
      moodText.toLowerCase() === m.toLowerCase() || 
      moodText.toLowerCase().includes(m.toLowerCase())
    );
    
    if (normalizedMood) {
      return { finalMood: normalizedMood, confidence: 0.9 };
    }
    return null;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null;
  }
}

// Helper: Classify mood using Gemini API
async function classifyMoodWithGemini(diaryText, manualMood, apiKey) {
  try {
    const prompt = `Analyze the following diary entry and user-selected mood, then classify the final emotional state into exactly one of these categories: Happy, Sad, Angry, Stressed, Calm, Neutral.

Diary text: "${diaryText.substring(0, 1000)}"
User-selected mood: "${manualMood || "Not specified"}"

Consider both the text content and the user's self-reported mood. Respond with ONLY one word from the list: Happy, Sad, Angry, Stressed, Calm, or Neutral.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 10 }
      })
    });

    const data = await response.json();
    const moodText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // Validate and normalize the response
    const validMoods = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];
    const normalizedMood = validMoods.find(m => moodText.toLowerCase().includes(m.toLowerCase()));
    
    if (normalizedMood) {
      return { finalMood: normalizedMood, confidence: 0.85 };
    }
    return null;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}

// Helper: Combine sentiment analysis with manual mood selection
function combineSentimentAndManualMood(sentiment, manualMood, text) {
  const validMoods = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];
  
  // Map manual mood to final mood categories
  const manualMapped = mapManualMoodToFinal(manualMood);
  
  // Analyze text for specific emotion keywords
  const textLower = text.toLowerCase();
  const stressKeywords = ["stress", "overwhelmed", "pressure", "worried", "anxious", "frustrated"];
  const angryKeywords = ["angry", "mad", "furious", "annoyed", "irritated", "rage"];
  const sadKeywords = ["sad", "depressed", "down", "unhappy", "crying", "tears", "lonely"];
  const happyKeywords = ["happy", "joy", "excited", "glad", "pleased", "cheerful", "grateful"];
  const calmKeywords = ["calm", "peaceful", "relaxed", "serene", "tranquil", "content"];
  
  let textMood = null;
  if (stressKeywords.some(kw => textLower.includes(kw))) textMood = "Stressed";
  else if (angryKeywords.some(kw => textLower.includes(kw))) textMood = "Angry";
  else if (sadKeywords.some(kw => textLower.includes(kw))) textMood = "Sad";
  else if (happyKeywords.some(kw => textLower.includes(kw))) textMood = "Happy";
  else if (calmKeywords.some(kw => textLower.includes(kw))) textMood = "Calm";
  
  // Combine: prioritize text analysis, then manual mood, then sentiment
  if (textMood && validMoods.includes(textMood)) return textMood;
  if (manualMapped && validMoods.includes(manualMapped)) return manualMapped;
  if (sentiment === "POSITIVE") return "Happy";
  if (sentiment === "NEGATIVE") return "Sad";
  return "Neutral";
}

// Helper: Map manual mood selection to final mood categories
function mapManualMoodToFinal(manualMood) {
  if (!manualMood) return "Neutral";
  
  const moodLower = manualMood.toLowerCase();
  const moodMap = {
    "happy": "Happy",
    "loved": "Happy",
    "grateful": "Happy",
    "sad": "Sad",
    "crying": "Sad",
    "frustrated": "Angry",
    "anxious": "Stressed",
    "tired": "Stressed",
    "calm": "Calm",
    "neutral": "Neutral"
  };
  
  for (const [key, value] of Object.entries(moodMap)) {
    if (moodLower.includes(key)) return value;
  }
  
  return "Neutral";
}