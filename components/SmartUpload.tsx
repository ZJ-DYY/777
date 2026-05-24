import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import { analyzeMedicalReport, fileToGenerativePart } from '../services/geminiService';
import { ReportData } from '../types';

interface SmartUploadProps {
  onReportAnalyzed: (data: ReportData) => void;
}

const SmartUpload: React.FC<SmartUploadProps> = ({ onReportAnalyzed }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzedReport, setAnalyzedReport] = useState<ReportData | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    setAnalyzedReport(null);

    try {
      const base64Data = await fileToGenerativePart(file);
      const reportData = await analyzeMedicalReport(base64Data, file.type);
      setAnalyzedReport(reportData);
    } catch (error) {
      alert("报告分析失败，请重试。");
      console.error(error);
      setFileName(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (analyzedReport) {
      onReportAnalyzed(analyzedReport);
    }
  };

  const handleReset = () => {
    setAnalyzedReport(null);
    setFileName(null);
  };

  if (analyzedReport) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI 智能分析完成
          </h3>
          <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-50/50 rounded-xl p-5 mb-6 border border-indigo-100">
          <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 临床解读摘要
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {analyzedReport.clinicalAnalysis || analyzedReport.summary}
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
             {Object.entries(analyzedReport.metrics || {}).slice(0, 3).map(([key, value]) => (
                 <span key={key} className="text-xs bg-white border border-indigo-100 px-2 py-1 rounded text-indigo-600 font-mono">
                     {key}: {value}
                 </span>
             ))}
             {Object.keys(analyzedReport.metrics || {}).length > 3 && (
                 <span className="text-xs text-indigo-400 px-1 py-1">...</span>
             )}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleReset} 
            className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            重新上传
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-colors hover:scale-[1.02]"
          >
            保存并查看详情 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" />
        智能报告归档
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        上传您的血液检查或 CT 扫描报告。AI 将自动提取关键指标并生成中文摘要。
      </p>

      <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <span className="text-indigo-600 font-bold text-lg">AI 正在深度分析...</span>
            <span className="text-sm text-slate-400 mt-2">正在识别关键指标与生成解读</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors shadow-sm">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <span className="text-slate-800 font-bold text-lg mb-1">点击上传图片</span>
            <span className="text-xs text-slate-400">支持 JPG, PNG 格式</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartUpload;