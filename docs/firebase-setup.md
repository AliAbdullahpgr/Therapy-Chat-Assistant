# Firebase Setup Guide

## Overview
This guide covers the Firebase and Firestore setup for the Therapy Chat Assistant application.

## Prerequisites
- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Firebase CLI installed (optional, for advanced features)

## Installation

```bash
npm install firebase
```

## Configuration

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to Project Settings > General
4. Scroll to "Your apps" and click "Web" (</>) to add a web app
5. Copy the Firebase configuration object

### 2. Environment Variables
Add your Firebase configuration to `.env`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Firebase Initialization (`src/lib/firebase.ts`)
The Firebase app is initialized using the environment variables:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
```

## Firestore Database Setup

### 1. Enable Firestore
1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location closest to your users

### 2. Security Rules (Development)
For development, use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: These rules allow public access. Update them for production!

### 3. Security Rules (Production)
For production, implement proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Collection Structure

### Conversations Collection
```
conversations/
  ├── {userId}/
  │   ├── Dr. Sarah: Message[]
  │   ├── Dr. Laura: Message[]
  │   ├── Dr. John: Message[]
  │   └── lastUpdated: timestamp
```

### Message Object Schema
```typescript
interface Message {
  id: string;
  speaker: string;
  message: string;
  timestamp: Date;
}
```

## Troubleshooting

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Cause**: Incorrect API key in environment variables
**Solution**: Verify your Firebase API key in `.env` matches the one in Firebase Console

### Issue: "Missing or insufficient permissions"
**Cause**: Firestore security rules are too restrictive
**Solution**: Update Firestore rules in Firebase Console

### Issue: "Firebase app not initialized"
**Cause**: Missing environment variables
**Solution**: Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env`

## Next Steps
- Review [Firestore Integration](./firestore-integration.md) for conversation persistence
- Check [Console Logging and Fixes](./console-logging-and-fixes.md) for debugging
