# OpenAI API Integration for Mood Classification

## Overview
The Luneverse app now uses OpenAI API to determine the user's final mood by combining data from the Diary module and Mood Tracker module.

## Implementation Details

### 1. **OpenAI API Integration**
- **Service**: `src/services/aiMoodService.js`
- **API Key**: `VITE_OPENAI_API_KEY` (from `import.meta.env`)
- **Model**: `gpt-3.5-turbo`
- **Endpoint**: `https://api.openai.com/v1/chat/completions`

### 2. **Prompt Used**
```
Given the diary entry text and the user-selected mood, classify the final emotional state as one of: Happy, Sad, Angry, Stressed, Calm, or Neutral. Return only one word.

Diary entry text: "{diaryText}"
User-selected mood: "{manualMood}"
```

### 3. **Data Flow**

1. **When Diary Entry is Saved**:
   - User writes diary entry and optionally selects a mood
   - `addDiaryEntry()` in `diaryService.js` is called
   - `classifyMood()` in `aiMoodService.js` is called with:
     - Diary text (HTML stripped)
     - Manual mood selection
   - OpenAI API is called with the prompt
   - Response is validated and normalized
   - `finalMood` is stored in Firestore along with:
     - `mood` (original manual mood)
     - `finalMood` (AI-determined mood)
     - `moodConfidence` (confidence score)
     - `moodClassificationError` (if any errors occurred)

2. **Chart Updates**:
   - Charts use `getAggregatedMoodCounts()` from `moodService.js`
   - Combines data from:
     - `moodEntries` collection (mood tracker entries)
     - `diaryEntries` collection (diary entries with `finalMood`)
   - Aggregates by day/week/month
   - Shows accumulated counts (number of Happy, Sad, Stressed, etc.)

### 4. **Error Handling**

- **Missing API Key**: Falls back to manual mood mapping
- **API Errors**: Catches errors, logs them, and uses fallback
- **Invalid Responses**: Validates OpenAI response against valid moods
- **Network Issues**: Gracefully handles timeouts and network errors

### 5. **Loading States**

- **FullScreenEditor**: Shows "Saving entry & classifying mood..." during save
- **DiaryPage**: Shows loading spinner during save operation
- **Error Messages**: Displayed to user if save fails

### 6. **Chart Integration**

The mood trend charts now:
- Use `finalMood` from diary entries (OpenAI-classified)
- Combine with mood tracker entries
- Display accumulated counts per mood category
- Show data for Today (hourly), Week, and Month views
- Display actual counts on data points

## Setup Instructions

### 1. Add OpenAI API Key to `.env`
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. (Optional) Firebase Functions Fallback
If you want server-side classification as fallback:
```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
firebase deploy --only functions
```

## Data Structure

### Diary Entry in Firestore
```javascript
{
  userId: "user123",
  title: "Untitled Entry",
  content: "<p>Diary text...</p>",
  mood: "😊 Happy",              // Original manual mood
  finalMood: "Happy",            // OpenAI-classified mood
  moodConfidence: 0.9,           // Confidence score
  moodClassificationError: null, // Error message if classification failed
  date: "Mon Jan 15 2024",
  timestamp: Timestamp,
  createdAt: Timestamp
}
```

## Valid Mood Categories
- Happy
- Sad
- Angry
- Stressed
- Calm
- Neutral

## Features

✅ **Automatic Mood Classification**: When diary entries are saved
✅ **Combined Data**: Uses both diary text and manual mood selection
✅ **Accumulated Counts**: Charts show total counts per mood category
✅ **Error Handling**: Graceful fallbacks if API fails
✅ **Loading States**: User feedback during classification
✅ **Backward Compatible**: Existing data is preserved and reused

## Notes

- The API key is used client-side (exposed in browser)
- For production, consider moving to Firebase Functions for better security
- OpenAI API calls are made on every diary entry save/update
- Cost: ~$0.002 per 1K tokens (gpt-3.5-turbo is very affordable)
- Response time: Typically 1-3 seconds





