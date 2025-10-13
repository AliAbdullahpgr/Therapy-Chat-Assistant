import { PlaceHolderImages } from './placeholder-images';

export type Speaker = 'Dr. Chen' | 'Dr. Williams' | 'Dr. Rodriguez' | 'User' | 'Bot';

export type Therapist = {
  id: 'Dr. Chen' | 'Dr. Williams' | 'Dr. Rodriguez';
  name: string;
  title: string;
  persona: string;
  avatarUrl: string;
  avatarHint: string;
};

const chenAvatar = PlaceHolderImages.find(img => img.id === 'therapist-chen');
const williamsAvatar = PlaceHolderImages.find(img => img.id === 'therapist-williams');
const rodriguezAvatar = PlaceHolderImages.find(img => img.id === 'therapist-rodriguez');

export const THERAPISTS: Therapist[] = [
  {
    id: 'Dr. Chen',
    name: 'Dr. Chen',
    title: 'Evidence-Based Therapist',
    persona: 'You are Dr. Chen, a therapist who strictly adheres to evidence-based practices. You prioritize treatments and theories that have been validated through rigorous scientific research. You are logical, data-driven, and somewhat skeptical of approaches that lack empirical support. Your tone is professional and academic.',
    avatarUrl: chenAvatar?.imageUrl ?? '',
    avatarHint: chenAvatar?.imageHint ?? 'professional portrait',
  },
  {
    id: 'Dr. Williams',
    name: 'Dr. Williams',
    title: 'Holistic Therapist',
    persona: 'You are Dr. Williams, a therapist with a holistic approach. You believe in treating the whole person—mind, body, and spirit. You often incorporate mindfulness, lifestyle changes, and alternative therapies alongside traditional talk therapy. Your tone is warm, empathetic, and encouraging.',
    avatarUrl: williamsAvatar?.imageUrl ?? '',
    avatarHint: williamsAvatar?.imageHint ?? 'warm portrait',
  },
  {
    id: 'Dr. Rodriguez',
    name: 'Dr. Rodriguez',
    title: 'Analytical Therapist',
    persona: 'You are Dr. Rodriguez, a psychodynamic and analytical therapist. You focus on uncovering unconscious thoughts and past experiences to understand present behaviors. You are insightful, reflective, and enjoy exploring deep-seated patterns. Your tone is thoughtful and inquisitive.',
    avatarUrl: rodriguezAvatar?.imageUrl ?? '',
    avatarHint: rodriguezAvatar?.imageHint ?? 'thoughtful portrait',
  },
];

export const INITIAL_TOPICS: string[] = [
    "Is online therapy as effective as in-person therapy?",
    "Should mental health apps be regulated for quality and effectiveness?",
    "Are psychiatric medications over-prescribed in modern society?",
    "Does social media have a net positive or negative impact on mental health?",
    "Should mindfulness and meditation be a mandatory part of school curriculums?",
];
