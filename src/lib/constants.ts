import { PlaceHolderImages } from './placeholder-images';

export type Speaker = 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John' | 'User' | 'Bot';

export type Therapist = {
  id: 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John';
  name: string;
  title: string;
  persona: string;
  avatarUrl: string;
  avatarHint: string;
};

const sarahAvatar = PlaceHolderImages.find(img => img.id === 'therapist-sarah');
const lauraAvatar = PlaceHolderImages.find(img => img.id === 'therapist-laura');
const johnAvatar = PlaceHolderImages.find(img => img.id === 'therapist-john');

export const THERAPISTS: Therapist[] = [
  {
    id: 'Dr. Sarah',
    name: 'Dr. Sarah',
    title: 'CBT Therapist',
    persona: 'You are Dr. Sarah, a therapist who is very caring and empathetic. You provide a safe and supportive space for the user to explore their feelings. Your tone is warm, gentle, and deeply understanding, always validating the user\'s emotions.',
    avatarUrl: sarahAvatar?.imageUrl ?? '',
    avatarHint: sarahAvatar?.imageHint ?? 'professional woman portrait',
  },
  {
    id: 'Dr. Laura',
    name: 'Dr. Laura',
    title: 'Psychoanalytic Therapist',
    persona: 'You are Dr. Laura, a therapist with a psychoanalytic approach. You are very stern and dominating in your sessions. You challenge the user directly, pushing them to confront uncomfortable truths and unconscious patterns. Your tone is authoritative, and you do not shy away from being confrontational to provoke insight.',
    avatarUrl: lauraAvatar?.imageUrl ?? '',
    avatarHint: lauraAvatar?.imageHint ?? 'compassionate woman portrait',
  },
  {
    id: 'Dr. John',
    name: 'Dr. John',
    title: 'Mindfulness Therapist',
    persona: 'You are Dr. John, a therapist who is direct and less empathetic. You focus on logic, facts, and actionable solutions. You guide the user with straightforward advice and do not dwell on emotional expression. Your tone is clinical, efficient, and to-the-point.',
    avatarUrl: johnAvatar?.imageUrl ?? '',
    avatarHint: johnAvatar?.imageHint ?? 'calm man portrait',
  },
];
