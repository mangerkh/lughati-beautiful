import React from 'react';
import { 
  Volume2, MessageCircle, BookOpen, Brain, Target, 
  PenTool, Mic, Sparkles, Star, Key, Check, Heart, Trophy
} from 'lucide-react';

export default function LessonDetailView({ 
  lessonData,
  lesson: propLesson, 
  sections: propSections = [], 
  onSelectSection, 
  completedSections = [],
  progressPercent = 0 
}) {
  const lesson = propLesson || lessonData?.lesson || {};
  const sections = propSections?.length > 0 ? propSections : (lessonData?.sections || []);

  // 10 Unified Core Skills metadata
  const unifiedSkills = [
    {
      type: 'listening',
      title: 'أستمع',
      emoji: '🎧',
      subtitle: 'استمعي جيداً',
      color: '#0284c7',
      bgColor: '#e0f2fe',
      borderColor: '#bae6fd',
      icon: <Volume2 size={36} color="#0284c7" />
    },
    {
      type: 'observe',
      title: 'أتحدث',
      emoji: '💬',
      subtitle: 'ألاحظ وأتحدث',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#a7f3d0',
      icon: <MessageCircle size={36} color="#10b981" />
    },
    {
      type: 'reading',
      title: 'أقرأ',
      emoji: '📖',
      subtitle: 'أقرأ القصة ومفرداتها',
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#6ee7b7',
      icon: <BookOpen size={36} color="#059669" />
    },
    {
      type: 'comprehension',
      title: 'أفكر بذكاء',
      emoji: '🧠',
      subtitle: 'أفكر وأجيب',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      borderColor: '#d8b4fe',
      icon: <Brain size={36} color="#7c3aed" />
    },
    {
      type: 'activities',
      title: 'أتدرب',
      emoji: '🎯',
      subtitle: 'ألعب وأتدرب',
      color: '#ea580c',
      bgColor: '#ffedd5',
      borderColor: '#fed7aa',
      icon: <Target size={36} color="#ea580c" />
    },
    {
      type: 'writing',
      title: 'أكتب بخط جميل',
      emoji: '✏️',
      subtitle: 'أتدرّب على الكتابة',
      color: '#2563eb',
      bgColor: '#dbeafe',
      borderColor: '#bfdbfe',
      icon: <PenTool size={36} color="#2563eb" />
    },
    {
      type: 'dictation',
      title: 'أستمع وأكتب',
      emoji: '🔊',
      subtitle: 'أستمع وأكتب',
      color: '#dc2626',
      bgColor: '#fee2e2',
      borderColor: '#fca5a5',
      icon: <Mic size={36} color="#dc2626" />
    },
    {
      type: 'expression',
      title: 'أعبر',
      emoji: '🗣️',
      subtitle: 'أعبر عن أفكاري',
      color: '#c026d3',
      bgColor: '#fae8ff',
      borderColor: '#f0abfc',
      icon: <Sparkles size={36} color="#c026d3" />
    },
    {
      type: 'enrichment',
      title: 'إثراء',
      emoji: '⭐',
      subtitle: 'أنشطة ومعارف ونشيد',
      color: '#d97706',
      bgColor: '#fef3c7',
      borderColor: '#fde047',
      icon: <Star size={36} color="#d97706" />
    }
  ];

  // Thinking keys special card metadata
  const thinkingKeysCard = {
    type: 'thinking_keys',
    title: 'مفاتيح التفكير',
    emoji: '🔑',
    subtitle: 'نحلّل 🔍 | نناقش 💬 | نبتكر 💡 | نبدع 🎨',
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#c084fc',
    icon: <Key size={40} color="#9333ea" />
  };

  const handleCardClick = (skillType) => {
    const found = sections.find(s => s.section_type === skillType);
    if (found) {
      onSelectSection(found);
    } else {
      const skillMeta = [...unifiedSkills, thinkingKeysCard].find(s => s.type === skillType);
      onSelectSection({
        id: 999,
        lesson_id: lesson.id || 1,
        section_type: skillType,
        title: skillMeta?.title || (skillType === 'quiz' ? 'اختبر نفسي' : skillType)
      });
    }
  };

  return (
    <div>
      {/* Lesson Header Card */}
      <div className="lesson-detail-header">
        <div className="lesson-header-img-box">
          <img 
            src={lesson.image || `/uploads/lesson_${lesson.id || 1}.svg`} 
            alt={lesson.title || 'الدرس'} 
            onError={(e) => { e.target.src = '/uploads/lesson_1.svg'; }}
          />
        </div>

        <div style={{ flexGrow: 1 }}>
          <h2 className="lesson-detail-title">
            {lesson.title || 'الدرس'}
          </h2>
          <p className="lesson-detail-welcome">
            {lesson.welcome_message || 'استعدي لرحلة ممتعة ومبدعة في هذا الدرس يا بطلة! ✨🌸'}
          </p>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="progress-card">
        <div className="progress-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star color="#f59e0b" fill="#f59e0b" size={22} />
            <span>التقدم والإنجاز في مهارات الدرس:</span>
          </div>
          <span style={{ color: '#059669', fontSize: '18px' }}>{progressPercent}% مكتمل</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* 10 Unified Skill Cards Layout */}
      <div style={{ marginTop: '28px' }}>
        <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={26} color="#db2777" fill="#fbcfe8" />
          <span>المهارات الأساسية للدرس:</span>
        </h3>

        {/* Rows 1, 2, 3 Grid (3 columns each) */}
        <div className="unified-skills-grid">
          {unifiedSkills.map((skill) => {
            const isCompleted = completedSections.includes(skill.type);
            return (
              <div
                key={skill.type}
                className="big-skill-card"
                style={{
                  background: skill.bgColor,
                  borderColor: skill.borderColor
                }}
                onClick={() => handleCardClick(skill.type)}
              >
                {isCompleted && (
                  <div className="completed-badge">
                    <Check size={18} strokeWidth={3} />
                  </div>
                )}

                <div className="big-skill-icon-box" style={{ color: skill.color }}>
                  {skill.icon}
                </div>

                <div className="big-skill-title" style={{ color: skill.color }}>
                  <span>{skill.title}</span>
                  <span style={{ fontSize: '24px' }}>{skill.emoji}</span>
                </div>

                <div className="big-skill-subtitle">
                  {skill.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Special Wide Card: مفاتيح التفكير 🔑 */}
        <div 
          className="thinking-keys-wide-card"
          onClick={() => handleCardClick('thinking_keys')}
          style={{ marginBottom: '32px' }}
        >
          {completedSections.includes('thinking_keys') && (
            <div className="completed-badge" style={{ top: '16px', left: '16px' }}>
              <Check size={20} strokeWidth={3} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="thinking-keys-icon-box">
              {thinkingKeysCard.icon}
            </div>

            <div style={{ flexGrow: 1 }}>
              <div className="thinking-keys-title">
                <span>مفاتيح التفكير 🔑</span>
              </div>
              <div className="thinking-keys-pills">
                <span className="pill pill-analyze">نحلّل 🔍</span>
                <span className="pill pill-discuss">نناقش 💬</span>
                <span className="pill pill-innovate">نبتكر 💡</span>
                <span className="pill pill-create">نبدع 🎨</span>
              </div>
            </div>
          </div>
        </div>

        {/* STANDALONE GOLDEN FEATURED CARD AT PAGE END: 🏆 اختبر نفسي */}
        <div
          className="quiz-golden-card"
          onClick={() => handleCardClick('quiz')}
          style={{
            background: 'linear-gradient(135deg, #fffbe6 0%, #fef3c7 50%, #fde68a 100%)',
            border: '3px solid #f59e0b',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.25)',
            cursor: 'pointer',
            position: 'relative',
            marginTop: '36px',
            transition: 'all 0.3s ease',
            direction: 'rtl'
          }}
        >
          {completedSections.includes('quiz') && (
            <div className="completed-badge" style={{ top: '20px', left: '20px', background: '#059669', width: '36px', height: '36px' }}>
              <Check size={24} strokeWidth={3} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                background: '#ffffff',
                width: '72px',
                height: '72px',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                border: '2px solid #f59e0b'
              }}>
                <Trophy size={42} color="#d97706" />
              </div>

              <div>
                <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#b45309', margin: 0, fontFamily: 'Cairo, sans-serif' }}>
                  🏆 اختبر نفسي
                </h3>
                <p style={{ fontSize: '18px', fontWeight: '800', color: '#d97706', marginTop: '6px', margin: 0 }}>
                  "هيا نرى كم تعلمتِ!"
                </p>
              </div>
            </div>

            <button
              className="hero-start-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick('quiz');
              }}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontSize: '20px',
                fontWeight: '900',
                padding: '14px 36px',
                borderRadius: '20px',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🚀 ابدئي الاختبار
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
