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

export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  avatarUrl: string;
  avatarHint: string;
};

const testimonialUser1Avatar = PlaceHolderImages.find(img => img.id === 'testimonial-user-1');
const testimonialUser2Avatar = PlaceHolderImages.find(img => img.id === 'testimonial-user-2');
const testimonialUser3Avatar = PlaceHolderImages.find(img => img.id === 'testimonial-user-3');


export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    quote: "Speaking with Dr. Sarah has been a transformative experience. I've learned so much about myself and how to handle my anxiety. The platform is so easy to use.",
    avatarUrl: testimonialUser1Avatar?.imageUrl ?? '',
    avatarHint: testimonialUser1Avatar?.imageHint ?? 'smiling person',
  },
  {
    id: 'user-2',
    name: 'Samantha Lee',
    quote: "Dr. John's direct approach is exactly what I needed. No sugar-coating, just practical advice that gets results. It's like having a mental coach in your pocket.",
    avatarUrl: testimonialUser2Avatar?.imageUrl ?? '',
    avatarHint: testimonialUser2Avatar?.imageHint ?? 'thoughtful person',
  },
  {
    id: 'user-3',
    name: 'Michael Chen',
    quote: "I was skeptical about AI therapy, but this app changed my mind. The conversations feel real and genuinely helpful. Highly recommended for anyone needing support.",
    avatarUrl: testimonialUser3Avatar?.imageUrl ?? '',
    avatarHint: testimonialUser3Avatar?.imageHint ?? 'happy person',
  }
];
