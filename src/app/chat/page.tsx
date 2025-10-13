"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User as UserIcon, Send, MessageSquareHeart, LogOut, MoreVertical, Trash2 } from 'lucide-react';
import { THERAPISTS, type Therapist, type Speaker } from '@/lib/constants';
import * as actions from '../actions';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { logOut } from '@/lib/auth-service';
import { saveConversation, loadConversation, clearConversation } from '@/lib/conversation-service';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Message = {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: Date;
};

type ConversationHistory = {
  [key in Therapist['id']]: Message[];
};

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isEmailVerified } = useAuth();
  const { toast } = useToast();
  
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
  const [isClient, setIsClient] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [therapistToDelete, setTherapistToDelete] = useState<Therapist | null>(null);

  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || !isEmailVerified)) {
      console.log('[Chat] User not authenticated or email not verified, redirecting to login...');
      router.push('/login');
    }
  }, [user, isEmailVerified, authLoading, router]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load conversation from Firestore when component mounts or therapist changes
  useEffect(() => {
    async function loadConversationHistory() {
      setIsLoadingConversations(true);
      console.log(`[Firestore] 📥 Loading conversation for ${activeTherapist.id}...`);
      
      try {
        const savedMessages = await loadConversation(activeTherapist.id);
        
        if (savedMessages.length > 0) {
          // Convert Firestore message format to our Message type
          const formattedMessages: Message[] = savedMessages
            .filter((msg: any) => msg.message) // Filter out messages without content
            .map((msg: any) => ({
              id: msg.id,
              speaker: msg.speaker as Speaker,
              content: msg.message || '', // Fallback to empty string
              timestamp: msg.timestamp,
            }));
          
          setMessages((prev) => ({
            ...prev,
            [activeTherapist.id]: formattedMessages,
          }));
          
          console.log(`[Firestore] ✅ Loaded ${formattedMessages.length} messages for ${activeTherapist.id}`);
        } else {
          console.log(`[Firestore] ℹ️ No saved conversation found for ${activeTherapist.id}, using welcome message`);
        }
      } catch (error) {
        console.error(`[Firestore] ❌ Error loading conversation:`, error);
      } finally {
        setIsLoadingConversations(false);
      }
    }

    loadConversationHistory();
  }, [activeTherapist.id]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const activeMessages = messages[activeTherapist.id];

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error('[Chat] Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      speaker: 'User',
      content: userMessageContent,
      timestamp: new Date(),
    };

    // IMPORTANT: Add user message to state IMMEDIATELY before any async operations
    // This prevents the message from disappearing
    setMessages(prev => ({
      ...prev,
      [activeTherapist.id]: [...prev[activeTherapist.id], userMessage]
    }));
    
    setUserInput("");
    setIsThinking(true);

    // Save user message to Firestore
    try {
      const currentMessages = [...messages[activeTherapist.id], userMessage];
      const firestoreMessages = currentMessages.map(msg => ({
        id: msg.id,
        speaker: msg.speaker,
        message: msg.content,
        timestamp: msg.timestamp,
      }));
      
      await saveConversation(activeTherapist.id, firestoreMessages);
      console.log(`[Firestore] ✅ User message stored in database for ${activeTherapist.id}`);
    } catch (error) {
      console.error(`[Firestore] ❌ Error saving user message:`, error);
    }

    // Get AI response
    try {
      const currentConversation = [...messages[activeTherapist.id], userMessage];
      
      const { response } = await actions.aiRespondsToSpeakers({
        conversationHistory: currentConversation.map(m => ({ speaker: m.speaker, message: m.content })),
        currentSpeaker: activeTherapist.id,
        drSarahPersona: THERAPISTS.find(t => t.id === 'Dr. Sarah')?.persona ?? '',
        drLauraPersona: THERAPISTS.find(t => t.id === 'Dr. Laura')?.persona ?? '',
        drJohnPersona: THERAPISTS.find(t => t.id === 'Dr. John')?.persona ?? '',
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        speaker: activeTherapist.id,
        content: response,
        timestamp: new Date(),
      };

      // Add AI message to state
      setMessages(prev => ({
        ...prev,
        [activeTherapist.id]: [...prev[activeTherapist.id], aiMessage]
      }));

      // Save AI message to Firestore
      try {
        const updatedMessages = [...messages[activeTherapist.id], userMessage, aiMessage];
        const firestoreMessages = updatedMessages.map(msg => ({
          id: msg.id,
          speaker: msg.speaker,
          message: msg.content,
          timestamp: msg.timestamp,
        }));
        
        await saveConversation(activeTherapist.id, firestoreMessages);
        console.log(`[Firestore] ✅ AI response stored in database for ${activeTherapist.id}`);
      } catch (error) {
        console.error(`[Firestore] ❌ Error saving AI response:`, error);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        speaker: 'Bot',
        content: 'Sorry, I encountered an error. Please try sending your message again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => ({
        ...prev,
        [activeTherapist.id]: [...prev[activeTherapist.id], errorMessage]
      }));
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleTherapistChange = (therapist: Therapist) => {
    if (therapist.id === activeTherapist.id) return;
    setActiveTherapist(therapist);
  }

  const handleClearConversation = async (therapist: Therapist) => {
    try {
      console.log(`[Chat] 🗑️ Clearing conversation for ${therapist.id}...`);
      
      // Clear from Firestore
      await clearConversation(therapist.id);
      
      // Reset to welcome message in state
      const welcomeMessage: Message = {
        id: `${therapist.id}-${Date.now()}`,
        speaker: therapist.id,
        content: `Hello, I'm ${therapist.name}. How can I help you today?`,
        timestamp: new Date(),
      };
      
      setMessages(prev => ({
        ...prev,
        [therapist.id]: [welcomeMessage]
      }));
      
      toast({
        title: "Conversation Cleared",
        description: `Your conversation with ${therapist.name} has been deleted and reset.`,
      });
      
      console.log(`[Chat] ✅ Conversation cleared successfully for ${therapist.id}`);
      setTherapistToDelete(null);
    } catch (error) {
      console.error('[Chat] ❌ Error clearing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to clear conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <Link href="/" className="flex items-center gap-3">
            <MessageSquareHeart className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-headline font-bold">AI Therapists</h1>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {THERAPISTS.map(therapist => (
            <div key={therapist.id} className="relative group">
              <Button
                variant={activeTherapist.id === therapist.id ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 h-14 pr-12"
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => setTherapistToDelete(therapist)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/debate">
            <Button variant="outline" className="w-full justify-start gap-3">
              <MessageSquareHeart className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Roundtable Debates</p>
                <p className="text-xs text-muted-foreground">Watch therapists discuss topics</p>
              </div>
            </Button>
          </Link>
        </div>
      </aside>
      
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6 shrink-0 bg-card">
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
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-600 text-white font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 px-2 py-2">
                  <p className="text-xs text-muted-foreground">Logged in as</p>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="flex gap-1 justify-center mb-2">
                      <span className="animate-bounce inline-block">●</span>
                      <span className="animate-bounce inline-block" style={{animationDelay: '0.1s'}}>●</span>
                      <span className="animate-bounce inline-block" style={{animationDelay: '0.2s'}}>●</span>
                    </div>
                    <p>Loading conversation from Firebase...</p>
                  </div>
                </div>
              ) : (
                <>
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
                            {isClient && <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>}
                        </div>
                        <Card className={cn(isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none')}>
                            <CardContent className="p-3 text-sm">
                                {(message.content || '').split('\n').map((line, index) => <p key={index}>{line || ' '}</p>)}
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
                </>
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

      {/* Confirmation Dialog for Clearing Conversation */}
      <AlertDialog open={!!therapistToDelete} onOpenChange={(open) => !open && setTherapistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your entire conversation history with{' '}
              <span className="font-semibold">{therapistToDelete?.name}</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => therapistToDelete && handleClearConversation(therapistToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
