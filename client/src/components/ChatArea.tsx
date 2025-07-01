import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, Bot, Sparkles, Edit3, MapPin, Stethoscope, MessageCircle, Heart, TestTube } from "lucide-react";
import InteractiveMessage from "./InteractiveMessage";
import TypingIndicator from "./TypingIndicator";
import HospitalRecommendations from "./HospitalRecommendations";
import MedicalSummaryCard from "./MedicalSummaryCard";
import { storageService, ChatSession } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import SpecialtyDisplay from "./SpecialtyDisplay";
import SpecialtyRecommendation from "./SpecialtyRecommendation";
import FlashMode from "./FlashMode";
import ApiKeyConfig from './ApiKeyConfig';
import { cn } from '../lib/utils';

interface InteractiveOption {
  id: string;
  label: string;
  value: string;
}

interface Message {
  id: number;
  text?: string;
  sender: "user" | "ai";
  timestamp: Date;
  isInteractive?: boolean;
  question?: string;
  options?: InteractiveOption[];
  selectedOption?: string;
  showHospitals?: boolean;
  summary?: string;
  specialty?: string;
  summaryType?: string;
  specialties?: string[];
  showSpecialtyRecommendation?: boolean;
}

type DynamicQuestion = { question: string; options: string[] };

const MAX_TOTAL_QUESTIONS = 10;

interface ChatAreaProps {
  sessionId: string;
  onUpdateSession: (session: ChatSession) => void;
}

