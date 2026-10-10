import React, { useState } from 'react';
import { BookOpenCheck, CheckCircle2, Award, Sparkles, RefreshCw, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const defaultLesson4Drills = [
  {
    id: 'd1',
    title: '✅ صح أم خطأ',
    instructions: 'اقرئي العبارات، ثم اختاري صح أو خطأ.',
    type: 'true_false',
    is_visible: 1,
    items: [
      { id: 1, statement: 'وجد الغراب جرةً فيها ماء.', answer: 'صح' },
      { id: 2, statement: 'استطاع الغراب الوصول إلى الماء بمنقاره بسهولة.', answer: 'خطأ' },
      { id: 3, statement: 'ألقى الغراب الحجارة في الجرة فارتفع الماء.', answer: 'صح' }
    ]
  },
  {
    id: 'd2',
    title: '✏️ أكمل الفراغ',
    instructions: 'أكملي الجملة بالكلمة المناسبة.',
    type: 'fill_blank',
    is_visible: 1,
    items: [
      { id: 1, question: 'عطش الغراب فأخذ يبحث عن ________.', answer: 'الماء' },
      { id: 2, question: 'وجد الغراب ________ فيها ماء.', answer: 'جرة' },
      { id: 3, question: 'ألقى الغراب ________ في الجرة.', answer: 'الحجارة' }
    ]
  },
  {
    id: 'd3',
    title: '🔤 اختاري الكلمة المناسبة',
    instructions: 'اختاري الكلمة الصحيحة لإكمال الجملة.',
    type: 'multiple_choice',
    is_visible: 1,
    items: [
      { id: 1, question: 'كان يوم الصيف ________.', options: ['بارداً', 'حاراً', 'ممطراً'], answer: 'حاراً' },
      { id: 2, question: 'وجد الغراب حجارة ________.', options: ['صغيرة', 'كبيرة جداً', 'ملونة'], answer: 'صغيرة' },
      { id: 3, question: 'شرب الغراب حتى ________.', options: ['ارتوى', 'نام', 'طار'], answer: 'ارتوى' }
    ]
  }
];

export default function ReviewSection({ questions = [], sectionContents = [], onCompleteSection }) {
  // Parse drills from sectionContents or fallback to defaultLesson4Drills
  let drillsToRender = [];

  if (sectionContents && sectionContents.length > 0) {
    const visibleContents = sectionContents.filter(c => c.is_visible !== 0);
    drillsToRender = visibleContents.map(c => {
      let extra = {};
      try {
        extra = typeof c.extra_data === 'string' ? JSON.parse(c.extra_data || '{}') : (c.extra_data || {});
      } catch (e) {}

      let type = extra.drill_type || extra.question_type || 'multiple_choice';
      if (c.title?.includes('صح') || c.title?.includes('خطأ')) type = 'true_false';
      else if (c.title?.includes('أكمل') || c.title?.includes('الفراغ')) type = 'fill_blank';
      else if (c.title?.includes('اختر')) type = 'multiple_choice';

      const rawItems = extra.items || [];
      const visibleItems = rawItems
        .filter(it => it.is_visible !== 0)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      return {
        id: c.id,
        title: c.title || 'تدريب مراجعة',
        instructions: c.content || 'أجيبي عن الأسئلة التالية:',
        type,
        items: visibleItems
      };
    });
  }

  // If no dynamic drills parsed or dynamic is empty, fallback to standard Lesson 4 drills
  if (drillsToRender.length === 0) {
    drillsToRender = defaultLesson4Drills;
  }

  // State management for user responses
  const [answers, setAnswers] = useState({});
  const [fillAnswers, setFillAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  const normalizeArabic = (text = '') => {
    return text
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u0652]/g, '');
  };

  const handleSelectAnswer = (drillId, itemId, selectedValue, correctAnswer) => {
    const key = `${drillId}_${itemId}`;
    setAnswers(prev => ({ ...prev, [key]: selectedValue }));

    if (selectedValue === correctAnswer) {
      setFeedbacks(prev => ({ ...prev, [key]: { isCorrect: true, msg: 'أحسنتِ 🌟' } }));
    } else {
      setFeedbacks(prev => ({ ...prev, [key]: { isCorrect: false, msg: 'حاولي مرة أخرى 💪' } }));
    }
  };

  const handleCheckFillAnswer = (drillId, itemId, correctAnswer) => {
    const key = `${drillId}_${itemId}`;
    const userVal = fillAnswers[key] || '';
    const normUser = normalizeArabic(userVal);
    const normCorrect = normalizeArabic(correctAnswer);

    if (normUser === normCorrect && normUser.length > 0) {
      setFeedbacks(prev => ({ ...prev, [key]: { isCorrect: true, msg: 'أحسنتِ 🌟' } }));
    } else {
      setFeedbacks(prev => ({ ...prev, [key]: { isCorrect: false, msg: 'حاولي مرة أخرى 💪' } }));
    }
  };

  return (
    <div className="content-box" style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 className="section-title" style={{ color: '#16a34a', justifyContent: 'center', margin: '0 0 8px 0' }}>
          <BookOpenCheck size={36} />
          <span>أتدرب وأراجع 📝</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '700', margin: 0 }}>
          مراجعة قصيرة وبسيطة لتثبيت الفهم والتحقق من الإجابات
        </p>
      </div>

      {/* Drills Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {drillsToRender.map((drill, idx) => (
          <div
            key={drill.id || idx}
            style={{
              background: '#ffffff',
              border: '3px solid #bbf7d0',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 20px rgba(22, 163, 74, 0.08)'
            }}
          >
            {/* Drill Card Title & Instructions */}
            <div style={{ borderBottom: '2px dashed #dcfce7', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#15803d', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '4px 12px', fontSize: '18px' }}>
                  {idx + 1}
                </span>
                <span>{drill.title}</span>
              </h3>
              {drill.instructions && (
                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '700', marginRight: '46px' }}>
                  💡 {drill.instructions}
                </div>
              )}
            </div>

            {/* Drill Questions Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* TYPE 1: TRUE / FALSE */}
              {drill.type === 'true_false' && drill.items?.map((item, qIdx) => {
                const key = `${drill.id}_${item.id}`;
                const currentAnswer = answers[key];
                const fb = feedbacks[key];

                return (
                  <div key={item.id || qIdx} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '14px' }}>
                      {qIdx + 1}. {item.statement || item.question}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {['صح', 'خطأ'].map(opt => {
                        const isSelected = currentAnswer === opt;
                        let btnBg = 'white';
                        let btnBorder = '#cbd5e1';
                        let btnColor = '#334155';

                        if (isSelected) {
                          if (opt === 'صح') {
                            btnBg = '#d1fae5';
                            btnBorder = '#10b981';
                            btnColor = '#065f46';
                          } else {
                            btnBg = '#fee2e2';
                            btnBorder = '#ef4444';
                            btnColor = '#991b1b';
                          }
                        }

                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectAnswer(drill.id, item.id, opt, item.answer)}
                            style={{
                              background: btnBg,
                              border: `2px solid ${btnBorder}`,
                              color: btnColor,
                              borderRadius: '14px',
                              padding: '10px 24px',
                              fontSize: '17px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{opt === 'صح' ? '✅ صح' : '❌ خطأ'}</span>
                          </button>
                        );
                      })}

                      {/* Feedback Message */}
                      {fb && (
                        <div
                          style={{
                            marginRight: 'auto',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            background: fb.isCorrect ? '#d1fae5' : '#fff7ed',
                            color: fb.isCorrect ? '#047857' : '#c2410c',
                            border: fb.isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #ffedd5'
                          }}
                        >
                          {fb.msg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* TYPE 2: FILL IN THE BLANK */}
              {drill.type === 'fill_blank' && drill.items?.map((item, qIdx) => {
                const key = `${drill.id}_${item.id}`;
                const userVal = fillAnswers[key] || '';
                const fb = feedbacks[key];

                return (
                  <div key={item.id || qIdx} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '14px' }}>
                      {qIdx + 1}. {item.question}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="اكتبي الكلمة المناسبة هنا..."
                        value={userVal}
                        onChange={(e) => setFillAnswers({ ...fillAnswers, [key]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCheckFillAnswer(drill.id, item.id, item.answer);
                        }}
                        style={{
                          flex: '1 1 240px',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: '2px solid #cbd5e1',
                          fontSize: '17px',
                          fontWeight: '800',
                          outline: 'none'
                        }}
                      />

                      <button
                        onClick={() => handleCheckFillAnswer(drill.id, item.id, item.answer)}
                        style={{
                          background: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 20px',
                          fontSize: '16px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={18} />
                        <span>تحقق</span>
                      </button>

                      {/* Feedback Message */}
                      {fb && (
                        <div
                          style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            background: fb.isCorrect ? '#d1fae5' : '#fff7ed',
                            color: fb.isCorrect ? '#047857' : '#c2410c',
                            border: fb.isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #ffedd5'
                          }}
                        >
                          {fb.msg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* TYPE 3: MULTIPLE CHOICE */}
              {drill.type === 'multiple_choice' && drill.items?.map((item, qIdx) => {
                const key = `${drill.id}_${item.id}`;
                const currentAnswer = answers[key];
                const fb = feedbacks[key];

                return (
                  <div key={item.id || qIdx} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '14px' }}>
                      {qIdx + 1}. {item.question}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {(item.options || []).map((opt, oIdx) => {
                        const isSelected = currentAnswer === opt;
                        let btnBg = 'white';
                        let btnBorder = '#cbd5e1';
                        let btnColor = '#334155';

                        if (isSelected) {
                          btnBg = '#e0f2fe';
                          btnBorder = '#0284c7';
                          btnColor = '#0369a1';
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectAnswer(drill.id, item.id, opt, item.answer)}
                            style={{
                              background: btnBg,
                              border: `2px solid ${btnBorder}`,
                              color: btnColor,
                              borderRadius: '14px',
                              padding: '10px 20px',
                              fontSize: '17px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}

                      {/* Feedback Message */}
                      {fb && (
                        <div
                          style={{
                            marginRight: 'auto',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            background: fb.isCorrect ? '#d1fae5' : '#fff7ed',
                            color: fb.isCorrect ? '#047857' : '#c2410c',
                            border: fb.isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #ffedd5'
                          }}
                        >
                          {fb.msg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

