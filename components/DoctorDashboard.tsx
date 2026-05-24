import React, { useState, useEffect } from 'react';
import { PatientProfile, UserRole } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, AlertTriangle, ChevronDown, Activity, FileText, ArrowLeft, Thermometer, Brain, Scale, Search, User, Gauge, PieChart } from 'lucide-react';
import { MOCK_PATIENTS } from '../services/mockData';
import { clsx } from 'clsx';
import WeeklyInsights from './WeeklyInsights';

interface DoctorDashboardProps {
  currentPatientId: string;
  onPatientSwitch: (id: string) => void;
  onUpdatePatient: (updated: PatientProfile) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ currentPatientId, onPatientSwitch, onUpdatePatient }) => {
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'DETAIL'>('OVERVIEW');
  const [highRiskPatients, setHighRiskPatients] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Scan for risks
  useEffect(() => {
    const riskList: any[] = [];
    MOCK_PATIENTS.forEach(p => {
      const checkIns = p.history?.checkIns || [];
      const lastCheckIn = checkIns[checkIns.length - 1];
      const alerts: string[] = [];
      let isRisk = false;

      if (lastCheckIn) {
        // DT Risk
        if (lastCheckIn.dtScore && lastCheckIn.dtScore >= 7) {
            alerts.push(`心理痛苦严重 (DT: ${lastCheckIn.dtScore})`);
            isRisk = true;
        }

        // Updated Risk Logic for HADS
        if (lastCheckIn.hadsResult) {
            if (lastCheckIn.hadsResult.anxietyScore >= 11) {
                alerts.push(`焦虑 (A: ${lastCheckIn.hadsResult.anxietyScore})`);
                isRisk = true;
            }
            if (lastCheckIn.hadsResult.depressionScore >= 11) {
                alerts.push(`抑郁 (D: ${lastCheckIn.hadsResult.depressionScore})`);
                isRisk = true;
            }
        }
        
        if (lastCheckIn.temperature > 37.8) {
             alerts.push(`发热 (${lastCheckIn.temperature}℃)`);
             isRisk = true;
        }
        if (lastCheckIn.weight && lastCheckIn.weight < 50) {
            alerts.push(`体重过低 (${lastCheckIn.weight}kg)`);
            isRisk = true;
        }
      }
      
      const reports = p.history?.reports || [];
      const lastReport = reports.find(r => r.reportType === 'LAB');
      if (lastReport && lastReport.metrics?.['WBC'] < 4) {
          alerts.push(`白细胞偏低 (${lastReport.metrics?.['WBC']})`);
          isRisk = true;
      }

      if (isRisk) {
          riskList.push({ ...p, alerts });
      }
    });
    setHighRiskPatients(riskList);
  }, []);

  const handlePatientSelect = (id: string) => {
    onPatientSwitch(id);
    setViewMode('DETAIL');
  };

  const patient = MOCK_PATIENTS.find(p => p.id === currentPatientId) || MOCK_PATIENTS[0];
  const reports = patient.history?.reports || [];
  const chartData = reports.filter(r => r.reportType === 'LAB').map(r => ({
    date: r.date,
    WBC: r.metrics?.['WBC'] || 0,
    Hb: r.metrics?.['Hemoglobin'] || 0
  })).reverse();

  // --- OVERVIEW MODE ---
  if (viewMode === 'OVERVIEW') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center mb-10">
           <div>
             <h1 className="text-3xl font-bold text-slate-900 tracking-tight">智能诊疗工作台</h1>
             <p className="text-slate-500 mt-1">Intelligent Clinical Workbench</p>
           </div>
           <div className="flex gap-4">
             <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">在管患者</span>
                <span className="text-2xl font-bold text-slate-800">{MOCK_PATIENTS.length}</span>
             </div>
             <div className="bg-red-50 px-6 py-3 rounded-xl shadow-sm border border-red-100 flex flex-col items-center">
                <span className="text-xs font-bold text-red-400 uppercase">高危预警</span>
                <span className="text-2xl font-bold text-red-600">{highRiskPatients.length}</span>
             </div>
           </div>
        </div>

        {/* RISK MONITOR */}
        {highRiskPatients.length > 0 && (
            <div className="mb-10 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> 高危患者预警 (High Risk Alerts)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {highRiskPatients.map((p) => (
                        <div key={p.id} onClick={() => handlePatientSelect(p.id)} className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-l-red-500 border-y border-r border-slate-200 cursor-pointer hover:shadow-xl hover:translate-y-[-2px] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle className="w-24 h-24 text-red-500"/></div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-lg">{p.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{p.name}</h4>
                                        <p className="text-xs text-slate-400">ID: {p.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 relative">
                                {p.alerts.map((alert: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                                        <Activity className="w-4 h-4" /> {alert}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-400">最近更新: {new Date().toLocaleDateString()}</span>
                                <span className="text-indigo-600 text-xs font-bold">调阅档案 &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ALL PATIENTS LIST */}
        <div>
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> 患者全景列表
             </h3>
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                         <tr>
                             <th className="px-6 py-4">基本信息</th>
                             <th className="px-6 py-4">诊断与治疗</th>
                             <th className="px-6 py-4">最新体征</th>
                             <th className="px-6 py-4">最新血象</th>
                             <th className="px-6 py-4">心理评估 (DT / HADS)</th>
                             <th className="px-6 py-4">临床决策</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {MOCK_PATIENTS.map(p => {
                             const checkIns = p.history?.checkIns || [];
                             const lastCheckIn = checkIns[checkIns.length - 1];
                             const reports = p.history?.reports || [];
                             const lastLab = reports.find(r => r.reportType === 'LAB');
                             const isRisk = highRiskPatients.find(rp => rp.id === p.id);
                             const hads = lastCheckIn?.hadsResult;
                             const dt = lastCheckIn?.dtScore ?? 0;

                             return (
                                 <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">{p.name.charAt(0)}</div>
                                             <div><div className="font-bold text-slate-800">{p.name}</div><div className="text-xs text-slate-400">ID: {p.id}</div></div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="font-medium text-slate-800">{p.diagnosis}</div>
                                         <div className="text-xs text-slate-500">{p.currentTreatment}</div>
                                     </td>
                                     <td className="px-6 py-4">
                                         {lastCheckIn ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs"><Thermometer className="w-3 h-3 text-slate-400"/> {lastCheckIn.temperature}℃</div>
                                                <div className="text-xs text-slate-500">{lastCheckIn.date}</div>
                                            </div>
                                         ) : <span className="text-slate-400">--</span>}
                                     </td>
                                     <td className="px-6 py-4 font-mono text-xs">
                                         {lastLab ? (
                                            <div>
                                                <div className={lastLab.metrics?.['WBC'] < 4 ? "text-red-600 font-bold" : ""}>WBC: {lastLab.metrics?.['WBC']}</div>
                                                <div>Hb: {lastLab.metrics?.['Hemoglobin']}</div>
                                            </div>
                                         ) : '--'}
                                     </td>
                                     <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", dt >= 7 ? "bg-red-100 text-red-600" : dt >= 4 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600")}>
                                                    DT: {dt}
                                                </span>
                                            </div>
                                            {hads ? (
                                                <div className="flex gap-2 text-[10px] text-slate-400">
                                                    <span>A:{hads.anxietyScore}</span>
                                                    <span>D:{hads.depressionScore}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <button onClick={() => handlePatientSelect(p.id)} className="text-indigo-600 font-bold hover:underline">详情</button>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
        </div>
      </div>
    );
  }

  // --- DETAIL MODE ---
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen relative">
      {/* Report Modal */}
      {showReportModal && <WeeklyInsights patient={patient} onClose={() => setShowReportModal(false)} />}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center mb-6 sticky top-0 z-10">
         <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('OVERVIEW')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-slate-800 flex items-center gap-2">
                {patient.name} 
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-normal">ID: {patient.id}</span>
              </h1>
              <p className="text-xs text-slate-500">{patient.diagnosis} | {patient.currentTreatment}</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:scale-105 transition-all"
             >
                 <PieChart className="w-4 h-4" /> 调阅周报
             </button>

             <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                <Users className="w-4 h-4" /> 快速切换 <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-20">
                    {MOCK_PATIENTS.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => handlePatientSelect(p.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-center"
                    >
                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                        {p.id === currentPatientId && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </button>
                    ))}
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> 
                  关键指标趋势 (WBC / Hb)
                </h3>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="WBC" name="白细胞" stroke="#4f46e5" strokeWidth={3} dot={{r:4}} />
                    <Line type="monotone" dataKey="Hb" name="血红蛋白" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex gap-2"><FileText className="w-5 h-5 text-indigo-500" /> 病历与报告归档</h3>
              <table className="w-full text-sm text-left text-slate-600">
                 <thead className="bg-slate-50 text-slate-700 uppercase text-xs">
                   <tr><th className="px-4 py-3">日期</th><th className="px-4 py-3">类型</th><th className="px-4 py-3">AI 摘要</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {(patient.history?.reports || []).map((r, i) => (
                     <tr key={i} className="hover:bg-slate-50">
                       <td className="px-4 py-3 font-medium">{r.date}</td>
                       <td className="px-4 py-3">
                           <span className={clsx("px-2 py-0.5 rounded text-xs font-bold", 
                               r.reportType==='LAB'?"bg-blue-100 text-blue-700":
                               r.reportType==='CT'?"bg-purple-100 text-purple-700":"bg-emerald-100 text-emerald-700")}>
                               {r.reportType}
                           </span>
                       </td>
                       <td className="px-4 py-3 truncate max-w-lg">{r.summary}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;