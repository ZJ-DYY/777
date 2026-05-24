import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { PatientSubSection } from '../App';
import DailyGreeting from './patient/DailyGreeting';
import WeeklyReportNotification from './patient/WeeklyReportNotification';
import MedicalRecordModule from './patient/MedicalRecordModule';
import UKBRiskProfileView from './patient/UKBRiskProfileView';
import SymptomCheckIn from './patient/SymptomCheckIn';
import WeeklyInsights from './WeeklyInsights';

interface PatientDashboardProps {
  patient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
  activeSection: PatientSubSection;
  onChangeSection: (section: PatientSubSection) => void;
}

const DAILY_QUOTES = [
    "世界上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。——罗曼·罗兰",
    "每一个不曾起舞的日子，都是对生命的辜负。——尼采",
    "希望能像阳光一样，不偏不倚地洒在每个人身上。",
    "在此刻的身体里，安住下来。",
    "通过裂缝，光才能照进来。"
];

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onUpdatePatient, activeSection, onChangeSection }) => {
  const [dailyQuote, setDailyQuote] = useState('');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  useEffect(() => {
    setDailyQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen pb-20">
       {activeSection === 'care-center' && (
          <div className="animate-fade-in">
             <DailyGreeting patient={patient} dailyQuote={dailyQuote} />
             <WeeklyReportNotification setShowWeeklyReport={setShowWeeklyReport} />
             <SymptomCheckIn 
                patient={patient} 
                onUpdatePatient={onUpdatePatient} 
                onShowWeeklyReport={() => setShowWeeklyReport(true)}
             />
          </div>
       )}

       {activeSection === 'medical-records' && (
          <MedicalRecordModule patient={patient} onUpdatePatient={onUpdatePatient} />
       )}

       {activeSection === 'ukb-profile' && (
          <UKBRiskProfileView patient={patient} onUpdatePatient={onUpdatePatient} />
       )}

       {showWeeklyReport && (
          <WeeklyInsights 
            isOpen={showWeeklyReport} 
            onClose={() => setShowWeeklyReport(false)} 
            patient={patient} 
          />
       )}
    </div>
  );
};

export default PatientDashboard;
