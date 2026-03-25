/**
 * AI Mood Classification Service
 * Uses OpenAI API to classify mood from diary text + manual mood
 */

/**
 * Classify mood using OpenAI API by combining diary text and manual mood selection
 * @param {string} diaryText - The diary entry text (HTML will be stripped)
 * @param {string} manualMood - The manually selected mood (optional)
 * @returns {Promise<{finalMood: string, confidence: number, isLoading: boolean, error: string|null}>}
 */
const MOOD_SCORES = { Sad: 0, Angry: 1, Stressed: 2, Neutral: 3, Calm: 4, Happy: 5 };
const REVERSE_SCORES = ['Sad', 'Angry', 'Stressed', 'Neutral', 'Calm', 'Happy'];

export const classifyMood = async (diaryText, manualMood = "") => {
  console.log("🔍 [AI Service] Starting classification pipeline...");

  let result = {
    finalMood: "Neutral",
    confidence: 0.5,
    isLoading: false,
    error: null
  };

  try {
    const normalizedManual = mapManualMoodToFinal(manualMood);
    const manualScore = MOOD_SCORES[normalizedManual] ?? 3;

    // If no diary text, return normalized manual mood directly with high confidence
    // (no text = no ML signal, so manual mood IS the truth — don't dilute it with Neutral)
    if (!diaryText || !diaryText.trim()) {
      console.log(`ℹ️ [AI Service] No text provided. Using manual mood directly: ${normalizedManual}`);
      return { ...result, finalMood: normalizedManual, confidence: 0.9 };
    }

    let diaryMood = "Neutral";
    let diaryConfidence = 0.5;

    // --- STEP 1: Local ML Execution ---
    try {
        const cleanTextForML = diaryText
          .replace(/<[^>]*>/g, " ")
          .replace(/&[a-z0-9]+;/gi, " ")
          .replace(/&#\d+;/gi, " ")
          .trim();

        const mlServerRes = await fetch("http://localhost:5000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanTextForML })
        });

      if (mlServerRes.ok) {
        const mlData = await mlServerRes.json();
        diaryMood = mapLabelToMood(mlData.mood);
        diaryConfidence = mlData.confidence || 0.7;
        console.log(`📥 [AI Service] ML Prediction: ${mlData.mood} -> ${diaryMood} (Conf: ${diaryConfidence})`);
      } else {
        throw new Error("ML Server returned error");
      }
    } catch (mlErr) {
      console.warn("⚠️ [AI Service] Local ML unavailable, trying OpenAI fallback...");

      // Fallback to OpenAI
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (apiKey) {
        const cleanText = diaryText
          .replace(/<[^>]*>/g, " ")
          .replace(/&[a-z0-9]+;/gi, " ")
          .replace(/&#\d+;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "Classify mood: Happy, Sad, Angry, Stressed, Calm, or Neutral." }, { role: "user", content: cleanText }],
            temperature: 0.3, max_tokens: 10
          })
        });

        if (response.ok) {
          const data = await response.json();
          const moodText = data?.choices?.[0]?.message?.content?.trim() || "";
          diaryMood = REVERSE_SCORES.find(m => moodText.toLowerCase().includes(m.toLowerCase())) || "Neutral";
          diaryConfidence = 0.85;
          console.log(`📥 [AI Service] OpenAI Prediction: ${diaryMood}`);
        }
      }
    }

    // --- STEP 2: Weighted Aggregation ---
    // If ML gave a strong signal, trust it more (0.6 diary + 0.4 manual)
    // If ML confidence is low (<0.4), let manual mood have equal say (0.5 / 0.5)
    const diaryScore = MOOD_SCORES[diaryMood] ?? 3;
    const diaryWeight = diaryConfidence >= 0.4 ? 0.6 : 0.5;
    const manualWeight = 1 - diaryWeight;
    const weightedScore = (diaryScore * diaryWeight) + (manualScore * manualWeight);

    // Map weighted score back to label
    let finalMood = "Neutral";
    if (weightedScore < 0.8) finalMood = "Sad";
    else if (weightedScore < 1.8) finalMood = "Angry";
    else if (weightedScore < 2.8) finalMood = "Stressed";
    else if (weightedScore < 3.8) finalMood = "Neutral";
    else if (weightedScore < 4.8) finalMood = "Calm";
    else finalMood = "Happy";

    console.log(`⚖️ [AI Service] Weighted Aggregation:`, {
      diary: `${diaryMood} (${diaryScore}) x 0.7`,
      manual: `${normalizedManual} (${manualScore}) x 0.3`,
      resultScore: weightedScore.toFixed(2),
      finalCategory: finalMood
    });

    return {
      finalMood,
      confidence: Math.round(weightedScore * 10) / 10,
      isLoading: false,
      error: null
    };

  } catch (error) {
    console.error("❌ [AI Service] Pipeline Failure:", error);
    return { ...result, finalMood: mapManualMoodToFinal(manualMood), error: error.message };
  }
};

