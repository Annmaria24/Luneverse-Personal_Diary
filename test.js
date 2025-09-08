// test.js
import fetch from "node-fetch";

const mode = process.argv[2] || "local"; // default to local
const text = "I feel happy today.";

async function testLocal() {
  console.log("🔹 Testing LOCAL API...");
  try {
    const res = await fetch("http://localhost:3000/api/analyzeSentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    console.log("Local Response:", data);
  } catch (err) {
    console.error("Local Error:", err.message);
  }
}

async function testHF() {
  console.log("🔹 Testing Hugging Face API directly...");
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
        },
        body: JSON.stringify({ inputs: text }),
      }
    );
    const data = await res.json();
    console.log("HF Response:", data);
  } catch (err) {
    console.error("HF Error:", err.message);
  }
}

if (mode === "hf") {
  testHF();
} else {
  testLocal();
}
