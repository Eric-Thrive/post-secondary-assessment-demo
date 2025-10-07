import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileText, Calendar, CheckCircle, BookOpen, Clock, Users, Volume2, PenTool, Info, Lock, GraduationCap, Brain, MessageSquare, Headphones, UserPlus, Phone, ChevronRight, ChevronDown, ChevronLeft, Edit, Home, Edit2, Save, X } from "lucide-react";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import { unsplashImages, navigationIcons } from '@/utils/unsplashImages';
import { 
  parsePostSecondaryReportSections,
  parseAccommodationSubsections,
  parseFunctionalImpactBarriers,
  parseAccommodations,
  stripMarkdownFormatting
} from '@/utils/postSecondaryReportParser';
import { DocumentFile } from '@/types/assessment';
import { AssessmentCase } from '@/types/assessmentCase';
// Import Figma icon assets
import StudentInfoIcon from '@assets/icon7.4_1754492758374.png'; // Updated Student Info icon
import DocumentReviewIcon from '@assets/icon6.4_1754492792573.png'; // Updated Document Review icon
import DocumentReviewHeaderIcon from '@assets/icon6.6_1754497844296.png'; // Document Review header icon
import FunctionalImpactIcon from '@assets/icon4.4_1754492982304.png'; // Updated Functional Impact icon
import FunctionalImpactHeaderIcon from '@assets/icon4.2_1754532094463.png'; // Functional Impact header icon
import AccommodationsIcon from '@assets/icon2.4_1754493001138.png'; // Updated Accommodations icon
import AccommodationsHeaderIcon from '@assets/icon2.6_1755100497953.png'; // Heart-shaped people icon for Accommodations header
import StudentHeaderIcon from '@assets/icon7.7_1755100209288.png'; // Student Information header icon
import ThriveLogo from '@assets/isotype Y-NB_1754494460165.png'; // THRIVE logo
import BarrierIllustration from '@assets/image_1754498028324.png'; // Barrier illustration
import CompletionBackground from '@assets/ChatGPT Image Aug 6, 2025, 03_51_54 PM_1754509933318.png'; // Completion background

interface FigmaEnhancedReportViewerProps {
  currentCase: AssessmentCase | null;
  markdownReport: string | null;
  hasAnalysisResult: boolean;
  children?: React.ReactNode;
  initialViewMode?: 'standard' | 'figma';
  autoload?: boolean;
}

