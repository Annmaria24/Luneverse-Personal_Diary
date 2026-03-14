const http = require('http');

const phrases = [
    "I am so grateful for this wonderful day.",
    "Everything is so blessed and amazing.",
    "I had a very frustrating day today.",
    "I feel completely overwhelmed by everything.",
    "It was a peaceful night and very relaxing.",
    "I had an amazing day at the park."
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
    console.log('🧪 Verifying augmented keywords...\n');
    for (const phrase of phrases) {
        try {
            const result = await runTest(phrase);
            console.log(`Input: "${phrase}"`);
            console.log(`Prediction: ${result.mood} (${(result.confidence * 100).toFixed(1)}% confidence)\n`);
        } catch (error) {
            console.error(`❌ Test failed for: "${phrase}"`);
        }
    }
}

startTests();
