import React from 'react';
import { PieChart, ChevronRight } from 'lucide-react';

interface WeeklyReportNotificationProps {
  setShowWeeklyReport: (show: boolean) => void;
}

const WeeklyReportNotification: React.FC<WeeklyReportNotificationProps> = ({ setShowWeeklyReport }) => (
  <div 
    onClick={() => setShowWeeklyReport(true)}
    className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 mb-8 border border-amber-200 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between group"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
        <PieChart className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          第 12 周健康守护报告已生成
          <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
        </h3>
        <p className="text-xs text-amber-700/70">包含近期身心状态分析与生活建议</p>
      </div>
    </div>
    <div className="bg-white/50 p-2 rounded-full text-amber-600 group-hover:bg-white group-hover:text-amber-700 transition-colors">
      <ChevronRight className="w-5 h-5" />
    </div>
  </div>
);

export default WeeklyReportNotification;
