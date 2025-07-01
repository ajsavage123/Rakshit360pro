export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private apiKeys: string[] = [];
  private currentIndex: number = 0;

  private readonly defaultKeys = [
    'AIzaSyCvDat-bQkyMj4P-p-YfqifCYtYMcUB0pQ',
    'AIzaSyDiIz20C0geTawJL01kedSWOvnjRZ0D-MU', 
    'AIzaSyCkDKiQD_GMPr7WCk4Ozcurk9LSUYM9K98',
    'AIzaSyCwUuD2PJxLI3Al2uNK_tbK6KlsygmxXdA'
  ];

  private constructor() {
    this.loadKeys();
  }

  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  private loadKeys(): void {
    // Check for environment variable first
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const storedApiKeys = localStorage.getItem('gemini_api_keys');
    const storedKeyIndex = localStorage.getItem('current_key_index');

    if (envApiKey) {
      this.apiKeys = [envApiKey];
      this.currentIndex = 0;
    } else if (storedApiKeys) {
      try {
        const parsedKeys = JSON.parse(storedApiKeys);
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
          this.apiKeys = parsedKeys;
        } else {
          this.apiKeys = this.defaultKeys;
          localStorage.setItem('gemini_api_keys', JSON.stringify(this.defaultKeys));
        }
      } catch {
        this.apiKeys = this.defaultKeys;
        localStorage.setItem('gemini_api_keys', JSON.stringify(this.defaultKeys));
      }
    } else {
      this.apiKeys = this.defaultKeys;
      localStorage.setItem('gemini_api_keys', JSON.stringify(this.defaultKeys));
    }

    // Load saved key index
    if (storedKeyIndex) {
      this.currentIndex = Math.min(parseInt(storedKeyIndex, 10) || 0, this.apiKeys.length - 1);
    }
  }

  public getCurrentKey(): string {
    return this.apiKeys[this.currentIndex] || '';
  }

  public switchToNextKey(): void {
    this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
    localStorage.setItem('current_key_index', this.currentIndex.toString());
    console.log(`Switched to API key ${this.currentIndex + 1}/${this.apiKeys.length}`);
  }

  public getAllKeys(): string[] {
    return [...this.apiKeys];
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public setKeys(keys: string[]): void {
    this.apiKeys = keys;
    this.currentIndex = 0;
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    localStorage.setItem('current_key_index', '0');
  }

  public async makeGeminiRequest(prompt: string, maxRetries?: number): Promise<string> {
    const retries = maxRetries || this.apiKeys.length * 2;

    for (let attempt = 0; attempt < retries; attempt++) {
      const currentKey = this.getCurrentKey();

      try {
        console.log(`Making request with API key ${this.currentIndex + 1}/${this.apiKeys.length}`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates?.[0]?.content) {
            return data.candidates[0].content.parts[0].text;
          }
        } else if (response.status === 429) {
          console.log(`API key ${this.currentIndex + 1} quota exceeded, switching to next key...`);
          this.switchToNextKey();
          continue;
        } else if (response.status === 401) {
          console.log(`API key ${this.currentIndex + 1} authentication failed, switching to next key...`);
          this.switchToNextKey();
          continue;
        }

        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        console.error(`Error with API key ${this.currentIndex + 1}:`, error);
        this.switchToNextKey();
      }
    }

    throw new Error('All API keys exhausted');
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();