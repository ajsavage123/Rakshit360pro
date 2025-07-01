// Simple storage system using localStorage
// This provides a clean, Firebase-free storage solution

export interface ChatSession {
  id: string;
  userId: string;
  messages: Array<{
    id: number;
    text?: string;
    sender: "user" | "ai";
    timestamp: Date;
    isInteractive?: boolean;
    question?: string;
    options?: Array<{ id: string; label: string; value: string }>;
    selectedOption?: string;
    showHospitals?: boolean;
    summary?: string;
    specialty?: string;
    summaryType?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  medicalHistory?: string;
  preferences?: {
    notifications: boolean;
    language: string;
  };
}

class StorageService {
  private getKey(key: string, userId?: string): string {
    return userId ? `${userId}_${key}` : key;
  }

  // Helper function to safely execute localStorage operations with timeout
  private async safeStorageOperation<T>(operation: () => T, timeoutMs: number = 3000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Storage operation timed out'));
      }, timeoutMs);

      try {
        const result = operation();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Chat Sessions
  async saveChatSession(session: ChatSession): Promise<void> {
    if (!session.userId) {
      console.error("Cannot save chat session: userId is missing.");
      return;
    }
    
    try {
      await this.safeStorageOperation(() => {
        const key = this.getKey('chat_sessions', session.userId);
        const existingSessions = this.getChatSessionsSync(session.userId);
        
        // Update or add the session
        const sessionIndex = existingSessions.findIndex(s => s.id === session.id);
        if (sessionIndex >= 0) {
          existingSessions[sessionIndex] = session;
        } else {
          existingSessions.push(session);
        }
        
        localStorage.setItem(key, JSON.stringify(existingSessions));
      });
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw new Error('Failed to save chat session');
    }
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      return await this.safeStorageOperation(() => this.getChatSessionsSync(userId));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  private getChatSessionsSync(userId: string): ChatSession[] {
    if (!userId) return [];
    
    try {
      const key = this.getKey('chat_sessions', userId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      
      const sessions = JSON.parse(data);
      // Convert string timestamps back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  async getChatSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    if (!userId || !sessionId) return null;
    
    try {
      return await this.safeStorageOperation(() => {
        const sessions = this.getChatSessionsSync(userId);
        const session = sessions.find(s => s.id === sessionId);
        return session || null;
      });
    } catch (error) {
      console.error('Error loading chat session:', error);
      return null;
    }
  }

  async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    if (!userId || !sessionId) return;
    
    try {
      await this.safeStorageOperation(() => {
        const key = this.getKey('chat_sessions', userId);
        const existingSessions = this.getChatSessionsSync(userId);
        const filteredSessions = existingSessions.filter(s => s.id !== sessionId);
        localStorage.setItem(key, JSON.stringify(filteredSessions));
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  // User Profiles
  saveUserProfile(profile: UserProfile): void {
    try {
    const key = this.getKey('user_profile', profile.id);
    localStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  getUserProfile(userId: string): UserProfile | null {
    try {
    const key = this.getKey('user_profile', userId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  // Medical History
  saveMedicalHistory(userId: string, history: string): void {
    try {
    const key = this.getKey('medical_history', userId);
    localStorage.setItem(key, history);
    } catch (error) {
      console.error('Error saving medical history:', error);
    }
  }

  getMedicalHistory(userId: string): string {
    try {
    const key = this.getKey('medical_history', userId);
    return localStorage.getItem(key) || '';
    } catch (error) {
      console.error('Error loading medical history:', error);
      return '';
    }
  }

  // App Settings
  saveSettings(userId: string, settings: any): void {
    try {
    const key = this.getKey('app_settings', userId);
    localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getSettings(userId: string): any {
    try {
    const key = this.getKey('app_settings', userId);
    const data = localStorage.getItem(key);
    if (!data) return {};
    
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  // Clear all data for a user
  clearUserData(userId: string): void {
    try {
    const keys = [
        this.getKey('chat_sessions', userId),
      this.getKey('user_profile', userId),
      this.getKey('medical_history', userId),
      this.getKey('app_settings', userId),
      this.getKey('onboarding_completed', userId)
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Onboarding state management
  saveOnboardingCompleted(userId: string): void {
    try {
      const key = this.getKey('onboarding_completed', userId);
      localStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  isOnboardingCompleted(userId: string): boolean {
    try {
      const key = this.getKey('onboarding_completed', userId);
      const completed = localStorage.getItem(key);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding state:', error);
      return false;
    }
  }
}

export const storageService = new StorageService(); 