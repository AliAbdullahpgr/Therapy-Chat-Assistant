"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User as UserIcon, Send, MessageSquareHeart, Mic, X } from 'lucide-react';
import { THERAPISTS, type Therapist, type Speaker } from '@/lib/constants';
import * as actions from './actions';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Message = {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: Date;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [activeTherapist, setActiveTherapist] = useState<Therapist>(THERAPISTS[0]);

  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    // Start with a welcome message from the initial active therapist
    setMessages([{
      id: Date.now().toString(),
      speaker: activeTherapist.id,
      content: `Hello, I'm ${activeTherapist.name}. How can I help you today?`,
      timestamp: new Date()
    }]);
  }, []);

  const addMessage = (speaker: Speaker, content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), speaker, content, timestamp: new Date() }]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessageContent = userInput;
    addMessage('User', userMessageContent);
    setUserInput("");
    setIsThinking(true);

    try {
      const { response } = await actions.aiRespondsToSpeakers({
        conversationHistory: [...messages, { speaker: 'User', message: userMessageContent }].map(m => ({ speaker: m.speaker, message: m.content })),
        currentSpeaker: activeTherapist.id,
        drSarahPersona: THERAPISTS.find(t => t.id === 'Dr. Sarah')?.persona ?? '',
        drLauraPersona: THERAPISTS.find(t => t.id === 'Dr. Laura')?.persona ?? '',
        drJohnPersona: THERAPISTS.find(t => t.id === 'Dr. John')?.persona ?? '',
      });

      addMessage(activeTherapist.id, response);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
      addMessage('Bot', 'Sorry, I encountered an error. Please try sending your message again.');
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleTherapistChange = (therapist: Therapist) => {
    if (therapist.id === activeTherapist.id) return;
    setActiveTherapist(therapist);
    addMessage('Bot', `You are now speaking with ${therapist.name}.`);
    // Optional: Have the new therapist introduce themselves
    setIsThinking(true);
    setTimeout(() => {
        addMessage(therapist.id, `Hello, I'm ${therapist.name}. It's nice to meet you. What's on your mind?`);
        setIsThinking(false);
    }, 1000);
  }

  const PersonaIcon = ({ speaker, className }: { speaker: Speaker, className?: string }) => {
    const Svg = {
      'User': UserIcon,
      'Bot': Bot,
    }[speaker] || MessageSquareHeart;
    return Svg ? <Svg className={cn("h-5 w-5", className)} /> : null;
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-background font-body">
        <header className="flex h-16 items-center border-b px-6 shrink-0 bg-card">
          <div className="flex items-center gap-3">
             <MessageSquareHeart className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-headline font-bold">AI Therapy Chat</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {THERAPISTS.map(therapist => (
                <Tooltip key={therapist.id}>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => handleTherapistChange(therapist)} className={cn("rounded-full h-12 w-12", activeTherapist.id === therapist.id && "ring-2 ring-primary")}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={therapist.avatarUrl} data-ai-hint={therapist.avatarHint} />
                                <AvatarFallback>{therapist.name.charAt(3)}</AvatarFallback>
                            </Avatar>
                         </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{therapist.name}</p>
                        <p className="text-sm text-muted-foreground">{therapist.title}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => {
                  const speakerInfo = THERAPISTS.find(t => t.id === message.speaker);
                  const isUser = message.speaker === 'User';
                  
                  return (
                    <div key={message.id} className={cn("flex items-start gap-3 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "justify-end" : "justify-start")}>
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
                            <span className="font-semibold text-sm">{speakerInfo?.name || message.speaker}</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <Card className={cn(isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none')}>
                            <CardContent className="p-3 text-sm">
                                {message.content.split('\n').map((line, index) => <p key={index}>{line || ' '}</p>)}
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
                 <div className="flex items-start gap-3 max-w-3xl mx-auto">
                    <Avatar className="w-10 h-10 border">
                        <AvatarImage src={activeTherapist.avatarUrl} data-ai-hint={activeTherapist.avatarHint} />
                       <AvatarFallback>
                         <Bot />
                       </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 max-w-xl">
                      <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{activeTherapist.name} is thinking...</span>
                      </div>
                      <Card className='bg-card rounded-bl-none'>
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
               <div className="relative max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage}>
                      <Textarea
                        name="message"
                        placeholder={`Message ${activeTherapist.name}...`}
                        className="pr-24 min-h-[52px] resize-none"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                        disabled={isThinking}
                      />
                      <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-2">
                        <Button type="submit" size="icon" disabled={isThinking || !userInput.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                      </div>
                    </form>
               </div>
            </div>
          </main>
      </div>
    </TooltipProvider>
  );
}
