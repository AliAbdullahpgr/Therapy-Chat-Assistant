# Debate Feature - Visual Reference Guide

## Color Theme Reference

### Dr. Sarah - CBT Therapist (Blue Theme)
```
Color:       text-blue-600       #2563eb
Background:  bg-blue-50          #eff6ff (light)
             dark:bg-blue-950    #172554 (dark)
Border:      border-blue-200     #bfdbfe (light)
             dark:border-blue-800 #1e40af (dark)
```

### Dr. Laura - Psychoanalytic Therapist (Purple Theme)
```
Color:       text-purple-600     #9333ea
Background:  bg-purple-50        #faf5ff (light)
             dark:bg-purple-950  #1e1b4b (dark)
Border:      border-purple-200   #e9d5ff (light)
             dark:border-purple-800 #6b21a8 (dark)
```

### Dr. John - Mindfulness Therapist (Green Theme)
```
Color:       text-green-600      #16a34a
Background:  bg-green-50         #f0fdf4 (light)
             dark:bg-green-950   #14532d (dark)
Border:      border-green-200    #bbf7d0 (light)
             dark:border-green-800 #166534 (dark)
```

### User Messages (Primary Theme)
```
Background:  bg-primary          
Text:        text-primary-foreground
Border:      border-primary
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER (Sticky)                         │
│  Topic Title                            [Show] [Export] [Speed] │
│  Exchange 5 of 20+ • 12 total messages  [Pause] [New Topic]    │
└─────────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────────┐
│          │                                                      │
│ SIDEBAR  │              MESSAGES AREA                           │
│ (256px)  │                                                      │
│          │  ┌─────────────────────────────────────────────┐    │
│ Sarah 🟦 │  │ 👤 Dr. Sarah • CBT Therapist    2:30 PM    │    │
│ 3 msgs   │  │ ┌─────────────────────────────────────────┐ │    │
│          │  │ │ Message content in blue-themed card     │ │    │
│ Laura 🟪 │  │ └─────────────────────────────────────────┘ │    │
│ 2 msgs   │  └─────────────────────────────────────────────┘    │
│ (pulse)  │                                                      │
│          │  ┌─────────────────────────────────────────────┐    │
│ John 🟩  │  │ 👤 Dr. Laura • Psycho... Therapist 2:31 PM │    │
│ 2 msgs   │  │ ┌─────────────────────────────────────────┐ │    │
│          │  │ │ Message in purple-themed card           │ │    │
│ You      │  │ └─────────────────────────────────────────┘ │    │
│ 1 msg    │  └─────────────────────────────────────────────┘    │
│          │                                                      │
│          │  ┌─────────────────────────────────────────────┐    │
│          │  │ 🔄 Dr. Laura is composing a response        │    │
│          │  │    • • • (bouncing dots)                    │    │
│          │  └─────────────────────────────────────────────┘    │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT AREA                             │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Jump in with your question or comment...        [➤]│         │
│  └────────────────────────────────────────────────────┘         │
│  The debate will pause when you send a message.                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Bar
```tsx
Components:
- Topic title (text-lg font-semibold)
- Subtitle (text-sm text-muted-foreground)
- Button group:
  * Show/Hide Participants (Users icon)
  * Export (Download icon) 
  * Speed Control (Gauge icon)
  * Play/Pause (Play/Pause icon)
  * New Topic (RotateCcw icon)

Styling:
- Sticky position (top-0)
- Border bottom
- Padding: p-4
- Shadow: shadow-sm
- Background: bg-card
```

### 2. Participant Sidebar
```tsx
Width: 256px (w-64)
Transition: 300ms
Overflow: hidden

Each Participant Card:
- Avatar (w-10 h-10, colored border)
- Name (font-semibold, colored text)
- Title (text-xs muted)
- Message badge (secondary variant)
- Active indicator: ring-2 ring-offset-2 ring-primary

States:
- Hidden: w-0
- Shown: w-64
- Active Speaker: Pulsing ring animation
```

### 3. Message Display
```tsx
Container:
- Flex column with gap-6
- Padding: p-6
- Overflow-y: auto

