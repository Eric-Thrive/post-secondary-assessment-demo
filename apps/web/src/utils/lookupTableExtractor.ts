
export const extractLookupTable = (text: string): any | null => {
  console.log('Extracting lookup table from text...');
  
  // First try K-12 format - look for specific K-12 table patterns
  const k12Table = extractK12LookupTable(text);
  if (k12Table) {
    return k12Table;
  }
  
  // Then try post-secondary format
  return extractPostSecondaryLookupTable(text);
};

const extractK12LookupTable = (text: string): any | null => {
  console.log('Attempting K-12 lookup table extraction...');
  
  // Look for K-12 specific table markers and patterns
  // This could be JSON blocks, table sections, or other structured data
  const k12TablePatterns = [
    /(?:LOOKUP\s+TABLE|SUPPORT\s+TABLE|BARRIER\s+TABLE|ACCOMMODATION\s+TABLE)([\s\S]*?)(?=_{10,}|SYSTEM PROMPT END|$)/i,
    /(?:Table\s+Access|Function\s+Calls)([\s\S]*?)(?=_{10,}|SYSTEM PROMPT END|$)/i
  ];

  for (const pattern of k12TablePatterns) {
    const match = text.match(pattern);
    if (match) {
      const tableSection = match[1];
      
      // Look for JSON within this section
      const jsonMatch = tableSection.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed === 'object') {
            console.log('Found K-12 lookup table via pattern matching');
            return parsed;
          }
        } catch (error) {
          console.log('K-12 JSON parsing failed:', error);
        }
      }
    }
  }
  
  return null;
};

const extractPostSecondaryLookupTable = (text: string): any | null => {
  console.log('Attempting post-secondary lookup table extraction...');
  
  // Look for the specific "LOOKUP TABLE" section marker
  const lookupTableMarker = /LOOKUP\s+TABLE\s*\([^)]*\)\s*\n?\s*\{/i;
  const markerMatch = text.match(lookupTableMarker);
  
  if (!markerMatch) {
    console.log('No post-secondary LOOKUP TABLE marker found');
    return null;
  }

  // Find the start of the JSON object after the marker
  const startIndex = text.indexOf('{', markerMatch.index);
  if (startIndex === -1) {
    console.log('No opening brace found after LOOKUP TABLE marker');
    return null;
  }

  // Extract the complete JSON object by counting braces
  let braceCount = 0;
  let endIndex = startIndex;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
  }

  if (braceCount !== 0) {
    console.log('Unbalanced braces in post-secondary lookup table JSON');
    return null;
  }

  const jsonText = text.substring(startIndex, endIndex);
  console.log('Extracted post-secondary JSON text:', jsonText.substring(0, 200) + '...');
  
  try {
    const validated = JSON.parse(jsonText);
    if (validated && typeof validated === 'object') {
      // Validate that it looks like a functional impairment lookup table
      const keys = Object.keys(validated);
      const expectedKeys = ['attention', 'chronic_health', 'digital_access', 'executive_function', 'general_admin', 'housing', 'math', 'memory_deficit', 'mobility', 'mobility_medical', 'psychiatric', 'reading', 'sensory', 'speech_communication_disorder', 'testing', 'writing'];
      const hasExpectedKeys = expectedKeys.some(key => keys.includes(key));
      
      if (hasExpectedKeys) {
        console.log('Valid post-secondary lookup table found with keys:', keys);
        return validated;
      }
    }
  } catch (error) {
    console.log('Post-secondary JSON parsing failed:', error);
    return null;
  }
  
  console.log('Extracted content is not a valid post-secondary lookup table');
  return null;
};
