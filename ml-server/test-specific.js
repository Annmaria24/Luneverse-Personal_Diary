const http = require('http');

const phrase = "i'm very sad today";

async function runTest() {
    console.log(`🧪 Testing prediction for: "${phrase}"...`);
    const data = JSON.stringify({ text: phrase });
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
                const result = JSON.parse(body);
                console.log(`\nAPI Response:`, result);

                // Let's manually simulate the mapping from aiMoodService.js
                const label = result.mood;
                let mapped = "Neutral";
                if (label.includes("sadness")) mapped = "Sad";
                else if (label.includes("joy")) mapped = "Happy";
                else if (label.includes("anger")) mapped = "Angry";
                else if (label.includes("fear")) mapped = "Stressed";

                console.log(`Mapping logic check: ${label} -> ${mapped}`);
            } catch (e) {
                console.error(`❌ Failed to parse response: ${body}`);
            }
        });
    });

    req.on('error', (error) => console.error('Error:', error));
    req.write(data);
    req.end();
}

runTest();
