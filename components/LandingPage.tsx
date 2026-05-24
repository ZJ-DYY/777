
import React, { useEffect, useState } from 'react';
import { Activity, Shield, ChevronRight, Stethoscope, User, Smartphone, Database, Heart, Sun, Smile } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
              LC
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">LungCare AI</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Smart Oncology Platform</p>
            </div>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">核心功能</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">关于我们</a>
            <button 
              onClick={onLoginClick}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              登录平台
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Warm Background Gradient */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-orange-50 via-indigo-50/30 to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-8 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide shadow-sm">
              <Sun className="w-3 h-3 text-orange-500" />
              温暖 · 智能 · 全程陪伴
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1]">
              赋予生命 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-indigo-600">
                更多可能与希望
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              不仅仅是医疗管理，更是您康复路上的温暖伙伴。
              <br/>AI 智能分析报告，全天候身心关怀，连接医患的信任纽带。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onLoginClick} className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all group">
                开启康复旅程
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Hero Visual - Warm Lifestyle Image */}
          <div className={`relative transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
             <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl border-[6px] border-white rotate-1 hover:rotate-0 transition-transform duration-700">
               {/* Using a warm, nature/lifestyle image instead of a doctor */}
               <img 
                 src="https://images.unsplash.com/photo-1544367563-12123d8965cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                 alt="Warm Recovery Lifestyle" 
                 className="w-full h-auto object-cover scale-105 hover:scale-100 transition-transform duration-1000"
               />
               
               {/* Floating Glass Cards */}
               <div className="absolute -left-6 top-16 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 animate-float">
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-orange-100 rounded-lg"><Heart className="w-5 h-5 text-orange-500" /></div>
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase font-semibold">今日心情</p>
                     <p className="text-sm font-bold text-slate-800">充满希望</p>
                   </div>
                 </div>
               </div>

               <div className="absolute -right-6 bottom-20 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 animate-float" style={{animationDelay: '1.5s'}}>
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-100 rounded-lg"><Shield className="w-5 h-5 text-indigo-500" /></div>
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase font-semibold">AI 守护中</p>
                     <p className="text-sm font-bold text-slate-800">指标平稳</p>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Decorative Elements */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" />
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}/>
          </div>
        </div>
      </section>

      {/* Feature Split Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold tracking-wide text-sm uppercase">Functional Architecture</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-4">双端协同 · 科学管理</h2>
            <p className="text-slate-500">为医生提供科研级数据支持，为患者提供家人般的贴心呵护</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* Patient Card */}
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors duration-300">
                <User className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">患者端：智能康复伴侣</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                   <div className="mt-1"><Database className="w-5 h-5 text-blue-500"/></div>
                   <div>
                     <h4 className="font-bold text-slate-800">智能档案化 (Smart Archive)</h4>
                     <p className="text-sm text-slate-500 mt-1 leading-relaxed">拍照即可上传报告，OCR 技术自动提取 30+ 项关键指标，生成可视化趋势图。</p>
                   </div>
                </li>
                <li className="flex gap-4">
                   <div className="mt-1"><Heart className="w-5 h-5 text-blue-500"/></div>
                   <div>
                     <h4 className="font-bold text-slate-800">精准干预 (Precision Care)</h4>
                     <p className="text-sm text-slate-500 mt-1 leading-relaxed">基于症状打卡的“营养+康复+心理”三维干预矩阵，提供有据可依的生活建议。</p>
                   </div>
                </li>
              </ul>
            </div>

            {/* Doctor Card */}
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors duration-300">
                <Stethoscope className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">医生端：全景科研工作台</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                   <div className="mt-1"><Activity className="w-5 h-5 text-emerald-500"/></div>
                   <div>
                     <h4 className="font-bold text-slate-800">病区概览 (Ward Overview)</h4>
                     <p className="text-sm text-slate-500 mt-1 leading-relaxed">一屏掌握所有患者状态，智能筛选高风险病例，提升查房效率。</p>
                   </div>
                </li>
                <li className="flex gap-4">
                   <div className="mt-1"><Smartphone className="w-5 h-5 text-emerald-500"/></div>
                   <div>
                     <h4 className="font-bold text-slate-800">群体数据监控 (Cohort Analysis)</h4>
                     <p className="text-sm text-slate-500 mt-1 leading-relaxed">自动统计病区高频副作用，及时发现流行性异常，支持科研数据导出。</p>
                   </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
           <div className="flex items-center gap-2 mb-4 md:mb-0">
             <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">LC</div>
             <span className="font-bold text-white text-lg">LungCare AI</span>
           </div>
           <p className="text-sm">© 2023 LungCare Innovation Team. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
