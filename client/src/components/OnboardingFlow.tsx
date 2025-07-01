import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Shield, Clock } from "lucide-react";
import rakshithLogo from '../assets/rakshith360-logo.png'; // Adjust the path as needed

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Your original 3-page content
  const steps = [
    {
      title: "Welcome to Rakshith AI",
      subtitle: "Your intelligent medical assistant",
      content: "Get instant medical guidance, symptom assessment, and professional healthcare recommendations 24/7.",
      icon: <Sparkles className="w-16 h-16 text-white" />,
      gradient: "from-blue-600 via-purple-600 to-pink-600"
    },
    {
      title: "Secure & Confidential", 
      subtitle: "Your privacy is our priority",
      content: "All your medical conversations are encrypted and kept completely confidential. We follow strict medical privacy standards.",
      icon: <Shield className="w-16 h-16 text-white" />,
      gradient: "from-green-500 via-teal-500 to-blue-500"
    },
    {
      title: "24/7 Availability",
      subtitle: "Always here when you need us", 
      content: "Access medical guidance anytime, anywhere. Get immediate responses for your health concerns, day or night.",
      icon: <Clock className="w-16 h-16 text-white" />,
      gradient: "from-orange-500 via-red-500 to-pink-500"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-float animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Logo image with drop shadow, no background, larger size */}
        <img
          src={rakshithLogo}
          alt="Rakshith 360 Logo"
          className="mx-auto mb-6 sm:mb-8 shadow-2xl"
          style={{ width: '140px', height: '140px', objectFit: 'contain', background: 'transparent' }}
        />
        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-3 rounded-full transition-all duration-500 ${
                  index === currentStep 
                    ? 'bg-blue-600 dark:bg-blue-400 w-8' 
                    : index < currentStep 
                      ? 'bg-blue-400 dark:bg-blue-500 w-3'
                      : 'bg-gray-300 dark:bg-gray-600 w-3'
                }`}
              />
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="mb-8 space-y-4 w-full px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white text-center leading-tight">
            {currentStepData.title}
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-200 text-center">
            {currentStepData.subtitle}
          </p>
          <p className="text-base sm:text-lg text-blue-900 dark:text-blue-100 text-center">
            {currentStepData.content}
          </p>
        </div>
        {/* Next button */}
        <button
          className={`w-full max-w-xs py-3 rounded-xl bg-gradient-to-r ${currentStepData.gradient} text-white font-bold text-lg shadow-lg hover:scale-105 transition-all mb-2`}
          onClick={handleNext}
        >
          Next &nbsp; &rarr;
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
