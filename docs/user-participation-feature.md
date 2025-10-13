# User Participation in Debates - Feature Documentation

## Overview
Users can now **actively participate** in therapist debates by asking questions, sharing perspectives, or commenting on the discussion. When a user submits a message, the next therapist in rotation will respond directly to them while staying in character.

## How It Works

### User Flow
1. **Start a debate** on any topic
2. **Watch the therapists** discuss the topic
3. **Type your question or comment** in the text area at the bottom
4. **Press Enter or click Send**
5. **A therapist responds** to your input directly
6. **Debate continues** automatically after the response

### What Happens When You Participate

```
User Types: "How do I know which approach is right for me?"
         ↓
    Message Added to Transcript
         ↓
    System Pauses (if playing)
         ↓
    Next Therapist Responds
    (e.g., Dr. Sarah answers from CBT perspective)
         ↓
    Debate Resumes (if was playing)
```

## Features

### 1. Interactive Messaging
- **Text Area**: Multi-line input for questions/comments
- **Send Button**: Click to submit (or press Enter)
- **Keyboard Shortcut**: 
  - `Enter` to send
  - `Shift + Enter` for new line
- **Auto-Clear**: Input clears after sending

### 2. Smart Context Injection
When you send a message:
- Your message is added to the debate transcript
- The system injects your question into the AI context
- The next therapist receives: `"User asked: [your question]"`
- The therapist responds **directly to you** while maintaining their persona

### 3. Therapist Response Behavior
The responding therapist will:
- **Acknowledge your question** explicitly
- **Answer from their therapeutic perspective**
  - Dr. Sarah: CBT-focused practical advice
  - Dr. Laura: Psychoanalytic depth exploration
  - Dr. John: Mindfulness-based simple approach
- **Stay in character** throughout
- **Keep response concise** (2-4 sentences)

### 4. Debate Flow Management
- **Auto-pause**: If debate is playing, it pauses for your message
- **Auto-resume**: After therapist responds, debate resumes if it was playing
- **Manual control**: You can pause/resume anytime with the Play/Pause button

### 5. User Identification
Your messages are visually distinct:
- **Primary color theme** (different from therapists)
- **Right-aligned** (therapists are left-aligned)
- **"User" label** in the participant sidebar
- **Message counter** showing your participation

## User Interface

### Input Area (Bottom of Screen)
```
┌─────────────────────────────────────────────────────────┐
│  Ask a question or share your perspective...         [➤]│
│  The therapists will respond!                           │
└─────────────────────────────────────────────────────────┘
💬 Ask questions or share thoughts - a therapist will respond!
```

### Example Message Display
```
User Message (Right-aligned, Primary Color):
┌────────────────────────────────────────┐
│ User • 2:45 PM                         │
│ ┌────────────────────────────────────┐ │
│ │ How do I know which approach       │ │
│ │ is right for me?                   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘

Therapist Response (Left-aligned, Colored):
┌────────────────────────────────────────┐
│ 👤 Dr. Sarah • CBT Therapist • 2:45 PM │
│ ┌────────────────────────────────────┐ │
│ │ Great question! CBT works best     │ │
│ │ when you want practical tools...   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Example Interactions

### Example 1: Asking for Clarification
**User**: "What does CBT stand for?"

**Dr. Sarah**: "CBT stands for Cognitive Behavioral Therapy. It's an evidence-based approach that focuses on identifying and changing negative thought patterns to improve your emotional well-being."

### Example 2: Seeking Personal Advice
**User**: "I've been feeling anxious lately. Which approach should I try first?"

**Dr. Laura**: "That's a deeply personal question. I'd suggest exploring where this anxiety stems from - perhaps it's connected to unresolved experiences from your past. Understanding the 'why' can be transformative."

### Example 3: Challenging a Statement
**User**: "Isn't mindfulness just about meditation?"

**Dr. John**: "That's a common misconception. Mindfulness is about present-moment awareness in all activities - eating, walking, even breathing. Meditation is just one tool, not the whole practice."

### Example 4: Requesting Comparison
**User**: "How would each of you treat insomnia differently?"

**Dr. Sarah**: "I'd focus on cognitive restructuring around sleep beliefs and behavioral interventions like sleep hygiene and stimulus control - practical, measurable approaches."

*Then debate continues with other therapists adding their perspectives*

## Participant Sidebar

When you participate, you'll see yourself in the sidebar:

```
┌─────────────────────┐
│ PARTICIPANTS        │
├─────────────────────┤
│ 👤 Dr. Sarah        │
│    CBT Therapist    │
│    3 messages       │
├─────────────────────┤
│ 👤 Dr. Laura        │
│    Psychoanalytic   │
│    2 messages       │
├─────────────────────┤
│ 👤 Dr. John         │
│    Mindfulness      │
│    2 messages       │
├─────────────────────┤
│ 👤 You              │
│    Participant      │
│    1 message        │
└─────────────────────┘
```

## Export with User Messages

When you export the transcript, your messages are included:

```
================================================================================
TRANSCRIPT:
================================================================================

