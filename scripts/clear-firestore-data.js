/**
 * Clear Old Firestore Data Script
 * 
 * This script helps you clear corrupted or old data from Firestore.
 * Run this in the browser console to delete all conversations and start fresh.
 * 
 * Instructions:
 * 1. Open your app at http://localhost:9002/chat
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 */

import { clearAllConversations } from '@/lib/conversation-service';

async function clearOldData() {
  try {
    console.log('🗑️ Clearing all old Firestore data...');
    await clearAllConversations();
    console.log('✅ All conversations cleared successfully!');
    console.log('🔄 Please refresh the page to start fresh.');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Run the function
clearOldData();
