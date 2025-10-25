
import React from 'react';
import BaseReportGenerator from '@/components/BaseReportGenerator';
import { MODULE_CONFIGS } from '@/types/moduleConfig';

const K12ReportGenerator: React.FC = () => {
  return <BaseReportGenerator config={MODULE_CONFIGS.k12} />;
};

export default K12ReportGenerator;
