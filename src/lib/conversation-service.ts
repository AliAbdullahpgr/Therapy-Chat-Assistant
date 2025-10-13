import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';
const DEFAULT_USER_ID = 'default-user';

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
    console.log(
      `[Firestore] 💾 Saving conversation for ${therapistId} (${messages.length} messages)...`
    );

    const docRef = doc(db, CONVERSATIONS_COLLECTION, DEFAULT_USER_ID);

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
    console.log(`[Firestore] 📥 Loading conversation for ${therapistId}...`);

    const docRef = doc(db, CONVERSATIONS_COLLECTION, DEFAULT_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const messagesData = data[therapistId] || [];

      // Convert ISO strings back to Date objects
      const messages = messagesData.map((msg: any) => ({
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
    console.log(`[Firestore] 🗑️ Clearing conversation for ${therapistId}...`);

    const docRef = doc(db, CONVERSATIONS_COLLECTION, DEFAULT_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      delete data[therapistId];

      await updateDoc(docRef, {
        [therapistId]: deleteDoc as any,
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
    console.log('[Firestore] 🗑️ Clearing all conversations...');

    const docRef = doc(db, CONVERSATIONS_COLLECTION, DEFAULT_USER_ID);
    await deleteDoc(docRef);

    console.log('[Firestore] ✅ Successfully cleared all conversations');
  } catch (error) {
    console.error('[Firestore] ❌ Error clearing all conversations:', error);
    throw error;
  }
}
