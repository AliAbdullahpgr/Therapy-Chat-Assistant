import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Get the current user's ID for Firestore operations
 * Falls back to 'default-user' if no user is authenticated (for backwards compatibility)
 */
function getUserId(): string {
  return auth.currentUser?.uid || 'default-user';
}

interface Message {
  id: string;
  speaker: string;
  message: string;
  timestamp: Date;
}

export async function saveConversation(
  therapistId: string,
  messages: Message[]
): Promise<void> {
  try {
    const userId = getUserId();
    console.log(
      `[Firestore] 💾 Saving conversation for ${therapistId} (${messages.length} messages) - User: ${userId}...`
    );

    const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);

    // Convert Date objects to ISO strings for Firestore
    const messagesData = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));

    await setDoc(
      docRef,
      {
        [therapistId]: messagesData,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(
      `[Firestore] ✅ Successfully saved conversation for ${therapistId}`
    );
  } catch (error) {
    console.error(
      `[Firestore] ❌ Error saving conversation for ${therapistId}:`,
      error
    );
    throw error;
  }
}

export async function loadConversation(
  therapistId: string
): Promise<Message[]> {
  try {
    const userId = getUserId();
    console.log(`[Firestore] 📥 Loading conversation for ${therapistId} - User: ${userId}...`);

    const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const messagesData = data[therapistId] || [];

      // Convert ISO strings back to Date objects
      const messages = messagesData.map((msg: { id: string; speaker: string; content: string; timestamp: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      console.log(
        `[Firestore] ✅ Loaded ${messages.length} messages for ${therapistId}`
      );
      return messages;
    }

    console.log(`[Firestore] ✅ No existing conversation found for ${therapistId}`);
    return [];
  } catch (error) {
    console.error(
      `[Firestore] ❌ Error loading conversation for ${therapistId}:`,
      error
    );
    return [];
  }
}

export async function clearConversation(therapistId: string): Promise<void> {
  try {
    const userId = getUserId();
    console.log(`[Firestore] 🗑️ Clearing conversation for ${therapistId} - User: ${userId}...`);

    const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Use deleteField() to properly remove the therapist's conversation field
      await updateDoc(docRef, {
        [therapistId]: deleteField(),
        lastUpdated: new Date().toISOString(),
      });
    }

    console.log(
      `[Firestore] ✅ Successfully cleared conversation for ${therapistId}`
    );
  } catch (error) {
    console.error(
      `[Firestore] ❌ Error clearing conversation for ${therapistId}:`,
      error
    );
    throw error;
  }
}

export async function clearAllConversations(): Promise<void> {
  try {
    const userId = getUserId();
    console.log(`[Firestore] 🗑️ Clearing all conversations - User: ${userId}...`);

    const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    await deleteDoc(docRef);

    console.log('[Firestore] ✅ Successfully cleared all conversations');
  } catch (error) {
    console.error('[Firestore] ❌ Error clearing all conversations:', error);
    throw error;
  }
}
