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

// Add a new diary entry
export const addDiaryEntry = async (userId, entryData) => {
  try {
    const docRef = await addDoc(collection(db, "diaryEntries"), {
      userId,
      title: entryData.title || "Untitled Entry",
      content: entryData.content,
      mood: entryData.mood || "",
      tags: entryData.tags || [],
      date: entryData.date, // Store the date string for filtering
      timestamp: new Date(),
      createdAt: new Date(),
    });
    
    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding diary entry:", error);
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
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId),
      where("timestamp", ">=", startDate),
      where("timestamp", "<", endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching diary entries count:", error);
    throw error;
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
    const entryRef = doc(db, "diaryEntries", id);
    await updateDoc(entryRef, {
      ...updatedData,
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
