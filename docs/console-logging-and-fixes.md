# Console Logging and UI Fixes

## Overview
This document describes the console logging implementation and UI fixes for the chat interface.

## Console Logging Format

All database operations use emoji-prefixed logs for easy visual scanning:

### Emoji Legend
- `💾` - Save operation
- `📥` - Load operation
- `🗑️` - Delete/clear operation
- `✅` - Success
- `❌` - Error/failure

### Log Format
```
[Firestore] {emoji} {action} for {therapist} {details}...
[Firestore] {result emoji} {outcome message}
```

## Implementation Examples

### Save Conversation
```typescript
console.log(`[Firestore] 💾 Saving conversation for ${therapistId} (${messages.length} messages)...`);
await setDoc(docRef, data, { merge: true });
console.log(`[Firestore] ✅ Successfully saved conversation for ${therapistId}`);
```

**Expected Output**:
```
[Firestore] 💾 Saving conversation for Dr. Sarah (3 messages)...
[Firestore] ✅ Successfully saved conversation for Dr. Sarah
```

### Load Conversation
```typescript
console.log(`[Firestore] 📥 Loading conversation for ${therapistId}...`);
const messages = await loadConversation(therapistId);
console.log(`[Firestore] ✅ Loaded ${messages.length} messages for ${therapistId}`);
```

**Expected Output**:
```
[Firestore] 📥 Loading conversation for Dr. Laura...
[Firestore] ✅ Loaded 5 messages for Dr. Laura
```

### Clear Conversation
```typescript
console.log(`[Firestore] 🗑️ Clearing conversation for ${therapistId}...`);
await clearConversation(therapistId);
console.log(`[Firestore] ✅ Successfully cleared conversation for ${therapistId}`);
```

**Expected Output**:
```
[Firestore] 🗑️ Clearing conversation for Dr. John...
[Firestore] ✅ Successfully cleared conversation for Dr. John
```

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error(`[Firestore] ❌ Error saving conversation for ${therapistId}:`, error);
  throw error;
}
```

**Expected Output**:
```
[Firestore] ❌ Error saving conversation for Dr. Sarah: FirebaseError: ...
```

## UI Fixes

### Issue 1: User Messages Disappearing

**Problem**: 
- User types message
- Message appears briefly
- Disappears when AI responds
- Only AI response remains

**Root Cause**:
The original implementation was:
1. User sends message
2. Both user + AI messages saved together
3. State updated with both messages at once
4. Race condition causes user message to be lost

**Solution**:
```typescript
async function handleSendMessage(e: React.FormEvent) {
  e.preventDefault();
  if (!input.trim()) return;

  const newUserMessage: Message = {
    id: Date.now().toString(),
    speaker: 'User',
    message: input,
    timestamp: new Date(),
  };

  // 1. Update state IMMEDIATELY - don't wait for save
  setConversations((prev) => ({
    ...prev,
    [activeTherapist]: [...prev[activeTherapist], newUserMessage],
  }));
  
  setInput('');

  // 2. Save user message separately
  const updatedMessages = [...currentMessages, newUserMessage];
  await saveConversation(activeTherapist, updatedMessages);

  // 3. Get AI response
  const aiResponse = await callAiFlow(...);

  // 4. Add AI message
  const newAiMessage: Message = {
    id: Date.now().toString(),
    speaker: activeTherapist,
    message: aiResponse,
    timestamp: new Date(),
  };

  setConversations((prev) => ({
    ...prev,
    [activeTherapist]: [...prev[activeTherapist], newAiMessage],
  }));

  // 5. Save AI message
  await saveConversation(activeTherapist, [...updatedMessages, newAiMessage]);
}
```

**Key Changes**:
- User message added to state **immediately** before any async operations
- Input cleared right away for better UX
- Separate save operations for user and AI messages
- No batching that could cause race conditions

### Issue 2: No Loading Indicator

**Problem**:
- No visual feedback when loading conversations from Firebase
- Users don't know if app is frozen or loading data

**Solution**:
```typescript
// Add loading state
const [isLoadingConversations, setIsLoadingConversations] = useState(true);

