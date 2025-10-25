import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function DeidentificationHeroCard() {
  return (
    <Card className="border border-gray-200">
      <CardContent className="space-y-4 pt-6">
        <Alert className="border-amber-200 bg-gray-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-gray-700">
            All documents must be de-identified before uploading to remove any personally 
            identifiable information (PII) including:
            <ul className="mt-2 ml-4 list-disc list-inside space-y-1">
              <li>Names (students, parents, teachers, staff)</li>
              <li>Dates of birth and addresses</li>
              <li>Social security numbers</li>
              <li>Student ID numbers</li>
              <li>Other protected health information</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}