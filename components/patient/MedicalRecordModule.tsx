import React, { useState, useMemo } from 'react';
import { PatientProfile, ReportData } from '../../types';
import SmartUpload from '../SmartUpload';
import { METRIC_DICT, REF_RANGES, CHART_COLORS } from '../../services/knowledgeBase';
import { ArrowLeft, Sparkles, FileText, ArrowUp, ArrowDown, Activity, Plus, TrendingUp, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

interface MedicalRecordModuleProps {
  patient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
}

const MedicalRecordModule: React.FC<MedicalRecordModuleProps> = ({ patient, onUpdatePatient }) => {
  const [recordMode, setRecordMode] = useState<'LIST' | 'DETAIL' | 'UPLOAD'>('LIST');
  const [recordTab, setRecordTab] = useState<'LAB' | 'CT'>('LAB');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['WBC', 'Hemoglobin']); 

  // Medical records with date sorting
  const reports = (patient.history?.reports || []).filter(r => r.reportType === recordTab).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allMetrics = useMemo(() => {
      const keys = new Set<string>();
      reports.forEach(r => Object.keys(r.metrics || {}).forEach(k => keys.add(k)));
      return Array.from(keys);
  }, [reports]);

  const chartData = useMemo(() => {
      return [...reports].reverse().map(r => ({
          date: r.date,
          // Format YYYY-MM for better axis labels on long duration
          displayDate: r.date.substring(0, 7), 
          fullDate: r.date,
          ...(r.metrics || {})
      }));
  }, [reports]);

  if (recordMode === 'UPLOAD') {
    return (
      <div className="max-w-3xl mx-auto animate-scale-in">
         <button onClick={() => setRecordMode('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6">
           <ArrowLeft className="w-4 h-4" /> 返回列表
         </button>
         <SmartUpload onReportAnalyzed={(data) => {
             const updated = { ...patient, history: { ...(patient.history || { reports: [], checkIns: [] }), reports: [...(patient.history?.reports || []), data] }};
             onUpdatePatient(updated);
             setSelectedReport(data);
             setRecordMode('DETAIL');
         }} />
      </div>
    );
  }

  if (recordMode === 'DETAIL' && selectedReport) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in pb-20 relative">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-4">
              <button onClick={() => setRecordMode('LIST')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   {selectedReport.reportType === 'LAB' ? '检验报告' : 'CT 影像报告'}
                   <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{selectedReport.date}</span>
                 </h2>
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)] min-h-[600px]">
           <div className="bg-black/5 rounded-2xl border border-slate-200 overflow-hidden relative group flex items-center justify-center bg-slate-100">
              {selectedReport.imageUrl ? (
                <img src={selectedReport.imageUrl} alt="Original Report" className="max-w-full max-h-full object-contain" />
              ) : <div className="text-slate-400">原图未存档</div>}
           </div>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-indigo-600" /> AI 智能分析结果
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> 临床解读摘要</h4>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReport.clinicalAnalysis || selectedReport.summary}</div>
                 </div>
                 <div className="space-y-3">
                    {/* Metric List with Normal Range Highlight */}
                    {Object.entries(selectedReport.metrics || {}).map(([key, value]) => {
                       const range = REF_RANGES[key];
                       const isHigh = range && value > range.max;
                       const isLow = range && value < range.min;
                       const isAbnormal = isHigh || isLow;

                       return (
                          <div key={key} className={clsx("flex items-center justify-between p-4 rounded-xl border transition-colors", isAbnormal ? "border-red-100 bg-red-50/30" : "border-slate-100")}>
                             <div>
                                <div className="flex items-center gap-2">
                                   <span className={clsx("text-sm font-medium", isAbnormal ? "text-red-700" : "text-slate-700")}>{METRIC_DICT[key] || key}</span>
                                   {isHigh && <ArrowUp className="w-3 h-3 text-red-500 font-bold" />}
                                   {isLow && <ArrowDown className="w-3 h-3 text-red-500 font-bold" />}
                                </div>
                                {range && (
                                   <div className="text-xs text-slate-400 mt-0.5">
                                      参考值: {range.min} - {range.max} <span className="scale-75 inline-block origin-left">{range.unit}</span>
                                   </div>
                                )}
                             </div>
                             <span className={clsx("text-lg font-mono font-bold", isAbnormal ? "text-red-600" : "text-slate-800")}>{value}</span>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <Activity className="w-7 h-7 text-indigo-600" /> 医疗档案中心
           </h2>
           <p className="text-slate-500 mt-2">您的专属健康数据银行。</p>
         </div>
         <button onClick={() => setRecordMode('UPLOAD')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
           <Plus className="w-5 h-5" /> 上传新报告
         </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
          {[
              { id: 'LAB', label: '血常规 / 生化' },
              { id: 'CT', label: 'CT 影像专栏' }
          ].map(tab => (
              <button 
                  key={tab.id}
                  onClick={() => setRecordTab(tab.id as any)}
                  className={clsx(
                      "px-6 py-2 rounded-lg font-bold text-sm transition-all relative",
                      recordTab === tab.id ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50"
                  )}
              >
                  {tab.label}
                  {recordTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
              </button>
          ))}
      </div>

      {recordTab === 'LAB' && allMetrics.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" /> 核心指标合并趋势
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                      <div className="w-3 h-3 bg-slate-200/50 rounded-sm"></div> 
                      灰色区域代表医学参考正常范围
                  </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                  {allMetrics.map((m, i) => (
                      <button 
                          key={m}
                          onClick={() => {
                              if (selectedMetrics.includes(m)) setSelectedMetrics(selectedMetrics.filter(x => x !== m));
                              else setSelectedMetrics([...selectedMetrics, m]);
                          }}
                          className={clsx(
                              "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2",
                              selectedMetrics.includes(m) ? "bg-white shadow-sm ring-1" : "bg-slate-50 border-slate-100 text-slate-400 opacity-60 grayscale"
                          )}
                          style={selectedMetrics.includes(m) ? { 
                              color: CHART_COLORS[i % CHART_COLORS.length], 
                              borderColor: CHART_COLORS[i % CHART_COLORS.length], 
                              '--tw-ring-color': CHART_COLORS[i % CHART_COLORS.length] 
                          } as React.CSSProperties : {}}
                      >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedMetrics.includes(m) ? CHART_COLORS[i % CHART_COLORS.length] : '#cbd5e1' }} />
                          {METRIC_DICT[m] || m}
                      </button>
                  ))}
              </div>
              <div className="h-[400px] w-full bg-gradient-to-b from-white to-slate-50/50 rounded-xl p-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                              dataKey="displayDate" 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              tickMargin={10}
                              axisLine={false}
                              tickLine={false}
                          />
                          <YAxis 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              axisLine={false}
                              tickLine={false}
                          />
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                              labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '12px' }}
                              labelFormatter={(label, payload) => {
                                  if (payload && payload.length > 0) return payload[0].payload.fullDate;
                                  return label;
                              }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle"/>
                          
                          {/* Render Reference Areas for selected metrics */}
                          {selectedMetrics.map((m, i) => {
                              const range = REF_RANGES[m];
                              if (!range) return null;
                              return (
                                  <ReferenceArea 
                                      key={`ref-${m}`}
                                      y1={range.min} 
                                      y2={range.max} 
                                      fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                      fillOpacity={0.05}
                                      strokeOpacity={0}
                                      ifOverflow="extendDomain"
                                  />
                              );
                          })}

                          {selectedMetrics.map((m, i) => (
                              <Line 
                                  key={m} 
                                  type="monotone" 
                                  dataKey={m} 
                                  name={METRIC_DICT[m] || m}
                                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                                  strokeWidth={3} 
                                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                                  activeDot={{r: 6, strokeWidth: 0}}
                                  connectNulls
                              />
                          ))}
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      <div className="space-y-4">
          {reports.map(r => (
              <div key={r.id} onClick={() => { setSelectedReport(r); setRecordMode('DETAIL'); }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex justify-between items-center">
                  <div className="flex items-start gap-4">
                      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0", r.reportType === 'LAB' ? "bg-blue-500" : "bg-purple-500")}>
                          {r.reportType}
                      </div>
                      <div>
                          <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-slate-800">{r.date}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">ID: {r.id}</span>
                          </div>
                          <p className="text-slate-600 text-sm max-w-2xl line-clamp-1">{r.summary}</p>
                          {/* Summary Metrics Preview */}
                          <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(r.metrics || {}).slice(0, 4).map(([k, v]) => {
                                  const range = REF_RANGES[k];
                                  const isAbnormal = range && (v > range.max || v < range.min);
                                  return (
                                      <span key={k} className={clsx(
                                          "text-[10px] px-2 py-1 rounded border",
                                          isAbnormal ? "bg-red-50 border-red-100 text-red-600 font-bold" : "bg-slate-50 border-slate-100 text-slate-500"
                                      )}>
                                          {k}: {v}
                                      </span>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
              </div>
          ))}
      </div>
    </div>
  );
};

export default MedicalRecordModule;
