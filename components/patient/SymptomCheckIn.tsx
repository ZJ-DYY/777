import React, { useState, useMemo, useEffect } from 'react';
import { PatientProfile, SymptomEntry, HADSResult, StructuredAdvice } from '../../types';
import BodyMap from '../BodyMap';
import WeeklyInsights from '../WeeklyInsights';
import { SYMPTOM_OPTIONS, generateSmartAdvice, getSideEffectsForTreatment, HADS_QUESTIONS, calculateHADSLevel, CTCAE_STANDARDS, TERM_MAPPING, GENERIC_GRADES } from '../../services/knowledgeBase';
import { Heart, Activity, Thermometer, Smile, AlertCircle, Sparkles, Plus, ChevronRight, ArrowLeft, CheckCircle, BrainCircuit, Pill, ShieldCheck, Zap, Info, CalendarCheck, HeartPulse, Stethoscope, Utensils, Clock, Quote, Gauge, X, PauseCircle, Siren, Leaf, Coffee, Scale, ArrowRight, Check, Battery, BedDouble, PersonStanding, Star, Move, Fish, ClipboardCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface SymptomCheckInProps {
  patient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
  onShowWeeklyReport: () => void;
}

const SymptomCheckIn: React.FC<SymptomCheckInProps> = ({ patient, onUpdatePatient, onShowWeeklyReport }) => {
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'INTRO' | 'VITALS' | 'MEDS' | 'DT' | 'HADS' | 'SYMPTOMS' | 'RESULT'>('INTRO');
  
  // Vitals
  const [weight, setWeight] = useState<number>(patient.weight || 60);
  const [temp, setTemp] = useState<number>(36.5);
  
  // Medication Adherence
  const [medicationStatus, setMedicationStatus] = useState<'Taken' | 'Skipped' | 'Not Required'>('Taken');

  // DT (Distress Thermometer)
  const [dtScore, setDtScore] = useState<number>(0);

  // HADS
  const [hadsAnswers, setHadsAnswers] = useState<Record<number, number>>({});
  const [currentHadsQuestion, setCurrentHadsQuestion] = useState(0);

  // Symptoms
  const [symptomLog, setSymptomLog] = useState<SymptomEntry[]>([]);
  const [adviceList, setAdviceList] = useState<StructuredAdvice[]>([]);
  
  // Modal/Selection State
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [customSymptomText, setCustomSymptomText] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState<number>(1);
  const [symptomDuration, setSymptomDuration] = useState<string>('半天');
  
  // Weekly Report Modal State
  // const [showWeeklyReport, setShowWeeklyReport] = useState(false); // Removed local state

  // Predicted Side Effects for Quick Select
  const likelySideEffects = useMemo(() => getSideEffectsForTreatment(patient.currentTreatment), [patient.currentTreatment]);

  const DURATION_OPTIONS = ['< 1小时', '1-4 小时', '半天', '全天', '持续多日'];

  // Helper to get current severity description
  const getCurrentGradeDescription = useMemo(() => {
    const finalSymptomName = selectedSymptom === 'OTHER' ? customSymptomText : selectedSymptom;
    if (!finalSymptomName) return "";

    const mappedName = TERM_MAPPING[finalSymptomName] || finalSymptomName;
    const standard = CTCAE_STANDARDS[mappedName];
    
    // Use explicit definition if available, otherwise generic
    const specificDesc = standard?.grades[symptomSeverity as 1|2|3|4|5];
    return specificDesc || GENERIC_GRADES[symptomSeverity] || "暂无详细描述";
  }, [selectedSymptom, customSymptomText, symptomSeverity]);

  useEffect(() => {
    // Robust local date generation
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const today = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
    
    const todaysCheckIn = patient.history?.checkIns?.find(c => c.date === today);

    if (todaysCheckIn) {
        setIsCheckedInToday(true);
        setCheckInStep('RESULT');
        const symptoms = (todaysCheckIn.symptomLog || []).map(s => s.specificSymptom);
        
        // Create details for CTCAE check
        const symptomDetails = (todaysCheckIn.symptomLog || []).map(s => ({
            name: s.specificSymptom,
            severity: s.severity
        }));

        const advice = generateSmartAdvice(patient.currentTreatment, symptoms, todaysCheckIn.hadsResult, todaysCheckIn.dtScore, symptomDetails);
        setAdviceList(advice);
        if (todaysCheckIn.dtScore !== undefined) setDtScore(todaysCheckIn.dtScore);
        if (todaysCheckIn.medicationAdherence) setMedicationStatus(todaysCheckIn.medicationAdherence);
    } else {
        setCheckInStep('INTRO');
    }
  }, [patient]);

  const handleHadsAnswer = (score: number) => {
      setHadsAnswers(prev => ({ ...prev, [HADS_QUESTIONS[currentHadsQuestion].id]: score }));
      if (currentHadsQuestion < HADS_QUESTIONS.length - 1) {
          setCurrentHadsQuestion(prev => prev + 1);
      } else {
          setCheckInStep('SYMPTOMS');
      }
  };

  const calculateScores = (): HADSResult => {
      let aScore = 0;
      let dScore = 0;
      HADS_QUESTIONS.forEach(q => {
          const score = hadsAnswers[q.id] || 0;
          if (q.category === 'A') aScore += score;
          else dScore += score;
      });
      return {
          anxietyScore: aScore,
          anxietyLevel: calculateHADSLevel(aScore),
          depressionScore: dScore,
          depressionLevel: calculateHADSLevel(dScore)
      };
  };

  const handleBodyPartClick = (part: string) => {
    setActiveBodyPart(part);
    setModalSymptoms(SYMPTOM_OPTIONS[part] || SYMPTOM_OPTIONS['General']);
    setSelectedSymptom(null);
    setCustomSymptomText('');
    setSymptomSeverity(1);
    setSymptomDuration('半天');
  };

  const confirmSymptom = () => {
      const finalSymptomName = selectedSymptom === 'OTHER' ? customSymptomText : selectedSymptom;
      
      if (!finalSymptomName) return;

      const newEntry: SymptomEntry = {
        bodyPart: activeBodyPart || 'General',
        specificSymptom: finalSymptomName,
        severity: symptomSeverity,
        duration: symptomDuration
      };
      
      const existingIdx = symptomLog.findIndex(s => s.specificSymptom === finalSymptomName);
      let newLog = [...symptomLog];
      if (existingIdx >= 0) {
        newLog[existingIdx] = newEntry;
      } else {
        newLog.push(newEntry);
      }
      setSymptomLog(newLog);
      setActiveBodyPart(null);
  };

  const toggleQuickSymptom = (name: string) => {
      const existing = symptomLog.find(s => s.specificSymptom === name);
      if (existing) {
          setSymptomLog(symptomLog.filter(s => s.specificSymptom !== name));
      } else {
          const newEntry: SymptomEntry = {
              bodyPart: 'General',
              specificSymptom: name,
              severity: 1,
              duration: '半天'
          };
          setSymptomLog([...symptomLog, newEntry]);
      }
  };

  const submitCheckIn = () => {
    const hadsResult = calculateScores();
    const symptoms = symptomLog.map(s => s.specificSymptom);
    
    // Create details for CTCAE check
    const symptomDetails = symptomLog.map(s => ({
        name: s.specificSymptom,
        severity: s.severity
    }));
    
    const advice = generateSmartAdvice(patient.currentTreatment, symptoms, hadsResult, dtScore, symptomDetails);
    setAdviceList(advice);

    // Robust local date generation
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const today = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);

    const newCheckIn = {
      date: today,
      temperature: temp,
      weight: weight,
      dtScore: dtScore,
      medicationAdherence: medicationStatus,
      hadsResult: hadsResult,
      symptomLog: symptomLog,
      mood: 'Neutral' as const, 
      notes: ''
    };

    onUpdatePatient({
      ...patient,
      weight: weight,
      history: {
        ...(patient.history || { reports: [], checkIns: [] }),
        checkIns: [...(patient.history?.checkIns || []), newCheckIn]
      }
    });

    setIsCheckedInToday(true);
    setCheckInStep('RESULT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (checkInStep === 'INTRO') {
      return (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center max-w-2xl mx-auto animate-fade-in">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarCheck className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">开启今日健康打卡</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">只需 2 分钟，记录您的身体状况，AI 将为您生成个性化的康复建议。</p>
              <button 
                  onClick={() => setCheckInStep('VITALS')}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              >
                  开始打卡 <ArrowRight className="w-5 h-5" />
              </button>
          </div>
      );
  }

  if (checkInStep === 'VITALS') {
      return (
          <div className="max-w-2xl mx-auto animate-slide-in">
              <div className="mb-8 flex items-center gap-4">
                  <button onClick={() => setCheckInStep('INTRO')}><ArrowLeft className="text-slate-400" /></button>
                  <h2 className="text-xl font-bold text-slate-800">第一步：基础体征</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                  <div>
                      <label className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                          <Scale className="w-5 h-5 text-indigo-600" /> 今日体重 (kg)
                      </label>
                      <div className="flex items-center gap-4">
                          <input 
                              type="number" 
                              value={weight} 
                              onChange={e => setWeight(parseFloat(e.target.value))}
                              className="text-4xl font-bold text-indigo-600 w-32 border-b-2 border-indigo-100 focus:border-indigo-600 outline-none bg-transparent text-center"
                          />
                          <span className="text-slate-400 font-medium">kg</span>
                      </div>
                  </div>
                  <div>
                      <label className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                          <Thermometer className="w-5 h-5 text-red-500" /> 今日体温 (°C)
                      </label>
                      <div className="flex items-center gap-4">
                          <input 
                              type="number" 
                              value={temp} 
                              onChange={e => setTemp(parseFloat(e.target.value))}
                              className="text-4xl font-bold text-red-500 w-32 border-b-2 border-red-100 focus:border-red-500 outline-none bg-transparent text-center"
                          />
                          <span className="text-slate-400 font-medium">°C</span>
                      </div>
                  </div>
                  <button onClick={() => setCheckInStep('MEDS')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-4 hover:bg-slate-800 transition-all">
                      下一步
                  </button>
              </div>
          </div>
      );
  }

  if (checkInStep === 'MEDS') {
      return (
          <div className="max-w-2xl mx-auto animate-slide-in">
              <div className="mb-8 flex items-center gap-4">
                  <button onClick={() => setCheckInStep('VITALS')}><ArrowLeft className="text-slate-400" /></button>
                  <h2 className="text-xl font-bold text-slate-800">第二步：服药情况</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 gap-4">
                      {[
                          { id: 'Taken', label: '已按时服药', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                          { id: 'Skipped', label: '今日漏服/停药', icon: X, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                          { id: 'Not Required', label: '今日无需服药', icon: PauseCircle, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' }
                      ].map(opt => (
                          <button 
                              key={opt.id}
                              onClick={() => setMedicationStatus(opt.id as any)}
                              className={clsx(
                                  "p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                                  medicationStatus === opt.id ? `${opt.bg} ${opt.border}` : "bg-white border-slate-100 hover:border-slate-200"
                              )}
                          >
                              <opt.icon className={clsx("w-8 h-8", opt.color)} />
                              <span className={clsx("font-bold text-lg", opt.color)}>{opt.label}</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setCheckInStep('DT')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-8 hover:bg-slate-800 transition-all">
                      下一步
                  </button>
              </div>
          </div>
      );
  }

  if (checkInStep === 'DT') {
      return (
          <div className="max-w-2xl mx-auto animate-slide-in">
              <div className="mb-8 flex items-center gap-4">
                  <button onClick={() => setCheckInStep('MEDS')}><ArrowLeft className="text-slate-400" /></button>
                  <h2 className="text-xl font-bold text-slate-800">第三步：心理痛苦温度计 (DT)</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-slate-600 mb-8 text-center">请评估您过去一周所经历的平均痛苦程度 (0-10)</p>
                  
                  <div className="relative h-12 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full mb-12">
                      <input 
                          type="range" 
                          min="0" 
                          max="10" 
                          step="1" 
                          value={dtScore} 
                          onChange={e => setDtScore(parseInt(e.target.value))}
                          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      <div 
                          className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl border-4 border-white flex items-center justify-center font-black text-2xl text-slate-800 transition-all z-10 pointer-events-none"
                          style={{ left: `calc(${dtScore * 10}% - 32px)` }}
                      >
                          {dtScore}
                      </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                      <span>无痛苦</span>
                      <span>中度痛苦</span>
                      <span>极度痛苦</span>
                  </div>

                  <button onClick={() => setCheckInStep('HADS')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-12 hover:bg-slate-800 transition-all">
                      下一步
                  </button>
              </div>
          </div>
      );
  }

  if (checkInStep === 'HADS') {
      const q = HADS_QUESTIONS[currentHadsQuestion];
      const progress = ((currentHadsQuestion + 1) / HADS_QUESTIONS.length) * 100;

      return (
          <div className="max-w-2xl mx-auto animate-slide-in">
              <div className="mb-8 flex items-center gap-4">
                  <button onClick={() => {
                      if (currentHadsQuestion > 0) setCurrentHadsQuestion(prev => prev - 1);
                      else setCheckInStep('DT');
                  }}><ArrowLeft className="text-slate-400" /></button>
                  <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-800">第四步：情绪评估 (HADS)</h2>
                      <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{currentHadsQuestion + 1} / {HADS_QUESTIONS.length}</span>
              </div>
              
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center leading-relaxed">{q.text}</h3>
                  <div className="space-y-3">
                      {q.options.map((opt, idx) => (
                          <button 
                              key={idx}
                              onClick={() => handleHadsAnswer(q.scores[idx])}
                              className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium text-slate-600 transition-all text-left"
                          >
                              {opt}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (checkInStep === 'SYMPTOMS') {
      return (
          <div className="max-w-6xl mx-auto animate-slide-in pb-20">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setCheckInStep('HADS')}><ArrowLeft className="text-slate-400" /></button>
                      <h2 className="text-xl font-bold text-slate-800">第五步：症状记录</h2>
                  </div>
                  <button onClick={submitCheckIn} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> 完成打卡
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <PersonStanding className="w-5 h-5 text-indigo-600" /> 点击身体部位添加
                      </h3>
                      <div className="h-[500px] relative bg-slate-50 rounded-2xl border border-slate-100">
                          <BodyMap onPartClick={handleBodyPartClick} selectedParts={symptomLog.map(s => s.bodyPart)} />
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                      {/* Quick Select */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-amber-500" /> 常见副作用快速选择
                          </h3>
                          <div className="flex flex-wrap gap-3">
                              {likelySideEffects.map(se => (
                                  <button 
                                      key={se.name}
                                      onClick={() => toggleQuickSymptom(se.name)}
                                      className={clsx(
                                          "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                          symptomLog.find(s => s.specificSymptom === se.name) 
                                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105" 
                                              : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"
                                      )}
                                  >
                                      {se.name}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Selected List */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[300px]">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <ClipboardCheck className="w-5 h-5 text-emerald-600" /> 已记录症状 ({symptomLog.length})
                          </h3>
                          {symptomLog.length === 0 ? (
                              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                  暂无记录，请点击左侧身体部位或上方快速选择
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  {symptomLog.map((log, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                          <div className="flex items-center gap-4">
                                              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white", log.severity >= 3 ? "bg-red-500" : "bg-indigo-500")}>
                                                  {log.severity}
                                              </div>
                                              <div>
                                                  <h4 className="font-bold text-slate-800">{log.specificSymptom}</h4>
                                                  <p className="text-xs text-slate-500">{log.duration} · {log.bodyPart}</p>
                                              </div>
                                          </div>
                                          <button onClick={() => setSymptomLog(symptomLog.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 p-2">
                                              <X className="w-5 h-5" />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Symptom Detail Modal */}
              {activeBodyPart && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                              <h3 className="font-bold text-lg text-slate-800">添加症状 - {activeBodyPart}</h3>
                              <button onClick={() => setActiveBodyPart(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                          </div>
                          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                              <div className="mb-6">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">症状类型</label>
                                  <div className="flex flex-wrap gap-2">
                                      {modalSymptoms.map(sym => (
                                          <button 
                                              key={sym}
                                              onClick={() => setSelectedSymptom(sym)}
                                              className={clsx(
                                                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                                  selectedSymptom === sym ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                              )}
                                          >
                                              {sym}
                                          </button>
                                      ))}
                                      <button 
                                          onClick={() => setSelectedSymptom('OTHER')}
                                          className={clsx(
                                              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                              selectedSymptom === 'OTHER' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                          )}
                                      >
                                          其他
                                      </button>
                                  </div>
                              </div>
                              
                              {selectedSymptom === 'OTHER' && (
                                  <div className="mb-6 animate-fade-in">
                                      <input 
                                          type="text" 
                                          value={customSymptomText}
                                          onChange={e => setCustomSymptomText(e.target.value)}
                                          placeholder="请输入具体症状描述..."
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                          autoFocus
                                      />
                                  </div>
                              )}

                              {selectedSymptom && (
                                  <div className="animate-fade-in space-y-6">
                                      <div>
                                          <div className="flex justify-between items-center mb-2">
                                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">严重程度 (CTCAE 分级参考)</label>
                                              <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", symptomSeverity >= 3 ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600")}>
                                                  {symptomSeverity} 级
                                              </span>
                                          </div>
                                          <input 
                                              type="range" 
                                              min="1" 
                                              max="5" 
                                              step="1" 
                                              value={symptomSeverity} 
                                              onChange={e => setSymptomSeverity(parseInt(e.target.value))}
                                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                          />
                                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                              <span className="font-bold text-slate-800 block mb-1">分级定义：</span>
                                              {getCurrentGradeDescription}
                                          </div>
                                      </div>

                                      <div>
                                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">持续时间</label>
                                          <div className="grid grid-cols-3 gap-2">
                                              {DURATION_OPTIONS.map(opt => (
                                                  <button 
                                                      key={opt}
                                                      onClick={() => setSymptomDuration(opt)}
                                                      className={clsx(
                                                          "py-2 rounded-lg text-xs font-medium transition-all border",
                                                          symptomDuration === opt ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white border-slate-200 text-slate-500"
                                                      )}
                                                  >
                                                      {opt}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                              <button onClick={() => setActiveBodyPart(null)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">取消</button>
                              <button 
                                  onClick={confirmSymptom}
                                  disabled={!selectedSymptom || (selectedSymptom === 'OTHER' && !customSymptomText)}
                                  className="px-8 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
                              >
                                  确认添加
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // RESULT VIEW
  return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-20">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <Sparkles className="w-7 h-7 text-indigo-600" /> 今日康复建议
                  </h2>
                  <p className="text-slate-500 mt-2">基于您的打卡数据生成的智能方案。</p>
              </div>
              <div className="flex gap-3">
                  <button onClick={onShowWeeklyReport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4" /> 查看周报
                  </button>
                  <button onClick={() => setCheckInStep('SYMPTOMS')} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors text-sm">
                      补充记录
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Advice Feed */}
              <div className="lg:col-span-2 space-y-6">
                  {adviceList.length === 0 ? (
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-8 h-8 text-emerald-500" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">状态良好</h3>
                          <p className="text-slate-500">您今天没有报告明显不适，继续保持！</p>
                      </div>
                  ) : (
                      adviceList.map((advice, idx) => (
                          <div key={idx} className={clsx(
                              "bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md",
                              advice.severityLevel === 'Severe' ? "border-red-200 bg-red-50/30" : 
                              advice.severityLevel === 'Moderate' ? "border-amber-200 bg-amber-50/30" : 
                              advice.isComforting ? "border-indigo-100 bg-indigo-50/30" : "border-slate-100"
                          )}>
                              <div className="flex items-start gap-4">
                                  <div className={clsx("p-3 rounded-xl shrink-0", 
                                      advice.category === 'SideEffect' ? "bg-blue-100 text-blue-600" :
                                      advice.category === 'Nutrition' ? "bg-green-100 text-green-600" :
                                      advice.category === 'Psych' ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600"
                                  )}>
                                      {advice.category === 'SideEffect' && <Pill className="w-6 h-6" />}
                                      {advice.category === 'Nutrition' && <Utensils className="w-6 h-6" />}
                                      {advice.category === 'Psych' && <BrainCircuit className="w-6 h-6" />}
                                      {advice.category === 'Lifestyle' && <Leaf className="w-6 h-6" />}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                                          {advice.title}
                                          {advice.severityLevel === 'Severe' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">需关注</span>}
                                      </h4>
                                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{advice.content}</p>
                                      {advice.source && (
                                          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                                              <ShieldCheck className="w-3 h-3" /> 来源: {advice.source}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              {/* Right: Summary Cards */}
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-indigo-600" /> 今日数据
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl">
                              <span className="text-xs text-slate-400 block mb-1">体重</span>
                              <span className="text-xl font-black text-slate-800">{weight} <span className="text-xs font-normal text-slate-400">kg</span></span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl">
                              <span className="text-xs text-slate-400 block mb-1">体温</span>
                              <span className="text-xl font-black text-slate-800">{temp} <span className="text-xs font-normal text-slate-400">°C</span></span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl col-span-2 flex items-center justify-between">
                              <div>
                                  <span className="text-xs text-slate-400 block mb-1">服药状态</span>
                                  <span className={clsx("font-bold", medicationStatus === 'Taken' ? "text-emerald-600" : "text-red-600")}>
                                      {medicationStatus === 'Taken' ? '已按时服用' : medicationStatus === 'Skipped' ? '未服用' : '无需服用'}
                                  </span>
                              </div>
                              {medicationStatus === 'Taken' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                          </div>
                      </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
                      <div className="relative z-10">
                          <h3 className="font-bold mb-2 flex items-center gap-2">
                              <BrainCircuit className="w-5 h-5" /> 心理能量站
                          </h3>
                          <div className="flex items-end gap-2 mb-4">
                              <span className="text-4xl font-black">{10 - dtScore}</span>
                              <span className="text-sm opacity-70 mb-1">/ 10 能量值</span>
                          </div>
                          <p className="text-xs opacity-80 leading-relaxed">
                              {dtScore < 4 ? "您的心理状态非常平稳，继续保持这份积极的心态！" : "感到压力是正常的，试着做几次深呼吸，或者听听舒缓的音乐。"}
                          </p>
                      </div>
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                  </div>
              </div>
          </div>

          {/* {showWeeklyReport && <WeeklyInsights isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} patient={patient} />} */}
      </div>
  );
};

export default SymptomCheckIn;
