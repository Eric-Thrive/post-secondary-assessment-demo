import thriveLogo from "figma:asset/a5030ddfd6fd8234840b3fc2f99c28aea5b168c7.png";
import studentInfoIcon from "figma:asset/e61f08af99ee81181367bd2cfa69aceb2452190c.png";
import functionalImpactIcon from "figma:asset/ab95a96c79889409bf3b7a4ccba2d510c5f31618.png";
import accommodationPlanIcon from "figma:asset/1bfe8329c4f1764d0741b96abf736c9572168576.png";
import documentsReviewedIcon from "figma:asset/37eddb4b53ea6f94d6ca8365d96efd77b41f92e9.png";
import { Badge } from "./components/ui/badge";

export default function AccommodationReport() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 pt-4">
        {/* Report Info */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-300">
          <div>
            <h1 className="text-[#1297D2]">
              Accommodation Report
            </h1>
            <div className="text-[10px] mt-0.5">
              <div className="text-gray-600">
                10/23/25 11:06 AM
              </div>
              <div className="text-gray-600">
                Accommodation_Report_AS
              </div>
              <div className="text-gray-800">AS</div>
            </div>
          </div>
          <img
            src={thriveLogo}
            alt="THRIVE"
            className="h-14 object-contain"
          />
        </div>

        {/* Student Info and Documents Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Student Information */}
          <div>
            <div className="bg-[#F89E54]/80 inline-block px-3 py-1 rounded-t-lg bg-[rgba(248,158,84,0.9)]">
              <div className="flex items-center gap-2">
                <img
                  src={studentInfoIcon}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                <h2 className="text-white text-base">
                  Student Information
                </h2>
              </div>
            </div>
            <div className="border-2 border-[#96D7E1] rounded-b-lg rounded-tr-lg p-2 bg-[rgba(150,215,225,0)]">
              <div className="space-y-0.5 text-xs">
                <div>
                  <span className="text-gray-800">
                    Unique ID:{" "}
                  </span>
                  <span>AS</span>
                </div>
                <div>
                  <span className="text-gray-800">
                    Program/Major:{" "}
                  </span>
                  <span>Post-Secondary Program</span>
                </div>
                <div>
                  <span className="text-gray-800">
                    Report Author:{" "}
                  </span>
                  <span>enc</span>
                </div>
                <div>
                  <span className="text-gray-800">
                    Date Issued:{" "}
                  </span>
                  <span>Oct 21, 2025</span>
                </div>
                <div>
                  <span className="text-gray-800">
                    Status:{" "}
                  </span>
                  <span className="text-[#F89E54]">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Reviewed */}
          <div className="bg-[rgba(150,215,225,0)]">
            <div className="bg-[#F89E54]/80 inline-block px-3 py-1 rounded-t-lg bg-[rgba(248,158,84,0.9)]">
              <div className="flex items-center gap-2">
                <img
                  src={documentsReviewedIcon}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                <h2 className="text-white text-base">
                  Documents Reviewed
                </h2>
              </div>
            </div>
            <div className="border-2 border-[#96D7E1] rounded-b-lg rounded-tr-lg p-2 bg-[rgba(150,215,225,0)]">
              <p className="text-gray-600 text-xs">
                No documents available
              </p>
            </div>
          </div>
        </div>

        {/* Functional Impact Summary */}
        <div className="mb-3">
          <div className="bg-[#F89E54]/80 inline-block px-3 py-1 rounded-t-lg bg-[rgba(248,158,84,0.9)]">
            <div className="flex items-center gap-2">
              <img
                src={functionalImpactIcon}
                alt=""
                className="h-4 w-4 object-contain"
              />
              <h2 className="text-white text-base">
                Functional Impact Summary
              </h2>
            </div>
          </div>
          <div className="border-2 border-[#1297D2] rounded-b-lg rounded-tr-lg p-2">
            <div className="grid grid-cols-2 gap-x-4">
              <ul className="space-y-1">
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span className="text-xs">
                    Needs more time to understand and use new
                    words.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span className="text-xs">
                    Struggles to follow and remember multi-step
                    directions.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span className="text-xs">
                    Has trouble remembering and following new
                    information.
                  </span>
                </li>
              </ul>
              <ul className="space-y-1">
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <span className="text-xs">
                    Finds it hard to clearly understand and
                    express ideas with others.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    5
                  </span>
                  <span className="text-xs">
                    Takes longer to solve new or unfamiliar
                    problems.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1297D2] text-white flex items-center justify-center text-[11px]">
                    6
                  </span>
                  <span className="text-xs">
                    Struggles to copy, draw, or organize visual
                    information.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Accommodation & Support Plan */}
        <div className="mb-3">
          <div className="bg-[#F89E54]/80 inline-block px-3 py-1 rounded-t-lg bg-[rgba(248,158,84,0.9)]">
            <div className="flex items-center gap-2">
              <img
                src={accommodationPlanIcon}
                alt=""
                className="h-4 w-4 object-contain"
              />
              <h2 className="text-white text-base">
                Accommodation & Support Plan
              </h2>
            </div>
          </div>

          {/* Two Panel Grid - Merged Sections */}
          <div className="space-y-3">
            {/* Merged Panel 1 - Academic & Instructional Accommodations - Sky Blue */}
            <div className="border-2 border-[#96D7E1] rounded-b-lg rounded-tr-lg p-3 bg-[#96D7E1]/10">
              <div className="grid grid-cols-2 gap-4 divide-x divide-[#96D7E1]/40">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h3 className="text-[#F89E54] text-sm">
                      3.1 Academic Accommodations
                    </h3>
                  </div>
                  <ol className="space-y-2">
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          1.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Extended time for tests and quizzes
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Test anxiety and time
                        management challenges
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          2.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Tests read aloud or provided in audio
                          format
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Test anxiety and time
                        management challenges
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          3.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Short, simple instructions for all
                          test items
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Test anxiety and time
                        management challenges
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          4.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Use of visual aids or graphic
                          organizers during assessments
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Test anxiety and time
                        management challenges
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          5.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Directions repeated and broken down
                          into steps
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Auditory processing and working
                        memory difficulties
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="pl-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h3 className="text-[#F89E54] text-sm">
                      3.2 Instructional / Program Accommodations
                    </h3>
                  </div>
                  <ol className="space-y-2">
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          1.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Access to written and visual
                          instructions for assignments
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Auditory processing and working
                        memory difficulties
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          2.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Use of graphic organizers for writing
                          and reading tasks
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Reading comprehension and
                        processing difficulties
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          3.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Allow oral responses or use of
                          assistive technology for written tasks
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          4.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Frequent checks for understanding
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          5.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Access to peer note takers or notes
                          from instructor
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          6.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Preferential seating to support
                          hearing and participation
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Merged Panel 2 - Auxiliary Aids & Non-Accommodation Supports - Sky Blue */}
            <div className="border-2 border-[#96D7E1] rounded-lg p-3 bg-[#96D7E1]/10">
              <div className="grid grid-cols-2 gap-4 divide-x divide-[#96D7E1]/40">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h3 className="text-[#F89E54] text-sm">
                      3.3 Auxiliary Aids & Services
                    </h3>
                  </div>
                  <ol className="space-y-2">
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          1.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Allow use of speech-to-text or
                          augmentative communication tools
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          2.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Opportunity to clarify or restate
                          expectations as needed
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Auditory processing and working
                        memory difficulties
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          3.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Written reminders and assignment
                          checklists
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          4.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Use of memory aids or study guides
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          5.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Provide step-by-step examples for
                          tasks
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Test anxiety and time
                        management challenges
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          6.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Advance access to lecture materials
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="pl-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h3 className="text-[#F89E54] text-sm">
                      3.4 Non-Accommodation Supports / Referrals
                    </h3>
                  </div>
                  <ol className="space-y-2">
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          1.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Use of manipulatives and hands-on
                          materials for problem-solving
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          2.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Provide templates or models for
                          drawing and copying tasks
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded hover:bg-white/50 transition-colors">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          3.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Break down visual tasks into small,
                          manageable steps
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                    <li className="p-1.5 rounded bg-gray-50/50">
                      <div className="text-[10px] flex gap-1">
                        <span className="text-gray-800 flex-shrink-0">
                          4.
                        </span>{" "}
                        <Badge className="text-[8px] bg-[#FDE677]/50 text-gray-800 hover:bg-[#FDE677]/40 border-0 px-1.5 py-0 inline-block whitespace-normal leading-tight">
                          Allow alternative formats for visual
                          assignments
                        </Badge>
                      </div>
                      <div className="text-[9px] text-gray-600 italic ml-2 mt-0.5">
                        Barrier: Academic processing and
                        learning differences
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pt-2 border-t border-gray-300">
          Generated by THRIVE Assessment System • 10/23/2025
        </div>
      </div>
    </div>
  );
}