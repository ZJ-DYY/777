
import React, { useState } from 'react';
import { UserRole } from '../types';
import { DOCTOR_CREDENTIALS, MOCK_PATIENTS } from '../services/mockData';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole, userId: string) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
      });

      if (!response.ok) {
        throw new Error('登录失败');
      }

      const data = await response.json();
      if (data.success) {
        onLoginSuccess(data.user.role, data.user.id);
      } else {
        throw new Error('登录失败');
      }
    } catch (err) {
      setError('账号或密码错误。请检查输入。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 animate-scale-in relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 mt-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 mb-4">
            LC
          </div>
          <h2 className="text-2xl font-bold text-slate-900">欢迎回来</h2>
          <p className="text-slate-500">LungCare AI 智能管理平台</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">账号 (ID)</label>
            <input 
              type="text" 
              value={id}
              onChange={e => setId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入账号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入密码"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '登 录'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-2">测试账号提示</p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>医生: 账号 000 / 密码 000</p>
            <p>患者: 账号 888, 555, 333, 222, 111 (密码同账号)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
