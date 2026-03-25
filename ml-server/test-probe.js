const key = "AIzaSyD4oQ-jziEz3RQNu0GVTUoIlv9lE30_xuw";

async function probe(model, ver = "v1beta") {
    const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${key}`;
    console.log(`[PROBE] ${ver}/${model}...`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        const status = res.status;
        const text = await res.text();
        console.log(`[RESULT] ${status} - ${text.substring(0, 200)}`);
        if (res.ok) return true;
    } catch (e) { console.log(`[ERR] ${e.message}`); }
    return false;
}

async function run() {
    await probe("gemini-1.5-flash");
    await probe("gemini-1.5-flash-latest");
    await probe("gemini-1.5-flash-001");
    await probe("gemini-1.5-pro");
    await probe("gemini-pro");
    await probe("gemini-1.5-flash", "v1");
}

run();
