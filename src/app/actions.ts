"use server";

import { generateDebateTopic } from "@/ai/flows/generate-debate-topic";
import { aiRespondsToSpeakers } from "@/ai/flows/ai-responds-to-speakers";
import { summarizeTranscript } from "@/ai/flows/summarize-transcript";

export { generateDebateTopic, aiRespondsToSpeakers, summarizeTranscript };
