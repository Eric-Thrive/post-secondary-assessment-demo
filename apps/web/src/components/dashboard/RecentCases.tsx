
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface CaseData {
  id: number;
  studentName: string;
  dateSubmitted: string;
  status: string;
  documentsCount: number;
  priority: string;
}

export const RecentCases = () => {
  const recentCases: CaseData[] = [
    {
      id: 1,
      studentName: "Sarah Johnson",
      dateSubmitted: "2024-05-28",
      status: "In Review",
      documentsCount: 3,
      priority: "Standard"
    },
    {
      id: 2,
      studentName: "Marcus Chen",
      dateSubmitted: "2024-05-27",
      status: "Completed",
      documentsCount: 4,
      priority: "Urgent"
    },
    {
      id: 3,
      studentName: "Emily Rodriguez",
      dateSubmitted: "2024-05-26",
      status: "Pending Documents",
      documentsCount: 2,
      priority: "Standard"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "In Review":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Pending Documents":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Review":
        return "bg-blue-100 text-blue-800";
      case "Pending Documents":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Assessment Cases</CardTitle>
            <CardDescription>
              Latest student accommodation evaluations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All Cases
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCases.map((case_) => (
            <div
              key={case_.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(case_.status)}
                <div>
                  <h3 className="font-medium text-gray-900">{case_.studentName}</h3>
                  <p className="text-sm text-gray-600">
                    Submitted {case_.dateSubmitted} • {case_.documentsCount} documents
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className={`${case_.priority === 'Urgent' ? 'border-red-200 text-red-800' : 'border-gray-200 text-gray-700'}`}>
                  {case_.priority}
                </Badge>
                <Badge className={getStatusColor(case_.status)}>
                  {case_.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
