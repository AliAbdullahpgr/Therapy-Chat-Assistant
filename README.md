# 🧠 Solace - Therapy Chat Assistant

**An AI-powered mental health support application featuring multiple therapeutic approaches and interactive debates between AI therapists.**

Built with Next.js 15, Firebase, Google Gemini AI, and OpenAI.

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [How to Use](#-how-to-use)
- [Special Features](#-special-features)
- [Configuration](#-configuration)
- [Known Limitations](#-known-limitations)
- [Tech Stack](#-tech-stack)
- [Development](#-development)

---

## ✨ Features

### 🗣️ Multi-Therapist Chat
- **Three AI Therapists** with different therapeutic approaches:
  - **Dr. Sarah** - Cognitive Behavioral Therapy (CBT)
  - **Dr. Laura** - Psychoanalytic Therapy
  - **Dr. John** - Mindfulness-Based Therapy
- Switch between therapists seamlessly
- Individual conversation history for each therapist
- Real-time AI responses using Google Gemini and OpenAI

### 🎭 Therapist Roundtable Debates
- Watch three AI therapists debate mental health topics
- **Pre-defined Topics**: Required and additional discussion topics
- **Custom Topics**: Create your own debate topics
- **Interactive Participation**: 
  - Send messages during debates
  - All three therapists respond to your questions
  - Pause/resume control
- **Adjustable Speed**: 1x, 1.5x, 2x playback speeds
- **Export Options**: Download transcripts in TXT, Markdown, or PDF format

### 🔐 Authentication & Security
- Email/password authentication via Firebase
- Email verification required for access
- Secure session management
- Protected routes

### 💾 Conversation Persistence
- All conversations saved to Firebase Firestore
- Access your conversation history anytime
- Clear conversations when needed

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Mobile Optimized**: Burger menu for participants on mobile
- **Real-time Updates**: Live conversation synchronization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Firebase account (free tier works)
- Google AI API key
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AliAbdullahpgr/Therapy-Chat-Assistant.git
cd Therapy-Chat-Assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI Configuration
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to `http://localhost:9002`

---

## 📖 How to Use

### Getting Started

1. **Sign Up**
   - Click "Get Started" on the home page
   - Enter your email and password
   - Verify your email (check inbox/spam)

2. **Log In**
   - After verification, log in with your credentials
   - You'll be redirected to the chat interface

### Using the Chat Feature

1. **Select a Therapist**
   - Choose from Dr. Sarah (CBT), Dr. Laura (Psychoanalytic), or Dr. John (Mindfulness)
   - Each therapist has a unique therapeutic approach

2. **Start Chatting**
   - Type your message in the input box
   - Press Enter or click Send
   - Wait for the AI therapist's response

3. **Switch Therapists**
   - Use the sidebar to switch between different therapists
   - Each conversation is saved separately

4. **Clear Conversation**
   - Click the menu icon (⋮) in the header
   - Select "Clear Conversation" to start fresh

### Using the Debate Feature

1. **Access Debates**
   - Click "Observe Debates" from the chat page

2. **Choose a Topic**
   - **Pre-defined Topics**: Select from required or additional topics
   - **Custom Topic**: Click "Create Custom Debate" to enter your own topic

3. **Watch the Debate**
   - The debate starts automatically
   - Three therapists discuss the topic with different perspectives

4. **Interact During Debate**
   - **Playing Mode**: Type your question and all three therapists will respond
   - **Paused Mode**: Messages are added but therapists don't respond until you resume
   - Use Pause/Resume button to control the debate

5. **Adjust Speed**
   - Click the speed button to cycle through 1x, 1.5x, 2x speeds
   - Slower speeds give more reading time

6. **View Participants**
   - Desktop: Click "Show Participants" button
   - Mobile: Use the burger menu (☰) on the left

7. **Export Transcript**
   - Click the "Export" dropdown
   - Choose format: TXT, Markdown, or PDF
   - Transcript includes all messages and metadata

---

## 🌟 Special Features

### 1. Multi-Model AI Integration
- **Dr. Sarah & Dr. John**: Powered by Google Gemini 2.0 Flash
- **Dr. Laura**: Powered by OpenAI GPT-4o
- Diverse AI perspectives for richer conversations

### 2. Debate Interaction System
- **Smart Pause Control**: Debates pause when you send a message (only in playing mode)
- **All Therapists Respond**: Get perspectives from all three therapists on your questions
- **Timed Responses**: 2-second delay between responses for natural reading flow

### 3. Custom Topic Creation
- Create debates on any mental health topic
- Add optional descriptions for context
- Works seamlessly with all debate features

### 4. Multiple Export Formats
- **TXT**: Clean plain text with proper formatting
- **Markdown**: GitHub-flavored markdown with structure
- **PDF**: Professional document with color-coded speakers (via browser print)

### 5. Real-Time Synchronization
- Conversations automatically sync with Firestore
- Access from any device
- No data loss

### 6. Theme Customization
- Persistent theme preference
- Smooth transitions
- System theme detection

---

## ⚙️ Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy configuration values to `.env.local`

**Firestore Security Rules:**
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

### AI API Keys

**Google AI:**
- Get your API key from [ai.google.dev](https://ai.google.dev)
- Free tier available

**OpenAI:**
- Get your API key from [platform.openai.com](https://platform.openai.com)
- Requires payment setup

---

## ⚠️ Known Limitations

### Technical Limitations

1. **API Rate Limits**
   - Google AI: Subject to their free/paid tier limits
   - OpenAI: Based on your usage plan
   - May experience delays during high traffic

2. **PDF Export**
   - Uses browser print dialog
   - User must select "Save as PDF"
   - Quality depends on browser implementation
   - Consider using a PDF library for better control

3. **Debate Length**
   - Debates are capped at 20 exchanges by default
   - Can be modified in code if needed

4. **Message History**
   - Limited by Firestore free tier (1GB storage)
   - Older conversations may need cleanup

### Feature Limitations

1. **No Audio/Video**
   - Text-based only
   - No voice input/output

2. **Single Language**
   - Currently supports English only
   - Therapists respond in English

3. **No Real-Time Collaboration**
   - Single-user experience
   - No group therapy sessions

4. **Limited Context Window**
   - AI models have token limits
   - Very long conversations may lose early context

### Recommendations

- **For Production**: 
  - Implement rate limiting
  - Add usage monitoring
  - Set up error tracking (Sentry, etc.)
  - Configure proper Firestore indexes
  
- **For Better PDF Export**:
  - Consider integrating jsPDF or pdfMake
  - Add export progress indicators

- **For Scalability**:
  - Implement caching strategy
  - Add message pagination
  - Consider serverless functions for AI calls

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Lucide React** - Icons

### Backend & Services
- **Firebase Authentication** - User management
- **Firebase Firestore** - Database
- **Google Gemini 2.0 Flash** - AI model (Dr. Sarah & Dr. John)
- **OpenAI GPT-4o** - AI model (Dr. Laura)
- **Genkit** - AI orchestration

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **date-fns** - Date formatting

---

## 👨‍💻 Development

### Available Scripts

```bash
# Development server (runs on port 9002)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# TypeScript type checking
npm run typecheck

# Genkit development mode
npm run genkit:dev

# Genkit watch mode
npm run genkit:watch
```

### Project Structure

```
therapy-chat-assistant/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── page.tsx        # Home page
│   │   ├── chat/           # Chat interface
│   │   ├── debate/         # Debate feature
│   │   ├── login/          # Authentication
│   │   ├── signup/         # Registration
│   │   └── verify-email/   # Email verification
│   ├── components/         # React components
│   │   └── ui/            # Shadcn UI components
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/               # Utilities and services
│   │   ├── firebase.ts    # Firebase configuration
│   │   ├── constants.ts   # App constants
│   │   ├── auth-service.ts        # Auth functions
│   │   ├── conversation-service.ts # Firestore functions
│   │   └── debate-export.ts       # Export utilities
│   ├── ai/                # AI flows and configuration
│   │   ├── genkit.ts      # Genkit setup
│   │   └── flows/         # AI conversation flows
│   └── hooks/             # Custom React hooks
├── docs/                  # Documentation
├── public/               # Static assets
└── scripts/              # Utility scripts
```

### Adding New Features

1. **New Therapist**:
   - Update `src/lib/constants.ts` with therapist details
   - Add AI flow in `src/ai/flows/`
   - Update UI components

2. **New Debate Topic**:
   - Add to `DEBATE_TOPICS` in `src/lib/constants.ts`

3. **New Export Format**:
   - Add export function in `src/lib/debate-export.ts`
   - Update export dropdown in `src/app/debate/page.tsx`

### Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build test
npm run build
```

---

## 📚 Additional Documentation

Detailed documentation available in the `docs/` folder:

- `ai-model-configuration.md` - AI setup and configuration
- `authentication-implementation.md` - Auth flow details
- `firebase-setup.md` - Firebase configuration guide
- `firestore-integration.md` - Database integration
- `debate-feature.md` - Debate feature documentation
- `debate-improvements-oct-2025.md` - Recent debate updates
- `custom-topics-and-export-formats.md` - Latest features

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is part of a thesis/research project.

---

## 👤 Author

**Ali Abdullah**
- GitHub: [@AliAbdullahpgr](https://github.com/AliAbdullahpgr)

---

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- OpenAI for GPT-4o integration
- Firebase for backend infrastructure
- Next.js team for the amazing framework
- Shadcn for beautiful UI components

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation in `docs/`
- Review `PRODUCTION-READY.md` for deployment guidance

---

## 🚀 Deployment

See `DEPLOYMENT-CHECKLIST.md` for production deployment instructions.

**Recommended Platforms:**
- Vercel (best for Next.js)
- Firebase Hosting
- AWS Amplify
- Netlify

---

**Made with ❤️ for mental health support**
