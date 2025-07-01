import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Stethoscope, Clock, Info, AlertTriangle, UserCheck, ShieldCheck, CheckCircle, TestTube } from "lucide-react";

interface MedicalSummaryCardProps {
  summary: string;
  summaryType?: string;
}

const iconMap: Record<string, JSX.Element> = {
  "CASE SUMMARY": <Stethoscope className="w-6 h-6 text-blue-600 bg-blue-100 rounded-full p-1 shadow" />,
  "FIRST AID RECOMMENDATIONS": <Heart className="w-6 h-6 text-red-600 bg-red-100 rounded-full p-1 shadow" />,
  "URGENCY LEVEL": <AlertTriangle className="w-6 h-6 text-pink-600 bg-pink-100 rounded-full p-1 shadow" />,
  "ADDITIONAL NOTES": <Info className="w-6 h-6 text-yellow-600 bg-yellow-100 rounded-full p-1 shadow" />,
  "FULL_SUMMARY": <ShieldCheck className="w-6 h-6 text-emerald-600 bg-emerald-100 rounded-full p-1 shadow" />,
};

const titleMap: Record<string, string> = {
  "CASE SUMMARY": "Case Summary",
  "FIRST AID RECOMMENDATIONS": "First Aid Recommendations",
  "URGENCY LEVEL": "Urgency Level",
  "ADDITIONAL NOTES": "Additional Notes",
  "FULL_SUMMARY": "Full Summary",
};

const getUrgencyLevel = (summary: string) => {
  if (!summary) return null;
  const lower = summary.toLowerCase();
  if (lower.includes('high')) return 'high';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return null;
};

const getUrgencyTextColor = (level: string | null) => {
  if (level === 'high') return 'text-red-600';
  if (level === 'medium') return 'text-yellow-500';
  if (level === 'low') return 'text-green-600';
  return 'text-gray-700 dark:text-gray-300';
};

const getUrgencyIcon = (level: string | null) => {
  if (level === 'high') return <AlertTriangle className="w-6 h-6 text-red-600" />;
  if (level === 'medium') return <Info className="w-6 h-6 text-yellow-500" />;
  if (level === 'low') return <CheckCircle className="w-6 h-6 text-green-600" />;
  return <Info className="w-6 h-6 text-gray-400" />;
};

const getHeadingColorClass = (summaryType: string | undefined) => {
  switch (summaryType) {
    case 'SUMMARY OF CASE':
      return 'bg-blue-600 text-white';
    case 'URGENCY LEVEL':
      return 'bg-orange-600 text-white';
    case 'FIRST AID RECOMMENDATIONS':
      return 'bg-red-600 text-white';
    case 'ADDITIONAL INVESTIGATIONS NEEDED':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

const MedicalSummaryCard = ({ summary, summaryType }: MedicalSummaryCardProps) => {
  // Format the content with proper bullet points and spacing
  const formatContent = (text: string) => {
    // Split into lines and process each line
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return null;
      
      // Check for various list formats: bullet points, dashes, numbers, etc.
      const isListItem = 
        trimmedLine.startsWith('-') || 
        trimmedLine.startsWith('•') || 
        trimmedLine.startsWith('*') ||
        /^\d+\./.test(trimmedLine) || // Numbered lists like "1."
        /^[a-z]\)/.test(trimmedLine) || // Letter lists like "a)"
        /^[A-Z]\)/.test(trimmedLine) || // Capital letter lists like "A)"
        trimmedLine.startsWith('→') ||
        trimmedLine.startsWith('➤') ||
        trimmedLine.startsWith('▶');
      
      if (isListItem) {
        // Remove the original bullet/number and add our own bullet
        const cleanText = trimmedLine.replace(/^[-•*→➤▶]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[a-zA-Z]\)\s*/, '');
        return (
          <div key={index} className="flex items-start space-x-3 ml-2 mb-3">
            <span className="text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
              {cleanText}
            </p>
          </div>
        );
      }
      
      // For First Aid and Investigations, if the text contains multiple sentences that should be separate points
      if ((summaryType === 'FIRST AID RECOMMENDATIONS' || summaryType === 'ADDITIONAL INVESTIGATIONS NEEDED') && 
          trimmedLine.includes('.') && trimmedLine.length > 50) {
        // Split by periods and treat each sentence as a separate point
        const sentences = trimmedLine.split(/\.\s+/).filter(s => s.trim().length > 0);
        return sentences.map((sentence, sentenceIndex) => (
          <div key={`${index}-${sentenceIndex}`} className="flex items-start space-x-3 ml-2 mb-3">
            <span className="text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
              {sentence.trim()}{sentenceIndex < sentences.length - 1 ? '.' : ''}
            </p>
          </div>
        ));
      }
      
      // Regular text line
      return (
        <p key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          {trimmedLine}
        </p>
      );
    }).filter(Boolean).flat(); // Flatten the array in case we return arrays for sentences
  };

  // Only highlight the Urgency Level text and icon
  let titleContent = null;
  if (summaryType === 'URGENCY LEVEL') {
    const level = getUrgencyLevel(summary);
    titleContent = (
      <span className={`flex items-center justify-center gap-2 font-semibold text-base ${getUrgencyTextColor(level)} w-full text-center`}>
        {getUrgencyIcon(level)}
        Urgency Level{level ? ` - ${level.charAt(0).toUpperCase() + level.slice(1)}` : ''}
      </span>
    );
  } else if (summaryType === 'FIRST AID RECOMMENDATIONS') {
    titleContent = (
      <span className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-sm shadow-sm ${getHeadingColorClass(summaryType)} w-full text-center`}>
        <Heart className="w-4 h-4 text-white" />
        First Aid Recommendations
      </span>
    );
  } else {
    titleContent = (
      <div className="flex items-center justify-center w-full">
        <span className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-sm shadow-sm ${getHeadingColorClass(summaryType)} text-center`}>
          {summaryType === 'ADDITIONAL INVESTIGATIONS NEEDED' ? <TestTube className="w-4 h-4 mr-1" /> : iconMap[summaryType || "FULL_SUMMARY"]}
          {summaryType === 'ADDITIONAL INVESTIGATIONS NEEDED' ? 'INVESTIGATIONS' : (titleMap[summaryType || "FULL_SUMMARY"] || summaryType)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[99vw] sm:max-w-3xl mx-auto">
      <Card className={'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-lg rounded-xl mb-3 sm:mb-4 medical-summary-card overflow-hidden mx-2 sm:mx-4'}>
        <CardHeader className="pb-3 sm:pb-4 flex items-center justify-center gap-2 px-3 sm:px-6 lg:px-10">
          <CardTitle className="flex items-center justify-center gap-2 sm:gap-3 w-full">
            {titleContent}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 lg:px-10 pb-6 sm:pb-8">
          <div className="space-y-3 sm:space-y-4">
            {formatContent(summary)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalSummaryCard; 