// Update useEffect
useEffect(() => {
  async function loadConversationHistory() {
    setIsLoadingConversations(true);
    console.log(`[Firestore] 📥 Loading conversation for ${activeTherapist}...`);
    
    const savedMessages = await loadConversation(activeTherapist);
    
    setConversations((prev) => ({
      ...prev,
      [activeTherapist]: savedMessages,
    }));
    
    console.log(`[Firestore] ✅ Loaded ${savedMessages.length} messages for ${activeTherapist}`);
    setIsLoadingConversations(false);
  }

  loadConversationHistory();
}, [activeTherapist]);

// Display loading UI
{isLoadingConversations ? (
  <div className="flex items-center justify-center h-full text-gray-500">
    <div className="text-center">
      <div className="flex gap-1 justify-center mb-2">
        <span className="animate-bounce">●</span>
        <span className="animate-bounce" style={{animationDelay: '0.1s'}}>●</span>
        <span className="animate-bounce" style={{animationDelay: '0.2s'}}>●</span>
      </div>
      <p>Loading conversation from Firebase...</p>
    </div>
  </div>
) : (
  // Normal chat UI
)}
```

**Features**:
- Animated bouncing dots
- Clear loading message
- Automatic dismissal when data loaded
- Runs on therapist switch

## Debugging Tips

### 1. Verify State Updates
```typescript
// Add after setConversations
console.log('Current messages:', conversations[activeTherapist]);
```

### 2. Track Message Flow
```typescript
console.log('1. User message created:', newUserMessage);
console.log('2. State before save:', conversations[activeTherapist]);
console.log('3. Saving to Firestore...');
// ... save operation
console.log('4. AI response:', aiResponse);
console.log('5. Final state:', conversations[activeTherapist]);
```

### 3. Monitor Loading State
```typescript
console.log('Loading state:', isLoadingConversations);
console.log('Active therapist:', activeTherapist);
console.log('Conversation length:', conversations[activeTherapist]?.length);
```

### 4. Check Timing
```typescript
const start = Date.now();
await saveConversation(...);
console.log(`Save took ${Date.now() - start}ms`);
```

## Testing Checklist

### User Message Persistence
- [ ] Type message and press send
- [ ] Message appears immediately in chat
- [ ] Console shows save log with ✅
- [ ] AI responds
- [ ] Both user and AI messages remain visible
- [ ] Refresh page
- [ ] Both messages still present

### Loading Indicator
- [ ] Start app
- [ ] Loading animation appears
- [ ] Console shows "Loading conversation..."
- [ ] Animation disappears when loaded
- [ ] Messages display
- [ ] Switch therapist
- [ ] Loading animation appears again

### Console Logs
- [ ] All operations show emoji-prefixed logs
- [ ] Success operations show ✅
- [ ] Errors show ❌ with details
- [ ] Message counts are accurate
- [ ] Therapist names are correct

## Common Console Output Examples

### Successful Flow
```
[Firestore] 📥 Loading conversation for Dr. Sarah...
[Firestore] ✅ Loaded 0 messages for Dr. Sarah
[Firestore] 💾 Saving conversation for Dr. Sarah (1 messages)...
[Firestore] ✅ Successfully saved conversation for Dr. Sarah
[Firestore] 💾 Saving conversation for Dr. Sarah (2 messages)...
[Firestore] ✅ Successfully saved conversation for Dr. Sarah
```

### Error Flow
```
[Firestore] 💾 Saving conversation for Dr. Laura (1 messages)...
[Firestore] ❌ Error saving conversation for Dr. Laura: FirebaseError: Missing or insufficient permissions
```

### Therapist Switch
```
[Firestore] 📥 Loading conversation for Dr. John...
[Firestore] ✅ Loaded 3 messages for Dr. John
```

## Performance Considerations

### Avoid Excessive Logging in Production
```typescript
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log(`[Firestore] 💾 Saving conversation...`);
}
```

### Batch Console Logs
```typescript
// Instead of multiple logs
console.log('Message 1:', msg1);
console.log('Message 2:', msg2);

// Use grouped logs
console.group('[Firestore] Save Operation');
console.log('User message:', msg1);
console.log('AI response:', msg2);
console.groupEnd();
```

### Use Console Levels
```typescript
// Information
console.log('[Firestore] ✅ Success');

// Warnings
console.warn('[Firestore] ⚠️ Slow operation detected');

// Errors
console.error('[Firestore] ❌ Operation failed');

// Debug (filtered out in production)
console.debug('[Firestore] 🔍 Debug info');
```
