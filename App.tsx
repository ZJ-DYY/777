
import React, { useState, useEffect } from 'react';
import { UserRole, PatientProfile } from './types';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SecureChat from './components/SecureChat';
import { LayoutDashboard, LogOut, ArrowLeft, ChevronDown, ChevronRight, ClipboardCheck, FolderOpen, HeartPulse, Fingerprint } from 'lucide-react';
import { MOCK_PATIENTS } from './services/mockData';
import { clsx } from 'clsx';

type AppState = 'LANDING' | 'LOGIN' | 'DASHBOARD';
export type PatientSubSection = 'medical-records' | 'care-center' | 'ukb-profile'; // Added UKB Profile

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [patients, setPatients] = useState<PatientProfile[]>(MOCK_PATIENTS);
  
  // Navigation State
  const [patientActiveSection, setPatientActiveSection] = useState<PatientSubSection>('care-center');
  const [doctorSelectedPatientId, setDoctorSelectedPatientId] = useState<string>('888');
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLoginSuccess = (role: UserRole, id: string) => {
    setCurrentUserRole(role);
    setCurrentUserId(id);
    if (role === UserRole.PATIENT) {
      setDoctorSelectedPatientId(id);
      setPatientActiveSection('care-center'); // Default to care center
    }
    setAppState('DASHBOARD');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // We need to map the role string from backend to UserRole enum if needed
          // But backend returns 'PATIENT' or 'DOCTOR' which matches enum string values
          handleLoginSuccess(data.user.role as UserRole, data.user.id);
        }
      } catch (e) {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout failed", e);
    }
    setAppState('LANDING');
    setCurrentUserRole(null);
    setCurrentUserId('');
    setIsChatOpen(false);
  };

  const updatePatientData = (updated: PatientProfile) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // --- RENDER LOGIC ---

  if (appState === 'LANDING') {
    return <LandingPage onLoginClick={() => setAppState('LOGIN')} />;
  }

  if (appState === 'LOGIN') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setAppState('LANDING')} />;
  }

  const activePatient = patients.find(p => p.id === (currentUserRole === UserRole.PATIENT ? currentUserId : doctorSelectedPatientId)) || patients[0];

  const renderSidebar = () => {
    if (currentUserRole === UserRole.PATIENT) {
      return (
        <div className="space-y-4 mt-6">
          <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">健康管理</div>
          
          <NavButton 
            active={patientActiveSection === 'care-center'} 
            onClick={() => setPatientActiveSection('care-center')} 
            icon={HeartPulse} 
            label="康复与打卡" 
          />
          
          <NavButton 
            active={patientActiveSection === 'medical-records'} 
            onClick={() => setPatientActiveSection('medical-records')} 
            icon={FolderOpen} 
            label="医疗档案中心" 
          />

          <NavButton 
            active={patientActiveSection === 'ukb-profile'} 
            onClick={() => setPatientActiveSection('ukb-profile')} 
            icon={Fingerprint} 
            label="UKB 全生命周期画像" 
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-1 mt-6">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">医生工作台</p>
          <NavButton active={true} onClick={() => {}} icon={LayoutDashboard} label="病区指挥中心" />
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Premium Background Texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200 flex-shrink-0 fixed h-full z-20 hidden lg:flex lg:flex-col shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-slate-100/50">
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-indigo-200">LC</div>
           <div>
             <h1 className="font-bold text-slate-800 leading-tight">LungCare AI</h1>
             <p className="text-[10px] text-slate-400 font-medium tracking-wide">SMART ONCOLOGY</p>
           </div>
        </div>

        <div className="flex-1 py-2 px-4 overflow-y-auto custom-scrollbar">
          {renderSidebar()}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
               {currentUserRole === UserRole.DOCTOR ? 'Dr' : activePatient.name.charAt(0)}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-700">{currentUserRole === UserRole.DOCTOR ? '李华 主任' : activePatient.name}</p>
               <p className="text-[10px] text-slate-400">ID: {currentUserRole === UserRole.DOCTOR ? '000' : currentUserId}</p>
             </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-500 bg-red-50 py-2 rounded-lg hover:bg-red-100 transition-colors">
             <LogOut className="w-3 h-3" /> 退出登录
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 transition-all duration-300 relative z-10">
        <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
           <span className="font-bold text-indigo-600">LungCare AI</span>
           <button onClick={handleLogout} className="p-2 text-slate-500"><LogOut className="w-5 h-5"/></button>
        </div>

        {currentUserRole === UserRole.PATIENT ? (
          <PatientDashboard 
            patient={activePatient} 
            onUpdatePatient={updatePatientData} 
            activeSection={patientActiveSection} 
            onChangeSection={setPatientActiveSection}
          />
        ) : (
          <DoctorDashboard 
            currentPatientId={doctorSelectedPatientId} 
            onPatientSwitch={setDoctorSelectedPatientId}
            onUpdatePatient={updatePatientData} 
          />
        )}
      </main>

      {/* GLOBAL FLOATING CHAT */}
      {currentUserRole && (
          <SecureChat 
              isOpen={isChatOpen}
              onToggle={() => setIsChatOpen(!isChatOpen)}
              messages={activePatient.messages}
              currentUserRole={currentUserRole}
              currentUserName={activePatient.name}
              onSendMessage={(txt) => {
                  const newMsg = {
                      id: Date.now().toString(),
                      sender: currentUserRole,
                      content: txt,
                      timestamp: new Date().toISOString(),
                      isRead: false
                  };
                  updatePatientData({
                      ...activePatient,
                      messages: [...(activePatient.messages || []), newMsg]
                  });
              }}
          />
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
      active ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={clsx("w-5 h-5", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
    {label}
  </button>
);

export default App;