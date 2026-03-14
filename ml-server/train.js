const fs = require('fs');
const natural = require('natural');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.csv');
const MODEL_PATH = path.join(__dirname, 'model.json');

const tokenizer = new natural.WordTokenizer();

// Standard English stopwords list

/**
 * Maps dataset labels (joy, sadness, etc.) to application mood categories.
 */
function mapLabel(label) {
    if (!label) return "Neutral";
    const labelLower = label.toLowerCase().trim();

    const mapping = {
        joy: "Happy",
        sadness: "Sad",
        anger: "Angry",
        fear: "Stressed",
        love: "Calm",
        surprise: "Neutral"
    };

    return mapping[labelLower] || "Neutral";
}

/**
 * Preprocesses text: 
 * - Converts to lowercase
 * - Removes punctuation using regex
 * - Tokenizes using WordTokenizer
 * - Removes English stopwords
 * - Applies PorterStemmer
 * - Joins back into a string
 */
function preprocessText(text) {
    if (!text || typeof text !== 'string') return "";

    // 1. Convert to lowercase
    let processed = text.toLowerCase();

    // 2. Remove punctuation using regex
    processed = processed.replace(/[^\w\s]/gi, ' ');

    // 3. Tokenize (WordTokenizer)
    const tokens = tokenizer.tokenize(processed);

    // 4. Remove English stopwords (Merge custom with natural's defaults)
    const baseStopwords = (natural.stopwords && Array.isArray(natural.stopwords)) ? natural.stopwords : [];
    const customStopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't", 'feel', 'feeling', 'day', 'today', 'everything', 'complete', 'completely'];
    const stopwordsList = Array.from(new Set([...baseStopwords, ...customStopwords]));

    const filtered = tokens.filter(token => !stopwordsList.includes(token));

    // 5. Apply PorterStemmer (with exceptions for emotional intensity)
    const protectedWords = ['wonderful', 'amazing', 'grateful', 'blessed', 'fantastic', 'frustrating', 'overwhelmed', 'peaceful'];
    const stemmed = filtered.map(token => {
        if (protectedWords.includes(token)) {
            return token; // Keep intact
        }
        return natural.PorterStemmer.stem(token);
    });

    // 6. Return tokens array directly for the classifier
    return stemmed;
}

/**
 * Trains a Naive Bayes classifier using the data in data.csv
 * and saves the trained model to model.json
 */