[5] 2:44:30 PM - USER
--------------------------------------------------------------------------------
How do I know which approach is right for me?

[6] 2:45:15 PM - DR. SARAH
--------------------------------------------------------------------------------
Great question! CBT works best when you want practical tools and structured
approaches. Consider your goals - do you want quick, actionable strategies
or deeper exploration of underlying patterns?
```

## Technical Implementation

### Message Handling
```typescript
handleUserIntervention(e: FormEvent) {
  1. Prevent default form submission
  2. Check if input is not empty
  3. Pause debate if currently playing
  4. Create user message object
  5. Add to messages array
  6. Clear input field
  7. Inject user context into AI prompt
  8. Generate therapist response
  9. Add therapist response to messages
  10. Resume debate if was playing
}
```

### AI Context Injection
```typescript
const contextWithUser = [
  ...previousExchanges,
  { 
    speaker: 'Dr. Sarah', 
    message: `User asked: "${userInputText}"` 
  }
];
```

### Smart Prompt Enhancement
The AI flow detects user questions:
```typescript
const hasUserQuestion = lastExchange?.message?.includes('User asked:');
```

Then modifies guidelines:
- **Normal**: "Keep responses concise"
- **With User**: "Address the participant's question directly"

## Best Practices for Users

### ✅ DO:
- Ask specific questions
- Share relevant personal experiences
- Request clarification on concepts
- Challenge ideas respectfully
- Ask for comparisons between approaches

### ❌ DON'T:
- Spam messages rapidly
- Share sensitive personal information
- Expect emergency mental health support
- Interrupt if you want to hear the full debate
- Ask multiple unrelated questions at once

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Clear Labels**: Input has descriptive placeholder
- **Help Text**: Explains how to participate
- **Visual Feedback**: 
  - Disabled send button when empty
  - Loading state while therapist responds
  - Clear message boundaries

## Troubleshooting

### Issue: Message Not Sending
**Solutions:**
- Ensure text area is not empty
- Check if debate has started (topic selected)
- Look for JavaScript errors in console
- Verify network connection

### Issue: No Therapist Response
**Solutions:**
- Check if AI service is running
- Verify API keys are configured
- Look for errors in network tab
- Check console for error messages

### Issue: Can't See My Messages
**Solutions:**
- Scroll to bottom of messages area
- Check if messages are hidden (shouldn't be)
- Verify message was added (check participant count)
- Refresh page if needed

### Issue: Input Not Clearing
**Solutions:**
- Message may have failed to send
- Check console for errors
- Try again
- Refresh page if persists

## Privacy & Safety

### What Happens to Your Messages
- Stored locally in component state
- Included in AI context for responses
- Exported if you download transcript
- **Not saved to database** (session only)
- Lost when you leave page or select new topic

### Safety Notes
- This is not a substitute for professional therapy
- Don't share identifying information
- Responses are AI-generated, not human therapists
- For emergencies, contact local crisis services

## Performance

- **Response Time**: 2-5 seconds (depends on AI model)
- **Message Limit**: No hard limit (but long debates may slow)
- **Input Length**: No character limit (but keep reasonable)
- **Concurrent Users**: Each session is independent

## Future Enhancements

Potential improvements:
1. **Direct Therapist Selection**: Choose which therapist responds
2. **Follow-up Questions**: Flag message as follow-up to previous
3. **Private Mode**: Toggle to hide user messages from export
4. **Reaction Buttons**: Quick reactions to therapist responses
5. **Message Editing**: Edit sent messages before therapist responds
6. **Save Conversations**: Persist user interactions across sessions

## Keyboard Shortcuts

| Key Combination | Action |
|----------------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Ctrl + /` (future) | Focus input |
| `Esc` (future) | Clear input |

## Mobile Experience

On mobile devices:
- Input area remains at bottom
- Virtual keyboard pushes content up
- Send button easily tappable
- Messages auto-scroll into view
- Participant sidebar can be toggled for space

## Analytics (Future)

Track user engagement:
- Number of user messages per debate
- Average response time
- Most active topics
- User satisfaction (ratings)

## Summary

The user participation feature transforms the debate from a passive viewing experience into an **interactive learning opportunity**. You can:

✅ Ask questions anytime
✅ Get personalized responses from each therapeutic perspective
✅ See your messages in the transcript
✅ Be counted as an active participant
✅ Export conversations including your input

This creates a more engaging, educational, and personalized experience where you're not just observing but actively learning by asking and receiving expert-level responses from multiple therapeutic viewpoints.

---

**Ready to participate?** Start a debate, watch for a few exchanges, then jump in with your questions! 💬
