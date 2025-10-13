# AI Model Configuration

## Overview
This document describes how the AI therapist models are configured in the application.

## Model Assignments

- **Dr. Sarah** (CBT Therapist): Uses Google Gemini (`googleai/gemini-2.5-flash`)
- **Dr. Laura** (Psychoanalytic Therapist): Uses OpenAI GPT-4 (`openai/gpt-4o`)
- **Dr. John** (Mindfulness Therapist): Uses Google Gemini (`googleai/gemini-2.5-flash`)

## Configuration Files

### 1. Environment Variables (`.env`)
```bash
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_GENAI_API_KEY=your-gemini-api-key-here
```

**Note**: Never commit your actual API keys to version control. Keep them in your local `.env` file only.

### 2. Genkit Configuration (`src/ai/genkit.ts`)
The Genkit instance is configured with both Google AI and OpenAI plugins:

```typescript
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
```

### 3. AI Flow Router (`src/ai/flows/ai-responds-to-speakers.ts`)
The flow dynamically selects the appropriate model based on the current speaker:

```typescript
const modelToUse =
  input.currentSpeaker === 'Dr. Laura'
    ? 'openai/gpt-4o'
    : 'googleai/gemini-2.5-flash';

const {text} = await generate({
  model: modelToUse,
  prompt: conversationHistory,
  config: {
    temperature: 0.7,
    maxOutputTokens: 1000,
  },
});
```

## How It Works

1. **Environment Setup**: API keys are loaded from `.env` file
2. **Genkit Initialization**: Both AI providers are registered with their respective API keys
3. **Model Selection**: When a user sends a message, the `ai-responds-to-speakers` flow checks which therapist is responding
4. **API Call**: The appropriate model is called with the conversation history
5. **Response**: The AI-generated response is returned to the user

## Testing

You can verify your OpenAI API key is working correctly by running:

```bash
node scripts/check-openai-key.js
```

This script will:
- Read your API key from `.env`
- Make a test request to OpenAI's API
- Display available models
- Confirm the key is valid

## Troubleshooting

### Issue: "FAILED_PRECONDITION" Error
**Cause**: Missing or invalid `GOOGLE_GENAI_API_KEY`
**Solution**: Ensure your Gemini API key is added to `.env`

### Issue: "UNAUTHORIZED" Error
**Cause**: Invalid or expired API key
**Solution**: Regenerate your API key from the provider's dashboard

### Issue: Model Not Responding
**Cause**: Incorrect model name or provider configuration
**Solution**: Verify model names match the provider's documentation
- OpenAI: `openai/gpt-4o`, `openai/gpt-3.5-turbo`
- Google: `googleai/gemini-2.5-flash`, `googleai/gemini-pro`
