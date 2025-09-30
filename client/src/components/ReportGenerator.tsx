
import React from 'react';
import BaseReportGenerator from '@/components/BaseReportGenerator';
import { MODULE_CONFIGS } from '@/types/moduleConfig';

const ReportGenerator: React.FC = () => {
  return <BaseReportGenerator config={MODULE_CONFIGS.general} />;
};

export default ReportGenerator;
