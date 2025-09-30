import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { CSVUploadWidget } from '@/components/CSVUploadWidget';
import { useCSVImport } from '@/hooks/useCSVImport';
import LookupTableCard from '../LookupTableCard';
import MappingConfigurationCard from '../MappingConfigurationCard';
import BarrierGlossaryCard from '../BarrierGlossaryCard';
import InferenceTriggersCard from '../InferenceTriggersCard';
import PlainLanguageMappingCard from '../PlainLanguageMappingCard';
import K12ItemMasterCard from '../K12ItemMasterCard';
import K12SupportLookupCard from '../K12SupportLookupCard';
import K12CautionLookupCard from '../K12CautionLookupCard';
import K12ObservationTemplateCard from '../K12ObservationTemplateCard';
import K12BarrierGlossaryCard from '../K12BarrierGlossaryCard';
import K12InferenceTriggersCard from '../K12InferenceTriggersCard';
import PromptCardSkeleton from '../PromptCardSkeleton';
import { ErrorAlert } from './ErrorAlert';

interface DataTablesSectionProps {
  // Post-Secondary props
  lookupTables: any[] | undefined;
  lookupLoading: boolean;
  lookupError: any;
  barrierGlossary: any[] | undefined;
  barrierLoading: boolean;
  barrierError: any;
  inferenceTriggers: any[] | undefined;
  triggersLoading: boolean;
  triggersError: any;
  plainLanguageMappings: any[] | undefined;
  mappingsLoading: boolean;
  mappingsError: any;
  mappingConfigurations: any[] | undefined;
  mappingConfigurationsLoading: boolean;
  mappingConfigurationsError: any;
  saveLookupTableMutation: { isPending: boolean };
  saveBarrierGlossaryMutation: { isPending: boolean };
  saveInferenceTriggerMutation: { isPending: boolean };
  savePlainLanguageMappingMutation: { isPending: boolean };
  saveMappingConfigurationMutation: { isPending: boolean };
  handleSaveLookupTable: (id: string, data: any) => Promise<void>;
  handleSaveBarrierGlossary: (id: string, data: any) => Promise<void>;
  handleDeleteBarrierGlossary: (id: string) => Promise<void>;
  handleSaveInferenceTrigger: (id: string, data: any) => Promise<void>;
  handleDeleteInferenceTrigger: (id: string) => Promise<void>;
  handleSavePlainLanguageMapping: (id: string, data: any) => Promise<void>;
  handleDeletePlainLanguageMapping: (id: string) => Promise<void>;
  handleSaveMappingConfiguration: (id: string, data: any) => Promise<void>;
  
  // K-12 props
  itemMaster?: any[] | undefined;
  itemMasterLoading?: boolean;
  itemMasterError?: any;
  supportLookup?: any[] | undefined;
  supportLookupLoading?: boolean;
  supportLookupError?: any;
  cautionLookup?: any[] | undefined;
  cautionLookupLoading?: boolean;
  cautionLookupError?: any;
  observationTemplate?: any[] | undefined;
  observationTemplateLoading?: boolean;
  observationTemplateError?: any;
  k12BarrierGlossary?: any[] | undefined;
  k12BarrierLoading?: boolean;
  k12BarrierError?: any;
  k12InferenceTriggers?: any[] | undefined;
  k12TriggersLoading?: boolean;
  k12TriggersError?: any;
  saveItemMasterMutation?: { isPending: boolean };
  saveSupportLookupMutation?: { isPending: boolean };
  saveCautionLookupMutation?: { isPending: boolean };
  saveObservationTemplateMutation?: { isPending: boolean };
  saveK12BarrierGlossaryMutation?: { isPending: boolean };
  saveK12InferenceTriggerMutation?: { isPending: boolean };
  handleSaveItemMaster?: (id: string, data: any) => Promise<void>;
  handleDeleteItemMaster?: (id: string) => Promise<void>;
  handleSaveSupportLookup?: (id: string, data: any) => Promise<void>;
  handleDeleteSupportLookup?: (id: string) => Promise<void>;
  handleSaveCautionLookup?: (id: string, data: any) => Promise<void>;
  handleDeleteCautionLookup?: (id: string) => Promise<void>;
  handleSaveObservationTemplate?: (canonical_key: string, grade_band: string, data: any) => Promise<void>;
  handleDeleteObservationTemplate?: (canonical_key: string, grade_band: string) => Promise<void>;
  handleSaveK12BarrierGlossary?: (canonical_key: string, data: any) => Promise<void>;
  handleDeleteK12BarrierGlossary?: (canonical_key: string) => Promise<void>;
  handleSaveK12InferenceTrigger?: (id: string, data: any) => Promise<void>;
  handleDeleteK12InferenceTrigger?: (id: string) => Promise<void>;
}

