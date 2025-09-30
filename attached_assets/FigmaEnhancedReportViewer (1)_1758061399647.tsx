import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileText, Calendar, CheckCircle, BookOpen, Clock, Users, Volume2, PenTool, Info, Lock, GraduationCap, Brain, MessageSquare, Headphones, UserPlus, Phone, ChevronRight, ChevronDown, ChevronLeft, Edit, Home, Edit2, Save, X } from "lucide-react";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { unsplashImages, navigationIcons } from '@/utils/unsplashImages';
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
  currentCase: any;
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

    // Parse markdown into structured sections 
    const parseMarkdownSections = () => {
      if (!markdownReport) {
        console.log('❌ No markdownReport available');
        return [];
      }
      
      console.log('📄 Parsing markdown report, length:', markdownReport.length);
      console.log('📄 First 500 chars:', markdownReport.substring(0, 500));
      
      const sections = [];
      
      // First try the standard ## parsing
      let parts = markdownReport.split(/^## /m);
      console.log('📋 Standard split into', parts.length, 'parts');
      
      // If we don't get enough sections, try alternative parsing
      if (parts.length < 3) {
        console.log('🔄 Trying alternative parsing...');
        
        // Look for the specific structure in this report
        // Based on the console output, the report has functional impact content at the beginning
        // and accommodation content after "## 3. Accommodation & Support Plan"
        
        const accommodationSplit = markdownReport.split(/^## 3\.\s*Accommodation/m);
        if (accommodationSplit.length === 2) {
          // Everything before "## 3. Accommodation" is functional impact
          const functionalContent = accommodationSplit[0]
            .replace(/^# Disability Accommodation Report\s*\n*/m, '') // Remove main title
            .trim();
          
          const accommodationContent = accommodationSplit[1].trim();
          
          console.log('📋 Found functional impact content:', functionalContent.length, 'chars');
          console.log('📋 Found accommodation content:', accommodationContent.length, 'chars');
          
          sections.push({
            title: '2. Functional Impact Summary',
            content: functionalContent,
            index: 2
          });
          
          sections.push({
            title: '3. Accommodation & Support Plan',
            content: accommodationContent,
            index: 3
          });
        }
      } else {
        // Use standard parsing
        for (let i = 1; i < parts.length; i++) {
          const sectionContent = parts[i];
          const titleMatch = sectionContent.match(/^([^\n]+)/);
          const title = titleMatch ? titleMatch[1].trim() : `Section ${i}`;
          const content = sectionContent.substring(title.length).trim();
          
          console.log(`📋 Section ${i}: "${title}" (${content.length} chars)`);
          sections.push({ title, content, index: i });
        }
      }
      
      console.log('📋 Final sections:', sections.map(s => ({ title: s.title, index: s.index })));
      return sections;
    };

    const sections = parseMarkdownSections();

    // Map sections to views
    const getSectionForView = (view: string) => {
      console.log('🔍 getSectionForView called for:', view);
      console.log('📋 Available sections:', sections.map(s => ({ title: s.title, index: s.index })));
      
      let section = null;
      switch (view) {
        case "document-review":
          section = sections.find(s => s.title.toLowerCase().includes("document") || s.index === 1);
          break;
        case "functional-impact":
          section = sections.find(s => s.title.toLowerCase().includes("functional") || s.title.toLowerCase().includes("impact") || s.index === 2);
          break;
        case "accommodations":
          section = sections.find(s => s.title.toLowerCase().includes("accommodation") || s.title.toLowerCase().includes("support") || s.index === 3);
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

    // Parse accommodations subsections (3.1, 3.2, 3.3, 3.4)
    const parseAccommodationSubsections = () => {
      const accommodationSection = getSectionForView("accommodations");
      if (!accommodationSection) return [];

      const subsections = [];
      const content = accommodationSection.content;
      
      // First check if there are ### headers for subsections
      const parts = content.split(/^### /m);
      
      if (parts.length > 1) {
        // We have subsections with ### headers
        for (let i = 1; i < parts.length; i++) {
          const subsectionContent = parts[i];
          const titleMatch = subsectionContent.match(/^([^\n]+)/);
          const rawTitle = titleMatch ? titleMatch[1].trim() : `Subsection 3.${i}`;
          // Remove section numbers like "3.1", "3.2" from the beginning of titles
          const title = rawTitle.replace(/^3\.\d+\s*/, '');
          const subsectionText = subsectionContent.substring((titleMatch ? titleMatch[1] : rawTitle).length).trim();
          
          subsections.push({ 
            id: `3.${i}`,
            title, 
            content: subsectionText,
            index: i 
          });
        }
      } else {
        // No ### headers, try to parse sections by looking for patterns like "3.1", "3.2", etc.
        // Or treat the entire content as one section
        const lines = content.split('\n');
        let currentSubsection = null;
        let currentContent = [];
        
        for (const line of lines) {
          // Check for section headers like "3.1 Academic Accommodations"
          const sectionMatch = line.match(/^(3\.\d+)\s+(.+)/);
          if (sectionMatch) {
            // Save previous subsection
            if (currentSubsection) {
              subsections.push({
                id: currentSubsection.id,
                title: currentSubsection.title,
                content: currentContent.join('\n'),
                index: parseInt(currentSubsection.id.split('.')[1])
              });
            }
            // Start new subsection
            currentSubsection = {
              id: sectionMatch[1],
              title: sectionMatch[2] // Title already extracted without the section number by the regex
            };
            currentContent = [];
          } else if (currentSubsection) {
            currentContent.push(line);
          }
        }
        
        // Save last subsection
        if (currentSubsection) {
          subsections.push({
            id: currentSubsection.id,
            title: currentSubsection.title,
            content: currentContent.join('\n'),
            index: parseInt(currentSubsection.id.split('.')[1])
          });
        }
        
        // If still no subsections found, create a default one with all content
        if (subsections.length === 0) {
          subsections.push({
            id: '3.1',
            title: 'Academic Accommodations',
            content: content,
            index: 1
          });
        }
      }
      
      return subsections;
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
              <button 
                onClick={() => window.location.href = '/'}
                className="hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded"
                title="Go Home"
              >
                <img 
                  src={ThriveLogo}
                  alt="THRIVE Logo - Go Home"
                  className="h-10 w-10 object-contain"
                />
              </button>
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
                    Document Review
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
                    {parseAccommodationSubsections().map((subsection) => (
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

              {/* Go Home */}
              <button
                onClick={() => window.location.href = '/'}
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
                        Student Name:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        Jordan M. Smith
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Student ID:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        STU123456
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
                        B.A. Psychology
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
                        Dr. Sarah Chen, Accommodation Specialist
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
                        May 1, 2025
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <label className="text-lg font-bold" 
                             style={{ 
                               color: '#1e293b',
                               fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                               minWidth: '200px'
                             }}>
                        Review Cycle:
                      </label>
                      <p className="text-lg" style={{ color: '#475569', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        Annual Review
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
                      Document Review
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
                    {/* Psycho-educational evaluation */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Psycho-educational evaluation <span className="text-gray-500 font-normal">[Smith, 2023]</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">08-15-23</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600">VALID</span>
                        </div>
                      </div>
                    </div>

                    {/* Medical letter */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Medical letter <span className="text-gray-500 font-normal">[Dr. Lee]</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">04-02-24</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600">VALID</span>
                        </div>
                      </div>
                    </div>

                    {/* Outdated IEP report */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Outdated IEP report <span className="text-gray-500 font-normal">[High School, 2018]</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">09-12-18</span>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✕</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">INVALID</span>
                        </div>
                      </div>
                    </div>

                    {/* Student interview */}
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Student interview <span className="text-gray-500 font-normal">[Disability Services]</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">05-01-25</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600">VALID</span>
                        </div>
                      </div>
                    </div>
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
                    
                    // Check if content follows standard barrier format - look for any numbered barriers
                    // More lenient detection: if we have numbered barriers, try to parse them even without perfect Evidence formatting
                    const hasNumberedBarriers = /\*\*\d+:/.test(contentToDisplay);
                    const hasStandardBarrierFormat = hasNumberedBarriers;
                    

                    
                    if (!hasStandardBarrierFormat) {
                      // Show content as plain text with simple formatting for non-standard format
                      return (
                        <div className="prose max-w-none p-6">
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {contentToDisplay}
                          </div>
                        </div>
                      );
                    }
                    
                    // Parse functional impact barriers from markdown (for standard format)
                    const parseBarriers = () => {
                      const barriers: any[] = [];
                      const lines = section.content.split('\n');

                      let currentBarrier: any = null;
                      
                      lines.forEach(line => {
                        // Match numbered barriers (e.g., "**3:** Takes longer to read...)
                        const barrierMatch = line.match(/^\*\*(\d+):\s*(.+)/);
                        if (barrierMatch) {
                          if (currentBarrier) barriers.push(currentBarrier);
                          let description = barrierMatch[2].trim();
                          let evidence = '';
                          
                          // Check if evidence is included in the same line or malformed
                          const evidenceMatch = description.match(/(.+?)\s*(?:Evidence:|Eviden)[\s:]*(.+)/i);
                          if (evidenceMatch) {
                            description = evidenceMatch[1].trim();
                            evidence = evidenceMatch[2]
                              .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                              .replace(/\s*\*\(Flagged for review.*?\).*$/i, '')
                              .replace(/\s*\(Flagged for Review.*?\).*$/i, '')
                              .trim();
                          }
                          
                          // Clean up the description by removing debug text and asterisks
                          description = description
                            .replace(/^\*+\s*/, '') // Remove leading asterisks
                            .replace(/\s*\*+$/, '') // Remove trailing asterisks
                            .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                            .replace(/\s*\*\(Flagged for review.*?\).*$/i, '')
                            .replace(/\s*\(Flagged for Review.*?\).*$/i, '')
                            .trim();
                          
                          currentBarrier = {
                            number: barrierMatch[1],
                            description,
                            evidence: evidence || 'Evidence information not available'
                          };
                        } else if (currentBarrier && line.trim()) {
                          // Look for evidence lines that follow the barrier
                          const evidenceMatch = line.match(/^\s*(?:Evidence:|Eviden)[\s:]*(.+)/i);
                          if (evidenceMatch) {
                            currentBarrier.evidence = evidenceMatch[1]
                              .replace(/\s*\(flagged for view demo mode\).*$/i, '')
                              .replace(/\s*\*\(Flagged for review.*?\).*$/i, '')
                              .replace(/\s*\(Flagged for Review.*?\).*$/i, '')
                              .trim();
                          } else if (currentBarrier.evidence && currentBarrier.evidence !== 'Evidence information not available' && !line.startsWith('**') && !line.includes('Evidence:')) {
                            // Continue evidence on multiple lines
                            currentBarrier.evidence += ' ' + line.trim();
                          }
                        }
                      });
                      if (currentBarrier) barriers.push(currentBarrier);
                      
                      // Use the actual barrier descriptions as titles, with appropriate icons
                      return barriers.map(b => {
                        let icon = BookOpen;
                        
                        // Determine icon based on content (but keep original descriptions as titles)
                        if (b.description.toLowerCase().includes('read') || b.description.toLowerCase().includes('note')) {
                          icon = BookOpen;
                        } else if (b.description.toLowerCase().includes('test') || b.description.toLowerCase().includes('exam') || b.description.toLowerCase().includes('time')) {
                          icon = Clock;
                        } else if (b.description.toLowerCase().includes('focus') || b.description.toLowerCase().includes('attention')) {
                          icon = Brain;
                        } else if (b.description.toLowerCase().includes('write') || b.description.toLowerCase().includes('written')) {
                          icon = PenTool;
                        }
                        
                        return {
                          ...b,
                          title: b.description, // Use the actual barrier description as the title
                          icon
                        };
                      });
                    };
                    
                    const barriers = parseBarriers();

                    
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
                      
                      const subsections = parseAccommodationSubsections();
                      console.log('Parsed subsections:', subsections);
                      
                      // If no subsection is selected, default to 3.1
                      const currentAccommodationId = expandedAccommodation || "3.1";
                      
                      // Show the selected subsection with dropdowns
                      const selectedSubsection = subsections.find(s => s.id === currentAccommodationId);
                      if (!selectedSubsection) return <div className="text-gray-500">No accommodation details found</div>;
                      
                      // Parse individual accommodations from the subsection content
                      const parseAccommodations = (content: string) => {
                        const accommodations = [];
                        const lines = content.split('\n');
                        let currentAccommodation = null;
                        let currentDescription = '';
                        
                        for (const line of lines) {
                          // Check multiple accommodation title formats:
                          // Format 1: "**1. Extended Time on Assignments and Exams**"
                          const boldTitleMatch = line.match(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/);
                          // Format 2: "**1.** Extended time description..."
                          const boldNumberMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.+)/);
                          // Format 3: Simple "1. Extended time"
                          const simpleMatch = line.match(/^(\d+)\.\s+(.+)/);
                          
                          const accommodationMatch = boldTitleMatch || boldNumberMatch || simpleMatch;
                          
                          if (accommodationMatch) {
                            // Save previous accommodation if it exists
                            if (currentAccommodation) {
                              const description = currentDescription.trim();
                              // Generate meaningful barrier and implementation from the description
                              const barrier = getBarrierFromDescription(description);
                              const implementation = getImplementationFromDescription(description);
                              
                              accommodations.push({
                                number: currentAccommodation.number,
                                title: currentAccommodation.title,
                                barrier: barrier,
                                implementation: implementation
                              });
                            }
                            
                            // Start new accommodation
                            currentAccommodation = {
                              number: accommodationMatch[1],
                              title: accommodationMatch[2].trim()
                            };
                            currentDescription = accommodationMatch[2].trim();
                          } else if (currentAccommodation && line.trim() && !line.startsWith('**') && !line.startsWith('#')) {
                            // Continue building the description
                            currentDescription += ' ' + line.trim();
                          }
                        }
                        
                        // Add the last accommodation
                        if (currentAccommodation) {
                          const description = currentDescription.trim();
                          const barrier = getBarrierFromDescription(description);
                          const implementation = getImplementationFromDescription(description);
                          
                          accommodations.push({
                            number: currentAccommodation.number,
                            title: currentAccommodation.title,
                            barrier: barrier,
                            implementation: implementation
                          });
                        }
                        
                        console.log('Parsed accommodations:', accommodations);
                        return accommodations;
                      };
                      
                      // Helper function to extract barrier information from accommodation description
                      const getBarrierFromDescription = (description: string): string => {
                        const lowerDesc = description.toLowerCase();
                        
                        if (lowerDesc.includes('reading') || lowerDesc.includes('comprehension')) {
                          return 'Reading comprehension and processing difficulties';
                        } else if (lowerDesc.includes('test') || lowerDesc.includes('exam') || lowerDesc.includes('assessment')) {
                          return 'Test anxiety and time management challenges';
                        } else if (lowerDesc.includes('writing') || lowerDesc.includes('spelling') || lowerDesc.includes('grammar')) {
                          return 'Written expression and language processing difficulties';
                        } else if (lowerDesc.includes('distraction') || lowerDesc.includes('quiet') || lowerDesc.includes('focus')) {
                          return 'Attention and concentration challenges';
                        } else if (lowerDesc.includes('instruction') || lowerDesc.includes('verbal') || lowerDesc.includes('direction')) {
                          return 'Auditory processing and working memory difficulties';
                        } else if (lowerDesc.includes('deadline') || lowerDesc.includes('scheduling') || lowerDesc.includes('flexible')) {
                          return 'Executive functioning and time management challenges';
                        } else {
                          return 'Academic processing and learning differences';
                        }
                      };
                      
                      // Helper function to extract implementation information from accommodation description
                      const getImplementationFromDescription = (description: string): string => {
                        const lowerDesc = description.toLowerCase();
                        
                        if (lowerDesc.includes('extended time')) {
                          return 'Provide 1.5x to 2x standard time allocation for assignments and assessments';
                        } else if (lowerDesc.includes('reduced') && lowerDesc.includes('question')) {
                          return 'Modify assessments to focus on essential learning objectives while maintaining rigor';
                        } else if (lowerDesc.includes('quiet') || lowerDesc.includes('distraction-free')) {
                          return 'Arrange alternative testing location with minimal environmental distractions';
                        } else if (lowerDesc.includes('organizer') || lowerDesc.includes('template')) {
                          return 'Provide structured templates and organizational tools for assignments';
                        } else if (lowerDesc.includes('spell') || lowerDesc.includes('grammar') || lowerDesc.includes('check')) {
                          return 'Allow assistive technology tools when focus is on content, not mechanics';
                        } else if (lowerDesc.includes('keyboard') || lowerDesc.includes('speech-to-text')) {
                          return 'Permit use of assistive technology for written expression tasks';
                        } else if (lowerDesc.includes('instruction') || lowerDesc.includes('direction')) {
                          return 'Provide multi-modal instruction delivery and written reinforcement';
                        } else if (lowerDesc.includes('deadline') || lowerDesc.includes('flexible')) {
                          return 'Allow reasonable extensions and flexible scheduling based on individual needs';
                        } else {
                          return 'Implement on case-by-case basis in consultation with disability services';
                        }
                      };
                      
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
                  
                  const subsections = parseAccommodationSubsections();
                  const currentAccommodationId = expandedAccommodation || "3.1";
                  const selectedSubsection = subsections.find(s => s.id === currentAccommodationId);
                  if (!selectedSubsection) return null;
                  
                  const parseAccommodations = (content: string) => {
                    const accommodations = [];
                    const lines = content.split('\n');
                    let currentAccommodation = null;
                    let currentDescription = '';
                    
                    // Helper functions for this context (same as above)
                    const getBarrierFromDescription = (description: string): string => {
                      const lowerDesc = description.toLowerCase();
                      
                      if (lowerDesc.includes('reading') || lowerDesc.includes('comprehension')) {
                        return 'Reading comprehension and processing difficulties';
                      } else if (lowerDesc.includes('test') || lowerDesc.includes('exam') || lowerDesc.includes('assessment')) {
                        return 'Test anxiety and time management challenges';
                      } else if (lowerDesc.includes('writing') || lowerDesc.includes('spelling') || lowerDesc.includes('grammar')) {
                        return 'Written expression and language processing difficulties';
                      } else if (lowerDesc.includes('distraction') || lowerDesc.includes('quiet') || lowerDesc.includes('focus')) {
                        return 'Attention and concentration challenges';
                      } else if (lowerDesc.includes('instruction') || lowerDesc.includes('verbal') || lowerDesc.includes('direction')) {
                        return 'Auditory processing and working memory difficulties';
                      } else if (lowerDesc.includes('deadline') || lowerDesc.includes('scheduling') || lowerDesc.includes('flexible')) {
                        return 'Executive functioning and time management challenges';
                      } else {
                        return 'Academic processing and learning differences';
                      }
                    };
                    
                    const getImplementationFromDescription = (description: string): string => {
                      const lowerDesc = description.toLowerCase();
                      
                      if (lowerDesc.includes('extended time')) {
                        return 'Provide 1.5x to 2x standard time allocation for assignments and assessments';
                      } else if (lowerDesc.includes('reduced') && lowerDesc.includes('question')) {
                        return 'Modify assessments to focus on essential learning objectives while maintaining rigor';
                      } else if (lowerDesc.includes('quiet') || lowerDesc.includes('distraction-free')) {
                        return 'Arrange alternative testing location with minimal environmental distractions';
                      } else if (lowerDesc.includes('organizer') || lowerDesc.includes('template')) {
                        return 'Provide structured templates and organizational tools for assignments';
                      } else if (lowerDesc.includes('spell') || lowerDesc.includes('grammar') || lowerDesc.includes('check')) {
                        return 'Allow assistive technology tools when focus is on content, not mechanics';
                      } else if (lowerDesc.includes('keyboard') || lowerDesc.includes('speech-to-text')) {
                        return 'Permit use of assistive technology for written expression tasks';
                      } else if (lowerDesc.includes('instruction') || lowerDesc.includes('direction')) {
                        return 'Provide multi-modal instruction delivery and written reinforcement';
                      } else if (lowerDesc.includes('deadline') || lowerDesc.includes('flexible')) {
                        return 'Allow reasonable extensions and flexible scheduling based on individual needs';
                      } else {
                        return 'Implement on case-by-case basis in consultation with disability services';
                      }
                    };
                    
                    for (const line of lines) {
                      // Check multiple accommodation title formats:
                      // Format 1: "**1. Extended Time on Assignments and Exams**"
                      const boldTitleMatch = line.match(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/);
                      // Format 2: "**1.** Extended time description..."
                      const boldNumberMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.+)/);
                      // Format 3: Simple "1. Extended time"
                      const simpleMatch = line.match(/^(\d+)\.\s+(.+)/);
                      
                      const accommodationMatch = boldTitleMatch || boldNumberMatch || simpleMatch;
                      
                      if (accommodationMatch) {
                        // Save previous accommodation if it exists
                        if (currentAccommodation) {
                          const description = currentDescription.trim();
                          const barrier = getBarrierFromDescription(description);
                          const implementation = getImplementationFromDescription(description);
                          
                          accommodations.push({
                            number: currentAccommodation.number,
                            title: currentAccommodation.title,
                            barrier: barrier,
                            implementation: implementation
                          });
                        }
                        
                        // Start new accommodation
                        currentAccommodation = {
                          number: accommodationMatch[1],
                          title: accommodationMatch[2].trim()
                        };
                        currentDescription = accommodationMatch[2].trim();
                      } else if (currentAccommodation && line.trim() && !line.startsWith('**') && !line.startsWith('#')) {
                        // Continue building the description
                        currentDescription += ' ' + line.trim();
                      }
                    }
                    
                    // Add the last accommodation
                    if (currentAccommodation) {
                      const description = currentDescription.trim();
                      const barrier = getBarrierFromDescription(description);
                      const implementation = getImplementationFromDescription(description);
                      
                      accommodations.push({
                        number: currentAccommodation.number,
                        title: currentAccommodation.title,
                        barrier: barrier,
                        implementation: implementation
                      });
                    }
                    
                    return accommodations;
                  };
                  
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