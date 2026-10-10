import React, { useState, useEffect } from 'react';
import { Sparkles, Star, ArrowLeft, Building2, User, BookOpen, GraduationCap } from 'lucide-react';

export default function HomeView({ lessons, onSelectLesson }) {
  const [settings, setSettings] = useState({
    hero_welcome_image: '/uploads/images/main01_1791184907790_p3b9e.png',
    country: 'دولة فلسطين',
    ministry: 'وزارة التربية والتعليم العالي',
    directorate: 'مديرية التربية والتعليم - الخليل',
    school: 'مدرسة السيدة هاجر للبنات',
    teacher_name: 'نسرين بوجه الحسيني',
    grade: 'الصف الثاني الأساسي',
    book: 'لغتنا الجميلة',
    show_identity_card: 'true',
    show_developer_signature: 'true',
    developer_signature: 'eng.Khalil'
  });

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(err => console.error('Error loading public settings:', err));
  }, []);

  const visibleLessons = (lessons || []).filter(l => l.status !== 'hidden' && l.is_published !== 0);

  const showCard = settings.show_identity_card === true || settings.show_identity_card === 'true';
  const showDev = settings.show_developer_signature === true || settings.show_developer_signature === 'true';

  return (
    <div>
      {/* Soft Feminine Hero Banner with Welcome Image & Text */}
      <div className="hero-card">
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap-reverse'
        }}>
          {/* Welcome Text Content */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '15px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              <Sparkles size={18} color="#fde047" />
              <span>منهاج اللغة العربية - الصف الثاني الأساسي 🌸</span>
            </div>

            <h2 className="hero-title">أهلاً بكِ في عالم لغتي الجميلة ✨</h2>
            <p className="hero-subtitle">
              هيا بنا نتعلم ونلعب معاً يا فراشة الصف الثاني في رحلة ممتعة ومليئة بالنجوم!
            </p>
          </div>

          {/* Welcome Image (main01 or customized setting) */}
          {settings.hero_welcome_image && (
            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img
                src={settings.hero_welcome_image}
                alt="صورة الترحيب"
                style={{
                  maxHeight: '220px',
                  maxWidth: '300px',
                  width: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.12))',
                  borderRadius: '16px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Lessons Grid */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div className="section-title" style={{ margin: 0 }}>
            <Star size={32} color="#ec4899" fill="#fbcfe8" />
            <span>دروس مادة اللغة العربية</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#db2777', background: '#fce7f3', padding: '6px 16px', borderRadius: '9999px' }}>
            دروس ممتعة 🌟
          </span>
        </div>

        <div className="lessons-grid">
          {visibleLessons.map((lesson) => {
            const isDraft = lesson.status === 'draft';
            const isDisabled = lesson.status === 'disabled';

            return (
              <div 
                key={lesson.id} 
                className={`lesson-card ${isDisabled ? 'disabled-lesson-card' : ''}`}
                onClick={() => {
                  if (!isDisabled) {
                    onSelectLesson(lesson);
                  }
                }}
                style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
              >
                <div className="lesson-img-box">
                  <img 
                    src={lesson.image || `/uploads/lesson_${lesson.id}.svg`} 
                    alt={lesson.title} 
                    onError={(e) => { e.target.src = '/uploads/lesson_1.svg'; }}
                  />
                  {isDraft && (
                    <div className="coming-soon-badge" style={{ background: 'rgba(217, 119, 6, 0.95)' }}>
                      <span>قيد الإعداد ⏳</span>
                    </div>
                  )}
                  {isDisabled && (
                    <div className="coming-soon-badge" style={{ background: 'rgba(225, 29, 72, 0.95)' }}>
                      <span>🔒 غير متاح حالياً</span>
                    </div>
                  )}
                </div>

                <div className="lesson-card-body">
                  <h3 className="lesson-card-title">{lesson.title}</h3>
                  <p className="lesson-card-desc">
                    {lesson.description || 'استكشفي قصّة وأنشطة هذا الدرس الممتعة'}
                  </p>

                  {!isDisabled ? (
                    <div className="lesson-card-btn">
                      <span>دخول الدرس</span>
                      <ArrowLeft size={18} />
                    </div>
                  ) : (
                    <div className="lesson-card-btn" style={{ background: '#cbd5e1', color: '#64748b', cursor: 'not-allowed' }}>
                      <span>غير متاح حالياً 🔒</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official School Site Identity Card */}
      {showCard && (
        <div style={{
          marginTop: '48px',
          background: '#ffffff',
          borderRadius: '24px',
          border: '2px solid #f1f5f9',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          padding: '24px 28px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '2px dashed #f1f5f9',
            paddingBottom: '14px',
            marginBottom: '18px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#fce7f3',
              color: '#db2777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                {settings.school || 'مدرسة السيدة هاجر للبنات'}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                {settings.country} • {settings.ministry} • {settings.directorate}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} color="#0284c7" />
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>إعداد المعلمة:</span>
                <strong style={{ fontSize: '15px', color: '#0369a1', fontWeight: '800' }}>{settings.teacher_name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={18} color="#7c3aed" />
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>الصف الدراسي:</span>
                <strong style={{ fontSize: '15px', color: '#5b21b6', fontWeight: '800' }}>{settings.grade}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color="#db2777" />
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>المقرر الدراسي:</span>
                <strong style={{ fontSize: '15px', color: '#9d174d', fontWeight: '800' }}>{settings.book}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Developer Signature */}
      {showDev && (
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: '700',
          color: '#94a3b8',
          opacity: 0.75,
          letterSpacing: '0.5px'
        }}>
          <span>Designed & Developed by </span>
          <span style={{ color: '#0284c7', fontWeight: '800' }}>{settings.developer_signature || 'eng.Khalil'}</span>
        </div>
      )}
    </div>
  );
}