Each Message:
- Avatar: w-12 h-12, colored border
- Name: font-semibold, colored
- Badge: Therapist title
- Timestamp: text-xs muted
- Card: Colored border and background
- Content: p-4 padding

Animation:
- fade-in + slide-in-from-bottom-4
- duration-700
- Staggered by 50ms per message
```

### 4. Typing Indicator
```tsx
Components:
- Avatar with spinning loader
- Themed message card
- "is composing a response" text
- 3 bouncing dots

Colors:
- Uses active speaker's theme
- Avatar background: therapist bgColor
- Loader: therapist color
- Card: therapist borderColor + bgColor

Animation:
- Container: animate-pulse
- Dots: animate-bounce with delays (0, 150, 300ms)
- Loader: animate-spin
```

### 5. User Input
```tsx
Container:
- Border top
- Padding: p-4
- Background: bg-background/80 backdrop-blur-sm

Textarea:
- min-height: 52px
- Padding right: pr-12 (for button)
- Resize: none
- Keyboard: Enter to send, Shift+Enter for newline

Send Button:
- Position: absolute top-1/2 right-2
- Size: icon
- Disabled when empty

Help Text:
- text-xs text-muted-foreground
- Margin top: mt-2
```

## Animation Timeline

### Message Entrance
```
Time:     0ms    50ms   100ms  150ms  200ms  ...
Message:  [1]    [2]    [3]    [4]    [5]   ...
Effect:   ↑      ↑      ↑      ↑      ↑
          fade   fade   fade   fade   fade
```

### Typing Indicator Dots
```
Dot 1: ●  bounce at 0ms delay
Dot 2: ●  bounce at 150ms delay  
Dot 3: ●  bounce at 300ms delay

Pattern: Creates wave effect
```

### Active Speaker Ring
```
State: Pulsing
Ring: 2px width
Offset: 2px
Color: Primary
Speed: Continuous pulse
```

## Export File Structure

```
Line 1-3:   Header border (80 chars '=')
Line 4:     Title
Line 5-6:   More borders

Line 8-12:  Metadata section
            - Topic
            - Description  
            - Date/Time
            - Message count

Line 14-16: Section divider

Line 18-23: Participants list
            - Bullet points
            - Name + Role

Line 25-27: Section divider

Line 29+:   Transcript
            [N] HH:MM:SS AM - SPEAKER NAME
            ─────────────── (80 chars)
            Message content (wrapped at 76 chars)
            
            [N+1] ...

Footer:     End marker
            Generator info
            Export timestamp
```

## Responsive Breakpoints

### Desktop (1920px+)
- Full sidebar (256px)
- Messages: max-w-2xl (672px)
- Comfortable spacing

### Laptop (1366px)
- Full sidebar
- Messages: max-w-2xl
- Standard spacing

### Tablet (768px)
- Collapsible sidebar recommended
- Messages: full width with padding
- Touch-friendly buttons

### Mobile (375px)
- Sidebar should stay hidden
- Full-width messages
- Larger touch targets
- Simplified header

## State Management

```typescript
// Core State
selectedTopic: string | null
debateState: 'selecting' | 'playing' | 'paused' | 'finished'
messages: DebateMessage[]
currentExchange: number
playbackSpeed: 1 | 1.5 | 2
userInput: string
isGenerating: boolean
nextSpeaker: 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John'
showParticipants: boolean

// Computed State (memoized)
participantStats: Map<string, number>
selectedTopicData: DebateTopic | null
```

## Event Handlers

```typescript
startDebate(topicId: string)
  → Reset state
  → Set topic
  → Start playing

generateNextExchange()
  → Call AI flow
  → Add message
  → Update counter
  → Set next speaker

handleUserIntervention(e: FormEvent)
  → Add user message
  → Clear input
  → Pause debate

togglePlayPause()
  → Switch between playing/paused
  → Handle replay

cycleSpeed()
  → Rotate: 1x → 1.5x → 2x → 1x

