# Firestore Troubleshooting Guide

## Quick Verification Checklist

### 1. Environment Variables ✓
```bash
# Check .env file has all Firebase variables
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. Firebase Console Setup ✓
- [ ] Firestore Database created and enabled
- [ ] Security rules set to test mode (for development)
- [ ] Project ID matches your `.env` file

### 3. Console Logs ✓
Expected console output when saving:
```
[Firestore] 💾 Saving conversation for Dr. Sarah (2 messages)...
[Firestore] ✅ Successfully saved conversation for Dr. Sarah
```

Expected console output when loading:
```
[Firestore] 📥 Loading conversation for Dr. Sarah...
[Firestore] ✅ Loaded 2 messages for Dr. Sarah
```

### 4. Firestore Console ✓
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Look for collection: `conversations`
5. Check document: `default-user`
6. Verify data structure:
   ```json
   {
     "Dr. Sarah": [...],
     "lastUpdated": "2024-..."
   }
   ```

## Common Issues & Solutions

### Issue 1: "Data not saving to Firestore"

**Symptoms**:
- Console shows save logs but Firestore Console is empty
- No error messages in console

**Possible Causes & Solutions**:

#### A. Using Firebase Admin SDK instead of Client SDK
**Check**: Look at imports in `conversation-service.ts`
```typescript
// ❌ Wrong (Admin SDK - requires service account)
import { getFirestore } from 'firebase-admin/firestore';

// ✅ Correct (Client SDK - works with Firebase config)
import { getFirestore } from 'firebase/firestore';
```

**Solution**: Use Firebase Client SDK for browser-side operations

#### B. Firestore Rules Too Restrictive
**Check**: Firebase Console → Firestore Database → Rules

```javascript
// ❌ Wrong (blocks all writes)
allow read, write: if false;

// ✅ Correct (development mode)
allow read, write: if true;
```

**Solution**: Set rules to test mode for development

#### C. Network/CORS Issues
**Check**: Browser DevTools → Network tab → Filter by "firestore"

**Look for**:
- Red/failed requests to `firestore.googleapis.com`
- 403 Forbidden errors
- CORS errors

**Solution**: 
- Verify Firebase API key is correct
- Check project ID matches
- Ensure no ad blockers blocking Firebase

### Issue 2: "Firebase app not initialized"

**Error Message**:
```
Error: No Firebase App '[DEFAULT]' has been created
```

**Cause**: Missing or incorrect environment variables

**Solution**:
1. Verify `.env` file exists in project root
2. All `NEXT_PUBLIC_FIREBASE_*` variables are set
3. Restart dev server after adding environment variables

### Issue 3: "Missing or insufficient permissions"

**Error Message**:
```
FirebaseError: Missing or insufficient permissions
```

**Cause**: Firestore security rules denying access

**Solution**:
```javascript
// Update rules in Firebase Console
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Issue 4: "Conversations not loading on page refresh"

**Symptoms**:
- Messages appear when sent
- Disappear after page refresh
- Console shows "Loaded 0 messages"

**Possible Causes**:

#### A. Save operation failing silently
**Check**: Look for error logs in console
```
[Firestore] ❌ Error saving conversation for Dr. Sarah: ...
```

**Solution**: Fix the underlying error (see Issue 1)

#### B. Loading from wrong therapist ID
**Check**: Console logs show correct therapist name
```typescript
console.log('Active therapist:', activeTherapist);
```

**Solution**: Verify therapist ID matches exactly (case-sensitive)

### Issue 5: "Timestamps showing as strings"

**Symptoms**:
- Timestamps display as ISO strings instead of formatted dates
- `message.timestamp.toLocaleString()` errors

**Cause**: Not converting timestamps back to Date objects

**Solution**: Already implemented in `loadConversation`:
```typescript
timestamp: new Date(msg.timestamp)
```

### Issue 6: "Duplicate messages after save"

**Symptoms**:
- Same message appears multiple times
- Happens after rapid clicking

**Cause**: Multiple save operations or missing await

**Solution**: Ensure all save operations use `await` and disable button during save

## Debugging Steps

### Step 1: Verify Firebase Connection
```typescript
// Add to chat page useEffect
console.log('Firebase DB:', db);
console.log('Firebase config:', db.app.options);
```

### Step 2: Test Save Operation Manually
```typescript
// Add to browser console
import { doc, setDoc } from 'firebase/firestore';
const testDoc = doc(db, 'conversations', 'test-user');
await setDoc(testDoc, { test: 'Hello Firebase!' });
```

### Step 3: Check Network Requests
1. Open DevTools → Network tab
2. Filter by "firestore"
3. Send a message
4. Look for POST requests to `firestore.googleapis.com`
5. Check response status (should be 200)

### Step 4: Verify Document Structure
1. Firebase Console → Firestore Database
2. Navigate to `conversations/default-user`
3. Verify structure matches:
   ```json
   {
     "Dr. Sarah": [
       {
         "id": "...",
         "speaker": "User",
         "message": "Hello",
         "timestamp": "2024-..."
       }
     ],
     "lastUpdated": "2024-..."
   }
   ```

## Migration: Admin SDK → Client SDK

If you previously used Firebase Admin SDK, here's the migration guide:

### Before (Admin SDK):
```typescript
import { getFirestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

const docRef = adminDb.collection('conversations').doc(userId);
await docRef.set(data, { merge: true });
const snapshot = await docRef.get();
const data = snapshot.data();
```

### After (Client SDK):
```typescript
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const docRef = doc(db, 'conversations', userId);
await setDoc(docRef, data, { merge: true });
const snapshot = await getDoc(docRef);
const data = snapshot.data();
```

### Key Differences:
| Feature | Admin SDK | Client SDK |
|---------|-----------|------------|
| **Usage** | Server-side only | Client & server |
| **Auth** | Service account JSON | Firebase config |
| **Imports** | `firebase-admin/*` | `firebase/*` |
| **Collection** | `.collection().doc()` | `doc(db, collection, id)` |
| **Get** | `ref.get()` | `getDoc(ref)` |
| **Set** | `ref.set()` | `setDoc(ref, data)` |
| **Update** | `ref.update()` | `updateDoc(ref, data)` |
| **Delete** | `ref.delete()` | `deleteDoc(ref)` |

## Still Having Issues?

### 1. Enable Firestore Debug Logs
```typescript
import { setLogLevel } from 'firebase/firestore';
setLogLevel('debug');
```

### 2. Check Firebase Status
Visit [Firebase Status Dashboard](https://status.firebase.google.com/)

### 3. Verify Package Versions
```bash
npm list firebase firebase-admin
```

### 4. Clear Cache & Restart
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

## Production Considerations

### 1. Update Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{userId} {
      // Only authenticated users can access their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Implement Firebase Authentication
```typescript
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    const userId = user.uid;
  }
});
```

### 3. Add Offline Persistence
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support
  }
});
```

### 4. Monitor Usage
- Firebase Console → Usage and billing
- Set up budget alerts
- Implement pagination for large conversations

## Useful Commands

```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID

# Test Firebase connection
node scripts/test-firebase-connection.js

# View Firestore indexes
firebase firestore:indexes

# Deploy Firestore rules
firebase deploy --only firestore:rules
```
