import React from 'react';
import { Sun, Moon, Quote } from 'lucide-react';
import { PatientProfile } from '../../types';

interface DailyGreetingProps {
  patient: PatientProfile;
  dailyQuote: string;
}

const DailyGreeting: React.FC<DailyGreetingProps> = ({ patient, dailyQuote }) => {
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const greeting = isMorning ? "早安" : isAfternoon ? "午安" : "晚上好";
  const Icon = isMorning ? Sun : Moon;
  const daysSince = Math.floor((new Date().getTime() - new Date(patient.treatmentStartDate || "2023-01-01").getTime()) / (1000 * 3600 * 24));

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-indigo-100 font-medium mb-2 text-sm">
            <Icon className="w-4 h-4" /> {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h2 className="text-3xl font-bold mb-4">{greeting}，{patient.name}</h2>
          <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <Quote className="w-8 h-8 text-indigo-200 opacity-50 flex-shrink-0" />
            <p className="text-sm md:text-base italic opacity-90 leading-relaxed font-serif">
              {dailyQuote}
            </p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <span className="text-xs uppercase tracking-widest opacity-70 mb-1">抗癌旅程</span>
          <span className="text-4xl font-bold font-mono">{daysSince}</span>
          <span className="text-xs opacity-70 mt-1">天坚强守护</span>
        </div>
      </div>
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
    </div>
  );
};

export default DailyGreeting;
