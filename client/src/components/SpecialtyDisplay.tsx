import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Brain, 
  Bone, 
  AlertTriangle, 
  Baby, 
  Eye, 
  Stethoscope,
  Pill,
  Activity,
  Droplets,
  Microscope,
  User,
  Ear,
  Circle,
  Zap,
  Shield
} from "lucide-react";

interface SpecialtyDisplayProps {
  specialties: string[];
}

const SpecialtyDisplay = ({ specialties }: SpecialtyDisplayProps) => {
  const specialtyConfig = {
    'cardiology': {
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Specializes in heart and cardiovascular system conditions including heart disease, arrhythmias, and blood pressure issues.'
    },
    'neurology': {
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Focuses on disorders of the nervous system including brain, spinal cord, and nerve conditions.'
    },
    'orthopedics': {
      icon: Bone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Specializes in musculoskeletal system including bones, joints, muscles, ligaments, and tendons.'
    },
    'emergency medicine': {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Provides immediate care for acute illnesses and injuries requiring urgent medical attention.'
    },
    'pediatrics': {
      icon: Baby,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      description: 'Specializes in medical care for infants, children, and adolescents up to 18 years of age.'
    },
    'dermatology': {
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Focuses on skin, hair, and nail conditions including rashes, infections, and skin cancer.'
    },
    'psychiatry': {
      icon: User,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Specializes in mental health conditions including depression, anxiety, and behavioral disorders.'
    },
    'gastroenterology': {
      icon: Stethoscope,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      description: 'Focuses on digestive system disorders including stomach, intestines, liver, and pancreas conditions.'
    },
    'pulmonology': {
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      description: 'Specializes in respiratory system conditions including lungs, breathing disorders, and chest conditions.'
    },
    'endocrinology': {
      icon: Pill,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Focuses on hormone-related conditions including diabetes, thyroid disorders, and metabolic issues.'
    },
    'urology': {
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Specializes in urinary system and male reproductive system conditions.'
    },
    'nephrology': {
      icon: Microscope,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Focuses on kidney diseases and conditions affecting kidney function.'
    },
    'oncology': {
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Specializes in the diagnosis and treatment of cancer and related conditions.'
    },
    'hematology': {
      icon: Droplets,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Focuses on blood disorders including anemia, clotting problems, and blood cancers.'
    },
    'rheumatology': {
      icon: Bone,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Specializes in autoimmune and inflammatory conditions affecting joints and connective tissues.'
    },
    'ophthalmology': {
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Focuses on eye and vision disorders including eye diseases and surgical procedures.'
    },
    'otolaryngology': {
      icon: Ear,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Specializes in ear, nose, and throat conditions including hearing and balance disorders.'
    },
    'gynecology': {
      icon: Circle,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      description: 'Focuses on women\'s reproductive health including pregnancy, childbirth, and gynecological conditions.'
    },
    'general medicine': {
      icon: Stethoscope,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: 'Provides comprehensive primary care for adults including diagnosis, treatment, and preventive care.'
    }
  };

  const getSpecialtyConfig = (specialty: string) => {
    return specialtyConfig[specialty.toLowerCase()] || specialtyConfig['general medicine'];
  };

  return (
    <div className="max-w-[70vw] sm:max-w-sm lg:max-w-sm w-full">
      <Card className="border border-gray-200 dark:border-gray-700 shadow-md rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-blue-500" />
            Recommended Specialties
          </h3>
          
          <div className="space-y-3">
            {specialties.map((specialty, index) => {
              const config = getSpecialtyConfig(specialty);
              const IconComponent = config.icon;
              
              return (
                <div key={index} className={`flex items-center p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                  <IconComponent className={`w-5 h-5 mr-3 ${config.color}`} />
                  <span className={`font-medium ${config.color} capitalize`}>
                    {specialty.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {specialties.length === 1 
                ? getSpecialtyConfig(specialties[0]).description
                : `These specialties are recommended based on your symptoms. ${specialties.map(s => getSpecialtyConfig(s).description.split('.')[0]).join('. ')}.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecialtyDisplay; 