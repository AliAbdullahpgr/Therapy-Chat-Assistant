"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User as UserIcon, Send, MessageSquareHeart } from 'lucide-react';
import { THERAPISTS, type Therapist, type Speaker } from '@/lib/constants';
import * as actions from './actions';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

type Message = {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: Date;
};

type ConversationHistory = {
  [key in Therapist['id']]: Message[];
};

export default function Home() {
  const [messages, setMessages] = useState<ConversationHistory>(() => {
    const initialMessages: ConversationHistory = {
      'Dr. Sarah': [],
      'Dr. Laura': [],
      'Dr. John': [],
    };
    // Initialize with a welcome message for each therapist
    THERAPISTS.forEach(therapist => {
        initialMessages[therapist.id].push({
            id: `${therapist.id}-${Date.now()}`,
            speaker: therapist.id,
            content: `Hello, I'm ${therapist.name}. How can I help you today?`,
            timestamp: new Date(),
        });
    });
    return initialMessages;
  });

  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [activeTherapist, setActiveTherapist] = useState<Therapist>(THERAPISTS[0]);

  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const activeMessages = messages[activeTherapist.id];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const addMessage = (therapistId: Therapist['id'], speaker: Speaker, content: string) => {
    const newMessage: Message = { id: Date.now().toString(), speaker, content, timestamp: new Date() };
    setMessages(prev => ({
        ...prev,
        [therapistId]: [...prev[therapistId], newMessage]
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessageContent = userInput;
    addMessage(activeTherapist.id, 'User', userMessageContent);
    setUserInput("");
    setIsThinking(true);

    try {
      const currentConversation = [...messages[activeTherapist.id], { speaker: 'User', content: userMessageContent, id: '', timestamp: new Date() }];
      
      const { response } = await actions.aiRespondsToSpeakers({
        conversationHistory: currentConversation.map(m => ({ speaker: m.speaker, message: m.content })),
        currentSpeaker: activeTherapist.id,
        drSarahPersona: THERAPISTS.find(t => t.id === 'Dr. Sarah')?.persona ?? '',
        drLauraPersona: THERAPISTS.find(t => t.id === 'Dr. Laura')?.persona ?? '',
        drJohnPersona: THERAPISTS.find(t => t.id === 'Dr. John')?.persona ?? '',
      });

      addMessage(activeTherapist.id, activeTherapist.id, response);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
      addMessage(activeTherapist.id, 'Bot', 'Sorry, I encountered an error. Please try sending your message again.');
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleTherapistChange = (therapist: Therapist) => {
    if (therapist.id === activeTherapist.id) return;
    setActiveTherapist(therapist);
  }

  const PersonaIcon = ({ speaker, className }: { speaker: Speaker, className?: string }) => {
    const Svg = {
      'User': UserIcon,
      'Bot': Bot,
    }[speaker] || MessageSquareHeart;
    return Svg ? <Svg className={cn("h-5 w-5", className)} /> : null;
  };

  return (
    <div className="flex h-screen w-full bg-background font-body">
      <aside className="w-80 border-r bg-card flex flex-col">
        <div className="flex h-16 items-center border-b px-6 shrink-0">
            <div className="flex items-center gap-3">
                <MessageSquareHeart className="h-7 w-7 text-primary" />
                <h1 className="text-xl font-headline font-bold">AI Therapists</h1>
            </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {THERAPISTS.map(therapist => (
            <Button
              key={therapist.id}
              variant={activeTherapist.id === therapist.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-14"
              onClick={() => handleTherapistChange(therapist)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={therapist.avatarUrl} data-ai-hint={therapist.avatarHint} />
                <AvatarFallback>{therapist.name.charAt(3)}</AvatarFallback>
              </Avatar>
              <div className='text-left'>
                <p className="font-semibold">{therapist.name}</p>
                <p className="text-sm text-muted-foreground">{therapist.title}</p>
              </div>
            </Button>
          ))}
        </nav>
      </aside>
      
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b px-6 shrink-0 bg-card">
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10">
                <AvatarImage src={activeTherapist.avatarUrl} data-ai-hint={activeTherapist.avatarHint} />
                <AvatarFallback>{activeTherapist.name.charAt(3)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-lg font-headline font-bold">{activeTherapist.name}</h2>
                <p className="text-sm text-muted-foreground">{activeTherapist.title}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeMessages.map((message) => {
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
    </div>
  );
}
