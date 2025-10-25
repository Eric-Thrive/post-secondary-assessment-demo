
import React from 'react';
import { Users, GraduationCap, BookOpen, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useModule } from '@/contexts/ModuleContext';

export const WelcomeSection = () => {
  const { activeModule, isDemoMode, isK12 } = useModule();

  const getTitle = () => {
    if (isDemoMode && isK12) {
      return 'K-12 Educational Assessment Demo';
    }
    if (isDemoMode) {
      return 'Post-Secondary Accommodation Demo';
    }
    return 'ADA Assessment Portal';
  };

  const getDescription = () => {
    if (isDemoMode && isK12) {
      return 'Experience our AI-powered educational assessment system for K-12 students';
    }
    if (isDemoMode) {
      return 'Experience our AI-powered accommodation assessment system for higher education';
    }
    return 'Student Accommodation & Support Services';
  };

  const getIcon = () => {
    if (isDemoMode && isK12) {
      return <BookOpen className="h-8 w-8 text-white" />;
    }
    if (isDemoMode) {
      return <GraduationCap className="h-8 w-8 text-white" />;
    }
    return <Users className="h-8 w-8 text-white" />;
  };

  return (
    <div className="mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
        <p className="text-sm text-gray-600">{getDescription()}</p>
      </div>
    </div>
  );
};
