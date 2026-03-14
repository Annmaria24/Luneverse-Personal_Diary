const http = require('http');

const testPhrases = [
    "I am so happy today! Everything is going great.",
    "I feel really sad and lonely lately.",
    "I am so angry at how things turned out!",
    "I feel very calm and peaceful by the lake.",
    "The situation is very stressful and I feel overwhelmed."
];

async function runTest(text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ text });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/predict',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
}

async function startTests() {
    console.log('🧪 Starting ML Server verification tests...\n');
    for (const phrase of testPhrases) {
        try {
            const result = await runTest(phrase);
            console.log(`Input: "${phrase}"`);
            console.log(`Prediction: ${result.mood} (${(result.confidence * 100).toFixed(1)}% confidence)\n`);
        } catch (error) {
            console.error(`❌ Test failed for phrase: "${phrase}"`);
            console.error(`Error: ${error.message}\n`);
        }
    }
}

startTests();
