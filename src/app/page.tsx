"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { THERAPISTS } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquareHeart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <MessageSquareHeart className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold font-headline">AI Therapists</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
                Meet Your Personal AI Therapists
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Engage in meaningful conversations with AI companions designed to listen, understand, and provide support.
                Choose a therapist that best fits your needs.
              </p>
              <Link href="/chat">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your Session
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">Our AI Therapists</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {THERAPISTS.map((therapist) => (
                <div key={therapist.id} className="flex flex-col items-center text-center p-6 rounded-lg border">
                  <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                    <AvatarImage src={therapist.avatarUrl} alt={therapist.name} data-ai-hint={therapist.avatarHint} />
                    <AvatarFallback>{therapist.name.charAt(3)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">{therapist.name}</h3>
                  <p className="text-primary font-semibold">{therapist.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{therapist.persona.substring(therapist.persona.indexOf(',') + 1).trim()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AI Therapists. All rights reserved.</p>
      </footer>
    </div>
  );
}
