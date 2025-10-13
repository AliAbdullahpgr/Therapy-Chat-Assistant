"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Info,
  Download,
  Users,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { exportDebateTranscript, formatTimestamp } from '@/lib/debate-export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const [showParticipants, setShowParticipants] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateContainerRef = useRef<HTMLDivElement>(null);
  
  // Protect route
  useEffect(() => {
    if (!authLoading && (!user || !isEmailVerified)) {
      router.push('/login');
    }
  }, [user, isEmailVerified, authLoading, router]);

  // Auto-scroll to bottom when messages change or when generating starts
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const startDebate = (topicId: string) => {
    setSelectedTopic(topicId);
    setMessages([]);
    setCurrentExchange(0);
    setNextSpeaker('Dr. Sarah');
    setDebateState('playing');
  };

  const generateNextExchange = useCallback(async () => {
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
  }, [selectedTopic, messages, currentExchange, nextSpeaker]);

  // Auto-play debate
  useEffect(() => {
    if (debateState === 'playing' && currentExchange < 20 && !isGenerating) {
      // Speed settings: 1x = 2.5s, 1.5x = 1.5s, 2x = 1s
      let delay = 2500; // 1x speed (2.5 seconds)
      if (playbackSpeed === 1.5) {
        delay = 1500; // 1.5x speed (1.5 seconds)
      } else if (playbackSpeed === 2) {
        delay = 1000; // 2x speed (1 second)
      }
      const timer = setTimeout(() => {
        generateNextExchange();
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (debateState === 'playing' && currentExchange >= 20) {
      setDebateState('finished');
    }
  }, [debateState, currentExchange, playbackSpeed, isGenerating, generateNextExchange]);

  const handleUserIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedTopic) return;

    const wasPaused = debateState === 'paused';
    const wasPlaying = debateState === 'playing';
    
    // Temporarily pause if playing
    if (wasPlaying) {
      setDebateState('paused');
    }

    // Add user message
    const userMessage: DebateMessage = {
      id: `${Date.now()}-user`,
      speaker: 'User',
      message: userInput.trim(),
      timestamp: new Date(),
      isUserMessage: true,
    };

    setMessages(prev => [...prev, userMessage]);
    const userInputText = userInput.trim();
    setUserInput('');
    
    // Scroll to bottom after user message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    // Generate a response from the next therapist addressing the user's comment
    if (!selectedTopic) return;
    
    const topic = DEBATE_TOPICS.find(t => t.id === selectedTopic);
    if (!topic) return;

    setIsGenerating(true);
    
    try {
      const previousExchanges = messages
        .filter(m => !m.isUserMessage)
        .map(m => ({
          speaker: m.speaker as 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John',
          message: m.message,
        }));

      // Add user's message to context
      const contextWithUser = [
        ...previousExchanges,
        { speaker: 'Dr. Sarah' as const, message: `User asked: "${userInputText}"` }
      ];

      const result = await actions.generateDebateExchange({
        topic: topic.title,
        topicDescription: topic.description,
        exchangeNumber: currentExchange + 1,
        previousExchanges: contextWithUser,
        currentSpeaker: nextSpeaker,
      });

      const responseMessage: DebateMessage = {
        id: `${Date.now()}-${result.speaker}`,
        speaker: result.speaker,
        message: result.message,
        timestamp: new Date(),
        isUserMessage: false,
      };

      setMessages(prev => [...prev, responseMessage]);
      setCurrentExchange(prev => prev + 1);
      setNextSpeaker(result.nextSpeaker);
      
      // Resume playing if it was playing before
      if (wasPlaying) {
        setDebateState('playing');
      }
    } catch (error) {
      console.error('[Debate] Error generating response to user:', error);
    } finally {
      setIsGenerating(false);
    }
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

  const handleExport = () => {
    if (!selectedTopicData || messages.length === 0) return;
    exportDebateTranscript(messages, selectedTopicData.title, selectedTopicData.description);
  };

  const selectedTopicData = selectedTopic ? DEBATE_TOPICS.find(t => t.id === selectedTopic) : null;

  // Get participant statistics
  const participantStats = React.useMemo(() => {
    const stats = new Map<string, number>();
    messages.forEach(msg => {
      stats.set(msg.speaker, (stats.get(msg.speaker) || 0) + 1);
    });
    return stats;
  }, [messages]);

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
    <div className="flex h-screen bg-background">
      {/* Participant Sidebar - Hidden on mobile */}
      <aside className={cn(
        "hidden md:flex md:flex-col border-r bg-card transition-all duration-300 overflow-hidden",
        showParticipants ? "w-64" : "w-0"
      )}>
        <div className="p-4 w-64 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">Participants</h3>
          </div>
          
          <div className="space-y-3">
            {THERAPISTS.map(therapist => {
              const messageCount = participantStats.get(therapist.id) || 0;
              const isActive = nextSpeaker === therapist.id && isGenerating;
              
              return (
                <div 
                  key={therapist.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 transition-all",
                    therapist.borderColor,
                    isActive && "ring-2 ring-offset-2 ring-primary animate-pulse"
                  )}
                >
                  <Avatar className={cn("w-10 h-10 border-2", therapist.borderColor)}>
                    <AvatarImage src={therapist.avatarUrl} />
                    <AvatarFallback className={therapist.bgColor}>
                      {therapist.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm", therapist.color)}>
                      {therapist.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {therapist.title}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {participantStats.has('User') && (
              <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary">
                <Avatar className="w-10 h-10 border-2 border-primary">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">You</p>
                  <p className="text-xs text-muted-foreground">Participant</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {participantStats.get('User')} {participantStats.get('User') === 1 ? 'message' : 'messages'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Header with Controls */}
        <header className="border-b bg-card px-3 md:px-6 py-2 md:py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm md:text-base font-semibold truncate">{selectedTopicData?.title}</h2>
              <p className="text-xs text-muted-foreground">
                Exchange {currentExchange} of 20+ • {messages.length} messages
              </p>
            </div>
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="h-4 w-4 mr-2" />
                {showParticipants ? 'Hide' : 'Show'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={messages.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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

            {/* Mobile Controls Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowParticipants(!showParticipants)}>
                    <Users className="h-4 w-4 mr-2" />
                    {showParticipants ? 'Hide' : 'Show'} Participants
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport} disabled={messages.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Transcript
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={cycleSpeed}>
                    <Gauge className="h-4 w-4 mr-2" />
                    Speed: {playbackSpeed}x
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={togglePlayPause} disabled={isGenerating}>
                    {debateState === 'playing' ? (
                      <><Pause className="h-4 w-4 mr-2" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" /> {debateState === 'finished' ? 'Replay' : 'Resume'}</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={resetDebate}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New Topic
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Debate Messages */}
        <div ref={debateContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((message, index) => {
            const therapist = THERAPISTS.find(t => t.id === message.speaker);
            const isUser = message.speaker === 'User';

            return (
              <div 
                key={message.id} 
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700",
                  isUser && "flex-row-reverse"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className={cn(
                  "w-12 h-12 border-2 shadow-sm flex-shrink-0",
                  therapist?.borderColor || "border-primary"
                )}>
                  {therapist && <AvatarImage src={therapist.avatarUrl} />}
                  <AvatarFallback className={therapist?.bgColor || "bg-primary/10"}>
                    <span className={therapist?.color || "text-primary"}>
                      {message.speaker.charAt(0)}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col gap-2 max-w-2xl flex-1", isUser && "items-end")}>
                  <div className={cn("flex items-center gap-2", isUser && "flex-row-reverse")}>
                    <span className={cn(
                      "font-semibold text-sm",
                      isUser ? "text-primary" : "text-foreground"
                    )}>
                      {therapist?.name || message.speaker}
                    </span>
                    {therapist && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", therapist.borderColor)}
                      >
                        {therapist.title}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <Card className={cn(
                    "border-2 transition-shadow hover:shadow-md",
                    isUser 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : therapist?.borderColor || 'border-border',
                    !isUser && therapist?.bgColor
                  )}>
                    <CardContent className="p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {message.message}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
          
          {isGenerating && (
            <div className="flex items-start gap-3 animate-pulse">
              {(() => {
                const nextTherapist = THERAPISTS.find(t => t.id === nextSpeaker);
                return (
                  <>
                    <Avatar className={cn(
                      "w-12 h-12 border-2",
                      nextTherapist?.borderColor
                    )}>
                      <AvatarFallback className={nextTherapist?.bgColor}>
                        <Loader2 className={cn("h-5 w-5 animate-spin", nextTherapist?.color)} />
                      </AvatarFallback>
                    </Avatar>
                    <Card className={cn(
                      "border-2",
                      nextTherapist?.borderColor,
                      nextTherapist?.bgColor
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", nextTherapist?.color)}>
                            {nextSpeaker} is composing a response
                          </span>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* User Intervention Input */}
        <div className="border-t p-3 md:p-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleUserIntervention} className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder="Ask a question or share your perspective... The therapists will respond!"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="pr-12 min-h-[52px] resize-none text-sm md:text-base"
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
          </form>
        </div>
      </div>
    </div>
  );
}
