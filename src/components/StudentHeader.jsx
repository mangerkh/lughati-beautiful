import React from 'react';
import { BookOpen, Star, LogIn, Home, UserCheck, FolderCheck, LogOut, Sparkles } from 'lucide-react';

export default function StudentHeader({ 
  onGoHome, 
  onOpenTeacherLogin, 
  stars = 0, 
  currentView,
  studentName,
  onOpenStudentLogin,
  onOpenMySubmissions,
  onStudentLogout
}) {
  return (
    <header className="student-header">
      <div className="logo-group" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        <div className="logo-badge">
          <BookOpen size={30} />
        </div>
        <div className="title-box">
          <h1>لغتي الجميلة</h1>
          <p>اللغة العربية – الصف الثاني الأساسي</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {stars > 0 && (
          <div style={{
            background: '#fffbeb',
            color: '#d97706',
            border: '2px solid #fef3c7',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
            <span>{stars} نجوم</span>
          </div>
        )}

        {/* Student Login & Profile Buttons */}
        {studentName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '9999px', padding: '4px 12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#be185d', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👧</span>
              <span>مرحباً، {studentName} 🌷</span>
            </span>

            <button 
              onClick={onOpenMySubmissions}
              style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="أعمالي وحوافظي"
            >
              <FolderCheck size={15} />
              <span>أعمالي</span>
            </button>

            <button 
              onClick={onStudentLogout}
              style={{ background: 'transparent', color: '#9d174d', border: 'none', cursor: 'pointer', padding: '4px' }}
              title="تغيير الاسم / خروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenStudentLogin}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontWeight: '900',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(219, 39, 119, 0.3)'
            }}
          >
            <Sparkles size={18} />
            <span>👧 دخول الطالبة</span>
          </button>
        )}

        {currentView !== 'home' && (
          <button className="back-btn" onClick={onGoHome} title="الرئيسية">
            <Home size={20} />
            <span>الرئيسية</span>
          </button>
        )}

        <button className="teacher-login-btn" onClick={onOpenTeacherLogin}>
          <LogIn size={18} />
          <span>دخول المعلم</span>
        </button>
      </div>
    </header>
  );
}