export const DataTablesSection: React.FC<DataTablesSectionProps> = (props) => {
  const { activeModule, isK12 } = useModule();
  const {
    isImporting,
    importItemMaster,
    importSupportLookup,
    importCautionLookup,
    importObservationTemplate,
    importK12BarrierGlossary,
    importK12InferenceTriggers,
  } = useCSVImport();

  if (isK12) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Database className="h-5 w-5" />
            K-12 Data Tables & References
            <Badge variant="secondary" className="ml-2">K-12 Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="item-master" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-green-100/50">
              <TabsTrigger value="item-master" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Item Master
              </TabsTrigger>
              <TabsTrigger value="support-lookup" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Support Lookup
              </TabsTrigger>
              <TabsTrigger value="caution-lookup" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Caution Lookup
              </TabsTrigger>
              <TabsTrigger value="observation-template" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Observation Templates
              </TabsTrigger>
              <TabsTrigger value="k12-barriers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Barriers
              </TabsTrigger>
              <TabsTrigger value="k12-triggers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
                K-12 Triggers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="item-master" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="item-master"
                  tableName="K-12 Item Master"
                  onUpload={importItemMaster}
                  isUploading={isImporting}
                />
                
                {props.itemMasterError && <ErrorAlert error={props.itemMasterError} />}
                {props.itemMasterLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.itemMaster && props.itemMaster.length > 0 ? (
                  props.itemMaster.map((item) => (
                    <K12ItemMasterCard 
                      key={item.id} 
                      item={item}
                      onSave={props.handleSaveItemMaster!}
                      onDelete={props.handleDeleteItemMaster!}
                      isSaving={props.saveItemMasterMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 item master entries found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="support-lookup" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="support-lookup"
                  tableName="K-12 Support Lookup"
                  onUpload={importSupportLookup}
                  isUploading={isImporting}
                />
                
                {props.supportLookupError && <ErrorAlert error={props.supportLookupError} />}
                {props.supportLookupLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.supportLookup && props.supportLookup.length > 0 ? (
                  props.supportLookup.map((support) => (
                    <K12SupportLookupCard 
                      key={support.id} 
                      support={support}
                      onSave={props.handleSaveSupportLookup!}
                      onDelete={props.handleDeleteSupportLookup!}
                      isSaving={props.saveSupportLookupMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 support lookup entries found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="caution-lookup" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="caution-lookup"
                  tableName="K-12 Caution Lookup"
                  onUpload={importCautionLookup}
                  isUploading={isImporting}
                />
                
                {props.cautionLookupError && <ErrorAlert error={props.cautionLookupError} />}
                {props.cautionLookupLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.cautionLookup && props.cautionLookup.length > 0 ? (
                  props.cautionLookup.map((caution) => (
                    <K12CautionLookupCard 
                      key={caution.id} 
                      caution={caution}
                      onSave={props.handleSaveCautionLookup!}
                      onDelete={props.handleDeleteCautionLookup!}
                      isSaving={props.saveCautionLookupMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 caution lookup entries found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="observation-template" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="observation-template"
                  tableName="K-12 Observation Template"
                  onUpload={importObservationTemplate}
                  isUploading={isImporting}
                />
                
                {props.observationTemplateError && <ErrorAlert error={props.observationTemplateError} />}
                {props.observationTemplateLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.observationTemplate && props.observationTemplate.length > 0 ? (
                  props.observationTemplate.map((template) => (
                    <K12ObservationTemplateCard 
                      key={`${template.canonical_key}-${template.grade_band}`}
                      template={template}
                      onSave={props.handleSaveObservationTemplate!}
                      onDelete={props.handleDeleteObservationTemplate!}
                      isSaving={props.saveObservationTemplateMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 observation templates found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="k12-barriers" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="k12-barriers"
                  tableName="K-12 Barrier Glossary"
                  onUpload={importK12BarrierGlossary}
                  isUploading={isImporting}
                />
                
                {props.k12BarrierError && <ErrorAlert error={props.k12BarrierError} />}
                {props.k12BarrierLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.k12BarrierGlossary && props.k12BarrierGlossary.length > 0 ? (
                  props.k12BarrierGlossary.map((glossary) => (
                    <K12BarrierGlossaryCard 
                      key={glossary.canonical_key} 
                      glossary={glossary}
                      onSave={props.handleSaveK12BarrierGlossary!}
                      onDelete={props.handleDeleteK12BarrierGlossary!}
                      isSaving={props.saveK12BarrierGlossaryMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 barrier glossary entries found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="k12-triggers" className="mt-4">
              <div className="space-y-6">
                <CSVUploadWidget
                  tableType="k12-triggers"
                  tableName="K-12 Inference Triggers"
                  onUpload={importK12InferenceTriggers}
                  isUploading={isImporting}
                />
                
                {props.k12TriggersError && <ErrorAlert error={props.k12TriggersError} />}
                {props.k12TriggersLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <PromptCardSkeleton key={index} />
                  ))
                ) : props.k12InferenceTriggers && props.k12InferenceTriggers.length > 0 ? (
                  props.k12InferenceTriggers.map((trigger) => (
                    <K12InferenceTriggersCard 
                      key={trigger.canonical_key} 
                      trigger={trigger}
                      onSave={props.handleSaveK12InferenceTrigger!}
                      onDelete={props.handleDeleteK12InferenceTrigger!}
                      isSaving={props.saveK12InferenceTriggerMutation?.isPending || false}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No K-12 inference triggers found. Check console for debugging info.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Post-Secondary view (unchanged)
  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Database className="h-5 w-5" />
          Data Tables & References
          <Badge variant="secondary" className="ml-2">Data</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lookup-tables" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-green-100/50">
            <TabsTrigger value="lookup-tables" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Lookup Tables
            </TabsTrigger>
            <TabsTrigger value="barriers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Barriers
            </TabsTrigger>
            <TabsTrigger value="triggers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Triggers
            </TabsTrigger>
            <TabsTrigger value="language" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Plain Language
            </TabsTrigger>
            <TabsTrigger value="mappings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Report Mapping
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lookup-tables" className="mt-4">
            {props.lookupError && <ErrorAlert error={props.lookupError} />}
            <div className="space-y-6">

              {props.lookupLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : props.lookupTables && props.lookupTables.length > 0 ? (
                props.lookupTables.map((table) => (
                  <LookupTableCard 
                    key={table.id} 
                    table={table}
                    onSave={props.handleSaveLookupTable}
                    isSaving={props.saveLookupTableMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No lookup tables found. Check console for debugging info.
                  <br />
                  Data received: {JSON.stringify(props.lookupTables)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="barriers" className="mt-4">
            {props.barrierError && <ErrorAlert error={props.barrierError} />}
            <div className="space-y-6">
              {props.barrierLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : props.barrierGlossary && props.barrierGlossary.length > 0 ? (
                props.barrierGlossary.map((glossary) => (
                  <BarrierGlossaryCard 
                    key={glossary.id} 
                    glossary={glossary}
                    onSave={props.handleSaveBarrierGlossary}
                    onDelete={props.handleDeleteBarrierGlossary}
                    isSaving={props.saveBarrierGlossaryMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No barrier glossary entries found. Check console for debugging info.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="triggers" className="mt-4">
            {props.triggersError && <ErrorAlert error={props.triggersError} />}
            <div className="space-y-6">
              {props.triggersLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : props.inferenceTriggers && props.inferenceTriggers.length > 0 ? (
                props.inferenceTriggers.map((trigger) => (
                  <InferenceTriggersCard 
                    key={trigger.id} 
                    trigger={trigger}
                    onSave={props.handleSaveInferenceTrigger}
                    onDelete={props.handleDeleteInferenceTrigger}
                    isSaving={props.saveInferenceTriggerMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No inference triggers found. Check console for debugging info.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="language" className="mt-4">
            {props.mappingsError && <ErrorAlert error={props.mappingsError} />}
            <div className="space-y-6">
              {props.mappingsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : props.plainLanguageMappings && props.plainLanguageMappings.length > 0 ? (
                props.plainLanguageMappings.map((mapping) => (
                  <PlainLanguageMappingCard 
                    key={mapping.id} 
                    mapping={mapping}
                    onSave={props.handleSavePlainLanguageMapping}
                    onDelete={props.handleDeletePlainLanguageMapping}
                    isSaving={props.savePlainLanguageMappingMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No plain language mappings found. Check console for debugging info.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-4">
            {props.mappingConfigurationsError && <ErrorAlert error={props.mappingConfigurationsError} />}
            <div className="space-y-6">
              {props.mappingConfigurationsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <PromptCardSkeleton key={index} />
                ))
              ) : props.mappingConfigurations && props.mappingConfigurations.length > 0 ? (
                props.mappingConfigurations.map((mapping) => (
                  <MappingConfigurationCard 
                    key={mapping.id} 
                    mapping={mapping}
                    onSave={props.handleSaveMappingConfiguration}
                    isSaving={props.saveMappingConfigurationMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No mapping configurations found. Check console for debugging info.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
