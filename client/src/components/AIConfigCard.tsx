
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aiConfigService, AIConfig } from '@/services/aiConfigService';

interface AIConfigCardProps {
  config: AIConfig;
  onUpdate: (config: Partial<AIConfig>) => Promise<void>;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4.1', label: 'GPT-4.1', limit: 1000000 },
  { value: 'o3-2025-04-16', label: 'O3 (2025-04-16)', limit: 65536 },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini (2025-04-16)', limit: 65536 },
  { value: 'gpt-4o', label: 'GPT-4o', limit: 16384 },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', limit: 16384 }
];

export const AIConfigCard: React.FC<AIConfigCardProps> = ({ config, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    model_name: config.model_name,
    temperature: config.temperature.toString(),
    max_tokens: config.max_tokens.toString(),
  });
  const { toast } = useToast();

  // Initialize edit values from current config
  useEffect(() => {
    setEditValues({
      model_name: config.model_name,
      temperature: config.temperature.toString(),
      max_tokens: config.max_tokens.toString(),
    });
  }, [config]);

  const currentModel = MODEL_OPTIONS.find(m => m.value === editValues.model_name);
  const maxTokensNum = parseInt(editValues.max_tokens);
  const isTokenLimitExceeded = currentModel && maxTokensNum > currentModel.limit;

  const handleUpdate = async (updates: Partial<AIConfig>) => {
    try {
      await onUpdate(updates);
      toast({
        title: "Configuration Updated",
        description: "AI configuration has been successfully updated"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update AI configuration",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      const temperature = parseFloat(editValues.temperature);
      let maxTokens = parseInt(editValues.max_tokens);

      // Validate temperature
      if (isNaN(temperature) || temperature < 0 || temperature > 2) {
        toast({
          title: "Invalid Temperature",
          description: "Temperature must be between 0 and 2",
          variant: "destructive"
        });
        return;
      }

      // Validate and adjust max_tokens
      if (isNaN(maxTokens) || maxTokens < 1) {
        toast({
          title: "Invalid Max Tokens",
          description: "Max tokens must be a positive number",
          variant: "destructive"
        });
        return;
      }

      // Auto-adjust if exceeding model limit
      if (currentModel && maxTokens > currentModel.limit) {
        maxTokens = currentModel.limit;
        toast({
          title: "Token Limit Adjusted",
          description: `Max tokens adjusted to ${currentModel.limit} (model limit)`,
        });
      }

      await onUpdate({
        model_name: editValues.model_name,
        temperature,
        max_tokens: maxTokens
      });

      toast({
        title: "Configuration Updated",
        description: "AI configuration has been successfully updated"
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update AI configuration",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditValues({
      model_name: config.model_name,
      temperature: config.temperature.toString(),
      max_tokens: config.max_tokens.toString(),
    });
    setIsEditing(false);
  };

  const handleModelChange = (modelName: string) => {
    setEditValues(prev => {
      const newModel = MODEL_OPTIONS.find(m => m.value === modelName);
      const currentMaxTokens = parseInt(prev.max_tokens);
      
      // Auto-adjust max_tokens if it exceeds the new model's limit
      let adjustedMaxTokens = prev.max_tokens;
      if (newModel && currentMaxTokens > newModel.limit) {
        adjustedMaxTokens = newModel.limit.toString();
      }
      
      return {
        ...prev,
        model_name: modelName,
        max_tokens: adjustedMaxTokens
      };
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          AI Configuration
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            Active
          </Badge>
        </CardTitle>
        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={isTokenLimitExceeded}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={editValues.model_name} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span>{model.label}</span>
                        <span className="text-xs text-gray-500">Max tokens: {model.limit.toLocaleString()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={editValues.temperature}
                onChange={(e) => setEditValues(prev => ({ ...prev, temperature: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Controls randomness (0 = deterministic, 2 = very creative)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="1"
                max={currentModel?.limit || 32768}
                value={editValues.max_tokens}
                onChange={(e) => setEditValues(prev => ({ ...prev, max_tokens: e.target.value }))}
                className={isTokenLimitExceeded ? "border-red-500" : ""}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Maximum response length
                </span>
                {currentModel && (
                  <span className="text-gray-500">
                    Limit: {currentModel.limit.toLocaleString()}
                  </span>
                )}
              </div>
              {isTokenLimitExceeded && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Max tokens exceeds model limit of {currentModel?.limit.toLocaleString()}. 
                    Value will be automatically adjusted to {currentModel?.limit.toLocaleString()}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Model</Label>
              <p className="font-medium">{config.model_name}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Temperature</Label>
              <p className="font-medium">{config.temperature}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Max Tokens</Label>
              <p className="font-medium">{config.max_tokens.toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
