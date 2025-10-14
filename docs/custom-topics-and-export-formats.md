# Custom Topics and Export Formats Feature

## Changes Made - October 14, 2025

### 1. Custom Topic Creation 🎯

**New Feature:**
Users can now create their own custom debate topics for the three therapists to discuss!

**Implementation:**
- Added a "Custom Topic" card in the topic selection screen
- Dialog interface for entering custom topic details
- Fields:
  - **Topic Title** (required): The main debate topic
  - **Description** (optional): Additional context for the discussion

**User Experience:**
1. On the debate page, scroll to "Custom Topic" section
2. Click the "Create Custom Debate" card with the plus icon
3. Enter your topic title (e.g., "The Role of Medication in Mental Health Treatment")
4. Optionally add a description for more context
5. Click "Start Debate" to begin
6. The three therapists will debate your custom topic from their unique perspectives

**Technical Details:**
- Custom topics stored with ID 'custom' in state
- Custom topic data stored separately from predefined topics
- All debate functions work seamlessly with custom topics
- Form validates that title is not empty

---

### 2. Multiple Export Formats 📄

**Previous:** Only .TXT export was available

**New:** Three export formats available:
1. **TXT** (Plain Text) - Original format
2. **Markdown (.md)** - Formatted markdown with headers and styling
3. **PDF** - Professional formatted document (via print dialog)

#### TXT Format
- Clean plain text format
- 80-character width formatting
- Header with metadata
- Participant list
- Numbered messages with timestamps
- Footer with generation info

#### Markdown Format
- GitHub-flavored Markdown
- Headers for structure (H1, H2, H3)
- Bold text for speakers and metadata
- Clean formatting for easy reading
- Compatible with markdown viewers and editors
- Can be converted to HTML or PDF later

#### PDF Format
- Professional document layout
- Styled HTML converted to PDF
- Color-coded speakers:
  - Dr. Sarah: Blue (#3b82f6)
  - Dr. Laura: Purple (#8b5cf6)
  - Dr. John: Green (#10b981)
  - User: Indigo (#6366f1)
- Bordered message boxes
- Metadata section
- Participant list
- Proper page breaks
- Print-friendly layout

---

### 3. Updated UI/UX 🎨

**Desktop Export Menu:**
- Replaced single "Export" button with dropdown menu
- Options: Export as TXT, Export as Markdown, Export as PDF
- Icons for each format
- Disabled when no messages exist

**Mobile Export Menu:**
- Added export format options to mobile dropdown
- Three separate menu items for each format
- Separator before other controls
- Consistent with desktop experience

**Custom Topic Card:**
- Dashed border design to indicate "add new"
- Plus icon in circular background
- Clear call to action
- Consistent with existing card design

---

### 4. Code Structure

**Files Modified:**

1. **src/app/debate/page.tsx**
   - Added Dialog, Input, Label imports
   - Added Plus, FileText, FileDown icons
   - New state variables for custom topics
   - `startCustomDebate()` function
   - Updated `handleExport()` to accept format parameter
   - Memoized `selectedTopicData` calculation
   - Updated all topic-related functions to handle custom topics
   - Added custom topic dialog UI
   - Updated export buttons to dropdown menus

2. **src/lib/debate-export.ts**
   - New `exportToMarkdown()` function
   - New `exportToPDF()` function
   - Existing `exportDebateTranscript()` unchanged

---

### 5. Export Function Details

#### exportToMarkdown()
```typescript
- Creates .md file with markdown formatting
- Uses headers (# ## ###) for structure
- Bold text for emphasis
- Lists for participants
- Timestamps in italics
- Footer with generation info
```

#### exportToPDF()
```typescript
- Creates HTML content with inline styles
- Opens new window for printing
- User selects "Save as PDF" in print dialog
- Styled with:
  - Professional fonts
  - Color-coded speakers
  - Bordered message boxes
  - Responsive layout
  - Print-specific CSS
```

---

### 6. Benefits

✅ **Flexibility**: Users can discuss any topic they choose
✅ **Multiple Formats**: Export in the format that works best for them
✅ **Professional Output**: PDF format for formal documentation
✅ **Developer-Friendly**: Markdown for GitHub/documentation
✅ **Universal**: TXT for maximum compatibility
✅ **Better UX**: Dropdown menus organize export options clearly
✅ **Consistent**: Same experience on desktop and mobile

---

### 7. Testing Checklist

**Custom Topics:**
- [ ] Click custom topic card
- [ ] Dialog opens with empty form
- [ ] Try to start with empty title (should be disabled)
- [ ] Enter title only and start debate
- [ ] Enter title + description and start debate
- [ ] Verify debate runs normally with custom topic
- [ ] Check if export shows custom topic info

**Export Formats:**
- [ ] Test TXT export (should work as before)
- [ ] Test Markdown export (should download .md file)
- [ ] Test PDF export (should open print dialog)
- [ ] Verify all formats include correct metadata
- [ ] Check that custom topics export correctly
- [ ] Test on mobile dropdown menu
- [ ] Verify disabled state when no messages

**Edge Cases:**
- [ ] Very long custom topic titles
- [ ] Special characters in topic names
- [ ] Empty description (should work fine)
- [ ] Cancel dialog without saving
- [ ] Export with only user messages
- [ ] Export with 100+ messages

---

### 8. Future Enhancements (Optional)

- **Direct PDF Library**: Use jsPDF or pdfMake for better PDF control
- **Topic Templates**: Suggest popular custom topic ideas
- **Save Custom Topics**: Store user's custom topics for reuse
- **Share Topics**: Allow users to share custom topic links
- **Export Styles**: Let users choose PDF theme/colors
- **Batch Export**: Export all formats at once
- **Email Export**: Send transcript via email
- **Cloud Save**: Save transcripts to user account

---

### 9. Known Limitations

**PDF Export:**
- Relies on browser's print-to-PDF functionality
- Quality depends on browser print implementation
- Some users might not know to select "Save as PDF"
- Consider adding instructions or tooltip

**Solution Ideas:**
- Add tooltip: "Select 'Save as PDF' in the print dialog"
- Use a PDF library for direct generation
- Add "How to export PDF" guide in UI

---

## Summary

Users can now:
1. ✨ **Create custom debate topics** with their own titles and descriptions
2. 📄 **Export transcripts in 3 formats**: TXT, Markdown, and PDF
3. 🎨 **Enjoy improved UI** with organized dropdown menus
4. 📱 **Access all features on mobile** with updated mobile menu

The debate feature is now more flexible and professional, allowing users to tailor the experience to their needs and export in their preferred format!
