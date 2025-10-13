"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DEBATE_TOPICS, THERAPISTS, type DebateMessage, type PlaybackSpeed } from '@/lib/constants';
import * as actions from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquareHeart, 
  Play, 
  Pause, 
  RotateCcw, 
  Send,
  Gauge,
  ArrowLeft,
  Loader2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type DebateState = 'selecting' | 'playing' | 'paused' | 'finished';

export default function DebatePage() {
  const router = useRouter();
  const { user, loading: authLoading, isEmailVerified } = useAuth();
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [debateState, setDebateState] = useState<DebateState>('selecting');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentExchange, setCurrentExchange] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextSpeaker, setNextSpeaker] = useState<'Dr. Sarah' | 'Dr. Laura' | 'Dr. John'>('Dr. Sarah');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateContainerRef = useRef<HTMLDivElement>(null);
  
  // Protect route
  useEffect(() => {
    if (!authLoading && (!user || !isEmailVerified)) {
      router.push('/login');
    }
  }, [user, isEmailVerified, authLoading, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-play debate
  useEffect(() => {
    if (debateState === 'playing' && currentExchange < 20 && !isGenerating) {
      const delay = (3000 / playbackSpeed); // Base delay of 3 seconds
      const timer = setTimeout(() => {
        generateNextExchange();
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (debateState === 'playing' && currentExchange >= 20) {
      setDebateState('finished');
    }
  }, [debateState, currentExchange, playbackSpeed, isGenerating]);

  const startDebate = (topicId: string) => {
    setSelectedTopic(topicId);
    setMessages([]);
    setCurrentExchange(0);
    setNextSpeaker('Dr. Sarah');
    setDebateState('playing');
  };

  const generateNextExchange = async () => {
    if (!selectedTopic) return;
    
    setIsGenerating(true);
    const topic = DEBATE_TOPICS.find(t => t.id === selectedTopic);
    if (!topic) return;

    try {
      const previousExchanges = messages.filter(m => !m.isUserMessage).map(m => ({
        speaker: m.speaker as 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John',
        message: m.message,
      }));

      const result = await actions.generateDebateExchange({
        topic: topic.title,
        topicDescription: topic.description,
        exchangeNumber: currentExchange + 1,
        previousExchanges,
        currentSpeaker: nextSpeaker,
      });

      const newMessage: DebateMessage = {
        id: `${Date.now()}-${result.speaker}`,
        speaker: result.speaker,
        message: result.message,
        timestamp: new Date(),
        isUserMessage: false,
      };

      setMessages(prev => [...prev, newMessage]);
      setCurrentExchange(prev => prev + 1);
      setNextSpeaker(result.nextSpeaker);
    } catch (error) {
      console.error('[Debate] Error generating exchange:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUserIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedTopic) return;

    // Add user message
    const userMessage: DebateMessage = {
      id: `${Date.now()}-user`,
      speaker: 'User',
      message: userInput.trim(),
      timestamp: new Date(),
      isUserMessage: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Pause to let user message be read
    setDebateState('paused');
  };

  const resetDebate = () => {
    setSelectedTopic(null);
    setMessages([]);
    setCurrentExchange(0);
    setDebateState('selecting');
    setNextSpeaker('Dr. Sarah');
  };

  const togglePlayPause = () => {
    if (debateState === 'playing') {
      setDebateState('paused');
    } else if (debateState === 'paused' || debateState === 'finished') {
      if (currentExchange >= 20) {
        setCurrentExchange(0);
        setMessages([]);
        setNextSpeaker('Dr. Sarah');
      }
      setDebateState('playing');
    }
  };

  const cycleSpeed = () => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };

  const selectedTopicData = selectedTopic ? DEBATE_TOPICS.find(t => t.id === selectedTopic) : null;

  // Topic Selection View
  if (debateState === 'selecting') {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex flex-col max-w-6xl mx-auto p-6">
          <header className="mb-8">
            <Link href="/chat" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquareHeart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-headline font-bold">Therapist Roundtable Debates</h1>
            </div>
            <p className="text-muted-foreground">
              Observe professional debates between three expert therapists with different philosophies,
              or jump in with your own questions.
            </p>
          </header>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Each debate features Dr. Sarah (CBT), Dr. Laura (Psychoanalytic), and Dr. John (Mindfulness)
              discussing mental health topics. Debates last 5-7 minutes with 20+ exchanges. You can pause,
              adjust playback speed, or add your own questions anytime.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Required Topics</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {DEBATE_TOPICS.filter(t => t.category === 'required').map(topic => (
                  <Card key={topic.id} className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => startDebate(topic.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <Badge variant="secondary">{topic.estimatedDuration}</Badge>
                      </div>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Additional Topics</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {DEBATE_TOPICS.filter(t => t.category === 'optional').map(topic => (
                  <Card key={topic.id} className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => startDebate(topic.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <Badge variant="outline">{topic.estimatedDuration}</Badge>
                      </div>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debate Viewing Interface
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto">
        {/* Header with Controls */}
        <header className="border-b bg-card p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold">{selectedTopicData?.title}</h2>
              <p className="text-sm text-muted-foreground">
                Exchange {currentExchange} of 20+
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cycleSpeed}>
                <Gauge className="h-4 w-4 mr-2" />
                {playbackSpeed}x
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePlayPause}
                disabled={isGenerating}
              >
                {debateState === 'playing' ? (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> {debateState === 'finished' ? 'Replay' : 'Resume'}</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={resetDebate}>
                <RotateCcw className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </div>
          </div>
        </header>

        {/* Debate Messages */}
        <div ref={debateContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => {
            const therapist = THERAPISTS.find(t => t.id === message.speaker);
            const isUser = message.speaker === 'User';

            return (
              <div 
                key={message.id} 
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
                  isUser && "flex-row-reverse"
                )}
              >
                <Avatar className="w-10 h-10 border-2">
                  {therapist && <AvatarImage src={therapist.avatarUrl} />}
                  <AvatarFallback>{message.speaker.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col gap-1 max-w-2xl", isUser && "items-end")}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {therapist?.name || message.speaker}
                    </span>
                    {therapist && (
                      <Badge variant="outline" className="text-xs">
                        {therapist.title}
                      </Badge>
                    )}
                  </div>
                  <Card className={cn(
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-card'
                  )}>
                    <CardContent className="p-3">
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
          
          {isGenerating && (
            <div className="flex items-center gap-3 opacity-60">
              <Avatar className="w-10 h-10 border-2">
                <AvatarFallback>
                  <Loader2 className="h-5 w-5 animate-spin" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{nextSpeaker} is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* User Intervention Input */}
        <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleUserIntervention} className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder="Jump in with your question or comment..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="pr-12 min-h-[52px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUserIntervention(e as any);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute top-1/2 -translate-y-1/2 right-2"
                disabled={!userInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The debate will pause when you send a message. Press Resume to continue.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