handleExport()
  → Build transcript
  → Create blob
  → Trigger download

resetDebate()
  → Clear all state
  → Return to selection
```

## CSS Classes Quick Reference

### Colors
```css
/* Dr. Sarah - Blue */
.text-blue-600
.bg-blue-50 .dark:bg-blue-950
.border-blue-200 .dark:border-blue-800

/* Dr. Laura - Purple */
.text-purple-600
.bg-purple-50 .dark:bg-purple-950
.border-purple-200 .dark:border-purple-800

/* Dr. John - Green */
.text-green-600
.bg-green-50 .dark:bg-green-950
.border-green-200 .dark:border-green-800
```

### Animations
```css
.animate-in fade-in slide-in-from-bottom-4 duration-700
.animate-pulse
.animate-bounce
.animate-spin
.transition-all duration-300
```

### Layout
```css
.flex .flex-col .flex-1
.gap-2 .gap-3 .gap-4 .gap-6
.p-3 .p-4 .p-6
.border-2
.rounded-lg
.shadow-sm .hover:shadow-md
```

## Icon Reference

```
MessageSquareHeart - Main debate icon
Users             - Participant sidebar toggle
Download          - Export transcript
Gauge             - Playback speed
Play / Pause      - Control playback
RotateCcw         - Reset/new topic
Send              - Submit user message
ArrowLeft         - Back to chat
Loader2           - Typing/loading indicator
Info              - Information alert
```

## Testing Scenarios

### Scenario 1: First Time User
1. See topic selection screen
2. Click "Best Approaches for Treating Anxiety"
3. Observe debate start automatically
4. See Dr. Sarah's blue-themed first message
5. Wait for Dr. Laura's purple-themed message
6. See Dr. John's green-themed message
7. Click "Show" to reveal participants
8. Type a question and send
9. See debate pause
10. Click "Export" to download transcript

### Scenario 2: Power User
1. Start any debate
2. Immediately click "Show" for participants
3. Change speed to 2x
4. Watch rapid exchanges
5. Pause at interesting point
6. Add multiple questions
7. Resume debate
8. Monitor participant message counts
9. Wait for debate completion
10. Export full transcript
11. Click "New Topic" to try another

### Scenario 3: Mobile User
1. Access on phone
2. Select topic
3. Keep sidebar hidden (no space)
4. Read messages in portrait
5. Use textarea to add comment
6. Rotate to landscape
7. Toggle sidebar briefly
8. Export transcript
9. Share downloaded file

## Troubleshooting Guide

### Issue: Colors Not Showing
**Check:**
- Tailwind CSS compiled
- Dark mode configuration
- Browser DevTools for applied classes

### Issue: Animations Choppy
**Check:**
- Hardware acceleration enabled
- Too many messages (>100)?
- Browser performance tab
- Reduce motion preference

### Issue: Export Not Working
**Check:**
- Browser blocks downloads?
- Messages array has items
- Console for errors
- date-fns library installed

### Issue: Sidebar Overlaps Content
**Check:**
- Screen width
- Flex layout
- Z-index values
- Overflow settings

### Issue: Typing Indicator Stuck
**Check:**
- isGenerating state
- AI flow completing
- Error in console
- Network connection

## Performance Tips

1. **Limit visible messages**: Consider virtualizing if >100 messages
2. **Memoize computed values**: Use React.useMemo for participantStats
3. **Debounce input**: If typing causes lag
4. **Lazy load avatars**: Use loading="lazy" on images
5. **Optimize animations**: Use CSS transforms, avoid layout thrashing
6. **Bundle size**: Tree-shake unused Tailwind classes

## Accessibility Checklist

- [ ] All buttons have aria-labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] Screen reader announces messages
- [ ] Alternative text for avatars
- [ ] Reduced motion respected
- [ ] Semantic HTML (<main>, <aside>, <header>)

---

**End of Visual Reference Guide**

For implementation details, see: `enhanced-debate-feature.md`
For testing checklist, see: `debate-implementation-summary.md`
