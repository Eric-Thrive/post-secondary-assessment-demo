/**
 * K-12 Markdown Export Service
 *
 * Generates markdown content from parsed K12ReportData for printing
 */

import type { K12ReportData } from "@/utils/k12ReportParser";

export class K12MarkdownExportService {
  /**
   * Generate markdown content from parsed K12 report data
   */
  static generateMarkdown(reportData: K12ReportData): string {
    const {
      caseInfo,
      documentsReviewed,
      studentOverview,
      supportStrategies,
      studentStrengths,
      studentChallenges,
    } = reportData;

    let markdown = `# K-12 Educational Assessment Report\n\n`;

    // Case Information Section
    markdown += `## Case Information\n\n`;
    markdown += `**Student Name:** ${caseInfo.studentName}\n`;
    markdown += `**Grade:** ${caseInfo.grade}\n`;
    markdown += `**School Year:** ${caseInfo.schoolYear}\n`;
    if (caseInfo.tutor && caseInfo.tutor !== "Not Specified") {
      markdown += `**Tutor:** ${caseInfo.tutor}\n`;
    }
    markdown += `**Date Created:** ${caseInfo.dateCreated}\n`;
    markdown += `**Last Updated:** ${caseInfo.lastUpdated}\n\n`;

    // Documents Reviewed Section
    if (documentsReviewed && documentsReviewed.length > 0) {
      markdown += `## Documents Reviewed\n\n`;
      documentsReviewed.forEach((doc: any, index: number) => {
        markdown += `${index + 1}. **${doc.title}**\n`;
        if (doc.author) {
          markdown += `   *Author: ${doc.author}*\n`;
        }
        markdown += `\n`;
      });
    }

    // Student Overview Section
    if (studentOverview && studentOverview.atAGlance) {
      markdown += `## Student Overview\n\n`;
      markdown += `${studentOverview.atAGlance}\n\n`;
    }

    // Key Support Strategies Section
    if (supportStrategies && supportStrategies.length > 0) {
      markdown += `## Key Support Strategies\n\n`;
      supportStrategies.forEach((strategy: any, index: number) => {
        markdown += `### ${index + 1}. ${strategy.strategy}\n\n`;
        markdown += `${strategy.description}\n\n`;
      });
    }

    // Student Strengths Section
    if (studentStrengths && studentStrengths.length > 0) {
      markdown += `## Student Strengths\n\n`;
      markdown += `| Strength | What You See | Color |\n`;
      markdown += `|----------|--------------|-------|\n`;

      studentStrengths.forEach((strength: any) => {
        const title = strength.title || "General";
        const whatYouSee = strength.whatYouSee
          ? strength.whatYouSee.join(", ")
          : "";
        const color = strength.color || "";

        // Clean up any existing markdown formatting for table display
        const cleanWhatYouSee = whatYouSee
          .replace(/\|/g, "\\|")
          .replace(/\n/g, "<br>");

        markdown += `| ${title} | ${cleanWhatYouSee} | ${color} |\n`;
      });
      markdown += `\n`;
    }

    // Student Challenges Section
    if (studentChallenges && studentChallenges.length > 0) {
      markdown += `## Student Challenges\n\n`;
      markdown += `| Challenge | What You See | Notes |\n`;
      markdown += `|-----------|--------------|-------|\n`;

      studentChallenges.forEach((challenge: any) => {
        const challengeText = challenge.challenge || "General";
        const whatYouSee = challenge.whatYouSee
          ? challenge.whatYouSee.join(", ")
          : "";

        // Clean up any existing markdown formatting for table display
        const cleanChallenge = challengeText
          .replace(/\|/g, "\\|")
          .replace(/\n/g, "<br>");
        const cleanWhatYouSee = whatYouSee
          .replace(/\|/g, "\\|")
          .replace(/\n/g, "<br>");

        markdown += `| ${cleanChallenge} | ${cleanWhatYouSee} | |\n`;
      });
      markdown += `\n`;
    }

    // Footer
    markdown += `---\n\n`;
    markdown += `*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`;

    return markdown;
  }

  /**
   * Open print dialog with raw markdown content for debugging
   */
  static printOriginalMarkdown(
    originalMarkdown: string,
    studentName: string = "Student"
  ): void {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the report");
      return;
    }

    // Output raw markdown with minimal formatting for debugging
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>K-12 Raw Markdown - ${studentName}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 20px;
              padding: 0;
              color: #000;
              background: #fff;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
              padding: 0;
            }
            .header {
              font-family: Arial, sans-serif;
              font-size: 14px;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ccc;
            }
            @media print {
              body {
                margin: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <strong>Raw Markdown Output for Debugging - ${studentName}</strong><br>
            Generated: ${new Date().toLocaleString()}<br>
            <em>Use this to troubleshoot parser issues</em>
          </div>
          <pre>${originalMarkdown
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }

  /**
   * Open print dialog with markdown content (legacy method for parsed data)
   */
  static printMarkdown(reportData: K12ReportData): void {
    const markdown = this.generateMarkdown(reportData);

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the report");
      return;
    }

    // Convert markdown to HTML for better printing
    const html = this.markdownToHtml(markdown);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>K-12 Assessment Report - ${reportData.caseInfo.studentName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #1e40af;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
              margin-top: 30px;
            }
            h3 {
              color: #1e40af;
              margin-top: 25px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            ul, ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            li {
              margin: 5px 0;
            }
            hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 30px 0;
            }
            .footer {
              font-style: italic;
              color: #6b7280;
              text-align: center;
              margin-top: 30px;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
              h1, h2, h3 {
                page-break-after: avoid;
              }
              table {
                page-break-inside: avoid;
              }
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }

  /**
   * Convert markdown to HTML for printing
   */
  private static markdownToHtml(markdown: string): string {
    let html = markdown;

    // Convert headers
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic text
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert tables
    const tableRegex = /(\|.*\|[\r\n]+)+/g;
    html = html.replace(tableRegex, (match) => {
      const rows = match.trim().split("\n");
      let tableHtml = "<table>\n";

      rows.forEach((row, index) => {
        if (row.includes("---")) return; // Skip separator row

        const cells = row.split("|").slice(1, -1); // Remove empty first/last elements
        const tag = index === 0 ? "th" : "td";

        tableHtml += "  <tr>\n";
        cells.forEach((cell) => {
          const cleanCell = cell.trim().replace(/<br>/g, "<br>");
          tableHtml += `    <${tag}>${cleanCell}</${tag}>\n`;
        });
        tableHtml += "  </tr>\n";
      });

      tableHtml += "</table>\n";
      return tableHtml;
    });

    // Convert line breaks to paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = "<p>" + html + "</p>";

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>(<h[1-6]>)/g, "$1");
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
    html = html.replace(/<p>(<table>)/g, "$1");
    html = html.replace(/(<\/table>)<\/p>/g, "$1");
    html = html.replace(/<p>(<hr>)<\/p>/g, "$1");

    // Convert horizontal rules
    html = html.replace(/^---$/gm, "<hr>");

    // Convert lists
    html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    return html;
  }
}
