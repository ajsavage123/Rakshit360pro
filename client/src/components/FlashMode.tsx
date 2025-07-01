import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HospitalRecommendations from "./HospitalRecommendations";
import { X, Send, Zap } from "lucide-react";
import MedicalSummaryCard from "./MedicalSummaryCard";

interface FlashModeProps {
  onExit: () => void;
}

const callGeminiAPI = async (prompt: string) => {
  // Get API keys from localStorage (same as ChatArea)
  const storedApiKeys = localStorage.getItem('gemini_api_keys');
  const defaultKeys = [
    'AIzaSyCvDat-bQkyMj4P-p-YfqifCYtYMcUB0pQ',
    'AIzaSyDiIz20C0geTawJL01kedSWOvnjRZ0D-MU',
    'AIzaSyCkDKiQD_GMPr7WCk4Ozcurk9LSUYM9K98',
    'AIzaSyCwUuD2PJxLI3Al2uNK_tbK6KlsygmxXdA'
  ];
  
  let apiKeys = defaultKeys;
  let currentKeyIndex = 0;
  
  if (storedApiKeys) {
    try {
      const parsedKeys = JSON.parse(storedApiKeys);
      if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
        apiKeys = parsedKeys;
      }
    } catch {
      // Use default keys
    }
  }
  
  // Get current key index from localStorage
  const storedIndex = localStorage.getItem('current_key_index');
  if (storedIndex) {
    currentKeyIndex = parseInt(storedIndex, 10) || 0;
  }
  
  let attempts = 0;
  const maxAttempts = apiKeys.length * 2; // Try each key twice
  
  while (attempts < maxAttempts) {
    const currentKey = apiKeys[currentKeyIndex];
    console.log(`FlashMode: Using API key ${currentKeyIndex + 1}/${apiKeys.length}`);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an experienced emergency medical professional. The user is in a hurry and has described their emergency or main complaint in a single message. Immediately provide:
**SUMMARY OF CASE:**
[Brief summary of the main complaint and likely diagnosis.]
**URGENCY LEVEL:**
[High/Medium/Low. Key reason for this level.]
**RECOMMENDED SPECIALTY:**
[Most relevant specialty for this case.]
**FIRST AID RECOMMENDATIONS:**
[2-3 most critical first aid steps.]
**ADDITIONAL INVESTIGATIONS NEEDED:**
[2-3 most important tests.]
Strictly use these headings and formatting. Do not ask any follow-up questions. Do not add extra sections.\n\nUser's Emergency Input: ${prompt}`
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
      
      if (response.status === 429) {
        console.log(`FlashMode: Key ${currentKeyIndex + 1} quota exceeded, switching to next key`);
        // Switch to next key
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        localStorage.setItem('current_key_index', currentKeyIndex.toString());
        attempts++;
        continue;
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return "Sorry, I couldn't process your request right now.";
      }
    } catch (error) {
      console.error(`FlashMode: API error with key ${currentKeyIndex + 1}:`, error);
      // Switch to next key and try again
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      localStorage.setItem('current_key_index', currentKeyIndex.toString());
      attempts++;
    }
  }
  
  return "Sorry, all API keys are currently unavailable. Please try again later.";
};

const extractSpecialty = (summary: string): string => {
  const match = summary.match(/\*\*RECOMMENDED SPECIALTY:\*\*[\r\n]*([\s\S]*?)(?=\*\*|$)/i);
  if (match) {
    return match[1].split(/[\n\r]/)[0].trim().split(/,|\band\b/)[0] || "general medicine";
  }
  return "general medicine";
};

// Helper to parse Gemini summary sections (copied from ChatArea)
const parseGeminiSummarySections = (summary: string) => {
  // Returns an array of { type, content }
  const sections: { type: string; content: string }[] = [];
  const regex = /\*\*([\w \-]+):\*\*[\r\n]*([\s\S]*?)(?=(\*\*[\w \-]+:\*\*|$))/gi;
  let match;
  while ((match = regex.exec(summary))) {
    const type = match[1].trim();
    const content = match[2].trim();
    sections.push({ type, content });
  }
  return sections;
};

const FLASH_HINTS = [
  "Please describe your complaints briefly",
  "Include: duration",
  "Include: severity",
  "Include: medical history",
  "Include: events that caused it"
];