/**
 * Map manual mood selection to final mood categories
 * @param {string} manualMood - The manually selected mood
 * @returns {string} Final mood category
 */
function mapManualMoodToFinal(manualMood) {
  if (!manualMood) return "Neutral";

  const moodLower = manualMood.toLowerCase();
  const moodMap = {
    happy: "Happy",
    loved: "Happy",
    grateful: "Happy",
    sad: "Sad",
    crying: "Sad",
    frustrated: "Angry",
    anxious: "Stressed",
    tired: "Stressed",
    calm: "Calm",
    neutral: "Neutral",
  };

  for (const [key, value] of Object.entries(moodMap)) {
    if (moodLower.includes(key)) return value;
  }

  return "Neutral";
}

/**
 * Map local ML model labels (sadness, joy, etc.) to the app's final mood categories
 * @param {string} label - The raw label from the local ML server
 * @returns {string} Final mood category (Happy, Sad, Angry, Stressed, Calm, Neutral)
 */
function mapLabelToMood(label) {
  if (!label) return "Neutral";

  const labelLower = label.toLowerCase();

  // Mapping for data.csv labels (sadness, joy, love, anger, fear, surprise)
  if (labelLower.includes("sadness")) return "Sad";
  if (labelLower.includes("joy")) return "Happy";
  if (labelLower.includes("love")) return "Happy";
  if (labelLower.includes("anger")) return "Angry";
  if (labelLower.includes("fear")) return "Stressed";
  if (labelLower.includes("surprise")) return "Neutral";

  // General fallbacks
  const moodMap = {
    happy: "Happy",
    sad: "Sad",
    angry: "Angry",
    stressed: "Stressed",
    calm: "Calm",
    neutral: "Neutral"
  };

  for (const [key, value] of Object.entries(moodMap)) {
    if (labelLower.includes(key)) return value;
  }

  return "Neutral";
}

/**
 * Generate emotional insights from mood statistics and/or trend data using OpenAI API
 * @param {number} totalEntries - Total number of mood entries
 * @param {Object} moodCounts - Object with mood counts (e.g., {Happy: 2, Sad: 1, Calm: 1})
 * @param {string} dominantMood - The dominant mood
 * @param {string} timePeriod - The time period (today, week, month)
 * @param {Object} [trendData] - Optional: { dataPoints, trendDirection } for trend-based insight
 * @returns {Promise<{insight: string, isLoading: boolean, error: string|null}>}
 */
export const generateEmotionalInsight = async (totalEntries, moodCounts, dominantMood, timePeriod = "period", trendData = null) => {
  // Initialize return object
  let result = {
    insight: "",
    isLoading: false,
    error: null
  };

  try {
    // Get OpenAI API key from environment
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("OpenAI API key not found. Using fallback insight.");
      return {
        ...result,
        insight: `Your dominant mood this ${timePeriod} has been ${dominantMood.toLowerCase()}—noticing patterns can help you understand what supports your wellbeing.`,
        error: "OpenAI API key not configured"
      };
    }

    // Prepare mood counts string
    const moodCountsString = Object.entries(moodCounts)
      .filter(([mood, count]) => count > 0)
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(", ");

    let trendSection = "";
    if (trendData?.dataPoints?.length > 1) {
      const scores = trendData.dataPoints.map(p => p.y);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      trendSection = `\nEmotional trend over time: scores ranged from ${min} to ${max}, average ${avg} (scale 1-6: Sad to Happy). Focus on emotional stability, rises, and drops.`;
    }

    // Prepare the prompt for emotional insight (one concise sentence)
    const prompt = `Based on the following mood tracking data, generate exactly ONE short, empathetic sentence that helps the user interpret their emotional pattern. Use simple, non-judgmental language. Avoid medical or diagnostic terms. No repetition. Focus on emotional trends—stability, rises, drops—when relevant.

Time period: ${timePeriod}
Total entries: ${totalEntries}
Mood distribution: ${moodCountsString}
Dominant mood: ${dominantMood}${trendSection}

Respond with a single warm, supportive sentence (no bullet points, no multiple sentences).`;

    // Call OpenAI API
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
            content: "You are a compassionate wellness assistant. Generate exactly one concise, supportive sentence to help users interpret their mood pattern. Warm and non-judgmental. No medical terms. No repetition or filler."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 80
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const insight = data?.choices?.[0]?.message?.content?.trim() || "";

    if (insight) {
      return {
        insight: insight,
        isLoading: false,
        error: null
      };
    } else {
      return {
        ...result,
        insight: `Your dominant mood this ${timePeriod} has been ${dominantMood.toLowerCase()}—tracking helps you notice what supports your wellbeing.`,
        error: "No insight generated"
      };
    }

  } catch (error) {
    console.error("Error generating emotional insight with OpenAI:", error);
    return {
      ...result,
      insight: `Your dominant mood this ${timePeriod} has been ${dominantMood.toLowerCase()}—noticing patterns can help you understand what supports your wellbeing.`,
      error: error.message || "Failed to generate insight"
    };
  }
};

