# API Keys Summary for Luneverse AI Integration

## AI Service API Keys Used

### 1. **OpenAI API Key** ⭐ PRIMARY
Used for AI mood classification (combines diary text + manual mood selection).

**Location:**
- **Client-side** (Frontend):
  - Environment variable: `VITE_OPENAI_API_KEY`
  - Used in: `src/services/aiMoodService.js`
  - Set in: `.env` file in project root

**Usage:**
- Mood classification when saving diary entries
- Combines diary text and user-selected mood
- Returns: Happy, Sad, Angry, Stressed, Calm, or Neutral
- Model: `gpt-3.5-turbo`

**Firebase Functions (Optional Fallback):**
- Config: `functions.config().openai?.key`
- Set via: `firebase functions:config:set openai.key="YOUR_KEY"`

---

### 2. **Google Gemini API Key** 
Used for AI mood classification and chatbot features.

**Locations:**
- **Firebase Functions** (`functions/index.js`):
  - Config: `functions.config().gemini?.key`
  - Used in: `classifyMoodWithGemini()` function
  - Set via: `firebase functions:config:set gemini.key="YOUR_KEY"`

- **Client-side** (Frontend):
  - Environment variable: `VITE_GEMINI_API_KEY`
  - Used in:
    - `src/pages/RelaxChatbot.jsx` - Chatbot feature
    - `src/pages/Reflect.jsx` - Reflection/chat feature
  - Set in: `.env` file in project root

**Usage:**
- Mood classification (combines diary text + manual mood)
- Relax chatbot responses
- Reflect page AI conversations

---

### 2. **Hugging Face API Key**
Used as fallback for sentiment analysis and mood classification.

**Locations:**
- **Firebase Functions** (`functions/index.js`):
  - Config: `functions.config().huggingface?.key`
  - Used in:
    - `analyzeSentiment()` function
    - `classifyMood()` function (fallback)
  - Set via: `firebase functions:config:set huggingface.key="YOUR_KEY"`

- **Legacy API** (`api/analyzeSentiment.js`):
  - Environment variable: `HUGGINGFACE_KEY` (via `process.env`)
  - Note: This file appears to be unused/legacy

**Usage:**
- Sentiment analysis (POSITIVE/NEGATIVE/NEUTRAL)
- Fallback mood classification when Gemini is unavailable
- Model: `distilbert-base-uncased-finetuned-sst-2-english`

---

### 3. **Firebase Configuration Keys**
Standard Firebase project configuration (not AI-specific, but required).

**Location:** `src/firebase/config.js`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## How to Set Up API Keys

### For Firebase Functions (Server-side):
```bash
# Set Gemini API key
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# Set Hugging Face API key
firebase functions:config:set huggingface.key="YOUR_HUGGINGFACE_KEY"

# Deploy functions
firebase deploy --only functions
```

### For Client-side (Frontend):
Create a `.env` file in the `wellness-app` directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** 
- Never commit `.env` files to git (should be in `.gitignore`)
- Client-side API keys are exposed in the browser - use with caution
- For production, consider using Firebase Functions for all AI calls to keep keys secure

---

## Current Implementation Status

✅ **Mood Classification** (`classifyMood` function):
- Primary: Gemini API (if configured)
- Fallback: Hugging Face API (if configured)
- Final fallback: Manual mood mapping (no API needed)

✅ **Sentiment Analysis** (`analyzeSentiment` function):
- Uses: Hugging Face API

✅ **Chatbot Features**:
- RelaxChatbot: Uses Gemini API (client-side)
- Reflect: Uses Gemini API (client-side)

---

## Recommendations

1. **Security**: Move all AI API calls to Firebase Functions to keep keys server-side
2. **Cost Management**: Monitor API usage for both Gemini and Hugging Face
3. **Fallback Strategy**: Current implementation gracefully falls back if APIs are unavailable
4. **Environment Variables**: Ensure `.env` is in `.gitignore` and never committed

