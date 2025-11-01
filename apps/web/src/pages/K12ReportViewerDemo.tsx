/**
 * K12ReportViewerDemo Page
 *
 * Demo page to showcase the new K12ReportViewer component.
 * This demonstrates the config-driven, modular architecture.
 *
 * To view this page, add a route in your router configuration:
 * <Route path="/k12-report-viewer-demo" element={<K12ReportViewerDemo />} />
 */

import React from "react";
import { K12ReportViewer } from "@/components/k12";

/**
 * Mock report data for demonstration
 * In a real application, this would come from an API or database
 */
const mockReportData = {
  caseInfo: {
    studentName: "Sarah Johnson",
    grade: "5th Grade",
    schoolYear: "2024-2025",
    tutor: "Ms. Emily Rodriguez",
    dateCreated: "October 15, 2024",
    lastUpdated: "October 31, 2024",
  },
  documentsReviewed: [
    {
      title: "Psychoeducational Evaluation",
      author: "Dr. Michael Chen",
      date: "September 2024",
      keyFindings:
        "Student demonstrates strengths in verbal reasoning and working memory. Challenges noted in processing speed and written expression.",
    },
    {
      title: "IEP Document",
      author: "School District",
      date: "August 2024",
      keyFindings:
        "Accommodations include extended time, preferential seating, and access to assistive technology.",
    },
  ],
  studentOverview: {
    atAGlance:
      "Sarah is a bright, engaged 5th grader who thrives with structured support and visual aids. She excels in verbal discussions but needs additional time for written work.",
    sections: [],
  },
  supportStrategies: [],
  studentStrengths: [],
  studentChallenges: [],
};

const K12ReportViewerDemo: React.FC = () => {
  return (
    <K12ReportViewer
      initialSection="case-info"
      reportData={mockReportData}
      caseId="demo-123"
      onSectionChange={(sectionId) => {
        console.log("Section changed to:", sectionId);
      }}
    />
  );
};

export default K12ReportViewerDemo;
