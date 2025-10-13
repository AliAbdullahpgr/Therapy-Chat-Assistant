# Firestore Integration Guide

## Overview
This document explains how conversation persistence is implemented using Firestore.

## Architecture

### Data Flow
1. User sends message → Immediately displayed in UI
2. Message saved to Firestore → Console log confirmation
3. AI responds → Response saved to Firestore
4. App restart → Conversations loaded from Firestore

### Files Involved
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/conversation-service.ts` - Firestore CRUD operations
- `src/app/chat/page.tsx` - UI integration with auto-save/load

## Conversation Service API

### Save Conversation
```typescript
await saveConversation(therapistId: string, messages: Message[])
```

**Purpose**: Save or update a therapist's conversation
**Parameters**:
- `therapistId`: The therapist identifier (e.g., "Dr. Sarah")
- `messages`: Array of message objects

**Firestore Operation**: Uses `setDoc()` with `{ merge: true }` to update only the specific therapist's messages

**Example**:
```typescript
await saveConversation('Dr. Laura', [
  { id: '1', speaker: 'User', message: 'Hello', timestamp: new Date() },
  { id: '2', speaker: 'Dr. Laura', message: 'Hi there', timestamp: new Date() }
]);
```

### Load Conversation
```typescript
const messages = await loadConversation(therapistId: string): Promise<Message[]>
```

**Purpose**: Retrieve a therapist's conversation history
**Parameters**:
- `therapistId`: The therapist identifier

**Returns**: Array of messages or empty array if none exist

**Example**:
```typescript
const sarahMessages = await loadConversation('Dr. Sarah');
console.log(`Loaded ${sarahMessages.length} messages`);
```

### Clear Conversation
```typescript
await clearConversation(therapistId: string)
```

**Purpose**: Delete all messages for a specific therapist
**Parameters**:
- `therapistId`: The therapist identifier

**Firestore Operation**: Uses `updateDoc()` to remove the therapist's field and update `lastUpdated`

**Example**:
```typescript
await clearConversation('Dr. John');
// Dr. John's messages are now deleted
```

### Clear All Conversations
```typescript
await clearAllConversations()
```

**Purpose**: Delete the entire user document (all therapist conversations)
**Firestore Operation**: Uses `deleteDoc()` to remove the document

**Example**:
```typescript
await clearAllConversations();
// All conversations for all therapists are deleted
```

## Implementation Details

### 1. Firebase Client SDK
The service uses Firebase Client SDK (not Admin SDK) for browser-side operations:

```typescript
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
```

**Why Client SDK?**
- Works in browser without service account credentials
- Uses Firebase config from environment variables
- Simpler authentication for client-side apps

### 2. Document Structure
```typescript
{
  "Dr. Sarah": [
    { id: "1", speaker: "User", message: "Hello", timestamp: "2024-01-15T10:30:00Z" },
    { id: "2", speaker: "Dr. Sarah", message: "Hi", timestamp: "2024-01-15T10:30:05Z" }
  ],
  "Dr. Laura": [...],
  "Dr. John": [...],
  "lastUpdated": "2024-01-15T10:30:05Z"
}
```

### 3. Timestamp Handling
- **Saving**: Converts `Date` objects to ISO strings for Firestore compatibility
- **Loading**: Converts ISO strings back to `Date` objects for JavaScript usage

```typescript
// Saving
timestamp: msg.timestamp.toISOString()

// Loading
timestamp: new Date(msg.timestamp)
```

### 4. User Identification
Currently uses a default user ID: `default-user`

**Future Enhancement**: Implement Firebase Authentication for per-user storage:
```typescript
const userId = auth.currentUser?.uid || 'default-user';
const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);
```

## Chat Page Integration

### Auto-Load on Mount
```typescript
useEffect(() => {
  async function loadData() {
    console.log(`[Firestore] 📥 Loading conversation for ${activeTherapist}...`);
    const savedMessages = await loadConversation(activeTherapist);
    setConversations((prev) => ({
      ...prev,
      [activeTherapist]: savedMessages,
    }));
    console.log(`[Firestore] ✅ Loaded ${savedMessages.length} messages`);
  }
  loadData();
}, [activeTherapist]);
```

### Auto-Save on Send
```typescript
async function handleSendMessage(e: React.FormEvent) {
  e.preventDefault();
  
  // 1. Add user message to state immediately
  const newUserMessage = { id, speaker: 'User', message: input, timestamp: new Date() };
  setConversations((prev) => ({
    ...prev,
    [activeTherapist]: [...prev[activeTherapist], newUserMessage],
  }));
  
  // 2. Save user message
  await saveConversation(activeTherapist, [...currentMessages, newUserMessage]);
  
  // 3. Get AI response
  const aiResponse = await getAiResponse(...);
  
  // 4. Add AI message to state
  const newAiMessage = { id, speaker: activeTherapist, message: aiResponse, timestamp: new Date() };
  setConversations((prev) => ({
    ...prev,
    [activeTherapist]: [...prev[activeTherapist], newAiMessage],
  }));
  
  // 5. Save AI message
  await saveConversation(activeTherapist, [...currentMessages, newUserMessage, newAiMessage]);
}
```

## Console Logging

All operations include emoji-prefixed console logs for easy debugging:

- `💾` - Save operation started
- `📥` - Load operation started
- `🗑️` - Clear operation started
- `✅` - Operation successful
- `❌` - Operation failed

**Example Output**:
```
[Firestore] 💾 Saving conversation for Dr. Sarah (2 messages)...
[Firestore] ✅ Successfully saved conversation for Dr. Sarah
[Firestore] 📥 Loading conversation for Dr. Laura...
[Firestore] ✅ Loaded 5 messages for Dr. Laura
```

## Error Handling

All functions include try-catch blocks with detailed error logging:

```typescript
try {
  await setDoc(docRef, data, { merge: true });
  console.log(`[Firestore] ✅ Successfully saved conversation for ${therapistId}`);
} catch (error) {
  console.error(`[Firestore] ❌ Error saving conversation for ${therapistId}:`, error);
  throw error;
}
```

## Testing Checklist

- [ ] Messages persist after page refresh
- [ ] Console shows save/load logs with emoji indicators
- [ ] Switching therapists loads correct conversation
- [ ] Clear conversation removes messages
- [ ] Firestore Console shows updated data in real-time
- [ ] Timestamps display correctly
- [ ] No duplicate messages after save

## Troubleshooting

See [Firestore Troubleshooting Guide](./firestore-troubleshooting.md) for detailed debugging steps.
