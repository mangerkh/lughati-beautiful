import React, { useState } from 'react';
import { Lock, User, LogIn, ArrowRight } from 'lucide-react';

export default function TeacherLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'خطأ في سجل الدخول');
      }

      onLoginSuccess(data.token, data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', width: '100%' }}>
      <div className="content-box" style={{ padding: '36px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900' }}>
            تسجيل دخول المعلم
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>
            لوحة إدارة وتخصيص المنهاج الدراسي
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', marginBottom: '8px', color: '#1e293b' }}>
              اسم المستخدم:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '17px',
                  fontFamily: 'Tajawal, sans-serif'
                }}
              />
              <User size={20} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '16px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', marginBottom: '8px', color: '#1e293b' }}>
              كلمة المرور:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '17px',
                  fontFamily: 'Tajawal, sans-serif'
                }}
              />
              <Lock size={20} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '16px' }} />
            </div>
          </div>

          <button
            type="submit"
            className="hero-start-btn"
            disabled={loading}
            style={{
              background: '#0284c7',
              color: 'white',
              justifyContent: 'center',
              width: '100%',
              padding: '14px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <LogIn size={20} />
            <span>{loading ? 'جارٍ تسجيل الدخول...' : 'دخول اللوحة'}</span>
          </button>

          <button
            type="button"
            className="teacher-login-btn"
            onClick={onCancel}
            style={{ justifyContent: 'center', marginTop: '8px' }}
          >
            <ArrowRight size={18} />
            <span>العودة لواجهة الطالب</span>
          </button>
        </form>
      </div>
    </div>
  );
}
