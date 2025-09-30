
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">127</div>
          <p className="text-xs text-gray-600">+12 from last month</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">89</div>
          <p className="text-xs text-gray-600">70% completion rate</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">In Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">23</div>
          <p className="text-xs text-gray-600">Avg. 3.2 days</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">15</div>
          <p className="text-xs text-gray-600">Awaiting documents</p>
        </CardContent>
      </Card>
    </div>
  );
};
