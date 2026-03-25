async function test(model = "gemini-pro", version = "v1") {
  const key = "AIzaSyD4oQ-jziEz3RQNu0GVTUoIlv9lE30_xuw";
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
  
  console.log(`Testing with ${version}/models/${model}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello Lune" }] }]
      })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    if (res.ok) {
        console.log("✅ SUCCESS!");
        console.log("Reply:", data.candidates[0].content.parts[0].text);
    } else {
        console.log("Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function runTests() {
  await test("gemini-1.5-flash", "v1beta");
  await test("gemini-1.5-flash", "v1");
  await test("gemini-pro", "v1");
}

runTests();
