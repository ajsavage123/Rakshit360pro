import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InteractiveOption {
  id: string;
  label: string;
  value: string;
}

interface InteractiveMessageProps {
  question: string;
  options?: InteractiveOption[];
  onOptionSelect?: (option: InteractiveOption) => void;
  selectedOption?: string;
  allowCustomAnswer?: boolean;
  onCustomAnswer?: (answer: string) => void;
  onFocusMainInput?: () => void;
}

const InteractiveMessage = ({ 
  question, 
  options = [], 
  onOptionSelect, 
  selectedOption, 
  allowCustomAnswer = false, 
  onCustomAnswer,
  onFocusMainInput
}: InteractiveMessageProps) => {
  const [showInput, setShowInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = () => {
    if (customValue.trim() && onCustomAnswer) {
      onCustomAnswer(customValue.trim());
      setCustomValue("");
      setShowInput(false);
    }
  };

  const handleTypeOwnClick = () => {
    if (onFocusMainInput) {
      onFocusMainInput();
    } else {
      setShowInput(true);
    }
  };

  return (
    <div className="max-w-[70vw] sm:max-w-sm lg:max-w-sm w-full">
      <div className="space-y-6 px-6 py-4">
        <p className="text-sm font-medium text-white">
          {question}
        </p>
        {options.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {options.slice(0, 4).map((option) => (
              <Button
                key={option.id}
                variant={selectedOption === option.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => onOptionSelect && onOptionSelect(option)}
                disabled={!!selectedOption}
                className={`w-full text-left transition-all duration-200 text-xs font-medium py-1 min-h-[32px] whitespace-normal break-words
                  ${selectedOption === option.value 
                    ? 'bg-white/20 text-white hover:bg-white/30 border-white/30 shadow-md' 
                    : 'border-white/40 hover:bg-white/10 text-white/90 hover:text-white bg-transparent hover:border-white/60'
                  }
                `}
              >
                <span className="whitespace-normal break-words block text-xs">
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        )}
        {allowCustomAnswer && !selectedOption && options.length > 0 && (
          <div className="mt-4">
            {!showInput ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-gray-200 border-white/40 hover:bg-white/10"
                onClick={handleTypeOwnClick}
              >
                Type your own answer
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  className="flex-1 rounded-md px-3 py-2 text-xs sm:text-sm bg-gray-900 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your answer..."
                  onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }}
                />
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs sm:text-sm"
                >
                  Send
                </Button>
              </div>
            )}
          </div>
        )}
        {options.length === 0 && !selectedOption && (
          <div className="mt-2">
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input
                type="text"
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                className="flex-1 rounded-md px-3 py-2 text-xs sm:text-sm bg-gray-900 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your answer..."
                onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }}
              />
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs sm:text-sm"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMessage;
