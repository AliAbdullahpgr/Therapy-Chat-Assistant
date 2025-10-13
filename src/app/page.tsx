"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AreaChart, BrainCircuit, Leaf, User as UserIcon, Play, Pause, Bot, MessageSquare, Wind, ChevronsRight, FileJson, FileText, BotMessageSquare, FileDown } from 'lucide-react';
import { THERAPISTS, INITIAL_TOPICS, type Therapist, type Speaker } from '@/lib/constants';
import * as actions from './actions';
import { useToast } from "@/hooks/use-toast";
import { cn, downloadFile } from '@/lib/utils';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Message = {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: Date;
};

const DEBATE_TURN_LIMIT = 40; // Approx 5-7 mins of conversation

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>(INITIAL_TOPICS[0]);
  const [isDebating, setIsDebating] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [turn, setTurn] = useState(0);

  const { toast } = useToast();
  const debateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (speaker: Speaker, content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), speaker, content, timestamp: new Date() }]);
  };

  const handleStartDebate = () => {
    setMessages([]);
    setTurn(0);
    addMessage('Bot', `Welcome to the debate! Today's topic is: "${topic}". Let's begin with Dr. Chen.`);
    setIsDebating(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (!isDebating) return;
    setIsPaused(prev => !prev);
  };
  
  const nextTurn = useCallback(async () => {
    if (!isDebating || turn >= DEBATE_TURN_LIMIT || !isMounted.current) {
      if (isDebating && turn >= DEBATE_TURN_LIMIT) {
        setIsThinking(true);
        const transcript = messages.map(m => `${m.speaker}: ${m.content}`).join('\n');
        try {
          const { summary } = await actions.summarizeTranscript({ transcript });
          addMessage('Bot', `The debate has concluded. Here is a summary:\n\n${summary}`);
        } catch (error) {
           addMessage('Bot', 'The debate has concluded.');
           console.error("Error summarizing transcript:", error);
        } finally {
           if(isMounted.current) {
             setIsThinking(false);
             setIsDebating(false);
             setIsPaused(true);
           }
        }
      }
      return;
    }

    setIsThinking(true);
    const currentSpeakerId = THERAPISTS[turn % THERAPISTS.length].id;
    
    try {
      const { response } = await actions.aiRespondsToSpeakers({
        conversationHistory: messages.map(m => ({ speaker: m.speaker, message: m.content })),
        currentSpeaker: currentSpeakerId,
        drChenPersona: THERAPISTS[0].persona,
        drWilliamsPersona: THERAPISTS[1].persona,
        drRodriguezPersona: THERAPISTS[2].persona,
      });

      if (isMounted.current) {
        addMessage(currentSpeakerId, response);
        setTurn(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (isMounted.current) {
        setIsThinking(false);
      }
    }
  }, [isDebating, turn, messages, topic, toast]);

  useEffect(() => {
    if (debateIntervalRef.current) {
      clearInterval(debateIntervalRef.current);
    }
    if (!isPaused && isDebating) {
      // Immediately trigger next turn if it's the beginning
      if(turn === 0 && messages.length === 1) {
        nextTurn();
      } else {
        debateIntervalRef.current = setInterval(nextTurn, 8000 / speed);
      }
    }
    return () => {
      if (debateIntervalRef.current) {
        clearInterval(debateIntervalRef.current);
      }
    };
  }, [isPaused, isDebating, speed, nextTurn, turn, messages.length]);


  const handleGenerateTopic = async () => {
    try {
      const newTopic = await actions.generateDebateTopic();
      setTopic(newTopic);
      toast({
        title: "New Topic Generated!",
        description: "A new debate topic has been selected.",
      });
    } catch (error) {
      console.error("Error generating topic:", error);
      toast({
        title: "Error",
        description: "Could not generate a new topic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUserMessage = (content: string) => {
    addMessage('User', content);
    setTurn(prev => prev + 1);
    if (isPaused) {
      setIsPaused(false);
    }
    // Manually trigger the next AI turn
    if (debateIntervalRef.current) {
      clearInterval(debateIntervalRef.current);
    }
    setTimeout(nextTurn, 1000);
  };
  
  const exportTranscript = (format: 'txt' | 'json' | 'md') => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    if (format === 'txt') {
        const content = `Topic: ${topic}\n\n${messages.map(m => `[${m.timestamp.toLocaleString()}] ${m.speaker}:\n${m.content}\n`).join('\n')}`;
        downloadFile({ content, fileName: `therapy-debate-${timestamp}.txt`, fileType: 'text/plain' });
    } else if (format === 'json') {
        const content = JSON.stringify({topic, date: new Date().toISOString(), messages}, null, 2);
        downloadFile({ content, fileName: `therapy-debate-${timestamp}.json`, fileType: 'application/json' });
    } else if (format === 'md') {
        const content = `# Therapy Debate\n\n**Topic:** ${topic}\n\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n` +
            messages.map(m => `**${m.speaker}** (*${m.timestamp.toLocaleTimeString()}*):\n\n${m.content.split('\n').map(line => `> ${line || ' '}`).join('\n')}\n`).join('\n---\n\n');
        downloadFile({ content, fileName: `therapy-debate-${timestamp}.md`, fileType: 'text/markdown' });
    }
  };

  const PersonaIcon = ({ speaker, className }: { speaker: Speaker, className?: string }) => {
    const Svg = {
      'Dr. Chen': BrainCircuit,
      'Dr. Williams': Leaf,
      'Dr. Rodriguez': AreaChart,
      'User': UserIcon,
      'Bot': BotMessageSquare,
    }[speaker];
    return Svg ? <Svg className={cn("h-5 w-5", className)} /> : null;
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-background">
        <header className="flex h-16 items-center border-b px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-headline font-bold">Therapy Debate</h1>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 border-r p-4 flex flex-col gap-6 overflow-y-auto">
            {/* Participants */}
            <div>
              <h2 className="text-lg font-headline font-semibold mb-3">Participants</h2>
              <div className="space-y-3">
                {THERAPISTS.map(therapist => (
                  <div key={therapist.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={therapist.avatarUrl} data-ai-hint={therapist.avatarHint} />
                      <AvatarFallback>{therapist.name.charAt(3)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{therapist.name}</p>
                      <p className="text-sm text-muted-foreground">{therapist.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
            
            {/* Topic Selection */}
            <div>
              <h2 className="text-lg font-headline font-semibold mb-3">Debate Topic</h2>
              <Select onValueChange={setTopic} defaultValue={topic} disabled={isDebating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_TOPICS.map((t, i) => <SelectItem key={i} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateTopic} variant="outline" className="w-full mt-2" disabled={isDebating}>
                <Wind className="mr-2 h-4 w-4" /> Generate New Topic
              </Button>
            </div>

            <Separator />

            {/* Controls */}
            <div>
              <h2 className="text-lg font-headline font-semibold mb-3">Controls</h2>
              <div className="flex items-center gap-2">
                {!isDebating ? (
                  <Button onClick={handleStartDebate} className="flex-1">
                    <Play className="mr-2 h-4 w-4" /> Start Debate
                  </Button>
                ) : (
                  <Button onClick={handlePauseResume} variant="secondary" className="flex-1">
                    {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Speed</p>
                <div className="flex items-center gap-2">
                  {[1, 1.5, 2].map(s => (
                    <Button key={s} variant={speed === s ? "default" : "outline"} onClick={() => setSpeed(s)} className="flex-1">
                      {s}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Export */}
            <div>
              <h2 className="text-lg font-headline font-semibold mb-3">Export</h2>
              <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => exportTranscript('txt')} className="flex-1" disabled={messages.length === 0}>
                    <FileText className="mr-2 h-4 w-4"/> TXT
                  </Button>
                  <Button variant="outline" onClick={() => exportTranscript('json')} className="flex-1" disabled={messages.length === 0}>
                    <FileJson className="mr-2 h-4 w-4"/> JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportTranscript('md')} className="flex-1" disabled={messages.length === 0}>
                    <FileDown className="mr-2 h-4 w-4"/> MD
                  </Button>
              </div>
            </div>
          </aside>
          
          <main className="flex-1 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => {
                  const speakerInfo = THERAPISTS.find(t => t.id === message.speaker);
                  const isUser = message.speaker === 'User';
                  
                  return (
                    <div key={message.id} className={cn("flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", isUser && "justify-end")}>
                      {!isUser && (
                        <Avatar className="w-10 h-10 border">
                           <AvatarImage src={speakerInfo?.avatarUrl} data-ai-hint={speakerInfo?.avatarHint} />
                           <AvatarFallback>
                             <PersonaIcon speaker={message.speaker} />
                           </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("flex flex-col gap-1 max-w-xl", isUser && "items-end")}>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{message.speaker}</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <Card className={cn(isUser ? 'bg-primary text-primary-foreground' : 'bg-card')}>
                            <CardContent className="p-3 text-sm">
                                {message.content.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                            </CardContent>
                        </Card>
                      </div>
                       {isUser && (
                        <Avatar className="w-10 h-10 border">
                           <AvatarFallback>
                             <UserIcon />
                           </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
              })}
              {isThinking && (
                 <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 border">
                       <AvatarFallback>
                         <Bot />
                       </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 max-w-xl">
                      <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">AI is thinking...</span>
                      </div>
                      <Card className='bg-card'>
                        <CardContent className="p-3 text-sm">
                          <div className="flex items-center gap-1.5">
                             <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                             <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                             <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
               <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('message') as HTMLTextAreaElement;
                  if (input.value.trim()) {
                    handleUserMessage(input.value.trim());
                    input.value = '';
                  }
                }} className="relative">
                  <Textarea
                    name="message"
                    placeholder="Intervene in the debate..."
                    className="pr-20 min-h-[40px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if(form) {
                            form.requestSubmit();
                        }
                      }
                    }}
                    disabled={!isDebating}
                  />
                  <Button type="submit" size="icon" className="absolute top-1/2 -translate-y-1/2 right-3" disabled={!isDebating}>
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
