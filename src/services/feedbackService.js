import { db, auth } from "../firebase/config";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc, where } from "firebase/firestore";
import { getErrorMessage } from "../utils/errorMessages";

/**
 * ✅ Submit user feedback
 */
export const submitUserFeedback = async (uid, feedbackData) => {
  try {
    const currentUid = auth?.currentUser?.uid || uid;

    console.log("🔄 Attempting to submit feedback for user:", currentUid);
    console.log("📝 Feedback data:", feedbackData);

    // Validate required fields
    if (!currentUid) {
      throw new Error("User ID is required");
    }

    if (!feedbackData.message || !feedbackData.message.trim()) {
      throw new Error("Feedback message is required");
    }

    const feedbackRef = await addDoc(collection(db, "userFeedback"), {
      uid: currentUid,
      type: feedbackData.type || 'general',
      subject: feedbackData.subject || '',
      message: feedbackData.message.trim(),
      rating: feedbackData.rating || null,
      category: feedbackData.category || 'general',
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: 'new', // new, reviewed, responded, closed
      priority: feedbackData.priority || 'medium', // low, medium, high
      tags: feedbackData.tags || [],
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });

    console.log("✅ User feedback submitted successfully:", feedbackRef.id);
    return { success: true, id: feedbackRef.id };
  } catch (error) {
    console.error("❌ Error submitting user feedback:", error);
    console.error("🔍 Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Create a new error with user-friendly message
    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

/**
 * ✅ Get all user feedback for admin
 */
export const getAllUserFeedback = async () => {
  try {
    const q = query(collection(db, 'userFeedback'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const feedback = [];

    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : null
      });
    });

    return feedback;
  } catch (error) {
    console.error("❌ Error fetching user feedback:", error);
    throw error;
  }
};

/**
 * ✅ Get user feedback by status
 */
export const getUserFeedbackByStatus = async (status = 'new') => {
  try {
    const q = query(
      collection(db, 'userFeedback'),
      where('status', '==', status),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const feedback = [];

    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : null
      });
    });

    return feedback;
  } catch (error) {
    console.error("❌ Error fetching user feedback by status:", error);
    throw error;
  }
};

/**
 * ✅ Update feedback status
 */
export const updateFeedbackStatus = async (feedbackId, status, adminResponse = null) => {
  try {
    const updateData = { status };

    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = serverTimestamp();
    }

    await setDoc(doc(db, 'userFeedback', feedbackId), updateData, { merge: true });

    console.log("✅ Feedback status updated successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating feedback status:", error);
    throw error;
  }
};

/**
 * ✅ Get feedback statistics for admin dashboard
 */
export const getFeedbackStats = async () => {
  try {
    const allFeedback = await getAllUserFeedback();
    const stats = {
      // Align field names with AdminDashboard expectations
      totalFeedback: allFeedback.length,
      averageRating: 0,
      feedbackTypes: {}, // distribution by type (bug/feature/improvement/question/...)
      categoryBreakdown: {},
      new: allFeedback.filter(f => f.status === 'new').length,
      reviewed: allFeedback.filter(f => f.status === 'reviewed').length,
      responded: allFeedback.filter(f => f.status === 'responded').length,
      closed: allFeedback.filter(f => f.status === 'closed').length,
      recentFeedback: allFeedback.slice(0, 5) // Last 5 feedback items
    };

    // Calculate average rating
    const ratedFeedback = allFeedback.filter(f => f.rating);
    if (ratedFeedback.length > 0) {
      stats.averageRating = ratedFeedback.reduce((sum, f) => sum + f.rating, 0) / ratedFeedback.length;
    }

    // Category and type breakdowns
    allFeedback.forEach(feedback => {
      const category = feedback.category || 'general';
      const type = feedback.type || 'other';
      stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
      stats.feedbackTypes[type] = (stats.feedbackTypes[type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("❌ Error calculating feedback statistics:", error);
    throw error;
  }
};

/**
 * ✅ Get user feedback for specific user
 */
export const getUserFeedback = async (uid) => {
  try {
    const q = query(
      collection(db, 'userFeedback'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const feedback = [];

    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : null
      });
    });

    return feedback;
  } catch (error) {
    console.error("❌ Error fetching user feedback:", error);
    throw error;
  }
};
