import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  History, 
  User, 
  Settings, 
  HelpCircle, 
  Info,
  X,
  Trash2
} from "lucide-react";
import { ChatSession } from "@/lib/storage";

interface SidebarProps {
  onClose: () => void;
  sessions: ChatSession[];
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

// Utility to detect mobile (screen width <= 640px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const Sidebar = ({ onClose, sessions, onNewChat, onSelectSession, onDeleteSession, currentSessionId }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState("new-chat");
  const [deleteModalSessionId, setDeleteModalSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();

  const menuItems = [
    { id: "new-chat", label: "New Chat", icon: MessageSquarePlus },
    { id: "history", label: "Chat History", icon: History },
    { id: "account", label: "Account", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help", icon: HelpCircle },
    { id: "about", label: "About", icon: Info },
  ];

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent triggering the select session
    if (confirm("Are you sure you want to delete this chat?")) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <div className="h-full w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Rakshith AI</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-900"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveItem("new-chat");
            onNewChat();
          }}
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2">
        {/* Chat History */}
        <div className="mb-4">
          <div className="flex items-center mb-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">
            <History className="w-4 h-4 mr-2" /> Chat History
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {sessions.length === 0 && (
              <div className="text-gray-500 text-xs px-2 py-1">No previous chats</div>
            )}
            {sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center group"
              >
                <button
                  onClick={() => {
                    setActiveItem("history");
                    onSelectSession(session.id);
                  }}
                  className={`flex-1 text-left px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-900 text-white ${currentSessionId === session.id ? 'bg-gray-800 dark:bg-gray-900 font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm">
                      {(() => {
                        // Find the first user message (symptoms input)
                        const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
                        if (firstUserMessage?.text) {
                          return firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '');
                        }
                        // Fallback to first message if no user message found
                        return session.messages[0]?.text?.slice(0, 30) + (session.messages[0]?.text?.length > 30 ? '...' : '') || 'Chat';
                      })()}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {session.createdAt instanceof Date ? session.createdAt.toLocaleDateString() : new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                {/* Mobile: show trash icon button */}
                {isMobile && (
                  <button
                    onClick={() => setDeleteModalSessionId(session.id)}
                    className="ml-2 p-1 text-white hover:text-red-600 focus:outline-none"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
                {/* Desktop: context menu for delete */}
                {!isMobile && (
                <div
                  onContextMenu={e => {
                    e.preventDefault();
                    setDeleteModalSessionId(session.id);
                  }}
                  style={{ width: '100%' }}
                />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Other Menu Items */}
        {menuItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveItem(item.id);
              if (item.id === 'settings') setShowSettings(true);
            }}
            className={`
              w-full flex items-center px-3 py-2 mb-1 rounded-lg
              transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-900
              ${activeItem === item.id ? 'bg-gray-800 dark:bg-gray-900' : ''}
              text-white
            `}
          >
            <item.icon className="w-4 h-4 mr-3" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 dark:border-gray-800">
        <div className="text-xs text-gray-400">
          Rakshith AI v1.0
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Delete Chat</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete this chat?</p>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setDeleteModalSessionId(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</Button>
              <Button onClick={() => { onDeleteSession(deleteModalSessionId); setDeleteModalSessionId(null); }} className="bg-red-600 text-white">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200">Dark Mode</span>
                <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" disabled />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200">Notification Preferences</span>
                <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" disabled />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200">Language</span>
                <select className="rounded border-gray-300 dark:bg-gray-800 dark:text-gray-100" disabled>
                  <option>English</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowSettings(false)} className="bg-blue-600 text-white">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
