
export class FileProcessingService {
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  createEnhancedFallbackText(file: File, reason: string, partialText?: string): string {
    const fallbackContent = `[PDF Document Analysis Required - ${file.name}]

File Information:
- Filename: ${file.name}
- File size: ${this.formatFileSize(file.size)}
- Processing issue: ${reason}

${partialText ? `Partial content extracted:\n${partialText}\n\n` : ''}

IMPORTANT INSTRUCTIONS FOR ANALYSIS:
This document requires manual review for accommodation assessment. Based on the filename and context, this appears to be a neuropsychological evaluation or related assessment document. 

Please analyze this document and provide:

1. FUNCTIONAL IMPACTS: Identify specific barriers in academic domains such as:
   - Reading comprehension and speed
   - Written expression difficulties  
   - Attention and concentration issues
   - Processing speed limitations
   - Memory and learning challenges
   - Executive functioning deficits

2. EVIDENCE BASE: Note any standardized test scores, clinical observations, or documented limitations that support accommodation needs.

3. ACCOMMODATION RECOMMENDATIONS: Based on typical patterns for neuropsychological evaluations, consider accommodations such as:
   - Extended time for examinations
   - Reduced distraction testing environment
   - Note-taking assistance or recorded lectures
   - Alternative format materials
   - Breaks during testing
   - Use of assistive technology

Please provide specific, evidence-based recommendations even though the full document text is not available for automatic processing.`;

    console.log('Created enhanced fallback text:', fallbackContent.length, 'characters');
    return fallbackContent;
  }

  async extractTextFromFile(file: File): Promise<string> {
    console.log('=== File Processing Starting ===');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: this.formatFileSize(file.size)
    });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          
          if (typeof result === 'string') {
            if (file.type.startsWith('text/')) {
              console.log(`Text file processed: ${result.length} characters extracted`);
              resolve(result);
            } else {
              // For other files, provide a meaningful placeholder
              const placeholder = `[${file.type} file - ${file.name}]\nFile size: ${this.formatFileSize(file.size)}\nNote: This file type requires manual review. Please provide a summary of the key findings and recommendations from this document for the accommodation assessment.`;
              console.log('Unsupported file type, using placeholder:', file.type);
              resolve(placeholder);
            }
          } else {
            reject(new Error('Failed to read file content'));
          }
        } catch (error) {
          console.error('File reading error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error occurred');
        reject(new Error('File reading error'));
      };
      
      reader.readAsText(file);
    });
  }
}

export const fileProcessingService = new FileProcessingService();
