import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import ChatArea from "@/components/ChatArea";
import Sidebar from "@/components/Sidebar";
import OnboardingFlow from "@/components/OnboardingFlow";
import { Loader2, LogOut, MessageCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService, ChatSession } from "@/lib/storage";
import rakshithShield from "@/assets/rakshith360-shield.svg";

const Index = () => {
  const { user, initializing, logout } = useAuth();
  const [testState, setTestState] = useState("loading");
  const [showChat, setShowChat] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    console.log("Index component mounted");
    setTestState("mounted");
  }, []);

  // Check onboarding status when user is authenticated
  useEffect(() => {
    if (user && !showOnboarding && checkingOnboarding) {
      const checkOnboarding = async () => {
        setCheckingOnboarding(true);
        const completed = storageService.isOnboardingCompleted(user.uid);
        console.log('Onboarding check for user:', user.uid, 'Completed:', completed);
        // Only show onboarding for new users who haven't completed it
        if (!completed) {
          console.log('Showing onboarding flow for new user');
          setShowOnboarding(true);
        } else {
          // For existing users, automatically start chat
          console.log('User has completed onboarding, starting chat directly');
          await handleStartChat();
        }
        setCheckingOnboarding(false);
      };
      checkOnboarding();
    }
  }, [user, showOnboarding, checkingOnboarding]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    if (user) {
      console.log('Onboarding completed for user:', user.uid);
      storageService.saveOnboardingCompleted(user.uid);
      setShowOnboarding(false);
      setCheckingOnboarding(false); // Prevent re-checking
      
      // Automatically start a chat session and go to chat interface
      await handleStartChat();
    }
  };

  // Reset onboarding for testing
  const handleResetOnboarding = () => {
    if (user) {
      console.log('Resetting onboarding for user:', user.uid);
      localStorage.removeItem(`${user.uid}_onboarding_completed`);
      setShowOnboarding(true);
      setCheckingOnboarding(false); // Prevent re-checking
    }
  };

  // Load existing chat sessions only when needed
  const loadSessions = async () => {
    if (!user) return;
    
    setLoadingSessions(true);
    setError(null);
    
    try {
      const userSessions = await storageService.getChatSessions(user.uid);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load chat sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Create a new chat session when user wants to chat
  const handleStartChat = async () => {
    if (!user) return;
    
    setError(null);
    
    try {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        userId: user.uid,
        messages: [
          {
            id: 1,
            text: "Hello! I'm Rakshith AI, your virtual medical assistant. I'll help you assess your symptoms and provide appropriate guidance. What symptoms are you experiencing?",
            sender: "ai",
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await storageService.saveChatSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setShowChat(true);
    } catch (error) {
      console.error('Error creating chat session:', error);
      setError('Failed to create chat session');
    }
  };

  // Handle session updates
  const handleUpdateSession = async (updatedSession: ChatSession) => {
    try {
      await storageService.saveChatSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowChat(true);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      await storageService.deleteChatSession(sessionId, user.uid);
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(remainingSessions);
      
      // If the deleted session was the current one, switch to the most recent remaining session
      if (currentSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setShowChat(false);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Show loading while checking authentication
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show chat interface if user wants to chat
  if (showChat && currentSessionId) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300 overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
        `}>
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            sessions={sessions}
            onNewChat={handleStartChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            currentSessionId={currentSessionId}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Header */}
          <header className="flex-shrink-0 bg-black border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <img src={rakshithShield} alt="Rakshith Shield" style={{ height: '2rem', width: '2rem', marginRight: '0.5rem' }} />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3ECFFF] via-[#7C3AED] to-[#FF4F9A] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(80,120,255,0.18)] whitespace-nowrap">
                RAKSHITH 360
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Error Message */}
          {error && (
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <ChatArea
              sessionId={currentSessionId}
              onUpdateSession={handleUpdateSession}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show minimal menu only if there's an error or no chat session
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Welcome to Rakshith 360</h1>
        <p className="mb-2">User: {user.email}</p>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={handleStartChat}
            disabled={loadingSessions}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loadingSessions ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            {loadingSessions ? 'Loading...' : 'Start Medical Chat'}
          </Button>
          
          <Button
            onClick={logout}
            variant="outline"
            className="w-full max-w-xs text-white border-white hover:bg-white hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
