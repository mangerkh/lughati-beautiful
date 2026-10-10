import React, { useState } from 'react';
import { Sparkles, Key, X, User } from 'lucide-react';

export default function StudentLoginModal({ onLoginSuccess, onClose, promptText }) {
  const [code, setCode] = useState('');
  const [useNameMode, setUseNameMode] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!useNameMode) {
      if (!code.trim()) {
        setError('يرجى إدخال رمز الدخول الخاص بكِ 🔑');
        return;
      }
    } else {
      if (!name.trim()) {
        setError('يرجى كتابة اسمك اللطيف 🌸');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = useNameMode ? { name: name.trim() } : { student_code: code.trim() };
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.setItem('lughati_student_name', data.name);
        localStorage.setItem('lughati_student_id', data.id);
        if (data.student_code) {
          localStorage.setItem('lughati_student_code', data.student_code);
        }
        onLoginSuccess(data.name, data.id, data.student_code);
      } else {
        setError(data.message || 'تعذر تسجيل الدخول، تأكدي من الرمز المكتوب 🌸');
      }
    } catch (e) {
      setError('حدث خطأ في الاتصال بالسيرفر. حاولي مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-modal" style={{ zIndex: 2000 }}>
      <div className="feedback-card" style={{ maxWidth: '450px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, borderRadius: '32px', border: '4px solid #f0abfc' }}>
        
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '20px 24px 12px 24px', textAlign: 'center', background: 'white', position: 'relative' }}>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '16px', left: '16px', background: '#fdf2f8', border: 'none', borderRadius: '9999px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}
            >
              <X size={20} />
            </button>
          )}
          <div style={{ fontSize: '44px', marginBottom: '4px' }}>👧🌸</div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#831843', margin: 0 }}>
            أهلاً يا بطلة 🌸
          </h2>
          <p style={{ fontSize: '15px', color: '#be185d', fontWeight: '700', marginTop: '6px', margin: 0 }}>
            {promptText || 'أدخلي رمزكِ الرقمي لتبدئي التعلم وتتابعي إنجازاتكِ:'}
          </p>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!useNameMode ? (
            <div>
              <label style={{ display: 'block', fontWeight: '900', fontSize: '15px', color: '#9d174d', marginBottom: '8px', textAlign: 'right' }}>
                🔑 رمز الدخول الرقمي:
              </label>
              <input
                type="text"
                placeholder="أدخلي رمزك (مثال: 26001)..."
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '18px',
                  border: error ? '2px solid #ef4444' : '2px solid #f472b6',
                  fontSize: '22px',
                  fontWeight: '900',
                  outline: 'none',
                  background: '#fff5f8',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontWeight: '900', fontSize: '15px', color: '#9d174d', marginBottom: '8px', textAlign: 'right' }}>
                🌸 اسم الطالبة:
              </label>
              <input
                type="text"
                placeholder="اكتبي اسمكِ الثلاثي..."
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '18px',
                  border: error ? '2px solid #ef4444' : '2px solid #f472b6',
                  fontSize: '18px',
                  fontWeight: '700',
                  outline: 'none',
                  background: '#fff5f8',
                  textAlign: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                autoFocus
              />
            </div>
          )}

          {error && (
            <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="hero-start-btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '19px',
              borderRadius: '20px',
              background: '#db2777',
              color: 'white',
              boxShadow: '0 10px 20px rgba(219, 39, 119, 0.3)',
              marginTop: '4px'
            }}
          >
            <Sparkles size={22} />
            <span>{loading ? 'جاري الدخول...' : '🚀 ابدئي التعلم'}</span>
          </button>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => { setUseNameMode(!useNameMode); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#be185d', fontSize: '14px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {useNameMode ? '🔑 الدخول بالرمز الرقمي' : '🌸 أردت الدخول بالاسم'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
