import React, { useState } from 'react';
import { CheckSquare, CheckCircle2, XCircle, Award } from 'lucide-react';

export default function ComprehensionSection({ questions = [], onCompleteSection }) {
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);

  const defaultQuestions = [
    { id: 1, question_text: 'كم عدد أبناء الفلاح؟', options: ['اثنان', 'ثلاثة', 'أربعة'], correct_answer: 'أربعة' },
    { id: 2, question_text: 'ماذا ترك الفلاح لأبنائه في الأرض؟', options: ['بيتاً', 'كنزاً', 'ثياباً'], correct_answer: 'كنزاً' },
    { id: 3, question_text: 'ماذا حمل كل ابن ليحفر الأرض؟', options: ['فأساً', 'كتاباً', 'قلماً'], correct_answer: 'فأساً' },
    { id: 4, question_text: 'وجد الأبناء الكنز مدفوناً في صندوق ذهبي.', options: ['صح', 'خطأ'], correct_answer: 'خطأ' },
    { id: 5, question_text: 'ماذا كان يقصد الفلاح بالكنز؟', options: ['الأرض وزراعتها', 'الذهب والفضة', 'الملابس الجديدة'], correct_answer: 'الأرض وزراعتها' }
  ];

  const list = questions.length > 0 ? questions : defaultQuestions;

  const handleSelect = (qId, option) => {
    setUserAnswers({ ...userAnswers, [qId]: option });
  };

  const handleSubmit = () => {
    let count = 0;
    list.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) {
        count++;
      }
    });
    setScore(count);
    if (count >= Math.ceil(list.length / 2)) {
      onCompleteSection('comprehension');
    }
  };

  return (
    <div className="content-box">
      <h2 className="section-title" style={{ color: '#7c3aed' }}>
        <CheckSquare size={32} />
        <span>أفهم النص: أسئلة الاستيعاب والتحليل</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
        {list.map((q, idx) => {
          const optionsList = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          const isSelected = userAnswers[q.id] !== undefined;

          return (
            <div key={q.id} className="activity-card" style={{ borderRight: '6px solid #7c3aed', margin: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '20px', marginBottom: '16px', color: '#1e293b' }}>
                {idx + 1}. {q.question_text}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {optionsList.map((opt, i) => {
                  const active = userAnswers[q.id] === opt;
                  let bg = 'white';
                  let border = '#cbd5e1';
                  let color = '#1e293b';

                  if (active) {
                    bg = '#f3e8ff';
                    border = '#7c3aed';
                    color = '#6b21a8';
                  }

                  if (score !== null) {
                    if (opt === q.correct_answer) {
                      bg = '#d1fae5';
                      border = '#10b981';
                      color = '#065f46';
                    } else if (active) {
                      bg = '#fee2e2';
                      border = '#ef4444';
                      color = '#991b1b';
                    }
                  }

                  return (
                    <button
                      key={i}
                      style={{
                        background: bg,
                        borderColor: border,
                        color: color,
                        borderStyle: 'solid',
                        borderWidth: '2px',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        flex: '1 1 200px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleSelect(q.id, opt)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        {score === null ? (
          <button 
            className="hero-start-btn"
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length === 0}
            style={{ 
              background: Object.keys(userAnswers).length === 0 ? '#94a3b8' : '#7c3aed',
              color: 'white', 
              padding: '14px 40px' 
            }}
          >
            <span>تحقق من إجاباتك ✨</span>
          </button>
        ) : (
          <div style={{ background: '#f3e8ff', border: '2px solid #c084fc', borderRadius: '20px', padding: '24px' }}>
            <Award size={48} color="#7c3aed" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#581c87' }}>
              حصلت على {score} من {list.length}! 🌟
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: '#6b21a8' }}>
              {score === list.length ? 'ممتاز جداً! أداء خيالي يا بطل 🏆' : 'أحسنت! واصل التعلم والتميز 🌸'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
