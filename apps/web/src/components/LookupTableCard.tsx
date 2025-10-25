
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, RefreshCw, Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { LookupTable } from '@/services/promptService';

interface LookupTableCardProps {
  table: LookupTable;
  onSave: (tableKey: string, content: any) => Promise<void>;
  isSaving: boolean;
}

const LookupTableCard: React.FC<LookupTableCardProps> = ({
  table,
  onSave,
  isSaving
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const newHeight = Math.max(
        textarea.scrollHeight,
        300 // Minimum height for lookup tables (slightly larger than system instructions)
      );
      
      // Set maximum height to 80vh to prevent taking up entire screen
      const maxHeight = Math.min(newHeight, window.innerHeight * 0.8);
      
      textarea.style.height = `${maxHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Adjust height when entering edit mode
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [isEditing, tempContent]);

  const handleEdit = () => {
    setIsEditing(true);
    const jsonString = JSON.stringify(table.content, null, 2);
    setTempContent(jsonString);
    console.log('Setting lookup content for editing:', {
      tableKey: table.table_key,
      contentLength: jsonString.length,
      characterCount: jsonString.length,
      preview: jsonString.substring(0, 200) + '...'
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving lookup table with content length:', tempContent.length);
      const parsedContent = JSON.parse(tempContent);
      await onSave(table.table_key, parsedContent);
      setIsEditing(false);
      setTempContent('');
    } catch (error) {
      console.error('Invalid JSON format');
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON formatting",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempContent('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempContent(e.target.value);
    // Adjust height on content change
    setTimeout(adjustTextareaHeight, 0);
  };

  // Function to render table data from JSON content
  const renderTableData = () => {
    try {
      const content = table.content;
      
      if (typeof content === 'object' && content !== null) {
        // Handle different data structures
        if (Array.isArray(content)) {
          // Check if it's accommodation categories format
          if (content.length > 0 && content[0].category && content[0].accommodations) {
            // Handle accommodation categories format
            const filteredCategories = content.filter(item => 
              searchTerm === '' || 
              item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.accommodations?.some((acc: string) => acc.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return (
              <div className="w-full overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Accommodations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category, categoryIndex) => 
                      category.accommodations?.map((accommodation: string, accIndex: number) => (
                        <TableRow key={`${categoryIndex}-${accIndex}`}>
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="text-xs">
                              {category.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            {accommodation}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          } else if (content.length > 0 && content[0].barrier && content[0].definition) {
            // Handle barrier definitions format
            const filteredBarriers = content.filter(item => 
              searchTerm === '' || 
              item.barrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.definition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.functional_impact?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div className="w-full overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barrier</TableHead>
                      <TableHead>Definition</TableHead>
                      <TableHead>Functional Impact</TableHead>
                      <TableHead>Evidence Indicators</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBarriers.map((barrier, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="text-xs">
                            {barrier.barrier?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {barrier.definition}
                        </TableCell>
                        <TableCell className="max-w-md">
                          {barrier.functional_impact}
                        </TableCell>
                        <TableCell className="max-w-md">
                          {barrier.evidence_indicators?.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          } else {
            // Handle generic array format (like barrier glossary)
            const filteredData = content.filter(item => 
              searchTerm === '' || 
              JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div className="w-full overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Definition/Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.key || item.barrier_type || item.technical_term || item.canonical_key || `Item ${index + 1}`}
                        </TableCell>
                        <TableCell>
                          {item.definition || item.description || item.plain_language_version || item.one_sentence_definition || JSON.stringify(item, null, 2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          }
        } else {
          // Handle object format (like functional impairment accommodations)
          const barrierTypes = Object.keys(content);
          const filteredBarriers = barrierTypes.filter(barrierType => 
            searchTerm === '' || 
            barrierType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content[barrierType].some((acc: any) => 
              acc.accommodation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              acc.category?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );

          return (
            <div className="w-full overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barrier Type</TableHead>
                    <TableHead>Accommodation</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBarriers.map(barrierType => 
                    content[barrierType]
                      .filter((acc: any) => 
                        searchTerm === '' ||
                        barrierType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.accommodation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.category?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((accommodation: any, index: number) => (
                        <TableRow key={`${barrierType}-${index}`}>
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="text-xs">
                              {barrierType.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            {accommodation.accommodation}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {accommodation.category}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          );
        }
      }
      
      // Fallback for other data types
      return (
        <pre className="text-xs whitespace-pre-wrap font-mono p-4 bg-gray-50 rounded">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    } catch (error) {
      return (
        <div className="text-red-500 p-4">
          Error rendering table data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{table.title}</h3>
        {!isEditing && (
          <Button 
            onClick={handleEdit}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      
      {table.description && (
        <p className="text-sm text-gray-600">{table.description}</p>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Content length: {tempContent.length} characters
          </div>
          <div className="border rounded-md">
            <Textarea
              ref={textareaRef}
              value={tempContent}
              onChange={handleContentChange}
              className="font-mono text-xs resize-y min-h-[300px] overflow-y-auto border-0"
              placeholder="JSON lookup table data..."
              style={{ height: 'auto' }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search functionality */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accommodations, barriers, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {/* Table display - completely unconstrained with natural height */}
          <div className="w-full">
            {renderTableData()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LookupTableCard;