const FlashMode: React.FC<FlashModeProps> = ({ onExit }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState("");
  const [hintIdx, setHintIdx] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingForward, setTypingForward] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Typing animation for cycling through multiple hints
  useEffect(() => {
    if (input.length > 0) {
      setPlaceholder("");
      return;
    }
    let timeout: NodeJS.Timeout;
    const currentHint = FLASH_HINTS[hintIdx];
    if (typingForward) {
      if (typingIndex < currentHint.length) {
        timeout = setTimeout(() => {
          setPlaceholder(currentHint.slice(0, typingIndex + 1));
          setTypingIndex(typingIndex + 1);
        }, 30);
      } else {
        timeout = setTimeout(() => setTypingForward(false), 1200);
      }
    } else {
      if (typingIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(currentHint.slice(0, typingIndex - 1));
          setTypingIndex(typingIndex - 1);
        }, 10);
      } else {
        // Move to next hint after a short pause
        timeout = setTimeout(() => {
          setHintIdx((hintIdx + 1) % FLASH_HINTS.length);
          setTypingForward(true);
        }, 500);
      }
    }
    return () => clearTimeout(timeout);
  }, [typingIndex, typingForward, hintIdx, input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setSummary(null);
    setSpecialty(null);
    setSummaryError(null);
    try {
      const aiSummary = await callGeminiAPI(input.trim());
      if (aiSummary && aiSummary.toLowerCase().includes('too many requests')) {
        setSummaryError("Unable to generate analysis right now due to too many requests. Please wait a moment and try again.");
        setLoading(false);
        return;
      }
      setSummary(aiSummary);
      setSpecialty(extractSpecialty(aiSummary));
      setLoading(false);
      setSummaryError(null);
    } catch (err) {
      setSummaryError("Unable to generate analysis at this time. Please try again later or check your API usage.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 p-2 sm:p-4">
      <Card className="w-full max-w-[95vw] sm:max-w-sm box-border shadow-2xl border-2 border-green-600 bg-white dark:bg-gray-900 rounded-xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header, input, and disclaimer always visible at the top */}
        <CardContent className="p-3 sm:p-6 pb-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg font-bold text-green-700 dark:text-green-300">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /> Flash Mode
            </span>
            <Button size="icon" variant="ghost" onClick={onExit} className="text-gray-500 hover:text-red-600 h-8 w-8 sm:h-10 sm:w-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          {!summary && (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                <input
                  type="text"
                  className="rounded-md border border-green-400 px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 dark:bg-green-950 text-gray-900 dark:text-gray-100 placeholder:opacity-70 placeholder:italic"
                  placeholder={placeholder}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2 justify-center py-2 sm:py-3 text-sm sm:text-base"
                  disabled={loading || !input.trim()}
                >
                  <Send className="w-4 h-4" /> Submit
                </Button>
              </form>
              <div className="mt-2 text-xs text-center text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900 rounded px-2 py-1">
                Disclaimer: Flash Mode may make mistakes if you don't provide complete details of your complaints.
              </div>
            </>
          )}
          {summary && !loading && (
            <>
              <div className="w-full mb-2 p-2 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-xs text-gray-700 dark:text-gray-200">
                <span className="font-semibold text-green-700 dark:text-green-300">Your input:</span> {input}
              </div>
              <div className="w-full mb-2 text-xs text-center text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900 rounded px-2 py-1">
                Disclaimer: Flash Mode may make mistakes if you don't provide complete details of your complaints.
              </div>
            </>
          )}
        </CardContent>
        {/* Only this area scrolls */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-1 sm:px-2">
          {summaryError && (
            <div className="w-full max-w-lg mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
              {summaryError}
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600 mb-3 sm:mb-4"></div>
              <span className="text-sm sm:text-base text-green-700 dark:text-green-300 text-center">Analyzing emergency input...</span>
            </div>
          )}
          {summary && !loading && (
            <div className="mt-2 w-full flex flex-col items-center">
              <div className="w-full space-y-2 sm:space-y-3">
                {parseGeminiSummarySections(summary).map((section, idx) => (
                  <div key={idx} className="w-full">
                    <MedicalSummaryCard summary={section.content} summaryType={section.type} />
                  </div>
                ))}
                <div className="mt-2 w-full flex justify-center">
                  <div className="w-full">
                    <HospitalRecommendations specialty={specialty || "general medicine"} summary={summary || ""} />
                  </div>
                </div>
              </div>
              <Button
                className="mt-4 sm:mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
                onClick={onExit}
              >
                Exit Flash Mode
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FlashMode; 