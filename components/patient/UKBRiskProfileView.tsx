import React, { useState } from 'react';
import { PatientProfile, UKBLifestyleProfile } from '../../types';
import { generateLifestyleReport } from '../../services/geminiService';
import { Fingerprint, Edit2, Cigarette, Wind, Moon, Apple, Sparkles, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface UKBRiskProfileViewProps {
  patient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
}

const UKBRiskProfileView: React.FC<UKBRiskProfileViewProps> = ({ patient, onUpdatePatient }) => {
  const [isGeneratingUKB, setIsGeneratingUKB] = useState(false);
  const [ukbAdvice, setUkbAdvice] = useState<string | null>(null);
  const [showUKBEditModal, setShowUKBEditModal] = useState(false);
  const [editingUKB, setEditingUKB] = useState<UKBLifestyleProfile | undefined>(patient.ukbProfile);

  if (!patient.ukbProfile) return <div className="text-center p-10 text-slate-500">暂无 UK Biobank 数据，请联系管理员完善档案。</div>;

  const { ukbProfile } = patient;

  // --- Simple Scoring Algorithm ---
  
  // 1. Tobacco Score: Base 100. If current smoker -> 0. Previous -> 60. Minus pack years.
  let tobaccoScore = ukbProfile.smokingStatus === 0 ? 100 : (ukbProfile.smokingStatus === 1 ? 60 : 20);
  tobaccoScore = Math.max(0, tobaccoScore - (ukbProfile.packYears));

  // 2. Sleep Score: Ideal 7-8 hours = 100. Deviate by 1 hour = -15. Quality adds up to 10 points.
  let sleepDist = Math.abs(ukbProfile.sleepDuration - 7.5);
  let sleepScore = Math.max(0, 90 - (sleepDist * 20)) + ukbProfile.sleepQualityScore; // Max 100

  // 3. Respiratory Score: Shortness of Breath (0-4) is heavy penalty. Wheezing is penalty.
  let respScore = 100 - (ukbProfile.shortnessOfBreath * 20) - (ukbProfile.hasWheezing ? 15 : 0);

  // 4. Activity Score: High(2)=100, Mod(1)=70, Low(0)=40. Add freq bonus.
  let activityScore = ukbProfile.activityLevel === 2 ? 90 : (ukbProfile.activityLevel === 1 ? 70 : 40);
  activityScore += Math.min(10, ukbProfile.weeklyExerciseFreq * 2);

  // 5. Nutrition Score: Complex logic for new fields
  // Base 60. Add fruits, veggies, fish. Subtract processed meat, sugar.
  let nutritionScore = 60;
  nutritionScore += (ukbProfile.fruitIntake * 5); // +5 per fruit
  nutritionScore += ((ukbProfile.cookedVegIntake + ukbProfile.rawVegIntake) * 3); // +3 per veg spoon
  if (ukbProfile.oilyFishIntake >= 1) nutritionScore += 10;
  if (ukbProfile.oilyFishIntake >= 2) nutritionScore += 5; // Bonus for 2+
  
  // Penalties
  if (ukbProfile.redMeatIntake >= 3) nutritionScore -= 10; // High red meat
  if (ukbProfile.processedMeatIntake >= 1) nutritionScore -= (ukbProfile.processedMeatIntake * 10);
  nutritionScore -= (ukbProfile.sugaryBeverageIntake * 5);

  nutritionScore = Math.max(0, Math.min(100, nutritionScore));


  const radarData = [
      { subject: '烟草控制', A: tobaccoScore, fullMark: 100 },
      { subject: '优质睡眠', A: sleepScore, fullMark: 100 },
      { subject: '心肺耐力', A: respScore, fullMark: 100 },
      { subject: '身体活跃度', A: activityScore, fullMark: 100 },
      { subject: '营养均衡', A: nutritionScore, fullMark: 100 },
  ];

  const overallScore = Math.round(radarData.reduce((a, b) => a + b.A, 0) / 5);

  const handleGenerateUKBAdvice = async () => {
    if (!patient.ukbProfile) return;
    setIsGeneratingUKB(true);
    // PASS TREATMENT CONTEXT
    const advice = await generateLifestyleReport(patient.ukbProfile, patient.currentTreatment, patient.name);
    setUkbAdvice(advice);
    setIsGeneratingUKB(false);
  };

  const handleSaveUKB = () => {
      if(editingUKB) {
          onUpdatePatient({ ...patient, ukbProfile: editingUKB });
          setShowUKBEditModal(false);
          // Clear old advice as data changed
          setUkbAdvice(null);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Fingerprint className="w-7 h-7 text-indigo-600" /> 生命时光 · 全维健康图谱
                </h2>
                <p className="text-slate-500 mt-2">基于 UK Biobank 标准的生命力监测模型，为您守护每一份生机。</p>
            </div>
            <button 
                onClick={() => { setEditingUKB(patient.ukbProfile); setShowUKBEditModal(true); }}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all font-bold text-sm"
            >
                <Edit2 className="w-4 h-4" /> 更新我的生活状态
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Radar & Overall */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="relative w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="健康得分" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#818cf8" fillOpacity={0.3} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <div className="text-4xl font-black text-indigo-600 tracking-tight">{overallScore}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">活力指数</div>
                    </div>
                </div>
            </div>

            {/* Right: Detailed Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smoking */}
                <div className={clsx("p-5 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-md", ukbProfile.smokingStatus === 2 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                    <div className={clsx("p-3 rounded-full shrink-0", ukbProfile.smokingStatus === 2 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                        <Cigarette className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">烟草暴露</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            {ukbProfile.smokingStatus === 2 ? "当前吸烟 (高风险)" : ukbProfile.smokingStatus === 1 ? "已戒烟 (值得鼓励)" : "从不吸烟 (保持优秀)"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">累积包年: {ukbProfile.packYears}年</p>
                    </div>
                </div>

                {/* Respiratory */}
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 shrink-0">
                        <Wind className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">呼吸功能储备</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            气短程度: {ukbProfile.shortnessOfBreath === 0 ? "无气短" : ukbProfile.shortnessOfBreath + " 级"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">喘鸣症状: {ukbProfile.hasWheezing ? "偶有" : "无"}</p>
                    </div>
                </div>

                {/* Sleep */}
                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600 shrink-0">
                        <Moon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">睡眠修复力</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            每日时长: {ukbProfile.sleepDuration}小时
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-slate-400">质量评分:</span>
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={clsx("w-1.5 h-1.5 rounded-full", i < (ukbProfile.sleepQualityScore / 2) ? "bg-purple-400" : "bg-purple-200")}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nutrition & Activity */}
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600 shrink-0">
                        <Apple className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">营养与运动</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            运动: {ukbProfile.activityLevel === 0 ? "需加强" : ukbProfile.activityLevel === 1 ? "适中" : "充沛"}
                        </p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">蔬果 {ukbProfile.fruitIntake + ukbProfile.cookedVegIntake + ukbProfile.rawVegIntake}份</span>
                            {ukbProfile.processedMeatIntake > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">加工肉警示</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* AI Generation Section */}
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> AI 康复挚友 · 深度关怀建议
                </h3>
                {!ukbAdvice && (
                    <button 
                        onClick={handleGenerateUKBAdvice}
                        disabled={isGeneratingUKB}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center gap-2 hover:-translate-y-0.5"
                    >
                        {isGeneratingUKB ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                        生成我的专属建议
                    </button>
                )}
            </div>

            {isGeneratingUKB && (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center animate-pulse flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-500">正在分析您的 UKB 全维数据...</p>
                </div>
            )}

            {ukbAdvice && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
                    <div className="prose prose-indigo max-w-none text-sm text-slate-600">
                        <div dangerouslySetInnerHTML={{ __html: ukbAdvice }} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UKBRiskProfileView;
