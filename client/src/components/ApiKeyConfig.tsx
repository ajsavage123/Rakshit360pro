import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ApiKeyConfigProps {
  onApiKeySet: (keys: string[]) => void;
  onClose?: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onApiKeySet, onClose }) => {
  const [apiKeysText, setApiKeysText] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKeysText.trim()) {
      setError('Please enter at least one API key');
      return;
    }
    
    // Split by lines and filter out empty lines
    const keys = apiKeysText.split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0);
    
    if (keys.length === 0) {
      setError('Please enter at least one API key');
      return;
    }
    
    setError('');
    onApiKeySet(keys);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md flex flex-col gap-3">
        <h2 className="text-lg font-semibold mb-2 text-center">Enter Gemini API Keys</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Enter up to 5 API keys (one per line) for automatic fallback when quotas are exceeded:
        </p>
        <textarea
          placeholder="Paste your Gemini API keys here (one per line)&#10;AIzaSyExample1...&#10;AIzaSyExample2...&#10;AIzaSyExample3..."
          value={apiKeysText}
          onChange={e => setApiKeysText(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white resize-none"
          rows={5}
        />
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleSave}>Save</Button>
          {onClose && <Button className="flex-1" variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyConfig; 