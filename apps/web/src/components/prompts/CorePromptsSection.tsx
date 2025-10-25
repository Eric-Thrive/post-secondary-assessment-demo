
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Workflow } from 'lucide-react';
import PromptExecutionFlow from '../PromptExecutionFlow';
import PromptCardSkeleton from '../PromptCardSkeleton';
import SystemInstructionsCard from './SystemInstructionsCard';
import ReportTemplateCard from './ReportTemplateCard';
import { ErrorAlert } from './ErrorAlert';
import { PromptSection } from '@/types/promptService';
import { useModule } from '@/contexts/ModuleContext';

interface CorePromptsSectionProps {
  promptSections: PromptSection[] | undefined;
  sectionsLoading: boolean;
  sectionsError: any;
  savePromptSectionMutation: { isPending: boolean };
  handleSavePromptSection: (sectionKey: string, content: string) => Promise<void>;
}

export const CorePromptsSection: React.FC<CorePromptsSectionProps> = ({
  promptSections,
  sectionsLoading,
  sectionsError,
  savePromptSectionMutation,
  handleSavePromptSection,
}) => {
  const { activeModule } = useModule();

  // Helper function to find section by exact key match
  const findSectionByKey = (sectionKey: string) => {
    if (!promptSections) return undefined;
    return promptSections.find(section => section.section_key === sectionKey);
  };

  // Get sections using standardized naming convention - removed user documentation
  const getSystemInstructionsKey = () => {
    if (activeModule === 'k12') return 'system_instructions_k12';
    if (activeModule === 'tutoring') return 'system_instructions_tutoring';
    return 'system_instructions_post_secondary';
  };

  const getReportTemplateKey = () => {
    if (activeModule === 'k12') return 'markdown_report_template_k12';
    if (activeModule === 'tutoring') return 'markdown_report_template_tutoring';
    return 'markdown_report_template_post_secondary';
  };

  const getQcReportTemplateKey = () => {
    if (activeModule === 'k12') return 'markdown_report_template_qc_k12';
    if (activeModule === 'tutoring') return 'markdown_report_template_qc_tutoring';
    return 'markdown_report_template_qc_post_secondary';
  };
  
  const systemInstructionsSection = findSectionByKey(getSystemInstructionsKey());
  
  const reportTemplateSection = findSectionByKey(getReportTemplateKey()) || 
                               findSectionByKey(getQcReportTemplateKey());

  // Debug logging to help troubleshoot section detection
  React.useEffect(() => {
    if (promptSections) {
      console.log('=== CORE PROMPTS SECTION DEBUG (STREAMLINED) ===');
      console.log('Active module:', activeModule);
      console.log('Available sections:', promptSections.map(s => ({ key: s.section_key, title: s.title, module: s.module_type })));
      console.log('System instructions found:', !!systemInstructionsSection, systemInstructionsSection?.section_key);
      console.log('Report template found:', !!reportTemplateSection, reportTemplateSection?.section_key);
      console.log('User documentation REMOVED from display (streamlined approach)');
    }
  }, [promptSections, systemInstructionsSection, reportTemplateSection, activeModule]);

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="h-5 w-5" />
          Core Prompts
          <Badge variant="secondary" className="ml-2">Streamlined</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-blue-100/50">
            <TabsTrigger value="sections" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Prompt Sections
            </TabsTrigger>
            <TabsTrigger value="flow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Workflow className="h-4 w-4 mr-2" />
              Execution Flow
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections" className="mt-4">
            {sectionsError && <ErrorAlert error={sectionsError} />}
            <div className="space-y-6">
              {sectionsLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : (
                <>
                  {/* Enhanced System Instructions (now includes document processing guidance) */}
                  {systemInstructionsSection ? (
                    <SystemInstructionsCard
                      section={systemInstructionsSection}
                      onSave={handleSavePromptSection}
                      isSaving={savePromptSectionMutation.isPending}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-4 border border-dashed rounded-lg">
                      System Instructions section not found for {activeModule}. Available sections: {promptSections?.map(s => s.section_key).join(', ') || 'None'}
                    </div>
                  )}

                  {/* Report Template */}
                  {reportTemplateSection ? (
                    <ReportTemplateCard
                      section={reportTemplateSection}
                      onSave={handleSavePromptSection}
                      isSaving={savePromptSectionMutation.isPending}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-4 border border-dashed rounded-lg">
                      Report Template section not found for {activeModule}. Available sections: {promptSections?.map(s => s.section_key).join(', ') || 'None'}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                    <strong>Streamlined Approach:</strong> User Documentation Input has been integrated into the Enhanced System Instructions to eliminate redundancy and create a more focused 4-message structure.
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="flow" className="mt-4">
            <PromptExecutionFlow />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
