const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const natural = require('natural');
const path = require('path');
const fs = require('fs');
const { preprocessText } = require('./train');

const app = express();
const PORT = process.env.PORT || 5000;
const MODEL_PATH = path.join(__dirname, 'model.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

let classifier;

/**
 * Loads the trained model from model.json
 */
function loadModel() {
    console.log('⏳ Loading model...');
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(MODEL_PATH)) {
            return reject(new Error(`Model file not found at ${MODEL_PATH}. Please run training script first.`));
        }

        natural.BayesClassifier.load(MODEL_PATH, null, (err, loadedClassifier) => {
            if (err) {
                return reject(err);
            }
            classifier = loadedClassifier;
            console.log('✅ Model loaded and ready for inference.');
            resolve();
        });
    });
}

// Predict Sentiment/Mood Endpoint
app.post('/predict', (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Please provide text for mood prediction.' });
    }

    if (!classifier) {
        return res.status(503).json({ error: 'Model is not yet loaded. Please try again in a moment.' });
    }

    try {
        const processedText = preprocessText(text);

        // If preprocessing leaves no words (e.g., all stopwords), fallback to neutral
        if (processedText.length === 0) {
            return res.json({ mood: 'Neutral', confidence: 0 });
        }

        const classifications = classifier.getClassifications(processedText);

        // Filter out 'Neutral' from classifications
        const validClassifications = classifications.filter(c => c.label !== "Neutral");

        const topResult = validClassifications.length > 0 ? validClassifications[0] : classifications[0];
        const mood = topResult.label;

        const logEntry = `\n--- Prediction Debug ---\nOriginal: ${text}\nProcessed: ${processedText}\nFiltered Classifications: ${JSON.stringify(validClassifications, null, 2)}\n`;
        fs.appendFileSync(path.join(__dirname, 'prediction_logs.txt'), logEntry);

        console.log("Original text:", text);
        console.log("Processed text:", processedText);
        console.log("Classifications:", classifications);

        // Calculate confidence using Softmax
        let confidence = 0.5;
        if (validClassifications.length > 0) {
            const maxVal = Math.max(...validClassifications.map(c => c.value));
            const expValues = validClassifications.map(c => Math.exp(c.value - maxVal));
            const sumExp = expValues.reduce((sum, val) => sum + val, 0);
            const topExp = Math.exp(topResult.value - maxVal);
            confidence = sumExp > 0 ? topExp / sumExp : 0;
        }

        res.json({
            mood: mood,
            confidence: parseFloat(confidence.toFixed(4))
        });
    } catch (error) {
        console.error('Inference error:', error);
        res.status(500).json({ error: 'Failed to perform prediction.' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'up', modelLoaded: !!classifier });
});

// Initialize and Start Server
const server = app.listen(PORT, async () => {
    try {
        await loadModel();
        console.log(`🚀 ML Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('❌ Failed to load model:', error.message);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => console.log('HTTP server closed'));
});
process.on('SIGINT', () => {
    server.close(() => console.log('HTTP server closed'));
});
