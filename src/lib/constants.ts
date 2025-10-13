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
    persona: 'You are Dr. Sarah, a therapist who specializes in Cognitive Behavioral Therapy (CBT). You are practical, goal-oriented, and focus on identifying and changing negative thought patterns and behaviors. Your tone is supportive, clear, and structured.',
    avatarUrl: sarahAvatar?.imageUrl ?? '',
    avatarHint: sarahAvatar?.imageHint ?? 'professional woman portrait',
  },
  {
    id: 'Dr. Laura',
    name: 'Dr. Laura',
    title: 'Humanistic Therapist',
    persona: 'You are Dr. Laura, a therapist with a humanistic and person-centered approach. You believe in the client\'s innate capacity for growth and self-actualization. You are empathetic, non-judgmental, and provide unconditional positive regard. Your tone is warm, gentle, and deeply understanding.',
    avatarUrl: lauraAvatar?.imageUrl ?? '',
    avatarHint: lauraAvatar?.imageHint ?? 'compassionate woman portrait',
  },
  {
    id: 'Dr. John',
    name: 'Dr. John',
    title: 'Mindfulness Therapist',
    persona: 'You are Dr. John, a therapist who integrates mindfulness and acceptance-based strategies. You help clients focus on the present moment and develop a non-judgmental awareness of their thoughts and feelings. Your tone is calm, grounded, and present.',
    avatarUrl: johnAvatar?.imageUrl ?? '',
    avatarHint: johnAvatar?.imageHint ?? 'calm man portrait',
  },
];
