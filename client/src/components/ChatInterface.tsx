import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService, ChatSession } from "@/lib/storage";
import rakshithShield from "@/assets/rakshith360-shield.svg";
import FlashMode from "./FlashMode";

const ChatInterface = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Load chat sessions for the user
  useEffect(() => {
    const loadUserSessions = async () => {
      if (user) {
        setLoadingSessions(true);
        const userSessions = await storageService.getChatSessions(user.uid);
        if (userSessions.length > 0) {
          setSessions(userSessions);
          setCurrentSessionId(userSessions[0].id);
        } else {
          // No sessions, create a new one automatically
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
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        }
        setLoadingSessions(false);
      }
    };
    loadUserSessions();
  }, [user]);

  // Handler to start a new chat session
  const handleNewChat = async () => {
    if (!user) return;
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
  };

  // Handler to select a chat session
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  // Handler to update a session (when messages change)
  const handleUpdateSession = async (updatedSession: ChatSession) => {
    await storageService.saveChatSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  // Handler to delete a session
  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    await storageService.deleteChatSession(sessionId, user.uid);
    const remainingSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(remainingSessions);
    
    // If the deleted session was the current one, switch to the most recent remaining session
    if (currentSessionId === sessionId) {
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

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
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          currentSessionId={currentSessionId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Fixed Header */}
        <header className="flex-shrink-0 bg-black border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-300 z-10">
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
          
          {/* User Info and Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              Welcome, {user?.displayName || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </header>

        {/* Chat Area - will handle its own scrolling */}
        <div className="flex-1 overflow-hidden">
          {loadingSessions ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading sessions...</span>
            </div>
          ) : flashMode ? (
            <FlashMode onExit={() => setFlashMode(false)} />
          ) : (
            currentSessionId && (
              <ChatArea
                key={currentSessionId}
                sessionId={currentSessionId}
                onUpdateSession={handleUpdateSession}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
