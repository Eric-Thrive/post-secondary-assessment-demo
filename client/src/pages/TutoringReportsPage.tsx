import BaseReportGenerator from "@/components/BaseReportGenerator";
import { MODULE_CONFIGS } from "@/types/moduleConfig";

const TutoringReportsPage = () => {
  return <BaseReportGenerator config={MODULE_CONFIGS.tutoring} />;
};

export default TutoringReportsPage;