async function trainModel() {
    console.log('🚀 Starting model training with 80/20 split and preprocessing...');

    try {
        const classifier = new natural.BayesClassifier();

        // Read the CSV data
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const lines = data.split('\n');

        const allEntries = [];
        let currentText = "";

        lines.forEach((line, index) => {
            let trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Handle multi-line: Check if the line has a semicolon
            const lastSemicolonIndex = trimmedLine.lastIndexOf(';');

            if (lastSemicolonIndex !== -1) {
                // This line contains a label (and possibly some text)
                const textPart = trimmedLine.substring(0, lastSemicolonIndex);
                const rawLabel = trimmedLine.substring(lastSemicolonIndex + 1);

                // Combine with any previously collected text from multi-lines
                let combinedText = currentText + " " + textPart;

                // Clean the text and label of all surrounding quotes
                combinedText = combinedText.replace(/^["']|["']$/g, '').trim();
                let cleanLabel = rawLabel.replace(/^["']|["']$/g, '').trim();

                if (combinedText && cleanLabel) {
                    const normalizedLabel = mapLabel(cleanLabel);
                    const processedTokens = preprocessText(combinedText);

                    if (processedTokens.length > 0) {
                        allEntries.push({ tokens: processedTokens, label: normalizedLabel });
                    }
                }

                // Reset currentText for next entry
                currentText = "";
            } else {
                // This is a continuation of the previous text
                currentText += " " + trimmedLine;
            }
        });

        // 0. Augment with Synthetic Data for Positive Emotions
        const syntheticData = [
            // Happy (joy)
            { text: "wonderful day", label: "joy" },
            { text: "amazing day", label: "joy" },
            { text: "grateful", label: "joy" },
            { text: "blessed", label: "joy" },
            { text: "fantastic", label: "joy" },
            { text: "I had a wonderful and productive day at work today.", label: "joy" },
            { text: "Everything about this morning was amazing and bright.", label: "joy" },
            { text: "I am so grateful for the supportive people in my life.", label: "joy" },
            { text: "The afternoon was filled with joyful moments and laughter.", label: "joy" },
            { text: "We had a fantastic time at the park today.", label: "joy" },
            { text: "It was such a great day from start to finish.", label: "joy" },
            { text: "I had an amazing conversation with an old friend.", label: "joy" },
            { text: "Feeling blessed today for everything I have.", label: "joy" },
            { text: "What an amazing day we had at the beach!", label: "joy" },
            { text: "I'm so blessed to have such wonderful friends.", label: "joy" },
            { text: "I had a wonderful day exploring the new city.", label: "joy" },
            { text: "Grateful for the small wins I had today.", label: "joy" },
            { text: "Everything is so amazing lately, I'm so happy.", label: "joy" },
            { text: "So blessed to wake up healthy and strong.", label: "joy" },
            { text: "I feel so lucky and blessed today.", label: "joy" },
            { text: "An amazing day filled with new discoveries.", label: "joy" },

            // Calm (love)
            { text: "peaceful night", label: "love" },
            { text: "relaxing evening", label: "love" },
            { text: "I feel truly blessed to have such a loving family.", label: "love" },
            { text: "The yoga session was so relaxing and restorative.", label: "love" },
            { text: "I feel completely peaceful sitting by the ocean.", label: "love" },
            { text: "The evening was so relaxing and stress-free.", label: "love" },
            { text: "It was a peaceful night, looking at the stars.", label: "love" },
            { text: "I am feeling so grateful for this relaxing evening.", label: "love" },
            { text: "Spent a relaxing evening watching my favorite show.", label: "love" },
            { text: "It was a peaceful night in the countryside.", label: "love" },
            { text: "Nothing beats a relaxing evening with a good book.", label: "love" },
            { text: "I feel so calm and peaceful right now.", label: "love" },
            { text: "The house is so quiet and peaceful tonight.", label: "love" },

            // Angry (anger)
            { text: "frustrating day", label: "anger" },
            { text: "Today was such a frustrating day; everything went wrong.", label: "anger" },
            { text: "This frustrating day is finally over, thank goodness.", label: "anger" },
            { text: "Felt very frustrated with the slow progress today.", label: "anger" },
            { text: "I had a frustrating day at the office today.", label: "anger" },
            { text: "I am so angry and frustrated right now.", label: "anger" },
            { text: "It's so frustrating when people don't listen.", label: "anger" },

            // Stressed (fear)
            { text: "overwhelmed", label: "fear" },
            { text: "I feel completely overwhelmed by my workload right now.", label: "fear" },
            { text: "I've been feeling overwhelmed and anxious all week.", label: "fear" },
            { text: "Overwhelmed by all the responsibilities on my plate.", label: "fear" },
            { text: "I feel overwhelmed and I don't know where to start.", label: "fear" },
            { text: "Everything is just too much, I am completely overwhelmed.", label: "fear" },
            { text: "I feel very stressed and overwhelmed today.", label: "fear" },
            { text: "Exam week is making me feel so overwhelmed.", label: "fear" },

            // --- Additional 20+ Diary Examples ---
            // Happy (joy)
            { text: "I am feeling so grateful for my family and friends today.", label: "joy" },
            { text: "Waking up this morning, I realized how truly blessed I am.", label: "joy" },
            { text: "Today was a wonderful day from start to finish.", label: "joy" },
            { text: "I had such an amazing day exploring the new city.", label: "joy" },
            { text: "I'm incredibly grateful for all the support I received today.", label: "joy" },
            { text: "Feeling absolutely blessed for the opportunities coming my way.", label: "joy" },
            { text: "What a wonderful day full of sunshine, smiles, and laughter.", label: "joy" },
            { text: "This has been an absolutely amazing day at work.", label: "joy" },
            { text: "I finished my project and it was a wonderful day overall.", label: "joy" },
            { text: "Reflecting on my journal, I'm just so grateful.", label: "joy" },

            // Calm (love)
            { text: "Enjoying a quiet and relaxing evening at home with a book.", label: "love" },
            { text: "Such a peaceful night listening to the rain outside.", label: "love" },
            { text: "This relaxing evening was exactly what I needed to recharge my energy.", label: "love" },
            { text: "Going for a walk under the stars made for a peaceful night.", label: "love" },
            { text: "Taking a hot bath made for a wonderfully relaxing evening.", label: "love" },
            { text: "Meditation gave me such a peaceful night's rest.", label: "love" },

            // Angry (anger)
            { text: "Today was a really frustrating day at work with my boss.", label: "anger" },
            { text: "I can't believe how much went wrong, such a frustrating day.", label: "anger" },
            { text: "Another frustrating day dealing with the exact same problems as yesterday.", label: "anger" },
            { text: "Traffic was horrible, making it a very frustrating day.", label: "anger" },

            // Stressed (fear)
            { text: "I'm feeling so overwhelmed by all these looming deadlines.", label: "fear" },
            { text: "There is too much to do and I feel completely overwhelmed.", label: "fear" },
            { text: "Being overwhelmed with responsibilities is making me highly anxious.", label: "fear" },
            { text: "Looking at my calendar just makes me feel overwhelmed.", label: "fear" },

            // Sad (sadness)
            { text: "I feel incredibly sad and heartbroken tonight.", label: "sadness" },
            { text: "Today brought back some hard memories, feeling very lonely and sad.", label: "sadness" }
        ];

        // Add 50 copies of core keywords to truly dominate biases
        const boosters = [
            { text: "amazing", label: "joy" },
            { text: "wonderful", label: "joy" },
            { text: "grateful", label: "joy" },
            { text: "blessed", label: "joy" },
            { text: "overwhelmed", label: "fear" },
            { text: "frustrating", label: "anger" },
            { text: "peaceful", label: "love" }
        ];

        boosters.forEach(b => {
            const tokens = preprocessText(b.text);
            const label = mapLabel(b.label);
            for (let i = 0; i < 50; i++) {
                allEntries.push({ tokens, label });
            }
        });

        syntheticData.forEach(item => {
            const normalizedLabel = mapLabel(item.label);
            const tokens = preprocessText(item.text);
            if (tokens.length > 0) {
                allEntries.push({ tokens, label: normalizedLabel });
            }
        });

        const labelCounts = {};
        allEntries.forEach(entry => {
            labelCounts[entry.label] = (labelCounts[entry.label] || 0) + 1;
        });
        console.log('\n📊 Label Distribution (Normalized):');
        const labels = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];
        Object.entries(labelCounts).forEach(([label, count]) => {
            console.log(`- ${label}: ${count} (${(count / allEntries.length * 100).toFixed(1)}%)`);
        });

        // 1. Shuffle the dataset randomly
        for (let i = allEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allEntries[i], allEntries[j]] = [allEntries[j], allEntries[i]];
        }

        // 2. Implement 80/20 split
        const trainSize = Math.floor(allEntries.length * 0.8);
        const rawTrainSet = allEntries.slice(0, trainSize);
        const testSet = allEntries.slice(trainSize);

        // 3. Balance the Training Set (Oversampling)
        const trainCounts = {};
        rawTrainSet.forEach(e => trainCounts[e.label] = (trainCounts[e.label] || 0) + 1);
        const maxTrainSize = Math.max(...Object.values(trainCounts));

        const balancedTrainSet = [];
        labels.forEach(label => {
            const classSamples = rawTrainSet.filter(e => e.label === label);
            if (classSamples.length === 0) return;

            const repeatCount = Math.floor(maxTrainSize / classSamples.length);
            for (let i = 0; i < repeatCount; i++) {
                balancedTrainSet.push(...classSamples);
            }
        });

        console.log(`📝 Balanced Training Set: ${balancedTrainSet.length} samples`);
        console.log(`📝 Testing samples: ${testSet.length}`);

        // 4. Train on Balanced Data
        balancedTrainSet.forEach(entry => {
            classifier.addDocument(entry.tokens, entry.label);
        });

        console.log('⏳ Training...');
        classifier.train();

        // 4. Evaluate on 20% test set
        let correctCount = 0;
        const confusionMatrix = {};

        labels.forEach(l1 => {
            confusionMatrix[l1] = {};
            labels.forEach(l2 => confusionMatrix[l1][l2] = 0);
        });

        console.log('\n🔍 Detailed Evaluation:');
        testSet.forEach((entry, idx) => {
            const results = classifier.getClassifications(entry.tokens);
            const topResult = results[0];
            const prediction = topResult.label;

            const totalScore = results.reduce((sum, r) => sum + r.value, 0);
            const confidencePercent = totalScore > 0 ? (topResult.value / totalScore) * 100 : 0;

            if (prediction === entry.label) {
                correctCount++;
            }

            if (confusionMatrix[entry.label] && confusionMatrix[entry.label][prediction] !== undefined) {
                confusionMatrix[entry.label][prediction]++;
            }

            if (idx < 20) {
                console.log(`Sample ${idx + 1}: Actual [${entry.label}] | Pred [${prediction}] (${confidencePercent.toFixed(1)}%) | ${prediction === entry.label ? '✅' : '❌'}`);
            }
        });

        const accuracy = (correctCount / testSet.length) * 100;
        console.log(`\nModel Accuracy: ${accuracy.toFixed(2)}%`);

        console.log('\n📊 Confusion Summary (Actual \\ Predicted):');
        let header = '          ';
        labels.forEach(l => header += l.padEnd(10));
        console.log(header);
        labels.forEach(actual => {
            let row = actual.padEnd(10);
            labels.forEach(pred => {
                row += confusionMatrix[actual][pred].toString().padEnd(10);
            });
            console.log(row);
        });

        // 5. Manual Verification Test
        console.log('\n🧪 Running Manual Verification Tests:');
        const testPhrases = [
            "I cried all evening and felt exhausted.",
            "I felt calm and relaxed today.",
            "I was extremely anxious about my exams.",
            "I had a joyful and productive day."
        ];

        testPhrases.forEach(phrase => {
            const processed = preprocessText(phrase);
            const results = classifier.getClassifications(processed);
            const top = results[0];
            const totalScore = results.reduce((sum, r) => sum + r.value, 0);
            const confidencePercent = totalScore > 0 ? (top.value / totalScore) * 100 : 0;

            console.log(`- Sentence: "${phrase}"`);
            console.log(`  Prediction: ${top.label} (${confidencePercent.toFixed(1)}% confidence)`);
        });
        console.log('');

        // Save the model
        classifier.save(MODEL_PATH, (err) => {
            if (err) {
                console.error('❌ Error saving model:', err);
                return;
            }
            console.log(`✅ Model successfully trained and saved to ${MODEL_PATH}`);
        });

    } catch (error) {
        console.error('❌ Error during training:', error);
    }
}

// Export for use in prediction
module.exports = {
    preprocessText,
    trainModel
};

// Run if called directly
if (require.main === module) {
    trainModel();
}
