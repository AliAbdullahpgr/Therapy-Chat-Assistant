"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User as UserIcon, Send, MessageSquareHeart, Users, MessageCircle, Download, Brain, MessageSquare, UserPlus, Menu, X, ArrowLeft, Eye, EyeOff, Check, Info, Clipboard, Flower2, Twitter, Linkedin, Github } from 'lucide-react';
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

type ViewType = 'landing' | 'signup' | 'login' | 'chat';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Form validation helpers
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Success - redirect to chat
    toast({
      title: "Success!",
      description: "Account created successfully! Welcome to AI Therapy Chat.",
    });
    setCurrentView('chat');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Success - redirect to chat
    toast({
      title: "Welcome back!",
      description: "Login successful! Redirecting to chat...",
    });
    setCurrentView('chat');
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

  // Landing Page Component
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-md z-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-gray-800">AI Therapy Chat</span>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How It Works</a>
                <a href="#therapists" className="text-gray-600 hover:text-blue-600 transition">Therapists</a>
                <Button variant="ghost" onClick={() => setCurrentView('login')}>Login</Button>
                <Button onClick={() => setCurrentView('signup')} className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
              </div>

              {/* Mobile Menu Button */}
              <button className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden pb-4 space-y-2">
                <a href="#features" className="block py-2 text-gray-600 hover:text-blue-600">Features</a>
                <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-blue-600">How It Works</a>
                <a href="#therapists" className="block py-2 text-gray-600 hover:text-blue-600">Therapists</a>
                <Button variant="ghost" onClick={() => setCurrentView('login')} className="w-full justify-start">Login</Button>
                <Button onClick={() => setCurrentView('signup')} className="w-full bg-blue-600 hover:bg-blue-700">Sign Up</Button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Experience the Future of<br />
              <span className="bg-gradient-to-r from-blue-600 via-green-500 to-purple-600 bg-clip-text text-transparent">
                Mental Health Education
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '200ms'}}>
              Watch AI therapists debate real-world topics, or join the conversation yourself
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '400ms'}}>
              <Button onClick={() => setCurrentView('signup')} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
                Get Started
              </Button>
              <Button onClick={() => setCurrentView('chat')} size="lg" variant="outline" className="px-8 py-6 text-lg border-2">
                Watch Demo
              </Button>
            </div>
            
            {/* Hero Illustration */}
            <div className="mt-16 relative animate-in fade-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '600ms'}}>
              <Card className="p-8 max-w-4xl mx-auto shadow-2xl">
                <CardContent className="p-0">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="text-blue-600 w-6 h-6" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <UserIcon className="text-green-600 w-6 h-6" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="text-purple-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-3 text-left">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700">From a CBT perspective, we should focus on identifying and challenging negative thought patterns...</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700">I believe we should also consider the holistic approach, addressing mind-body connection...</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-gray-700">Let&apos;s analyze the underlying psychological mechanisms that drive these behaviors...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Why Choose AI Therapy Chat?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                    <Users className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Three Expert Perspectives</h3>
                  <p className="text-gray-700">Learn from AI therapists with distinct therapeutic approaches, each bringing unique insights to every discussion.</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Interactive Debates</h3>
                  <p className="text-gray-700">Watch professional discussions unfold in real-time or jump in with your own questions and perspectives.</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-6">
                    <Download className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Export & Learn</h3>
                  <p className="text-gray-700">Save complete transcripts for later review and study, building your mental health knowledge library.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="text-white w-10 h-10" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-4">01</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose a Topic</h3>
                <p className="text-gray-600">Select from a wide range of mental health topics or submit your own question for discussion.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="text-white w-10 h-10" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-4">02</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Watch Experts Debate</h3>
                <p className="text-gray-600">Observe as three AI therapists share their unique perspectives and engage in professional dialogue.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="text-white w-10 h-10" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-4">03</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Join the Conversation</h3>
                <p className="text-gray-600">Participate actively by asking questions and receiving personalized responses from all three therapists.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Therapists Section */}
        <section id="therapists" className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Meet Your AI Therapists
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clipboard className="text-blue-600 w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Dr. Sarah Chen</h3>
                  <p className="text-blue-600 font-semibold mb-4 text-center">CBT Expert</p>
                  <p className="text-gray-700 text-center">Specializes in Cognitive Behavioral Therapy with a focus on evidence-based techniques to identify and challenge negative thought patterns.</p>
                  <div className="mt-6 flex justify-center">
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">Evidence-Based</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-green-200">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Flower2 className="text-green-600 w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Dr. James Williams</h3>
                  <p className="text-green-600 font-semibold mb-4 text-center">Holistic Healer</p>
                  <p className="text-gray-700 text-center">Embraces integrative approaches that address the mind-body connection, incorporating mindfulness and wellness practices.</p>
                  <div className="mt-6 flex justify-center">
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">Mind-Body</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-purple-200">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="text-purple-600 w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Dr. Maria Rodriguez</h3>
                  <p className="text-purple-600 font-semibold mb-4 text-center">Analytical Psychologist</p>
                  <p className="text-gray-700 text-center">Deep dives into the psychological mechanisms underlying behavior with analytical precision and psychological depth.</p>
                  <div className="mt-6 flex justify-center">
                    <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">Analytical</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-blue-600 via-green-500 to-purple-600 text-white border-0 shadow-2xl">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Understanding?</h2>
                <p className="text-xl mb-8 opacity-90">Join thousands learning from AI-powered therapeutic discussions</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setCurrentView('signup')} size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
                    Get Started Free
                  </Button>
                  <Button onClick={() => setCurrentView('chat')} size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg">
                    Try Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-purple-600 flex items-center justify-center">
                    <MessageCircle className="text-white w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold">AI Therapy Chat</span>
                </div>
                <p className="text-gray-400">Experience the future of mental health education</p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#features" className="hover:text-white transition">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                  <li><a href="#therapists" className="hover:text-white transition">Therapists</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">About</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">© 2025 AI Therapy Chat. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Github className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Signup Page Component
  if (currentView === 'signup') {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-green-500 to-purple-600 items-center justify-center p-12">
          <div className="text-white text-center max-w-md">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <MessageCircle className="text-white w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold mb-6">AI Therapy Chat</h2>
            <p className="text-xl opacity-90 mb-8">Experience the future of mental health education with expert AI therapists</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="text-white w-5 h-5" />
                </div>
                <span>Three expert perspectives</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="text-white w-5 h-5" />
                </div>
                <span>Interactive debates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="text-white w-5 h-5" />
                </div>
                <span>Export transcripts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="max-w-md w-full">
            <Button variant="ghost" onClick={() => setCurrentView('landing')} className="mb-8">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600 mb-8">Start your journey to better mental health understanding</p>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.fullName ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                  placeholder="John Doe"
                />
                {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                  placeholder="john@example.com"
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </span>
                </label>
                {formErrors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{formErrors.agreeToTerms}</p>}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg">
                Create Account
              </Button>

              <p className="text-center text-gray-600">
                Already have an account? <button type="button" onClick={() => setCurrentView('login')} className="text-blue-600 hover:underline font-semibold">Log in</button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Login Page Component
  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-green-500 to-purple-600 items-center justify-center p-12">
          <div className="text-white text-center max-w-md">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <MessageCircle className="text-white w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
            <p className="text-xl opacity-90 mb-8">Continue your journey in mental health education</p>
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
              <CardContent className="p-6">
                <p className="text-sm mb-2 flex items-center justify-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Demo Mode</span>
                </p>
                <p className="text-sm opacity-90">Use any email and password to try the application</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="max-w-md w-full">
            <Button variant="ghost" onClick={() => setCurrentView('landing')} className="mb-8">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Log in to continue your learning journey</p>

            {/* Demo Info Box */}
            <Card className="bg-blue-50 border-2 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Info className="text-blue-600 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Demo Mode Active</p>
                    <p className="text-sm text-blue-700">Use any email and password to access the application</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                  placeholder="john@example.com"
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition", formErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-600')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg">
                Log In
              </Button>

              <p className="text-center text-gray-600">
                Don&apos;t have an account? <button type="button" onClick={() => setCurrentView('signup')} className="text-blue-600 hover:underline font-semibold">Sign up</button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chat Page Component (Original)
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
                            {isClient && <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>}
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
