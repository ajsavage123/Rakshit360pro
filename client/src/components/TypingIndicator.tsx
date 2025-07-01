
const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 p-3">
      <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 italic">AI is typing...</span>
    </div>
  );
};

export default TypingIndicator;