const ChatArea = ({ sessionId, onUpdateSession }: ChatAreaProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [currentlyShowingInteractive, setCurrentlyShowingInteractive] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<string[]>([]);
  const [currentDynamicIndex, setCurrentDynamicIndex] = useState(0);
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  const [allAskedQuestions, setAllAskedQuestions] = useState<string[]>([]);
  const [askedQuestionIds, setAskedQuestionIds] = useState<Set<string>>(new Set());
  const mainInputRef = useRef<HTMLInputElement>(null);
  const [inputPlaceholder, setInputPlaceholder] = useState("Describe your symptoms...");
  const [customAnswerMode, setCustomAnswerMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showUserFallback, setShowUserFallback] = useState(false);
  const [userFallbackInput, setUserFallbackInput] = useState("");
  const [conversationStep, setConversationStep] = useState(0);
  const [currentSpecialties, setCurrentSpecialties] = useState<string[]>([]);
  const [flashMode, setFlashMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Load API keys from environment variables or localStorage on component mount
  useEffect(() => {
    // Check for environment variable first
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const storedApiKeys = localStorage.getItem('gemini_api_keys');
    const storedKeyIndex = localStorage.getItem('current_key_index');
    
    // Default API keys provided by user
    const defaultKeys = [
      'AIzaSyCvDat-bQkyMj4P-p-YfqifCYtYMcUB0pQ',
      'AIzaSyDiIz20C0geTawJL01kedSWOvnjRZ0D-MU',
      'AIzaSyCkDKiQD_GMPr7WCk4Ozcurk9LSUYM9K98',
      'AIzaSyCwUuD2PJxLI3Al2uNK_tbK6KlsygmxXdA'
    ];
    
    let keyIndex = 0;
    if (storedKeyIndex) {
      keyIndex = parseInt(storedKeyIndex, 10) || 0;
    }
    
    if (envApiKey) {
      setApiKeys([envApiKey]);
      setCurrentKeyIndex(0);
      setShowApiKeyConfig(false);
    } else if (storedApiKeys) {
      try {
        const parsedKeys = JSON.parse(storedApiKeys);
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
          setApiKeys(parsedKeys);
          setCurrentKeyIndex(Math.min(keyIndex, parsedKeys.length - 1));
          setShowApiKeyConfig(false);
        } else {
          // Use default keys and save them
          setApiKeys(defaultKeys);
          setCurrentKeyIndex(Math.min(keyIndex, defaultKeys.length - 1));
          localStorage.setItem('gemini_api_keys', JSON.stringify(defaultKeys));
          setShowApiKeyConfig(false);
        }
      } catch {
        // Use default keys and save them
        setApiKeys(defaultKeys);
        setCurrentKeyIndex(Math.min(keyIndex, defaultKeys.length - 1));
        localStorage.setItem('gemini_api_keys', JSON.stringify(defaultKeys));
        setShowApiKeyConfig(false);
      }
    } else {
      // Use default keys and save them
      setApiKeys(defaultKeys);
      setCurrentKeyIndex(Math.min(keyIndex, defaultKeys.length - 1));
      localStorage.setItem('gemini_api_keys', JSON.stringify(defaultKeys));
      setShowApiKeyConfig(false);
    }
  }, []);

  const handleApiKeySet = useCallback((keys: string[]) => {
    setApiKeys(keys);
    setCurrentKeyIndex(0);
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    setShowApiKeyConfig(false);
  }, []);

  // Function to get current API key
  const getCurrentApiKey = () => {
    return apiKeys[currentKeyIndex] || '';
  };

  // Function to switch to next API key when current one is exhausted (loops back to start)
  const switchToNextApiKey = () => {
    const nextIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`Switching to API key ${nextIndex + 1}/${apiKeys.length}`);
    setCurrentKeyIndex(nextIndex);
    localStorage.setItem('current_key_index', nextIndex.toString());
    return true;
  };

  // Helper to normalize question text
  const normalizeQuestion = (q: string) => q.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

  // Enhanced similarity check for questions
  const areQuestionsSimilar = (q1: string, q2: string) => {
    const norm1 = normalizeQuestion(q1);
    const norm2 = normalizeQuestion(q2);
    if (norm1 === norm2) return true;
    if (norm1.length > 10 && norm2.length > 10 && (norm1.includes(norm2) || norm2.includes(norm1))) return true;
    // High word overlap
    const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
    const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));
    const overlap = [...words1].filter(w => words2.has(w));
    const similarity = overlap.length / Math.max(words1.size, words2.size);
    return similarity > 0.8; // 80% word overlap threshold
  };

  // Enhanced similarity check for questions
  const isSimilarQuestion = (newQ: string) => {
    const asked = messages.filter(m => m.isInteractive && m.question).map(m => m.question || '');
    return asked.some(q => areQuestionsSimilar(q, newQ));
  };

  // Add static question flow
  const conversationFlow = [
    {
      question: "How long have you had these symptoms?",
      options: [
        { id: "1", label: "Less than 24 hours", value: "less_than_24h" },
        { id: "2", label: "1-3 days", value: "1_3_days" },
        { id: "3", label: "4-7 days", value: "4_7_days" },
        { id: "4", label: "More than a week", value: "more_than_week" }
      ]
    },
    {
      question: "How severe are your symptoms?",
      options: [
        { id: "1", label: "Mild", value: "mild" },
        { id: "2", label: "Moderate", value: "moderate" },
        { id: "3", label: "Severe", value: "severe" }
      ]
    },
    {
      question: "What event or situation might have caused these symptoms?",
      options: [
        { id: "1", label: "Recent illness or infection", value: "recent_illness" },
        { id: "2", label: "Missed regular medication", value: "missed_medication" },
        { id: "3", label: "Smoking/alchole habit", value: "smoking_alchole_habit" },
        { id: "4", label: "Food and diety changes", value: "food_diety_changes" }
      ]
    },
    {
      question: "Do you have any previous medical history?",
      options: [
        { id: "1", label: "Hypertension", value: "hypertension" },
        { id: "2", label: "Diabetes", value: "diabetes" },
        { id: "3", label: "Thyroid disease", value: "thyroid_disease" },
        { id: "4", label: "Lung diseases", value: "lung_diseases" },
        { id: "5", label: "Asthma", value: "asthma" },
        { id: "6", label: "No significant history", value: "none" }
      ]
    }
  ];

  // Restore chat state when loading a session
  useEffect(() => {
    const loadSession = async () => {
      if (user && sessionId) {
        setLoading(true); // Indicate loading while fetching session
        try {
          const session = await storageService.getChatSession(sessionId, user.uid); // Use user.uid for storage
          const msgs = session?.messages || [];
          setMessages(msgs);

          // Restore conversationStep (static flow)
          let staticStep = 0;
          const askedStaticSet = new Set<string>();
          for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].isInteractive && msgs[i].question && staticStep < conversationFlow.length) {
              const normQ = normalizeQuestion(msgs[i].question);
              if (!askedStaticSet.has(normQ)) {
                askedStaticSet.add(normQ);
                staticStep++;
              }
            }
          }
          setConversationStep(staticStep);

          // Restore userAnswers
          const answers: {[key: string]: string} = {};
          msgs.forEach((msg, idx) => {
            if (msg.isInteractive && msg.selectedOption && msg.question) {
              answers[msg.question] = msg.selectedOption;
            }
          });
          setUserAnswers(answers);

          // Restore currentlyShowingInteractive
          const lastMsg = msgs[msgs.length - 1];
          setCurrentlyShowingInteractive(!!(lastMsg && lastMsg.isInteractive && !lastMsg.selectedOption));

          // Restore dynamicQuestions and dynamicAnswers
          const dynamicQs: DynamicQuestion[] = [];
          const dynamicAs: string[] = [];
          msgs.forEach((msg) => {
            if (msg.isInteractive && staticStep >= conversationFlow.length && msg.question && msg.options) {
              dynamicQs.push({ question: msg.question, options: msg.options.map(o => o.label) });
              if (msg.selectedOption) dynamicAs.push(msg.selectedOption);
            }
          });
          setDynamicQuestions(dynamicQs);
          setDynamicAnswers(dynamicAs);
          setCurrentDynamicIndex(dynamicQs.length);

          // Restore asked questions
          setAllAskedQuestions(msgs.filter(m => m.isInteractive && m.question).map(m => m.question?.toLowerCase().trim() || ""));
          setAskedQuestionIds(new Set(msgs.filter(m => m.isInteractive && m.question).map(m => normalizeQuestion(m.question || ""))));
        } catch (error) {
          console.error('Error loading session:', error);
          // Start with default message if loading fails
          setMessages([{
            id: 1,
            text: "Hello! I'm Rakshith AI, your virtual medical assistant. I'll help you assess your symptoms and provide appropriate guidance. What symptoms are you experiencing?",
            sender: "ai",
            timestamp: new Date()
          }]);
        } finally {
          setLoading(false); // End loading
        }
      }
    };

    loadSession();
  }, [sessionId, user]); // Removed complex dependencies that could cause infinite loops

  // Save messages to session with debouncing
  useEffect(() => {
    if (user && sessionId && messages.length > 0) { // Only save if there are messages and user/session exist
      const timeoutId = setTimeout(async () => {
        try {
          const updatedSession: ChatSession = {
            id: sessionId,
            userId: user.uid, // Use user.uid
            messages,
            createdAt: messages[0]?.timestamp || new Date(), // Use first message timestamp or current time
            updatedAt: new Date(),
          };
          await storageService.saveChatSession(updatedSession);
          onUpdateSession(updatedSession); // Update parent state if needed
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, sessionId, onUpdateSession]); // Added user and sessionId to dependencies

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const callGeminiAPI = async (prompt: string, retryCount = 0): Promise<string> => {
    const currentKey = getCurrentApiKey();
    if (!currentKey) {
      setShowApiKeyConfig(true);
      return "Please configure your API keys to use the AI service.";
    }
    
    try {
      console.log(`Sending request to Gemini API with key ${currentKeyIndex + 1}/${apiKeys.length}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an experienced medical professional certified in emergency medicine and first aid. Based on the patient's information and ALL user answers, provide a clear and concise medical assessment. Your response MUST use the following section headings, in this exact order, with double asterisks and a colon, and nothing else:
**SUMMARY OF CASE:**
[Brief summary of main symptoms, duration, and key medical history. Most likely condition and a simple explanation. Always start the summary with the patient's main complaint (initial symptoms) as the first and most important part, regardless of later answers.]
**URGENCY LEVEL:**
[High/Medium/Low. Key reason for this level. One critical warning sign to watch for.]
**RECOMMENDED SPECIALTY:**
[ONLY the most relevant medical specialty or specialties for the main complaint and likely diagnosis. Use dynamic clinical reasoning based on the user's full input and answers. Do NOT use a static list. Do NOT include irrelevant specialties. For example, for bowel obstruction, recommend Gastroenterology, General Surgery, or Urology as appropriate. For neurological symptoms, recommend Neurology. For surgical cases, always include General Surgery. For medical cases, include the most relevant internal medicine specialty. If in doubt, prefer General Medicine or Emergency Medicine.]
**FIRST AID RECOMMENDATIONS:**
[2-3 most critical, WHO/Red Cross approved first aid steps for the specific situation. Include when to call emergency services.]
**ADDITIONAL INVESTIGATIONS NEEDED:**
[2-3 most important tests and why they're needed.]
Strictly use these headings and formatting. Do not add or change section names. Do not add extra sections or explanations. Do not use numbered or bulleted lists for section titles. Only use the double asterisks and colon format for section headers.

Patient Details:
${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error:', response.status, errorData);
        
        if (response.status === 400) {
          return "I apologize, but there was an issue with the request format. Please try again.";
        } else if (response.status === 401) {
          setShowApiKeyConfig(true);
          return "I apologize, but the AI service authentication failed. Please check your API key configuration.";
        } else if (response.status === 403) {
          return "I apologize, but access to the AI service is currently restricted. Please try again later.";
        } else if (response.status === 429) {
          // Quota exceeded - try next API key
          console.log(`API key ${currentKeyIndex + 1} quota exceeded, trying next key...`);
          if (retryCount < apiKeys.length * 2) { // Try each key twice before giving up
            switchToNextApiKey();
            return await callGeminiAPI(prompt, retryCount + 1);
          }
          return "I apologize, but all API keys are currently experiencing quota limits. Please try again in a few minutes.";
        } else {
          return "I apologize, but the AI service is currently unavailable. Please try again later.";
        }
      }

      const data = await response.json();
      console.log('Gemini API Response:', data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log('Processed Response:', responseText);
        return responseText;
      } else {
        console.error('Unexpected API response structure:', data);
        return "I apologize, but I'm having trouble processing your request right now. Please try again.";
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "I apologize, but I'm having trouble connecting to the AI service right now. Please check your internet connection and try again.";
    }
  };

  const callGeminiForDynamicQuestions = async (answers: Record<string, string>, previousQuestions: string[], retryCount = 0) => {
    const currentKey = getCurrentApiKey();
    if (!currentKey) {
      setShowApiKeyConfig(true);
      return {
        question: "Can you provide more details about your symptoms?",
        options: ["Yes", "No", "Not sure", "Need to clarify"]
      };
    }
    
    // Get the main complaint from the first user message
    const mainComplaint = messages.find(m => m.sender === "user")?.text || "";
    
    // Format the answers for better context
    const formattedAnswers = Object.entries(answers).map(([key, value]) => {
      const question = messages.find(m => m.question === key)?.question || key;
      return `${question}: ${value}`;
    }).join('\n');

    const questionsAsked = totalQuestionsAsked();
    const remainingQuestions = MAX_TOTAL_QUESTIONS - questionsAsked;

    const prompt = `You are an experienced medical professional conducting a patient assessment. Your goal is to gather enough information for a proper medical evaluation and determine the most appropriate medical specialty.

IMPORTANT GUIDELINES:
- Ask ONE highly relevant follow-up question based on the patient's symptoms and previous answers
- Use simple, patient-friendly language (no medical jargon)
- The question should help clarify the diagnosis or assess severity
- The question should be as short as possible, but still clear and complete
- CRITICAL: Do NOT repeat or rephrase any previous questions. Only ask for new, unique information
- If you have enough information for a proper assessment, respond with "ENOUGH_INFO"
- If you need more information, ask a specific, targeted question
- Always provide 3-4 clear answer options for the user to select from
- Focus on symptoms, severity, timing, or related factors that could affect the diagnosis
- Consider which medical specialty would be most appropriate based on the symptoms

Current Assessment Status:
- Questions asked so far: ${questionsAsked}/10
- Remaining questions available: ${remainingQuestions}
- Main complaint: ${mainComplaint}

Previous Responses:
${formattedAnswers}

Previous Questions Asked (DO NOT repeat or rephrase these):
${previousQuestions.join('; ')}

If you have sufficient information for a medical assessment, respond with exactly: "ENOUGH_INFO"
Otherwise, format your response exactly like this:
Question: [Your specific, targeted question here]
1. [First option]
2. [Second option]
3. [Third option]
4. [Fourth option]`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error for dynamic questions:', response.status, errorData);
        
        if (response.status === 401) {
          setShowApiKeyConfig(true);
        } else if (response.status === 429) {
          // Quota exceeded - try next API key
          console.log(`API key ${currentKeyIndex + 1} quota exceeded, trying next key...`);
          if (retryCount < apiKeys.length * 2) { // Try each key twice before giving up
            switchToNextApiKey();
            return await callGeminiForDynamicQuestions(answers, previousQuestions, retryCount + 1);
          }
        }
        
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.candidates?.[0]?.content) {
        throw new Error('No valid response from AI');
      }

      const text = data.candidates[0].content.parts[0].text;
      console.log('AI Response:', text);

      // Check if AI has enough information
      if (text.trim().toUpperCase().includes('ENOUGH_INFO')) {
        console.log('AI determined enough information gathered');
        return null; // Signal to proceed to summary
      }

      // Parse the response to extract question and options
      const lines = text.split('\n').filter(line => line.trim());
      
      // Extract question
      const questionLine = lines.find(line => line.toLowerCase().startsWith('question:'));
      let question = questionLine ? questionLine.replace(/^question:\s*/i, '').trim() : '';

      // Post-process: If question is too long, trim to 110 chars at last space
      if (question.length > 110) {
        const trimmed = question.slice(0, 110);
        const lastSpace = trimmed.lastIndexOf(' ');
        question = trimmed.slice(0, lastSpace > 80 ? lastSpace : 110) + '...';
      }

      // Extract options
      const options = lines
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(opt => opt.length > 0);

      // Fallback: If no options, provide generic options
      if (!question || options.length < 2) {
        return {
          question: question || "Can you provide more details about your symptoms?",
          options: ["Yes", "No", "Not sure", "Need to clarify"]
        };
      }

      return { question, options };
    } catch (error) {
      console.error('Error generating dynamic question:', error);
      return {
        question: "Can you provide more details about your symptoms?",
        options: ["Yes", "No", "Not sure", "Need to clarify"]
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Add user's message to conversation history
    const newHistory = [...conversationHistory, { role: 'user', content: inputValue }];
    setConversationHistory(newHistory);

    // Add user's message to chat
    const newMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setCurrentlyShowingInteractive(false);
    setIsTyping(true);

    // If at the start, begin static flow
    if (conversationStep < conversationFlow.length) {
      setTimeout(() => {
        const staticQ = conversationFlow[conversationStep];
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          sender: "ai",
          timestamp: new Date(),
          isInteractive: true,
          question: staticQ.question,
          options: toInteractiveOptions(staticQ.options)
        }]);
        setCurrentlyShowingInteractive(true);
        setConversationStep(prev => prev + 1);
        setIsTyping(false);
      }, 500);
      return;
    }

    // After static flow, call AI for dynamic questions
    const aiQuestion = await getNextAIQuestion(newHistory);
    setIsTyping(false);
    if (aiQuestion) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        sender: "ai",
        timestamp: new Date(),
        isInteractive: true,
        question: aiQuestion.question,
        options: toInteractiveOptions(aiQuestion.options)
      }]);
      setCurrentlyShowingInteractive(true);
    }
  };

  // Helper to count total questions asked (static + dynamic)
  const totalQuestionsAsked = (): number => {
    return messages.filter(m => m.isInteractive && m.question).length;
  };

  // Helper to get all asked questions (static + dynamic)
  const getAllAskedQuestions = (): string[] => messages.filter(m => m.isInteractive && m.question).map(m => m.question?.toLowerCase().trim() ?? '');

  // Helper to get all normalized asked questions as a Set
  const getAllNormalizedAskedQuestionsSet = (): Set<string> => {
    return new Set(messages.filter(m => m.isInteractive && m.question).map(m => normalizeQuestion(m.question || '')));
  };

  // Helper to get all user answers (static + dynamic)
  const getAllUserAnswers = () => {
    // Find all user messages that are answers to interactive questions
    const answers: { [question: string]: string } = {};
    let lastQuestion = null;
    for (const msg of messages) {
      if (msg.isInteractive && msg.question) {
        lastQuestion = msg.question;
      } else if (msg.sender === 'user' && lastQuestion) {
        answers[lastQuestion] = msg.text || '';
        lastQuestion = null;
      }
    }
    return answers;
  };

  // Function to get the next best question from the AI
  const getNextAIQuestion = async (history: {role: string, content: string}[], retryCount = 0): Promise<DynamicQuestion | null> => {
    if (totalQuestionsAsked() >= MAX_TOTAL_QUESTIONS) {
      console.log('Maximum questions reached, proceeding to summary');
      proceedToSummary(userAnswers);
      return null;
    }

    const answers = getAllUserAnswers();
    const previousQuestions = getAllAskedQuestions();
    
    try {
      const dynamicQuestion = await callGeminiForDynamicQuestions(answers, previousQuestions);
      
      // If AI returns null, it means it has enough information
      if (!dynamicQuestion) {
        console.log('AI determined enough information gathered, proceeding to summary');
        proceedToSummary(answers);
        return null;
      }

      // Check for duplicate questions using enhanced similarity check
      if (isSimilarQuestion(dynamicQuestion.question)) {
        console.log('Duplicate question detected:', dynamicQuestion.question);
        if (retryCount >= 4) { // Try up to 5 times
          console.log('Too many duplicate questions, proceeding to summary');
          proceedToSummary(answers);
          return null;
        }
        // Try to get a new question (skip duplicate)
        console.log(`Retrying question generation (attempt ${retryCount + 1})`);
        return getNextAIQuestion(history, retryCount + 1);
      }

      return dynamicQuestion;

    } catch (error) {
      console.error('Error in getNextAIQuestion:', error);
      // If we fail to get a dynamic question, proceed to summary
      proceedToSummary(answers);
      return null;
    }
  };

  const handleOptionSelect = async (option: InteractiveOption): Promise<void> => {
    if (currentlyShowingInteractive) {
      const currentMessage = messages[messages.length - 1];
      const currentQuestionId = normalizeQuestion(currentMessage.question || '');
      setAskedQuestionIds(prev => new Set([...prev, currentQuestionId]));
      
      // Create new messages array with user response
      const newMessages: Message[] = [
        ...messages,
        {
          id: messages.length + 1,
          text: option.label,
          sender: "user" as const,
          timestamp: new Date()
        }
      ];

      // Update the interactive message with selected option
      const finalMessages = newMessages.map(msg =>
        msg.id === currentMessage.id
          ? { ...msg, selectedOption: option.value }
          : msg
      );

      // Update all messages at once
      setMessages(finalMessages);
      setCurrentlyShowingInteractive(false);

      // Store the answer
      const newAnswers = {
        ...userAnswers,
        [currentMessage.question || '']: option.value
      };
      setUserAnswers(newAnswers);

      // If we're in static questions flow
      if (conversationStep < conversationFlow.length) {
        let nextStep = conversationStep + 1;
        // Find the next static question that hasn't been asked
        let nextQuestion = null;
        let nextQuestionId = null;
        while (nextStep < conversationFlow.length) {
          nextQuestion = conversationFlow[nextStep];
          nextQuestionId = normalizeQuestion(nextQuestion.question || '');
          if (!askedQuestionIds.has(nextQuestionId)) {
            break;
          }
          nextStep++;
        }
        if (nextStep < conversationFlow.length && nextQuestion && nextQuestionId && !askedQuestionIds.has(nextQuestionId)) {
          setConversationStep(nextStep);
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: prev.length + 1,
                question: nextQuestion.question,
                sender: "ai" as const,
                timestamp: new Date(),
                isInteractive: true,
                options: toInteractiveOptions(nextQuestion.options)
              }
            ]);
            setCurrentlyShowingInteractive(true);
          }, 500);
        } else {
          // After static questions, proceed to dynamic questions
          setConversationStep(conversationFlow.length);
          setIsGeneratingDynamic(true);
          const dynamicQuestion = await callGeminiForDynamicQuestions(newAnswers, getAllAskedQuestions());
          if (dynamicQuestion) {
            const dynamicQuestionId = normalizeQuestion(dynamicQuestion.question || '');
            if (!askedQuestionIds.has(dynamicQuestionId) && !isSimilarQuestion(dynamicQuestion.question)) {
              setTimeout(() => {
                setMessages(prev => [
                  ...prev,
                  {
                    id: prev.length + 1,
                    question: dynamicQuestion.question,
                    sender: "ai" as const,
                    timestamp: new Date(),
                    isInteractive: true,
                    options: toInteractiveOptions(dynamicQuestion.options)
                  }
                ]);
                setCurrentlyShowingInteractive(true);
                setDynamicQuestions([dynamicQuestion]);
                setCurrentDynamicIndex(0);
              }, 500);
            } else {
              proceedToSummary(newAnswers);
            }
          }
          setIsGeneratingDynamic(false);
        }
      } else {
        // Handle dynamic questions
        const allAnswers = getAllUserAnswers();
        const nextDynamicQuestion = await callGeminiForDynamicQuestions(allAnswers, getAllAskedQuestions());
        
        if (nextDynamicQuestion && totalQuestionsAsked() < MAX_TOTAL_QUESTIONS) {
          const nextDynamicQuestionId = normalizeQuestion(nextDynamicQuestion.question || '');
          
          // Check if this dynamic question was already asked using the Set and enhanced similarity check
          if (!askedQuestionIds.has(nextDynamicQuestionId) && !isSimilarQuestion(nextDynamicQuestion.question)) {
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                {
                  id: prev.length + 1,
                  question: nextDynamicQuestion.question,
                  sender: "ai" as const,
                  timestamp: new Date(),
                  isInteractive: true,
                  options: toInteractiveOptions(nextDynamicQuestion.options)
                }
              ]);
              setCurrentlyShowingInteractive(true);
              setDynamicQuestions(prev => [...prev, nextDynamicQuestion]);
              setCurrentDynamicIndex(prev => prev + 1);
            }, 500);
          } else {
            // Proceed to summary if we've reached the question limit or question was already asked
            proceedToSummary(allAnswers);
          }
        } else {
          // Proceed to summary if we've reached the question limit
          proceedToSummary(allAnswers);
        }
      }
    }
  };

  const proceedToSummary = async (finalAnswers?: Record<string, string>) => {
    setIsTyping(true);
    setCurrentlyShowingInteractive(false);
    setShowUserFallback(false);
    setSummaryError(null); // Reset error
    // Use all collected answers if not provided
    const answers = finalAnswers || getAllUserAnswers();
    // Build a structured summary prompt
    const mainComplaint = messages.find(m => m.sender === "user")?.text || "";
    
    // Enhanced summary prompt for better specialty selection
    const summaryPrompt = `You are an experienced medical professional. Based on the patient's information, provide a comprehensive medical assessment and recommend the most appropriate medical specialty.

Patient Information:
Main Complaint: ${mainComplaint}

Assessment Responses:
${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}

Please provide your assessment in the following format:

**Symptoms Analysis:**
[Analyze the patient's symptoms and their severity]

**Possible Conditions:**
[List potential medical conditions based on the symptoms]

**Recommended Specialty:**
[Recommend the most appropriate medical specialty based on the symptoms and patient history. Choose from: Cardiology, Neurology, Orthopedics, Gastroenterology, Dermatology, Ophthalmology, ENT (Ear, Nose, Throat), Pulmonology, Endocrinology, Urology, Gynecology, Pediatrics, Emergency Medicine, Internal Medicine, General Practice]

**Urgency Level:**
[Assess if this requires immediate attention, urgent care, or routine consultation]

**Next Steps:**
[Provide clear guidance on what the patient should do next]

**Additional Notes:**
[Any other relevant medical advice or precautions]`;

    try {
      const aiResponseText = await callGeminiAPI(summaryPrompt);
      setTimeout(() => {
        setIsTyping(false);
        // Split the Gemini response into sections and group by concept
        const sections = parseGeminiSummarySections(aiResponseText);
        let nextId = messages.length + 2;
        
        // Group sections by their type
        const groupedSections = sections.reduce<Record<string, string[]>>((acc, section) => {
          const type = section.type.trim();
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(section.content);
          return acc;
        }, {});

        // Extract recommended specialty from the sections with improved logic
        const specialtySection = sections.find(section => 
          section.type.toLowerCase().includes("recommended specialty") ||
          section.type.toLowerCase().includes("specialty")
        );
        
        const specialtyText = specialtySection ? specialtySection.content.toLowerCase().trim() : "general medicine";
        
        // Enhanced specialty extraction with better mapping
        const specialties = extractSpecialties(specialtyText);
        setCurrentSpecialties(specialties);

        // Create one message per concept type with all its content, except for any specialty section
        const newSectionMessages = Object.entries(groupedSections)
          .filter(([type]) => !type.trim().toLowerCase().includes('specialty'))
          .map(([type, contents]) => ({
            id: nextId++,
            text: contents.join('\n\n'),
            sender: "ai" as const,
            timestamp: new Date(),
            summary: contents.join('\n\n'),
            summaryType: type
          }));

        setMessages(prev => [...prev, ...newSectionMessages]);
        setSummaryError(null); // Clear error if successful
        
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: prev.length + 1,
              sender: "ai",
              timestamp: new Date(),
              showHospitals: true,
              specialty: specialties[0] || "general medicine", // Use first specialty for hospital search
              specialties: specialties // Store all specialties
            }
          ]);
        }, 1500);
      }, 1500);
    } catch (err) {
      setIsTyping(false);
      setSummaryError("Unable to generate analysis at this time. Please try again later or check your API usage.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const parseGeminiSummarySections = (summary: string) => {
    // Returns an array of { type, content }
    const sections: { type: string; content: string }[] = [];
    const regex = /\*\*([\w \-]+):\*\*[\r\n]*([\s\S]*?)(?=(\*\*[\w \-]+:\*\*|$))/gi;
    let match;
    while ((match = regex.exec(summary))) {
      const type = match[1].trim();
      const content = match[2].trim();
      console.log('Section:', type, 'Content:', content); // Debug log
      sections.push({ type, content });
    }
    return sections;
  };

  const handleDynamicAnswer = async (answer: string): Promise<void> => {
    // Add the answer to dynamic answers
    const newDynamicAnswers = [...dynamicAnswers, answer];
    setDynamicAnswers(newDynamicAnswers);
    setCurrentDynamicIndex(currentDynamicIndex + 1);

    // Add the answer to userAnswers
    const currentQuestion = dynamicQuestions[currentDynamicIndex];
    if (currentQuestion) {
      const updatedAnswers = { ...userAnswers, [currentQuestion.question]: answer };
      setUserAnswers(updatedAnswers);
    }

    // Add the interactive message with the selected option
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.isInteractive) {
      const updatedMessage = { ...lastMessage, selectedOption: answer };
      setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? updatedMessage : msg));
    }

    // Check if we should ask more questions or proceed to summary
    const totalAsked = totalQuestionsAsked();
    const remainingQuestions = MAX_TOTAL_QUESTIONS - totalAsked;

    if (remainingQuestions <= 0) {
      // Maximum questions reached
      console.log('Maximum questions reached, proceeding to summary');
      proceedToSummary(userAnswers);
      return;
    }

    // Get the next question from AI with enhanced duplicate detection
    const nextDynamicQuestion = await getNextAIQuestion([], 0);
    
    if (nextDynamicQuestion && totalQuestionsAsked() < MAX_TOTAL_QUESTIONS) {
      // Double-check for duplicates before adding
      if (!isSimilarQuestion(nextDynamicQuestion.question)) {
        // Add the new question to dynamic questions
        setDynamicQuestions(prev => [...prev, nextDynamicQuestion]);
        
        // Add the interactive message
        const interactiveMessage: Message = {
          id: Date.now(),
          sender: "ai",
          timestamp: new Date(),
          isInteractive: true,
          question: nextDynamicQuestion.question,
          options: toInteractiveOptions(nextDynamicQuestion.options)
        };
        
        setMessages(prev => [...prev, interactiveMessage]);
        setCurrentlyShowingInteractive(true);
        setAllAskedQuestions(prev => [...prev, nextDynamicQuestion.question.toLowerCase().trim()]);
        setAskedQuestionIds(prev => new Set([...prev, normalizeQuestion(nextDynamicQuestion.question)]));
      } else {
        console.log('Duplicate question detected in dynamic flow, proceeding to summary');
        proceedToSummary(userAnswers);
      }
    } else {
      // AI determined enough information or max questions reached
      console.log('Proceeding to summary - AI has enough information or max questions reached');
      proceedToSummary(userAnswers);
    }
  };

  // Add a handler for custom static answers
  const handleCustomStaticAnswer = async (answer: string): Promise<void> => {
    // Add user's answer as a message
    const userResponse: Message = {
      id: messages.length + 1,
      text: answer,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userResponse]);

    // Update userAnswers with the selected option
    const currentQuestion = conversationFlow[conversationStep];
    if (currentQuestion) {
      const updatedAnswers = { ...userAnswers, [currentQuestion.question]: answer };
      setUserAnswers(updatedAnswers);
    }

    // Add the interactive message with the selected option
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.isInteractive) {
      const updatedMessage = { ...lastMessage, selectedOption: answer };
      setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? updatedMessage : msg));
    }

    // Move to next step
    const nextStep = conversationStep + 1;
    setConversationStep(nextStep);

    if (nextStep < conversationFlow.length) {
      // Show next static question
      setTimeout(() => {
        const nextQ = conversationFlow[nextStep];
        const staticQuestion: Message = {
          id: messages.length + 2,
          sender: "ai",
          timestamp: new Date(),
          isInteractive: true,
          question: nextQ.question,
          options: toInteractiveOptions(nextQ.options)
        };
        setMessages(prev => [...prev, staticQuestion]);
        setCurrentlyShowingInteractive(true);
        setAllAskedQuestions(prev => [...prev, nextQ.question.toLowerCase().trim()]);
        setAskedQuestionIds(prev => new Set([...prev, nextQ.question.toLowerCase().trim()]));
      }, 1000);
    } else {
      // Static questions completed, now ask dynamic questions based on AI assessment
      console.log('Static questions completed, starting dynamic AI assessment');
      
      // Get the first dynamic question from AI
      const firstDynamicQuestion = await getNextAIQuestion([], 0);
      
      if (firstDynamicQuestion && totalQuestionsAsked() < MAX_TOTAL_QUESTIONS) {
        // Double-check for duplicates before adding
        if (!isSimilarQuestion(firstDynamicQuestion.question)) {
          // Add the new question to dynamic questions
          setDynamicQuestions([firstDynamicQuestion]);
          
          // Add the interactive message
          const interactiveMessage: Message = {
            id: Date.now(),
            sender: "ai",
            timestamp: new Date(),
            isInteractive: true,
            question: firstDynamicQuestion.question,
            options: toInteractiveOptions(firstDynamicQuestion.options)
          };
          
          setMessages(prev => [...prev, interactiveMessage]);
          setCurrentlyShowingInteractive(true);
          setAllAskedQuestions(prev => [...prev, firstDynamicQuestion.question.toLowerCase().trim()]);
          setAskedQuestionIds(prev => new Set([...prev, normalizeQuestion(firstDynamicQuestion.question)]));
        } else {
          console.log('Duplicate question detected after static questions, proceeding to summary');
          proceedToSummary(userAnswers);
        }
      } else {
        // AI determined enough information after static questions
        console.log('AI determined enough information after static questions, proceeding to summary');
        proceedToSummary(userAnswers);
      }
    }
  };

  const focusMainInput = (): void => {
    mainInputRef.current?.focus();
    setInputPlaceholder("Describe here...");
    setCustomAnswerMode(true);
  };

  // Helper type guard
  function isStringArray(arr: unknown): arr is string[] {
    return Array.isArray(arr) && arr.length > 0 && arr.every(opt => typeof opt === 'string');
  }

  // Handler for user fallback finish
  const handleUserFallbackFinish = (): void => {
    setShowUserFallback(false);
    if (userFallbackInput.trim()) {
      // Add user's extra info to conversation
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: userFallbackInput,
        sender: "user",
        timestamp: new Date()
      }]);
    }
    proceedToSummary(userAnswers);
    setUserFallbackInput("");
  };

  // Function to clean and normalize specialty names
  const cleanSpecialtyName = (specialty: string): string => {
    // Remove extra text and keep only the specialty name
    let cleaned = specialty.toLowerCase().trim();
    
    // Remove common extra words
    cleaned = cleaned.replace(/^(primary specialty|recommended specialty|specialty needed|specialty required|specialty|primary|recommended|needed|required):?\s*/i, '');
    cleaned = cleaned.replace(/^(brief reason|reason|why):?\s*/i, '');
    cleaned = cleaned.replace(/^(for|to|in|at|with|the|a|an)\s+/i, '');
    cleaned = cleaned.replace(/\s+(for|to|in|at|with|the|a|an)\s+/i, ' ');
    cleaned = cleaned.replace(/\s+$/i, '');
    
    // Normalize specific specialties
    const specialtyMap: { [key: string]: string } = {
      'general practitioner': 'general medicine',
      'gp': 'general medicine',
      'family medicine': 'general medicine',
      'primary care': 'general medicine',
      'internal medicine': 'general medicine',
      'cardiology': 'cardiology',
      'cardiovascular': 'cardiology',
      'heart': 'cardiology',
      'neurology': 'neurology',
      'neurosurgery': 'neurology',
      'brain': 'neurology',
      'orthopedics': 'orthopedics',
      'orthopedic surgery': 'orthopedics',
      'bone': 'orthopedics',
      'trauma': 'orthopedics',
      'emergency medicine': 'emergency medicine',
      'emergency': 'emergency medicine',
      'er': 'emergency medicine',
      'pediatrics': 'pediatrics',
      'pediatric': 'pediatrics',
      'child': 'pediatrics',
      'dermatology': 'dermatology',
      'skin': 'dermatology',
      'psychiatry': 'psychiatry',
      'mental health': 'psychiatry',
      'psychology': 'psychiatry',
      'gastroenterology': 'gastroenterology',
      'gi': 'gastroenterology',
      'stomach': 'gastroenterology',
      'digestive': 'gastroenterology',
      'pulmonology': 'pulmonology',
      'respiratory': 'pulmonology',
      'lung': 'pulmonology',
      'breathing': 'pulmonology',
      'endocrinology': 'endocrinology',
      'diabetes': 'endocrinology',
      'hormone': 'endocrinology',
      'urology': 'urology',
      'urinary': 'urology',
      'kidney': 'urology',
      'nephrology': 'nephrology',
      'renal': 'nephrology',
      'oncology': 'oncology',
      'cancer': 'oncology',
      'hematology': 'hematology',
      'blood': 'hematology',
      'rheumatology': 'rheumatology',
      'arthritis': 'rheumatology',
      'joint': 'rheumatology',
      'ophthalmology': 'ophthalmology',
      'eye': 'ophthalmology',
      'vision': 'ophthalmology',
      'ent': 'otolaryngology',
      'ear nose throat': 'otolaryngology',
      'otolaryngology': 'otolaryngology',
      'gynecology': 'gynecology',
      'obstetrics': 'gynecology',
      'women': 'gynecology',
      'reproductive': 'gynecology'
    };
    
    // Find the best match
    for (const [key, value] of Object.entries(specialtyMap)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return value;
      }
    }
    
    // Default to general medicine if no match found
    return 'general medicine';
  };

  // Function to extract multiple specialties from text
  const extractSpecialties = (specialtyText: string): string[] => {
    const specialtyMappings: { [key: string]: string[] } = {
      // Heart and cardiovascular symptoms
      'cardiology': ['cardiology', 'cardiologist', 'heart', 'chest pain', 'palpitations', 'hypertension', 'blood pressure'],
      'neurology': ['neurology', 'neurologist', 'headache', 'migraine', 'seizure', 'numbness', 'tingling', 'stroke', 'brain'],
      'orthopedics': ['orthopedics', 'orthopedic', 'bone', 'joint', 'fracture', 'sprain', 'back pain', 'knee pain', 'shoulder pain'],
      'gastroenterology': ['gastroenterology', 'gastroenterologist', 'stomach', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
      'dermatology': ['dermatology', 'dermatologist', 'skin', 'rash', 'acne', 'mole', 'itching', 'dermatitis'],
      'ophthalmology': ['ophthalmology', 'ophthalmologist', 'eye', 'vision', 'blurred', 'red eye', 'eye pain'],
      'ent': ['ent', 'otolaryngology', 'ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsils'],
      'pulmonology': ['pulmonology', 'pulmonologist', 'lung', 'breathing', 'cough', 'asthma', 'pneumonia'],
      'endocrinology': ['endocrinology', 'endocrinologist', 'diabetes', 'thyroid', 'hormone', 'metabolism'],
      'urology': ['urology', 'urologist', 'urinary', 'bladder', 'kidney', 'prostate'],
      'gynecology': ['gynecology', 'gynecologist', 'women', 'menstrual', 'pregnancy', 'ovarian'],
      'pediatrics': ['pediatrics', 'pediatrician', 'child', 'baby', 'infant', 'adolescent'],
      'emergency': ['emergency', 'urgent', 'acute', 'trauma', 'injury'],
      'internal': ['internal medicine', 'general medicine', 'primary care', 'family medicine']
    };

    const lowerText = specialtyText.toLowerCase();
    const foundSpecialties: string[] = [];

    // Check for exact matches first
    for (const [specialty, keywords] of Object.entries(specialtyMappings)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSpecialties.push(specialty);
      }
    }

    // If no specialties found, try to infer from common symptoms
    if (foundSpecialties.length === 0) {
      const symptomSpecialtyMap: { [key: string]: string } = {
        'chest pain': 'cardiology',
        'shortness of breath': 'pulmonology',
        'headache': 'neurology',
        'abdominal pain': 'gastroenterology',
        'skin rash': 'dermatology',
        'eye problem': 'ophthalmology',
        'ear pain': 'ent',
        'joint pain': 'orthopedics',
        'fever': 'internal',
        'fatigue': 'internal',
        'weight loss': 'endocrinology',
        'urinary problem': 'urology'
      };

      for (const [symptom, specialty] of Object.entries(symptomSpecialtyMap)) {
        if (lowerText.includes(symptom)) {
          foundSpecialties.push(specialty);
          break;
        }
      }
    }

    // Default to internal medicine if no specialty found
    if (foundSpecialties.length === 0) {
      foundSpecialties.push('internal');
    }

    return foundSpecialties;
  };

  function toInteractiveOptions(options: unknown): InteractiveOption[] {
    if (Array.isArray(options) && typeof options[0] === 'string') {
      return (options as string[]).map((opt, idx) => ({ id: String(idx + 1), label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') }));
    }
    return options as InteractiveOption[];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Enhanced Header - stays in place */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-200/60 dark:border-gray-700/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2 w-full">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Rakshith AI</h2>
                <p className="text-xs text-green-600 dark:text-green-400">● Online</p>
              </div>
              <div className="flex-1" />
              <button
                className="ml-4 relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold shadow-lg text-green-100 border border-emerald-700 focus:ring-2 focus:ring-emerald-400 transition-all duration-200 shine-flash align-middle"
                style={{
                  height: '1.6rem',
                  minWidth: 'auto',
                  boxShadow: '0 2px 6px 0 rgba(16,185,129,0.12)',
                  background: 'linear-gradient(90deg, #000 0%, #000 40%, #064e3b 80%, #34d399 100%)'
                }}
                onClick={() => setFlashMode(true)}
              >
                <span className="flex items-center justify-center">
                  <svg className="w-3 h-3 mr-1 text-emerald-300 drop-shadow" style={{width:'12px',height:'12px'}} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
                Flash Mode
                <span className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden rounded-full">
                  <span className="shine absolute left-[-75%] top-0 w-1/2 h-full bg-gradient-to-r from-white/60 to-transparent opacity-60 rotate-12" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <ApiKeyConfig onApiKeySet={handleApiKeySet} />
          </div>
        </div>
      )}

      {/* Messages Area - scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, idx) => {
          // Find if this is the Urgency Level summary card
          const isUrgencyLevel = message.summaryType && message.summaryType.toLowerCase().includes('urgency level');
          return (
            <React.Fragment key={message.id}>
              <div
                className={`flex items-start space-x-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "ai" && (
                  <div className={`w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex flex-col items-center justify-center flex-shrink-0 p-0.5 relative ${isTyping ? 'animate-bounce' : ''}`}>
                    <Bot className="w-4 h-4 text-white z-10 relative" style={{ top: '-4px' }} />
                    <Stethoscope className="w-2.5 h-2.5 text-white absolute left-[54%] -translate-x-1/2 top-3.5 z-0 rotate-3" style={{ top: '14px' }} />
                  </div>
                )}
                <div
                  className={`max-w-fit min-w-[40px] sm:min-w-[60px] lg:min-w-[80px] max-w-[65vw] sm:max-w-xs lg:max-w-md rounded-lg px-1 sm:px-2 py-1 text-xs break-words ${
                    message.showHospitals // Apply black background specifically for hospital recommendations
                      ? "bg-black text-white shadow-lg"
                      : message.sender === "user"
                      ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-md"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-fade-in"
                  } transition-all duration-300 hover:shadow-lg overflow-hidden`}
                >
                  {message.isInteractive ? (
                    <InteractiveMessage
                      question={message.question && message.question.length > 120 ? message.question.slice(0, 117) + '...' : message.question}
                      options={
                        isStringArray(message.options)
                          ? (message.options as string[]).map((opt, idx) => ({ id: String(idx+1), label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') }))
                          : (Array.isArray(message.options) && message.options.length > 0 && typeof message.options[0] === 'object'
                            ? message.options as InteractiveOption[]
                            : undefined)
                      }
                      onOptionSelect={handleOptionSelect}
                      selectedOption={message.selectedOption}
                      allowCustomAnswer={true}
                      onCustomAnswer={handleCustomStaticAnswer}
                      onFocusMainInput={focusMainInput}
                    />
                  ) : message.showHospitals ? (
                    <HospitalRecommendations specialty={message.specialty || "general"} />
                  ) : message.summary ? (
                    message.summaryType && [
                      'FIRST AID RECOMMENDATIONS',
                      'ADDITIONAL INVESTIGATIONS NEEDED'
                    ].includes(message.summaryType.toUpperCase()) ? (
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-4 my-2 text-sm leading-relaxed whitespace-pre-line text-white">
                        <div className="flex justify-center mb-3">
                          {message.summaryType.toUpperCase().includes('FIRST AID') ? (
                            <span className="flex items-center gap-2 px-5 py-1 rounded-full font-bold text-base text-white bg-gradient-to-r from-red-500 via-red-600 to-pink-500 shadow-md text-center">
                              <Heart className="w-5 h-5 text-white" />
                              First Aid
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 px-5 py-1 rounded-full font-bold text-base text-white bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 shadow-md text-center">
                              <TestTube className="w-5 h-5 text-white" />
                              Investigations
                            </span>
                          )}
                        </div>
                        {message.summary
                          .split(/\r?\n|\u2022|\d+\.|\- /)
                          .map(line => line.trim())
                          .filter(line => line.length > 0)
                          .map((line, idx) => (
                            <div key={idx} className="flex items-start">
                              <span className="mr-2 text-lg text-blue-400" style={{lineHeight: '1'}}>&bull;</span>
                              <span>{line}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <MedicalSummaryCard summary={message.text || ""} summaryType={message.summaryType} />
                    )
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              {/* Render SpecialtyRecommendation box after Urgency Level card, only once */}
              {isUrgencyLevel && currentSpecialties && currentSpecialties.length > 0 && idx === messages.findIndex(m => m.summaryType && m.summaryType.toLowerCase().includes('urgency level')) && (
                <div className="flex items-start space-x-3 justify-start mt-2 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex flex-col items-center justify-center flex-shrink-0 p-0.5 relative">
                    <Bot className="w-4 h-4 text-white z-10 relative" style={{ top: '-4px' }} />
                    <Stethoscope className="w-2.5 h-2.5 text-white absolute left-[54%] -translate-x-1/2 top-3.5 z-0 rotate-3" style={{ top: '14px' }} />
                  </div>
                  <div className="max-w-[85vw] sm:max-w-xs lg:max-w-md rounded-2xl px-3 sm:px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-fade-in transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <SpecialtyRecommendation specialties={currentSpecialties} />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        {isTyping && <TypingIndicator />}
        {showUserFallback && (
          <div className="max-w-xs lg:max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mt-4 animate-fade-in">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">I have enough information to help you now. If you want to share more details, please type them below or press 'Finish' to get your advice.</p>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 mb-3 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="Add any extra details (optional)"
              value={userFallbackInput}
              onChange={e => setUserFallbackInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-2 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              onClick={handleUserFallbackFinish}
              disabled={isTyping}
            >
              Finish and get advice
            </button>
          </div>
        )}
        {summaryError && (
          <div className="w-full max-w-lg mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
            {summaryError}
          </div>
        )}
      </div>

      {/* Enhanced Input Area - stays in place */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200/60 dark:border-gray-700/60 p-4">
        <div className="flex space-x-3 items-end">
          <div className="flex-1">
            <Input
              ref={mainInputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={inputPlaceholder}
              className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl px-4 py-3 resize-none"
              disabled={isTyping}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-500 dark:hover:from-emerald-500 dark:hover:via-blue-500 dark:hover:to-purple-600 transition-all duration-300 hover:scale-105 text-white border-0 shadow-lg rounded-xl px-6 py-3 font-medium"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 text-center leading-relaxed">
          Rakshith AI may provide inaccurate information if you don't provide precise details.
        </p>
      </div>

      {flashMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <FlashMode onExit={() => setFlashMode(false)} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
