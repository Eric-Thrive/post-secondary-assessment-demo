
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService, PromptSection } from '@/services/promptService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useModule } from '@/contexts/ModuleContext';
import { ArrowUp, ArrowDown, Eye, Play, Settings, Database, FileText, Brain, BookOpen, Repeat, MessageCircle } from 'lucide-react';

const PromptExecutionFlow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeModule } = useModule();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: executionFlow, isLoading } = useQuery({
    queryKey: ['prompt-execution-flow', activeModule],
    queryFn: () => promptService.getExecutionFlow(activeModule)
  });

  const { data: combinedPrompt, isLoading: previewLoading } = useQuery({
    queryKey: ['combined-prompt-preview', activeModule],
    queryFn: () => promptService.previewCombinedPrompt(activeModule),
    enabled: previewOpen
  });

  const { data: barrierGlossary, isLoading: glossaryLoading } = useQuery({
    queryKey: ['barrier-glossary', activeModule],
    queryFn: () => promptService.loadBarrierGlossary(activeModule),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: inferenceTriggers, isLoading: triggersLoading } = useQuery({
    queryKey: ['inference-triggers', activeModule],
    queryFn: () => promptService.loadInferenceTriggers(activeModule),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: plainLanguageMappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['plain-language-mappings', activeModule],
    queryFn: () => promptService.loadPlainLanguageMappings(activeModule),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: lookupTables, isLoading: lookupLoading } = useQuery({
    queryKey: ['lookup-tables', activeModule],
    queryFn: () => promptService.loadLookupTables(activeModule),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: mappingConfigurations, isLoading: mappingLoading } = useQuery({
    queryKey: ['mapping-configurations', activeModule],
    queryFn: () => promptService.loadMappingConfigurations(activeModule),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ sectionKey, newOrder }: { sectionKey: string; newOrder: number }) =>
      promptService.updatePromptOrder(sectionKey, newOrder, activeModule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-execution-flow', activeModule] });
      queryClient.invalidateQueries({ queryKey: ['combined-prompt-preview', activeModule] });
      toast({
        title: "Order Updated",
        description: "Prompt execution order has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const movePrompt = (prompt: PromptSection, direction: 'up' | 'down') => {
    if (!executionFlow) return;

    const allPrompts = [...executionFlow.systemPrompts, ...executionFlow.instructionPrompts];
    const currentIndex = allPrompts.findIndex(p => p.id === prompt.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = allPrompts[currentIndex - 1].execution_order;
      if (newOrder !== undefined) {
        updateOrderMutation.mutate({ sectionKey: prompt.section_key, newOrder: newOrder });
      }
    } else if (direction === 'down' && currentIndex < allPrompts.length - 1) {
      const newOrder = allPrompts[currentIndex + 1].execution_order;
      if (newOrder !== undefined) {
        updateOrderMutation.mutate({ sectionKey: prompt.section_key, newOrder: newOrder });
      }
    }
  };

  // Helper function to get the count of items in each message type
  const getDataCounts = () => {
    return {
      mappingCount: mappingConfigurations?.length || 0,
      lookupCount: lookupTables?.length || 0,
      barrierCount: barrierGlossary?.length || 0,
      triggerCount: inferenceTriggers?.length || 0,
      languageCount: plainLanguageMappings?.length || 0,
      systemCount: executionFlow?.systemPrompts.length || 0,
      instructionCount: executionFlow?.instructionPrompts.length || 0
    };
  };

  const dataCounts = getDataCounts();

  if (isLoading || glossaryLoading || triggersLoading || mappingsLoading || lookupLoading || mappingLoading) {
    return <div className="p-4">Loading execution flow and data sources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prompt Execution Flow</h2>
          <p className="text-muted-foreground">
            The multi-message architecture sends 6 system messages + 1 user message
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview Combined
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Combined Prompt Preview</DialogTitle>
                <DialogDescription>
                  This is exactly what will be sent to the AI based on the current execution order
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] w-full">
                {previewLoading ? (
                  <div className="p-4">Loading preview...</div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded">
                    {combinedPrompt}
                  </pre>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Multi-message system overview card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Multi-Message Architecture
            </CardTitle>
            <CardDescription>
              Our AI receives 6 system messages with different data components, followed by 1 user message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Card className="flex-1 min-w-[180px] bg-blue-50 border-blue-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <Database className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-blue-800">1. Mapping Table</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-blue-700">Field mapping configuration</p>
                    <Badge variant="outline" className="mt-1 bg-blue-100">
                      {dataCounts.mappingCount} mappings
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[180px] bg-green-50 border-green-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-green-800">2. Lookup Tables</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-green-700">Reference data for accommodations</p>
                    <Badge variant="outline" className="mt-1 bg-green-100">
                      {dataCounts.lookupCount} tables
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[180px] bg-purple-50 border-purple-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="text-purple-800">3. Barrier Glossary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-purple-700">Definitions of barriers & examples</p>
                    <Badge variant="outline" className="mt-1 bg-purple-100">
                      {dataCounts.barrierCount} barriers
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Card className="flex-1 min-w-[180px] bg-amber-50 border-amber-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-amber-600" />
                      <span className="text-amber-800">4. Inference Triggers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-amber-700">Pattern recognition instructions</p>
                    <Badge variant="outline" className="mt-1 bg-amber-100">
                      {dataCounts.triggerCount} triggers
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[180px] bg-red-50 border-red-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <Repeat className="w-4 h-4 mr-2 text-red-600" />
                      <span className="text-red-800">5. Plain Language</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-red-700">Technical to plain language</p>
                    <Badge variant="outline" className="mt-1 bg-red-100">
                      {dataCounts.languageCount} mappings
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[180px] bg-slate-100 border-slate-200">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-slate-600" />
                      <span className="text-slate-800">6. System Instructions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-slate-700">Main system prompt</p>
                    <Badge variant="outline" className="mt-1 bg-slate-200">
                      {dataCounts.systemCount} prompts
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Plus {dataCounts.instructionCount} instruction prompts sent to the AI</span>
              </div>
              <Badge variant="secondary">7. User Message with Student Data</Badge>
            </div>
          </CardFooter>
        </Card>

        {/* System prompts card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Prompts
              <Badge variant="secondary">{executionFlow?.systemPrompts.length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              System prompts that establish the AI's role and context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {executionFlow?.systemPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{prompt.execution_order}</Badge>
                  <div>
                    <h4 className="font-medium">{prompt.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.content.length} characters • v{prompt.version}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePrompt(prompt, 'up')}
                    disabled={index === 0 || updateOrderMutation.isPending}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePrompt(prompt, 'down')}
                    disabled={index === (executionFlow?.systemPrompts.length || 0) - 1 || updateOrderMutation.isPending}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instruction prompts card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Instruction Prompts
              <Badge variant="secondary">{executionFlow?.instructionPrompts.length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Section-specific instructions that guide the AI's analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {executionFlow?.instructionPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{prompt.execution_order}</Badge>
                  <div>
                    <h4 className="font-medium">{prompt.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.content.length} characters • v{prompt.version}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePrompt(prompt, 'up')}
                    disabled={index === 0 || updateOrderMutation.isPending}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePrompt(prompt, 'down')}
                    disabled={index === (executionFlow?.instructionPrompts.length || 0) - 1 || updateOrderMutation.isPending}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptExecutionFlow;
