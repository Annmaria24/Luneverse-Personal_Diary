const http = require('http');

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

(async () => {
    const text = "I had a wonderful day today";
    console.log(`Testing: "${text}"`);
    try {
        const result = await runTest(text);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
