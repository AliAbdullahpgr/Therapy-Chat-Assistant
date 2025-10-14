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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  MoreVertical,
  Menu,
  Plus,
  FileText,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { exportDebateTranscript, exportToMarkdown, exportToPDF, formatTimestamp } from '@/lib/debate-export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  const [mobileParticipantsOpen, setMobileParticipantsOpen] = useState(false);
  const [customTopicDialogOpen, setCustomTopicDialogOpen] = useState(false);
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicDescription, setCustomTopicDescription] = useState('');
  const [customTopicData, setCustomTopicData] = useState<{ title: string; description: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate selected topic data (memoized)
  const selectedTopicData = React.useMemo(() => {
    if (!selectedTopic) return null;
    if (selectedTopic === 'custom') return customTopicData;
    return DEBATE_TOPICS.find(t => t.id === selectedTopic) || null;
  }, [selectedTopic, customTopicData]);
  
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

  const startCustomDebate = () => {
    if (!customTopicTitle.trim()) return;
    
    setCustomTopicData({
      title: customTopicTitle,
      description: customTopicDescription || 'Custom debate topic',
    });
    setSelectedTopic('custom');
    setMessages([]);
    setCurrentExchange(0);
    setNextSpeaker('Dr. Sarah');
    setDebateState('playing');
    setCustomTopicDialogOpen(false);
    
    // Reset form
    setCustomTopicTitle('');
    setCustomTopicDescription('');
  };

  const generateNextExchange = useCallback(async () => {
    if (!selectedTopic || !selectedTopicData) return;
    
    setIsGenerating(true);

    try {
      const previousExchanges = messages.filter(m => !m.isUserMessage).map(m => ({
        speaker: m.speaker as 'Dr. Sarah' | 'Dr. Laura' | 'Dr. John',
        message: m.message,
      }));

      const result = await actions.generateDebateExchange({
        topic: selectedTopicData.title,
        topicDescription: selectedTopicData.description,
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
  }, [selectedTopic, selectedTopicData, messages, currentExchange, nextSpeaker]);

  // Auto-play debate
  useEffect(() => {
    if (debateState === 'playing' && currentExchange < 20 && !isGenerating) {
      // Speed settings: 1x = 4s, 1.5x = 3s, 2x = 2s (slower pacing)
      let delay = 6000; // 1x speed (4 seconds)
      if (playbackSpeed === 1.5) {
        delay = 4000; // 1.5x speed (3 seconds)
      } else if (playbackSpeed === 2) {
        delay = 2000; // 2x speed (2 seconds)
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

    // Check if debate is NOT in playing state - if paused, just add message and don't respond
    const shouldGenerateResponses = debateState === 'playing';
    
    // Always pause when user sends a message
    setDebateState('paused');

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
    
    // If debate was paused, don't generate responses - user must resume first
    if (!shouldGenerateResponses) {
      console.log('[Debate] Message sent while paused - no responses generated. Press Resume to continue.');
      return;
    }
    
    // Generate responses from ALL therapists addressing the user's comment
    if (!selectedTopic || !selectedTopicData) return;

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

      // Get responses from all three therapists
      const therapistIds: Array<'Dr. Sarah' | 'Dr. Laura' | 'Dr. John'> = ['Dr. Sarah', 'Dr. Laura', 'Dr. John'];
      
      for (let i = 0; i < therapistIds.length; i++) {
        const therapistId = therapistIds[i];
        
        const result = await actions.generateDebateExchange({
          topic: selectedTopicData.title,
          topicDescription: selectedTopicData.description,
          exchangeNumber: currentExchange + 1,
          previousExchanges: contextWithUser,
          currentSpeaker: therapistId,
        });

        const responseMessage: DebateMessage = {
          id: `${Date.now()}-${result.speaker}-${Math.random()}`,
          speaker: result.speaker,
          message: result.message,
          timestamp: new Date(),
          isUserMessage: false,
        };

        setMessages(prev => [...prev, responseMessage]);
        setCurrentExchange(prev => prev + 1);
        
        // Wait for message to be displayed before adding delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Scroll to show the new message
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Add delay AFTER displaying the message (except for the last one)
        if (i < therapistIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between responses
        }
      }
      
      // Set next speaker to cycle back
      setNextSpeaker('Dr. Sarah');
      
      // Stay paused - user must press resume to continue
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

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    if (!selectedTopicData || messages.length === 0) return;
    
    switch (format) {
      case 'txt':
        exportDebateTranscript(messages, selectedTopicData.title, selectedTopicData.description);
        break;
      case 'md':
        exportToMarkdown(messages, selectedTopicData.title, selectedTopicData.description);
        break;
      case 'pdf':
        exportToPDF(messages, selectedTopicData.title, selectedTopicData.description);
        break;
    }
  };

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

            <div>
              <h2 className="text-xl font-semibold mb-4">Custom Topic</h2>
              <Dialog open={customTopicDialogOpen} onOpenChange={setCustomTopicDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary transition-colors border-dashed border-2">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Create Custom Debate</CardTitle>
                          <CardDescription>Choose your own topic for the therapists to discuss</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Custom Debate Topic</DialogTitle>
                    <DialogDescription>
                      Enter a topic and the three therapists will debate from their unique perspectives.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="topic-title">Topic Title *</Label>
                      <Input
                        id="topic-title"
                        placeholder="e.g., The Role of Medication in Mental Health Treatment"
                        value={customTopicTitle}
                        onChange={(e) => setCustomTopicTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="topic-description">Description (Optional)</Label>
                      <Textarea
                        id="topic-description"
                        placeholder="Add more context about what you'd like the therapists to discuss..."
                        value={customTopicDescription}
                        onChange={(e) => setCustomTopicDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCustomTopicDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={startCustomDebate}
                      disabled={!customTopicTitle.trim()}
                    >
                      Start Debate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
            {/* Mobile Burger Menu for Participants */}
            <div className="md:hidden">
              <Sheet open={mobileParticipantsOpen} onOpenChange={setMobileParticipantsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
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
                </SheetContent>
              </Sheet>
            </div>

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={messages.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('txt')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('md')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <DropdownMenuItem onClick={() => handleExport('txt')} disabled={messages.length === 0}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('md')} disabled={messages.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={messages.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
