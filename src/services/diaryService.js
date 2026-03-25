import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { classifyMood } from "./aiMoodService";

// Add a new diary entry
export const addDiaryEntry = async (userId, entryData) => {
  try {
    console.log("📝 [Interpretation Pipeline] Starting diary analysis...");

    // Use the unified classification service
    // This will handle local ML prediction + OpenAI fallback
    const analysis = await classifyMood(entryData.content, entryData.mood || "");

    console.log(`🧠 [Interpretation Pipeline] Result:`, {
      contentMood: analysis.finalMood,
      confidence: analysis.confidence,
      manualHint: entryData.mood
    });

    const docRef = await addDoc(collection(db, "diaryEntries"), {
      userId,
      title: entryData.title || "Untitled Entry",
      content: entryData.content,
      mood: entryData.mood || "", // Original manual selection
      finalMood: analysis.finalMood, // Interpreted mood
      moodConfidence: analysis.confidence,
      moodClassificationError: analysis.error,
      tags: entryData.tags || [],
      date: entryData.date,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    console.log("✅ [Interpretation Pipeline] Saved to database with ID:", docRef.id);
    window.dispatchEvent(new Event('dashboardDataUpdated'));

    return {
      id: docRef.id,
      finalMood: analysis.finalMood,
      confidence: analysis.confidence,
      error: analysis.error
    };
  } catch (error) {
    console.error("❌ [Interpretation Pipeline] Error:", error);
    throw error;
  }
};

// Get all diary entries for a user, optionally filtered by date
export const getDiaryEntries = async (userId, dateString = null) => {
  try {
    // Get all entries for the user first (without ordering to avoid composite index requirement)
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    let allEntries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${allEntries.length} total entries for user ${userId}`);

    // Sort by timestamp on the client side
    allEntries.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return bTime - aTime; // Descending order (newest first)
    });

    // Filter by date if specified
    if (dateString) {
      const filteredEntries = allEntries.filter(entry => entry.date === dateString);
      console.log(`Filtered to ${filteredEntries.length} entries for date ${dateString}`);
      return filteredEntries;
    }

    return allEntries;
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    throw error;
  }
};

// Get count of diary entries for the current month
export const getDiaryEntriesCountForMonth = async (userId, year, month) => {
  try {
    // First try the optimized query
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    try {
      const q = query(
        collection(db, "diaryEntries"),
        where("userId", "==", userId),
        where("timestamp", ">=", startDate),
        where("timestamp", "<", endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (indexError) {
      console.warn("Composite index not available, using client-side filtering:", indexError);

      // Fallback to client-side filtering
      const q = query(
        collection(db, "diaryEntries"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      console.log(`Found ${snapshot.size} total diary entries for user ${userId}`);

      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (timestamp >= startDate && timestamp < endDate) {
          count++;
          console.log(`Diary entry ${doc.id} matches month filter:`, data.date || timestamp);
        }
      });

      console.log(`Filtered diary count for ${year}-${month}: ${count}`);
      return count;
    }
  } catch (error) {
    console.error("Error fetching diary entries count:", error);
    return 0; // Return 0 instead of throwing to prevent dashboard from breaking
  }
};

// Get latest diary entries for a user (regardless of date)
export const getLatestDiaryEntries = async (userId, limitCount = 10) => {
  try {
    // Get all entries for the user first (without ordering to avoid composite index requirement)
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    let allEntries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Sort by timestamp on the client side and limit
    allEntries.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return bTime - aTime; // Descending order (newest first)
    });

    // Return only the requested number of entries
    return allEntries.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching latest diary entries:", error);
    throw error;
  }
};

// Delete a diary entry
export const deleteDiaryEntry = async (id) => {
  try {
    await deleteDoc(doc(db, "diaryEntries", id));
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    throw error;
  }
};

// Update a diary entry
export const updateDiaryEntry = async (id, updatedData) => {
  try {
    // If content or mood changed, re-classify mood using OpenAI
    let finalMood = updatedData.finalMood; // Keep existing if not updating content/mood
    let moodConfidence = updatedData.moodConfidence;
    let moodClassificationError = null;

    if (updatedData.content !== undefined || updatedData.mood !== undefined) {
      try {
        const plainText = (updatedData.content || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&[a-z0-9]+;/gi, " ")
          .replace(/&#\d+;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        console.log("Sending updated diary text to ML server...");
        const response = await fetch("http://localhost:5000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: plainText })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Received ML server response:", result);

        finalMood = result.mood || "Neutral";
        moodConfidence = result.confidence || 0.5;
      } catch (error) {
        console.warn("ML backend prediction failed during update:", error);
        // Keep existing finalMood or use manual mood
        if (!finalMood) {
          finalMood = updatedData.mood || "Neutral";
        }
        moodClassificationError = error.message || "ML prediction failed";
      }
    }

    const entryRef = doc(db, "diaryEntries", id);
    await updateDoc(entryRef, {
      ...updatedData,
      finalMood: finalMood,
      moodConfidence: moodConfidence,
      moodClassificationError: moodClassificationError,
      updatedAt: new Date() // Add updated timestamp
    });
  } catch (error) {
    console.error("Error updating diary entry:", error);
    throw error;
  }
};

// Search diary entries by content
export const searchDiaryEntries = async (userId, searchTerm) => {
  try {
    // Get all entries for the user first (without ordering to avoid composite index requirement)
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    let allEntries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter by search term on the client side (case-insensitive)
    const filteredEntries = allEntries.filter(entry =>
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.title && entry.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by timestamp on the client side
    filteredEntries.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return bTime - aTime; // Descending order (newest first)
    });

    return filteredEntries;
  } catch (error) {
    console.error("Error searching diary entries:", error);
    throw error;
  }
};

// Get aggregated mood counts from diary entries
export const getDiaryMoodCounts = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    // Get all diary entries for the user
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    let allEntries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
    }));

    // Helper function to get date range
    const getDateRange = (mode, date) => {
      const d = new Date(date);
      let startDate, endDate;
      switch (mode) {
        case 'today':
          startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
          break;
        case 'week':
          const dayOfWeek = d.getDay();
          startDate = new Date(d);
          startDate.setDate(d.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(d.getFullYear(), d.getMonth(), 1);
          endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          break;
        default:
          startDate = new Date(2020, 0, 1);
          endDate = new Date();
          endDate.setDate(endDate.getDate() + 1);
      }
      return { startDate, endDate };
    };

    const { startDate, endDate } = getDateRange(viewMode, selectedDate);

    // Filter entries by date range
    const filteredEntries = allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate < endDate;
    });

    // Aggregate moods by count
    const moodCounts = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Stressed: 0,
      Calm: 0,
      Neutral: 0
    };

    filteredEntries.forEach(entry => {
      const mood = entry.finalMood || entry.mood || "Neutral";
      // Normalize mood to one of the valid categories
      const normalizedMood = normalizeMood(mood);
      if (moodCounts.hasOwnProperty(normalizedMood)) {
        moodCounts[normalizedMood]++;
      }
    });

    // Convert to array format for charts
    const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count
    }));

    return {
      moodCounts,
      moodData,
      totalEntries: filteredEntries.length,
      entries: filteredEntries
    };
  } catch (error) {
    console.error("Error getting diary mood counts:", error);
    return {
      moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 },
      moodData: [],
      totalEntries: 0,
      entries: []
    };
  }
};

// Helper: Normalize mood to standard categories
function normalizeMood(mood) {
  if (!mood) return "Neutral";

  const moodLower = mood.toLowerCase();
  const validMoods = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];

  // Direct match
  if (validMoods.some(m => moodLower === m.toLowerCase())) {
    return validMoods.find(m => moodLower === m.toLowerCase());
  }

  // Partial match
  if (moodLower.includes("happy") || moodLower.includes("joy") || moodLower.includes("loved") || moodLower.includes("grateful")) {
    return "Happy";
  }
  if (moodLower.includes("sad") || moodLower.includes("depressed") || moodLower.includes("crying")) {
    return "Sad";
  }
  if (moodLower.includes("angry") || moodLower.includes("mad") || moodLower.includes("frustrated")) {
    return "Angry";
  }
  if (moodLower.includes("stress") || moodLower.includes("anxious") || moodLower.includes("worried") || moodLower.includes("tired")) {
    return "Stressed";
  }
  if (moodLower.includes("calm") || moodLower.includes("peace") || moodLower.includes("relaxed")) {
    return "Calm";
  }

  return "Neutral";
}