const FigmaEnhancedReportViewer: React.FC<FigmaEnhancedReportViewerProps> = ({
  currentCase,
  markdownReport,
  hasAnalysisResult,
  children,
  initialViewMode,
  autoload
}) => {

  // Always use enhanced view - removed standard view option
  const { toast } = useToast();
  
  // Navigation function to Review & Edit section
  const handleEditClick = (sectionId: string) => {
    console.log('🔄 Navigating to Review & Edit section for:', sectionId, 'Case ID:', currentCase?.id);
    // Navigate to the Review & Edit page with the current case ID as a parameter
    // Using window.location for now as this needs to work with query params
    if (currentCase?.id) {
      window.location.href = `/post-secondary-review-edit?caseId=${currentCase.id}`;
    } else {
      window.location.href = '/post-secondary-review-edit';
    }
  };
  


  // Enhanced view styling (hardcoded without Figma dependency)
  const getEnhancedStyles = () => {
    return {
      backgroundColor: '#ffffff',
      fontFamily: '"Inter", sans-serif',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e5e7eb'
    };
  };

  const FigmaStyledReport = () => {
    const [currentView, setCurrentView] = useState("student-information");
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [expandedAccommodation, setExpandedAccommodation] = useState<string | null>(null);
    const [expandedAccommodationItems, setExpandedAccommodationItems] = useState<Set<number>>(new Set());
    const [showAccommodationsDropdown, setShowAccommodationsDropdown] = useState(false);
    const [currentAccommodationSlide, setCurrentAccommodationSlide] = useState(0);
    const [expandedAccommodationIndex, setExpandedAccommodationIndex] = useState<number | null>(null);

    // Parse markdown into structured sections using centralized parser
    const sections = useMemo(() => {
      return parsePostSecondaryReportSections(markdownReport || '');
    }, [markdownReport]);

    // Map sections to views
    const getSectionForView = (view: string) => {
      console.log('🔍 getSectionForView called for:', view);
      console.log('📋 Available sections:', sections.map(s => ({ title: s.title, index: s.index })));
      
      let section = null;
      switch (view) {
        case "document-review":
          // Document Review is now part of Student Information section (index 1)
          section = sections.find(s => s.title.toLowerCase().includes("document") || s.title.toLowerCase().includes("student") || s.index === 1);
          break;
        case "functional-impact":
          // Find Functional Impact section by title first, then fallback to index
          section = sections.find(s => 
            (s.title.toLowerCase().includes("functional") && s.title.toLowerCase().includes("impact")) ||
            s.title.toLowerCase().includes("functional impact") ||
            s.title.toLowerCase().includes("barrier")
          ) || sections.find(s => s.index === 2);
          break;
        case "accommodations":
          // Find Accommodations section by title first, then fallback to index
          section = sections.find(s => 
            s.title.toLowerCase().includes("accommodation") ||
            (s.title.toLowerCase().includes("support") && s.title.toLowerCase().includes("plan"))
          ) || sections.find(s => s.index === 3);
          break;
        case "report-complete":
          section = sections[sections.length - 1];
          break;
        default:
          section = null;
      }
      
      console.log('📄 Found section for', view, ':', section ? { title: section.title, contentLength: section.content.length } : 'null');
      return section;
    };

    // Get accommodations subsections using centralized parser
    const getAccommodationSubsections = () => {
      const accommodationSection = getSectionForView("accommodations");
      if (!accommodationSection) return [];
      
      // Use the centralized parser for accommodation subsections
      return parseAccommodationSubsections(accommodationSection.content);
    };

    // THRIVE Sunwashed Color Palette - Official Brand Colors
    const brandColors = {
      // Primary brand colors
      navyBlue: '#1297D2',     // Navy Blue (C:77% M:27% Y:1% K:0%) - Primary
      skyBlue: '#96D7E1',      // Sky Blue (C:39% M:0% Y:1% K:0%) - Secondary
      orange: '#F89E54',       // Orange (C:0% M:45% Y:74% K:0%) - Accent
      yellow: '#F5E6A3',       // Less saturated yellow for better readability
      
      // Semantic mappings for UI consistency
      primary: '#1297D2',      // Navy Blue for primary actions
      lightBlue: '#96D7E1',    // Sky Blue for secondary elements
      
      // Neutral colors for UI (keeping existing for compatibility)
      white: '#ffffff',
      gray50: '#f3f3f5',
      gray600: '#717182'
    };

    return (
      <div className="min-h-screen w-full relative" 
           style={{ 
             fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
             margin: 0,
             padding: 0
           }}>
        {/* Full-screen background overlay */}
        <div className="fixed inset-0 z-0" 
             style={{
               background: currentView === "student-information" 
                 ? `linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))`
                 : currentView === "document-review" 
                   ? `linear-gradient(to right, rgba(248, 158, 84, 0.2), rgba(248, 158, 84, 0.3), rgba(248, 158, 84, 0.1))`
                   : currentView === "functional-impact"
                     ? `linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))`
                     : currentView === "accommodations"
                       ? `linear-gradient(to right, rgba(248, 158, 84, 0.2), rgba(248, 158, 84, 0.3), rgba(248, 158, 84, 0.1))`
                       : currentView === "report-complete"
                         ? '#FEF9F0'
                         : `linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))`
             }} />
        {/* Content layer */}
        <div className="relative z-10">
        {/* Header - Content Area Extended to Right Edge */}
        <div className="fixed top-0 left-80 right-0 z-50">
          <header className="text-white py-3 shadow-2xl" 
                  style={{ background: `linear-gradient(to right, ${brandColors.primary}, ${brandColors.lightBlue})` }}>
            <div className="flex items-center px-6">
              <Link to="/">
                <button 
                  className="hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded"
                  title="Go Home"
              >
                <img 
                  src={ThriveLogo}
                  alt="THRIVE Logo - Go Home"
                  className="h-10 w-10 object-contain"
                />
              </button>
              </Link>
              <div className="ml-3">
                <h1 className="text-2xl font-bold" 
                    style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>Accommodation Report</h1>
              </div>
            </div>
          </header>
        </div>
        {/* Container for Sidebar and Content */}
        <div className="flex pt-0">
          {/* Left Navigation Sidebar */}
          <aside className="fixed left-0 top-0 h-screen w-80 bg-white shadow-xl z-40 overflow-y-auto" 
                 style={{ borderRight: `2px solid ${brandColors.lightBlue}` }}>
            <div className="pt-20 px-6 pb-6">
            <nav className="space-y-2">
              {/* Student Information */}
              <button
                onClick={() => {
                  setCurrentView("student-information");
                  setShowAccommodationsDropdown(false);
                }}
                className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={currentView === "student-information" ? {
                  backgroundColor: brandColors.yellow,
                  borderColor: brandColors.orange,
                  color: '#000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon without background circle */}
                  <img 
                    src={StudentInfoIcon}
                    alt="Student Information"
                    className="h-5 w-5"
                    style={{ 
                      filter: 'none'
                    }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Student Information
                  </div>
                </div>
              </button>

              {/* Document Review */}
              <button
                onClick={() => setCurrentView("document-review")}
                className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={currentView === "document-review" ? {
                  backgroundColor: brandColors.yellow,
                  borderColor: brandColors.orange,
                  color: '#000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={DocumentReviewIcon}
                    alt="Document Review"
                    className="h-5 w-5"
                    style={{ 
                      filter: 'none'
                    }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Documents Reviewed
                  </div>
                </div>
              </button>

              {/* Functional Impact */}
              <button
                onClick={() => {
                  setCurrentView("functional-impact");
                  setCurrentSlide(0);
                  setExpandedIndex(null);
                }}
                className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={currentView === "functional-impact" ? {
                  backgroundColor: brandColors.yellow,
                  borderColor: brandColors.orange,
                  color: '#000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={FunctionalImpactIcon}
                    alt="Functional Impact"
                    className="h-5 w-5"
                    style={{ 
                      filter: 'none'
                    }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Functional Impact
                  </div>
                </div>
              </button>

              {/* Accommodations with Dropdown */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowAccommodationsDropdown(!showAccommodationsDropdown);
                    if (!showAccommodationsDropdown) {
                      setCurrentView("accommodations");
                      setExpandedAccommodation("3.1"); // Automatically show 3.1 when opening
                      setCurrentAccommodationSlide(0);
                      setExpandedAccommodationIndex(null);
                    }
                  }}
                  className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={currentView === "accommodations" ? {
                    backgroundColor: brandColors.yellow,
                    borderColor: brandColors.orange,
                    color: '#000000',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  } : {
                    backgroundColor: '#f3f4f6',
                    borderColor: '#d1d5db',
                    color: '#374151'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={AccommodationsIcon}
                      alt="Accommodations"
                      className="h-5 w-5"
                      style={{ 
                        filter: 'none'
                      }}
                    />
                    <div className="font-bold text-left" 
                         style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Accommodations
                    </div>
                  </div>
                </button>
                
                {/* Dropdown Subsections - Dynamically populated */}
                {showAccommodationsDropdown && (
                  <div className="ml-6 space-y-1">
                    {getAccommodationSubsections().map((subsection) => (
                      <button
                        key={subsection.id}
                        onClick={() => {
                          setCurrentView("accommodations");
                          setExpandedAccommodation(subsection.id);
                          setCurrentAccommodationSlide(0);
                          setExpandedAccommodationIndex(null);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-md transition-all ${
                          expandedAccommodation === subsection.id 
                            ? 'text-white font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={expandedAccommodation === subsection.id ? {
                          backgroundColor: brandColors.skyBlue,
                          fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                        } : {
                          fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Report Complete */}
              <button
                onClick={() => setCurrentView("report-complete")}
                className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={currentView === "report-complete" ? {
                  backgroundColor: brandColors.yellow,
                  borderColor: brandColors.orange,
                  color: '#000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle 
                    className="h-5 w-5"
                    style={{ color: currentView === "report-complete" ? '#000000' : '#6b7280' }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Report Complete
                  </div>
                </div>
              </button>

              {/* Review */}
              <button
                onClick={() => handleEditClick('review')}
                className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
                data-testid="button-review"
              >
                <div className="flex items-center gap-3">
                  <Edit2 
                    className="h-5 w-5"
                    style={{ color: '#6b7280' }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Review
                  </div>
                </div>
              </button>

              {/* Go Home */}
              <Link to="/" className="block">
                <button
                  className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#374151'
                }}
              >
                <div className="flex items-center gap-3">
                  <Home 
                    className="h-5 w-5"
                    style={{ color: '#6b7280' }}
                  />
                  <div className="font-bold text-left" 
                       style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Go Home
                  </div>
                </div>
              </button>
              </Link>
            </nav>
          </div>
        </aside>
        
        {/* Main Content Container */}
        <div className="flex-1 ml-80 pt-16 px-0">
          {/* Content Area - Direct content without padding */}
          <div className="px-0">
            {/* Student Information View */}
            {currentView === "student-information" && (
              <div className="h-[600px] relative">
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={StudentHeaderIcon}
                      alt="Student Information"
                      className="h-5 w-5"
                      style={{ 
                        filter: `brightness(0) saturate(100%) invert(17%) sepia(97%) saturate(1392%) hue-rotate(195deg) brightness(94%) contrast(88%)`
                      }}
                    />
                    <h2 className="text-xl font-bold text-gray-900" 
                        style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Student Information & Report Details
                    </h2>
                  </div>
                </div>
                
                {/* Full-Width Sky Blue Background Block - With minimal margins */}
                <div className="absolute" 
                     style={{ 
                       backgroundColor: 'rgba(150, 215, 225, 0.15)',
                       top: '0px', // Start from top to include header
                       bottom: '0px',
                       left: '2px', // Minimal left margin
                       right: '2px' // Minimal right margin
                     }}>
                </div>
                
                {/* Student Information Card - Consistent with Document Review spacing */}
                <div className="mx-6 mb-6 bg-white rounded-xl shadow-lg relative z-10" style={{ 
                    padding: '2.5rem 3rem', 
                    height: 'auto'
                  }}>
                  <div className="space-y-5">
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Unique ID:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {(currentCase as any)?.unique_id || currentCase?.display_name || 'Not specified'}
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Program/Major:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {(currentCase as any)?.program_major || (currentCase?.module_type === 'post_secondary' ? 'Post-Secondary Program' : currentCase?.module_type === 'k12' ? `Grade ${(currentCase as any)?.grade_band || 'K-12'}` : currentCase?.module_type) || 'Not specified'}
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Report Author:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {(currentCase as any)?.report_author || 'THRIVE Assessment System'}
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Date Issued:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {currentCase?.analysis_result?.analysis_date ? new Date(currentCase.analysis_result.analysis_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : currentCase?.created_date ? new Date(currentCase.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available'}
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Assessment Status:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        {currentCase?.status === 'completed' ? 'Completed' : currentCase?.status === 'processing' ? 'Processing' : currentCase?.status === 'draft' ? 'Draft' : currentCase?.status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Next Section Button - Positioned at bottom right of section */}
                <div className="absolute bottom-6 right-6 z-20">
                  <button 
                    className="text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    style={{ 
                      backgroundColor: brandColors.navyBlue,
                      fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                    }}
                    onClick={() => setCurrentView("document-review")}
                  >
                    Next Section
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Review View */}
            {currentView === "document-review" && (
              <div className="h-[600px] relative">
                {/* Header with Document Review title and icon */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={DocumentReviewHeaderIcon}
                      alt="Document Review"
                      className="h-6 w-6"
                      style={{ filter: 'brightness(0) saturate(100%) invert(67%) sepia(89%) saturate(1951%) hue-rotate(346deg) brightness(101%) contrast(96%)' }}
                    />
                    <h3 className="text-xl font-bold text-gray-900" 
                        style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Documents Reviewed
                    </h3>
                  </div>
                </div>
                
                {/* Full-Width Orange Background Block - With minimal margins */}
                <div className="absolute" 
                     style={{ 
                       backgroundColor: 'rgba(248, 158, 84, 0.15)',
                       top: '0px', // Start from top to include header
                       bottom: '0px',
                       left: '2px', // Minimal left margin
                       right: '2px' // Minimal right margin
                     }}>
                </div>
                
                {/* Document Table - Clean White Background */}
                <div className="mx-6 mb-6 bg-white rounded-lg shadow-sm relative z-10" 
                     style={{ 
                       height: 'calc(100% - 140px)'
                     }}>
                  <div className="p-4 space-y-3">
                    {(() => {
                      // Transform stored document names into DocumentFile objects
                      const documents = currentCase?.documents || 
                        (currentCase as any)?.documentNames?.map((filename: string, index: number) => ({
                          id: `doc_${index}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
                          name: filename,
                          filename: filename,
                          type: 'other', // Default type since we don't store document types
                          status: 'analyzed', // Default to analyzed since documents were processed
                          uploadDate: (currentCase as any)?.created_date || new Date().toISOString()
                        })) || 
                        (currentCase as any)?.document_names?.map((filename: string, index: number) => ({
                          id: `doc_${index}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
                          name: filename,
                          filename: filename,
                          type: 'other',
                          status: 'analyzed',
                          uploadDate: (currentCase as any)?.created_date || new Date().toISOString()
                        })) || [];
                      
                      return documents && documents.length > 0 ? (
                        documents.map((doc: DocumentFile) => {
                          
                          const isLastItem = documents.indexOf(doc) === documents.length - 1;
                          return (
                            <div key={doc.id} className={`flex items-center gap-4 py-4 ${!isLastItem ? 'border-b border-gray-200' : ''}`}>
                              <FileText className="h-6 w-6 text-gray-400 flex-shrink-0" />
                              <div className="font-medium text-gray-900 text-lg leading-relaxed flex-1">
                                {doc.name}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium">No documents uploaded</p>
                          <p className="text-sm">Documents will appear here once uploaded and processed</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Navigation Bar - Only Finished Button on Right */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20">
                  <div></div>
                  <button 
                    className="text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    style={{ 
                      backgroundColor: brandColors.navyBlue,
                      fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                    }}
                    onClick={() => setCurrentView("functional-impact")}
                  >
                    Finished
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Functional Impact View */}
            {currentView === "functional-impact" && (
              <div className="h-[600px] relative">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={FunctionalImpactHeaderIcon}
                        alt="Functional Impact"
                        className="h-6 w-6"
                        style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(176deg) brightness(94%) contrast(91%)' }}
                      />
                      <h3 className="text-xl font-bold text-gray-900" 
                          style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        2. Functional Impact Summary
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🖊️ Edit button clicked for functional-impact - navigating to Review & Edit');
                        handleEditClick('functional-impact');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-30 relative cursor-pointer"
                      title="Edit this section"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Full-Width Sky Blue Background Block - With minimal margins */}
                <div className="absolute" 
                     style={{ 
                       backgroundColor: 'rgba(150, 215, 225, 0.15)',
                       top: '0px', // Start from top to include header
                       bottom: '0px',
                       left: '2px', // Minimal left margin
                       right: '2px' // Minimal right margin
                     }}>
                </div>
                
                {/* White Content Card */}
                <div className="mx-6 mb-6 bg-white rounded-lg shadow-sm relative z-10" 
                     style={{ 
                       height: 'calc(100% - 140px)'
                     }}>
                  <div className="p-6" style={{ height: '100%', overflowY: 'auto' }}>
                  {(() => {
                    const section = getSectionForView("functional-impact");
                    
                    if (!section) return <div className="text-gray-500">No functional impact section found</div>;
                    
                    // Always show the original content - no editing in this view
                    const contentToDisplay = section.content;
                    
                    // Use the centralized parser to extract barriers from any supported format
                    const parsedBarriers = parseFunctionalImpactBarriers(contentToDisplay);
                    
                    if (parsedBarriers.length === 0) {
                      // Show content as plain text if no barriers can be parsed
                      return (
                        <div className="prose max-w-none p-6">
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {contentToDisplay}
                          </div>
                        </div>
                      );
                    }
                    
                    // Transform parsed barriers for UI display with appropriate icons
                    const barriers = parsedBarriers.map(b => {
                      let icon = BookOpen;
                      const content = (b.description || b.title || '').toLowerCase();
                      
                      // Determine icon based on content
                      if (content.includes('read') || content.includes('note') || content.includes('understand')) {
                        icon = BookOpen;
                      } else if (content.includes('test') || content.includes('exam') || content.includes('time')) {
                        icon = Clock;
                      } else if (content.includes('focus') || content.includes('attention') || content.includes('remember')) {
                        icon = Brain;
                      } else if (content.includes('write') || content.includes('written') || content.includes('express')) {
                        icon = PenTool;
                      }
                      
                      return {
                        ...b,
                        title: stripMarkdownFormatting(b.description || b.title || `Barrier ${b.number}`), // Use description as title, strip markdown
                        icon
                      };
                    });

                    
                    // Always use 3 barriers per page for consistent pagination
                    const barriersPerSlide = 3;
                    const totalSlides = Math.ceil(barriers.length / barriersPerSlide);
                    const currentBarriers = barriers.slice(
                      currentSlide * barriersPerSlide,
                      (currentSlide + 1) * barriersPerSlide
                    );
                    const allCollapsed = expandedIndex === null;
                    
                    return (
                      <div className="relative">
                        {/* First slide layout with image and side-by-side cards */}
                        {currentSlide === 0 ? (
                          <div className="h-full">
                            {/* Layout with image and cards - Fill available space */}
                            <div className="flex gap-8 items-start h-full justify-center">
                              {/* Illustration on the left - aligned to top, hidden when any card is expanded */}
                              {allCollapsed && (
                                <div className="flex-shrink-0">
                                  <div className="bg-yellow-50 rounded-lg p-8" style={{ backgroundColor: '#FFF9E6' }}>
                                    <img 
                                      src={BarrierIllustration}
                                      alt="Student overcoming barriers"
                                      className="h-48 w-auto"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {/* Cards container - changes layout based on expansion */}
                              <div className={`${allCollapsed ? 'flex-1' : 'w-full'} h-full flex flex-col`}>
                                <div className={`${allCollapsed ? 'space-y-6' : 'space-y-4'}`}>
                                  {currentBarriers.map((barrier, slideIndex) => {
                                    const globalIndex = currentSlide * barriersPerSlide + slideIndex;
                                    const isExpanded = expandedIndex === globalIndex;
                                    const Icon = barrier.icon;
                                    
                                    return (
                                      <Collapsible 
                                        key={globalIndex} 
                                        open={isExpanded}
                                        onOpenChange={(open) => setExpandedIndex(open ? globalIndex : null)}
                                      >
                                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                          <CollapsibleTrigger className="w-full">
                                            <div className={`flex items-center justify-between ${allCollapsed ? 'p-5' : 'p-4'} hover:bg-gray-50 transition-colors cursor-pointer`}>
                                              <div className="flex items-center gap-4">
                                                <div className={`${allCollapsed ? 'w-12 h-12' : 'w-10 h-10'} flex items-center justify-center`}>
                                                  <Icon className={`${allCollapsed ? 'h-7 w-7' : 'h-6 w-6'}`} style={{ color: brandColors.navyBlue }} />
                                                </div>
                                                <div className="text-left">
                                                  <h4 className={`font-semibold text-gray-900 ${allCollapsed ? 'text-sm' : 'text-sm'}`}>
                                                    {barrier.title}
                                                  </h4>
                                                  {!isExpanded && (
                                                    <p className="text-xs text-gray-500 mt-1">Click to view evidence</p>
                                                  )}
                                                </div>
                                              </div>
                                              <ChevronDown 
                                                className={`${allCollapsed ? 'h-5 w-5' : 'h-5 w-5'} text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                              />
                                            </div>
                                          </CollapsibleTrigger>
                                          
                                          <CollapsibleContent>
                                            <div className="px-4 pb-4 border-t">
                                              <table className="w-full mt-4">
                                                <tbody>
                                                  {barrier.evidence && (
                                                    <tr>
                                                      <td className="py-2 pr-4 text-xs font-medium align-top text-[#1867c4]">
                                                        Evidence
                                                      </td>
                                                      <td className="py-2 text-xs text-gray-900">
                                                        {barrier.evidence}
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </CollapsibleContent>
                                        </div>
                                      </Collapsible>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Other slides - standard layout */
                          (<div className="h-full">
                            {/* Standard cards layout - Fill height */}
                            <div className="flex flex-col justify-center h-full">
                              <div className="space-y-6">
                                {currentBarriers.map((barrier, slideIndex) => {
                                  const globalIndex = currentSlide * barriersPerSlide + slideIndex;
                                  const isExpanded = expandedIndex === globalIndex;
                                  const Icon = barrier.icon;
                                  
                                  return (
                                    <Collapsible 
                                      key={globalIndex} 
                                      open={isExpanded}
                                      onOpenChange={(open) => setExpandedIndex(open ? globalIndex : null)}
                                    >
                                      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                        <CollapsibleTrigger className="w-full">
                                          <div className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 flex items-center justify-center">
                                                <Icon className="h-7 w-7" style={{ color: brandColors.navyBlue }} />
                                              </div>
                                              <div className="text-left">
                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                {barrier.title}
                                              </h4>
                                              {!isExpanded && (
                                                <p className="text-xs text-gray-500">Click to view evidence</p>
                                              )}
                                            </div>
                                          </div>
                                          <ChevronDown 
                                            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                          />
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <div className="px-4 pb-4 border-t">
                                          <table className="w-full mt-4">
                                            <tbody>
                                              {barrier.evidence && (
                                                <tr>
                                                  <td className="py-2 pr-4 text-sm font-medium text-gray-600 align-top">
                                                    Evidence
                                                  </td>
                                                  <td className="py-2 text-sm text-gray-900">
                                                    {barrier.evidence}
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                );
                                })}
                              </div>
                            </div>
                          </div>)
                        )}
                      </div>
                    );
                  })()}
                  </div>
                </div>
                
                {/* Bottom Navigation Bar - Page Counter and Buttons */}
                {(() => {
                  const section = getSectionForView("functional-impact");
                  if (!section) return null;
                  const barriers: any[] = [];
                  const lines = section.content.split('\n');
                  let currentBarrier: any = null;
                  
                  lines.forEach(line => {
                    const barrierMatch = line.match(/^\*\*(\d+):\s*(.+)/);
                    if (barrierMatch) {
                      if (currentBarrier) barriers.push(currentBarrier);
                      let description = barrierMatch[2].trim();
                      let evidence = '';
                      
                      // Check if evidence is included in the same line
                      const evidenceMatch = description.match(/(.+?)\s*Evidence:\s*(.+)/i);
                      if (evidenceMatch) {
                        description = evidenceMatch[1].trim();
                        evidence = evidenceMatch[2]
                          .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                          .replace(/\s*\*\(Flagged for review-demo mode\).*$/i, '')
                          .replace(/\s*\*\(Flagged for Review - Demo Mode\).*$/i, '')
                          .trim();
                      }
                      
                      // Clean up the description
                      description = description
                        .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                        .replace(/\s*\*\(Flagged for review-demo mode\).*$/i, '')
                        .replace(/\s*\*\(Flagged for Review - Demo Mode\).*$/i, '')
                        .trim();
                      
                      currentBarrier = {
                        number: barrierMatch[1],
                        description,
                        evidence
                      };
                    } else if (currentBarrier && line.trim()) {
                      const evidenceMatch = line.match(/^\s*Evidence:\s*(.+)/i);
                      if (evidenceMatch) {
                        currentBarrier.evidence = evidenceMatch[1]
                          .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                          .replace(/\s*\*\(Flagged for review-demo mode\).*$/i, '')
                          .replace(/\s*\*\(Flagged for Review - Demo Mode\).*$/i, '')
                          .trim();
                      } else if (currentBarrier.evidence && !line.startsWith('**') && !line.includes('Evidence:')) {
                        currentBarrier.evidence += ' ' + line.trim();
                      }
                    }
                  });
                  if (currentBarrier) barriers.push(currentBarrier);
                  
                  const totalSlides = Math.ceil(barriers.length / 3);

                  
                  return (
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20">
                      {/* Page Counter - Left Side */}
                      {totalSlides > 1 && (
                        <div className="text-sm text-gray-600">
                          Page {currentSlide + 1} of {totalSlides}
                        </div>
                      )}
                      {totalSlides <= 1 && <div></div>}
                      
                      {/* Navigation Buttons - Right Side */}
                      <div className="flex gap-2">
                        {currentSlide > 0 && (
                          <button 
                            onClick={() => {
                              setCurrentSlide(currentSlide - 1);
                              setExpandedIndex(null);
                            }}
                            className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                            Previous
                          </button>
                        )}
                        {currentSlide < totalSlides - 1 && (
                          <button 
                            onClick={() => {
                              setCurrentSlide(currentSlide + 1);
                              setExpandedIndex(null);
                            }}
                            className="text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                            style={{ 
                              backgroundColor: brandColors.navyBlue,
                            }}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                        {currentSlide === totalSlides - 1 && (
                          <button 
                            className="text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                            style={{ 
                              backgroundColor: brandColors.navyBlue,
                              fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onClick={() => setCurrentView("accommodations")}
                          >
                            Finished
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Accommodations View */}
            {currentView === "accommodations" && (
              <div className="h-[600px] relative">
                {/* Header */}
                <div className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={AccommodationsHeaderIcon}
                        alt="Accommodations"
                        className="h-5 w-5"
                        style={{ 
                          filter: `brightness(0) saturate(100%) invert(17%) sepia(97%) saturate(1392%) hue-rotate(195deg) brightness(94%) contrast(88%)`
                        }}
                      />
                      <h3 className="text-xl font-bold text-gray-900" 
                          style={{ fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        3. Accommodation & Support Plan
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🖊️ Edit button clicked for accommodations - navigating to Review & Edit');
                        handleEditClick('accommodations');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-30 relative cursor-pointer"
                      title="Edit this section"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Full-Width Orange Background Block - With minimal margins */}
                <div className="absolute" 
                     style={{ 
                       backgroundColor: 'rgba(248, 158, 84, 0.15)',
                       top: '0px', // Start from top to include header
                       bottom: '0px',
                       left: '2px', // Minimal left margin
                       right: '2px' // Minimal right margin
                     }}>
                </div>
                
                {/* White Content Card - Fixed height with bottom margin for buttons */}
                <div className={`mx-6 mt-2 mb-6 bg-white rounded-lg shadow-sm relative z-10 ${expandedAccommodationIndex !== null ? 'overflow-visible' : ''}`} 
                     style={{ 
                       height: expandedAccommodationIndex !== null ? 'auto' : 'calc(100% - 160px)'
                     }}>
                  <div className={`p-6 flex flex-col ${expandedAccommodationIndex !== null ? 'h-auto' : 'h-full'}`}>
                    {(() => {
                      const section = getSectionForView("accommodations");
                      if (!section) return <div className="text-gray-500">No accommodations section found</div>;
                      
                      // Debug: Log the section content
                      console.log('Accommodations section content:', section.content);
                      
                      const subsections = getAccommodationSubsections();
                      console.log('Parsed subsections:', subsections);
                      
                      // If no subsection is selected, default to 3.1
                      const currentAccommodationId = expandedAccommodation || "3.1";
                      
                      // Show the selected subsection with dropdowns
                      const selectedSubsection = subsections.find(s => s.id === currentAccommodationId);
                      if (!selectedSubsection) return <div className="text-gray-500">No accommodation details found</div>;
                      
                      // Parse individual accommodations from the subsection content using centralized parser
                      const accommodations = parseAccommodations(selectedSubsection.content);
                      
                      // Carousel settings for accommodations
                      const accommodationsPerSlide = 3;
                      const totalAccommodationSlides = Math.ceil(accommodations.length / accommodationsPerSlide);
                      const currentAccommodations = accommodations.slice(
                        currentAccommodationSlide * accommodationsPerSlide,
                        (currentAccommodationSlide + 1) * accommodationsPerSlide
                      );
                      
                      return (
                        <div className={`h-full flex flex-col ${expandedAccommodationIndex !== null ? 'overflow-visible' : ''}`}>
                          {/* Title section */}
                          <div className="mb-4 flex-shrink-0">
                            <h3 className="text-xl font-bold" 
                                style={{ 
                                  color: brandColors.navyBlue,
                                  fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                              {selectedSubsection.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              Direct academic support modifications
                            </p>
                          </div>
                          

                          
                          {/* Accommodation Dropdowns */}
                          <div className={`space-y-3 flex-1 ${expandedAccommodationIndex !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
                            {currentAccommodations.map((accommodation, slideIndex) => {
                              const globalIndex = currentAccommodationSlide * accommodationsPerSlide + slideIndex;
                              const isExpanded = expandedAccommodationIndex === globalIndex;
                              const Icon = slideIndex === 0 ? Clock : slideIndex === 1 ? Volume2 : Headphones;
                              
                              return (
                                <div key={globalIndex} className={`border rounded-lg ${isExpanded ? 'relative z-10 overflow-visible' : 'overflow-hidden'}`}
                                     style={{ borderColor: '#E0E0E0' }}>
                                  <button
                                    onClick={() => {
                                      setExpandedAccommodationIndex(isExpanded ? null : globalIndex);
                                    }}
                                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                             style={{ backgroundColor: `${brandColors.skyBlue}30` }}>
                                          <Icon className="h-5 w-5" style={{ color: brandColors.navyBlue }} />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-gray-900">
                                            {accommodation.title}
                                          </h4>
                                          {!isExpanded && (
                                            <p className="text-sm text-gray-500">Click to view accommodation details</p>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronDown 
                                        className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      />
                                    </div>
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="border-t px-4 pb-4 bg-white shadow-lg rounded-b-lg" style={{ borderColor: '#E0E0E0' }}>
                                      <div className="grid grid-cols-2 gap-6 mt-4">
                                        <div>
                                          <h5 className="font-semibold text-sm mb-2" style={{ color: brandColors.navyBlue }}>
                                            Barrier Addressed
                                          </h5>
                                          <p className="text-sm text-gray-700">
                                            {accommodation.barrier || 'Processing difficulties'}
                                          </p>
                                        </div>
                                        <div>
                                          <h5 className="font-semibold text-sm mb-2" style={{ color: brandColors.navyBlue }}>
                                            Implementation Notes
                                          </h5>
                                          <p className="text-sm text-gray-700">
                                            {accommodation.implementation || 'Apply to all assessments'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Bottom Navigation Bar - Page Counter and Buttons */}
                {(() => {
                  const section = getSectionForView("accommodations");
                  if (!section) return null;
                  
                  const subsections = getAccommodationSubsections();
                  const currentAccommodationId = expandedAccommodation || "3.1";
                  const selectedSubsection = subsections.find(s => s.id === currentAccommodationId);
                  if (!selectedSubsection) return null;
                  
                  // Parse accommodations using centralized parser
                  const accommodations = parseAccommodations(selectedSubsection.content);
                  const accommodationsPerSlide = 3;
                  const totalAccommodationSlides = Math.ceil(accommodations.length / accommodationsPerSlide);
                  
                  return (
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20">
                      {/* Page Counter - Left Side */}
                      {totalAccommodationSlides > 1 && (
                        <div className="text-sm text-gray-600">
                          Page {currentAccommodationSlide + 1} of {totalAccommodationSlides}
                        </div>
                      )}
                      {totalAccommodationSlides <= 1 && <div></div>}
                      
                      {/* Navigation Buttons - Right Side */}
                      <div className="flex gap-2">
                        {currentAccommodationSlide > 0 && (
                          <button
                            onClick={() => {
                              setCurrentAccommodationSlide(currentAccommodationSlide - 1);
                              setExpandedAccommodationIndex(null);
                            }}
                            className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                            Previous
                          </button>
                        )}
                        {currentAccommodationSlide < totalAccommodationSlides - 1 && (
                          <button
                            onClick={() => {
                              setCurrentAccommodationSlide(currentAccommodationSlide + 1);
                              setExpandedAccommodationIndex(null);
                            }}
                            className="text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                            style={{ 
                              backgroundColor: brandColors.navyBlue,
                            }}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                        {(!totalAccommodationSlides || totalAccommodationSlides === 1 || currentAccommodationSlide === totalAccommodationSlides - 1) && (
                          <button 
                            className="text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                            style={{ 
                              backgroundColor: brandColors.navyBlue,
                              fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onClick={() => setCurrentView("report-complete")}
                          >
                            Finished
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Report Complete View */}
            {currentView === "report-complete" && (
              <div className="relative h-[600px] flex items-center justify-center">
                {/* Background Image - Uses parent container background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src={CompletionBackground}
                    alt="Completion celebration"
                    className="object-cover"
                    style={{
                      filter: 'saturate(0.25) brightness(1.2)',
                      opacity: 0.7,
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
                
                {/* Main Content */}
                <div className="relative z-10 text-center px-8" style={{ marginTop: '-200px' }}>
                  <h1 className="text-4xl font-bold mb-8" 
                      style={{ 
                        color: '#1a1a1a',
                        fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                    Report Review Complete!
                  </h1>
                </div>
                

              </div>
            )}
          </div>
        </div>
        </div>
        </div>
      </div>
    );
  };

  if (!hasAnalysisResult) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No analysis result available for this case.</p>
      </div>
    );
  }

  // Check if this is a demo link (should hide the view switcher)
  const isDemoLink = autoload && initialViewMode === 'figma';

  return (
    <div className={isDemoLink ? "w-full" : "w-full"}>
      {/* Enhanced view is now the only option - removed view switcher */}

      {/* Report Content - Always show enhanced view */}
      <div className={isDemoLink ? "" : "report-viewer w-full"}>
        <FigmaStyledReport />
      </div>

      {/* Hide additional controls for demo links */}
      {!isDemoLink && children}
    </div>
  );
};

export default FigmaEnhancedReportViewer;