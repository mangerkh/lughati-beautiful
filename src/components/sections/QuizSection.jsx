import React, { useState, useEffect } from 'react';
import { Trophy, Award, ArrowRight, ArrowLeft, RotateCcw, CheckCircle2, Star, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizSection({
  lessonId = 4,
  lessonTitle = 'الغراب والجرة',
  studentName = '',
  onRequestLogin,
  onClose
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Student Answers state: { [qId]: answerValue }
  const [answers, setAnswers] = useState({});
  // For ordering question: { [qId]: ArrayOfItems }
  const [orderingAnswers, setOrderingAnswers] = useState({});

  // Screen state: 'quiz' | 'results'
  const [screenState, setScreenState] = useState('quiz');
  const [score, setScore] = useState(0);
  const [submittedAttempt, setSubmittedAttempt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  // Handle browser back button to prevent unexpected exit during quiz
  useEffect(() => {
    window.history.pushState({ inQuiz: true }, '');
    const handlePopState = (e) => {
      if (screenState === 'quiz') {
        const confirmExit = window.confirm('هل أنتِ تأكدة من رغبتك في الخروج من الاختبار الحالي؟ لن يتم حفظ الإجابات غير المكتملة.');
        if (!confirmExit) {
          window.history.pushState({ inQuiz: true }, '');
        } else {
          if (onClose) onClose();
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [screenState, onClose]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/quiz?lesson_id=${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        
        // Initialize ordering answers with shuffled items
        const initialOrder = {};
        data.forEach(q => {
          if (q.question_type === 'ordering') {
            try {
              const items = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
              // Shuffle copy of items
              const shuffled = [...items].sort(() => Math.random() - 0.5);
              initialOrder[q.id] = shuffled;
            } catch (e) {
              initialOrder[q.id] = [];
            }
          }
        });
        setOrderingAnswers(initialOrder);
      }
    } catch (err) {
      console.error('Error loading quiz questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, val) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleTextAnswer = (questionId, val) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleMoveOrderItem = (questionId, fromIdx, toIdx) => {
    setOrderingAnswers(prev => {
      const list = [...(prev[questionId] || [])];
      if (toIdx < 0 || toIdx >= list.length) return prev;
      const [item] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, item);
      return { ...prev, [questionId]: list };
    });
  };

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Grade calculation and submit
  const handleFinishQuiz = async () => {
    let calculatedScore = 0;

    questions.forEach(q => {
      const qType = q.question_type;
      
      if (qType === 'mcq' || qType === 'tf') {
        const studentAns = answers[q.id];
        if (studentAns && studentAns.toString().trim() === q.correct_answer.toString().trim()) {
          calculatedScore += 1;
        }
      } else if (qType === 'fill') {
        const studentAns = (answers[q.id] || '').toString().trim().toLowerCase();
        const correctAns = (q.correct_answer || '').toString().trim().toLowerCase();
        // Compare with tolerance for whitespace/alef
        if (studentAns && (studentAns === correctAns || studentAns.replace(/[أإآ]/g, 'ا') === correctAns.replace(/[أإآ]/g, 'ا'))) {
          calculatedScore += 1;
        }
      } else if (qType === 'ordering') {
        const studentList = orderingAnswers[q.id] || [];
        let correctList = [];
        try {
          correctList = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : (q.correct_answer || []);
        } catch (e) {
          correctList = [];
        }
        if (JSON.stringify(studentList) === JSON.stringify(correctList)) {
          calculatedScore += 1;
        }
      }
    });

    setScore(calculatedScore);
    setScreenState('results');

    if (calculatedScore >= 4) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } else if (calculatedScore >= 3) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }

    // Persist attempt to server
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName || 'طالبة زائرة',
          lesson_id: lessonId,
          score: calculatedScore,
          total_questions: totalQuestions
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSubmittedAttempt(data);
      }
    } catch (err) {
      console.error('Error saving quiz result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartQuiz = () => {
    setAnswers({});
    setCurrentIndex(0);
    setScore(0);
    setSubmittedAttempt(null);
    setScreenState('quiz');
    fetchQuestions();
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#0f172a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
        fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: 'rtl'
      }}>
        <div className="spinner" style={{ borderTopColor: '#f59e0b', width: '50px', height: '50px', borderWidth: '4px' }}></div>
        <h2 style={{ marginTop: '20px', fontSize: '22px', fontWeight: '900', color: '#fbbf24' }}>
          جارٍ تحضير اختبار "اختبر نفسي"... 🏆
        </h2>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.95)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
        fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: 'rtl', padding: '24px'
      }}>
        <div style={{ background: '#1e293b', border: '2px solid #334155', borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <Trophy size={60} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', marginBottom: '12px' }}>
            لا يوجد أسئلة حالياً لهذا الدرس
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '24px' }}>
            سيتم تفعيل الاختبار الختامي لهذا الدرس قريباً من قبل المعلمة!
          </p>
          <button
            onClick={onClose}
            className="hero-start-btn"
            style={{ background: '#f59e0b', color: '#1e293b', padding: '12px 32px', fontSize: '18px', fontWeight: '900', boxShadow: 'none' }}
          >
            العودة إلى الدرس
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Render Result Feedback Message
  const getResultMessage = () => {
    if (score === 5 || score === totalQuestions) {
      return {
        stars: '🌟🌟🌟🌟🌟',
        msg: 'ممتازة يا بطلة! أتقنتِ الدرس.',
        color: '#16a34a',
        badgeBg: '#dcfce7'
      };
    } else if (score === 4) {
      return {
        stars: '🌟🌟🌟🌟',
        msg: 'رائعة! بقيت خطوة صغيرة فقط.',
        color: '#0284c7',
        badgeBg: '#e0f2fe'
      };
    } else if (score === 3) {
      return {
        stars: '🌟🌟🌟',
        msg: 'أحسنتِ، راجعي بعض الأفكار ثم حاولي مرة أخرى.',
        color: '#d97706',
        badgeBg: '#fef3c7'
      };
    } else {
      return {
        stars: '⭐',
        msg: 'لا بأس، راجعي الدرس وحاولي مرة أخرى 💪',
        color: '#dc2626',
        badgeBg: '#fee2e2'
      };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Cairo', 'Tajawal', sans-serif",
      direction: 'rtl',
      overflowY: 'auto'
    }}>
      
      {/* TOP NAVBAR & PROGRESS BAR */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            <Trophy size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24', margin: 0 }}>
              🏆 اختبر نفسي — {lessonTitle}
            </h1>
            <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '700' }}>
              {studentName ? `الطالبة المبدعة: ${studentName}` : 'اختبار ختامي مستقل'}
            </span>
          </div>
        </div>

        {/* Step Counter & Progress Bar */}
        {screenState === 'quiz' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px', flexGrow: 1, maxWidth: '400px' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#fef3c7', whiteSpace: 'nowrap' }}>
              السؤال {currentIndex + 1} من {totalQuestions}
            </span>
            <div style={{
              flexGrow: 1, height: '14px', background: '#334155', borderRadius: '9999px', overflow: 'hidden', border: '1px solid #475569'
            }}>
              <div style={{
                height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '9999px', transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            if (screenState === 'quiz') {
              if (window.confirm('هل أنتِ تأكدة من رغبتك في الخروج من الاختبار الحالي؟')) {
                if (onClose) onClose();
              }
            } else {
              if (onClose) onClose();
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8',
            width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        
        {/* ================================================= */}
        {/* SCREEN 1: QUESTION STEP VIEW */}
        {/* ================================================= */}
        {screenState === 'quiz' && currentQ && (
          <div style={{
            width: '100%', maxWidth: '780px', background: 'rgba(30, 41, 59, 0.95)',
            border: '2px solid #f59e0b', borderRadius: '28px', padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)'
          }}>
            
            {/* Question Text Header */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{
                display: 'inline-block', background: '#3b82f6', color: 'white', padding: '4px 14px',
                borderRadius: '9999px', fontSize: '14px', fontWeight: '800', marginBottom: '12px'
              }}>
                {currentQ.question_type === 'mcq' && 'اختيار من متعدد 🎯'}
                {currentQ.question_type === 'tf' && 'صح أم خطأ ⚖️'}
                {currentQ.question_type === 'ordering' && 'ترتيب أحداث القصة 🔄'}
                {currentQ.question_type === 'fill' && 'إكمال الفراغ ✏️'}
              </span>

              <h2 style={{
                fontSize: '26px', fontWeight: '900', color: '#ffffff', lineHeight: '1.5',
                fontFamily: "'Cairo', 'Tajawal', sans-serif"
              }}>
                {currentQ.question_text}
              </h2>
            </div>

            {/* QUESTION TYPE RENDERERS */}

            {/* 1. MCQ Options */}
            {currentQ.question_type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {(() => {
                  let opts = [];
                  try {
                    opts = typeof currentQ.options === 'string' ? JSON.parse(currentQ.options) : (currentQ.options || []);
                  } catch (e) {
                    opts = [];
                  }
                  return opts.map((opt, idx) => {
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        style={{
                          width: '100%', padding: '18px 24px', borderRadius: '18px',
                          border: isSelected ? '3px solid #fbbf24' : '2px solid #475569',
                          background: isSelected ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : '#1e293b',
                          color: isSelected ? '#ffffff' : '#e2e8f0',
                          fontSize: '20px', fontWeight: '800', textAlign: 'right', cursor: 'pointer',
                          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 8px 24px rgba(245, 158, 11, 0.3)' : 'none'
                        }}
                      >
                        <span>{opt}</span>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          border: isSelected ? '2px solid white' : '2px solid #64748b',
                          background: isSelected ? '#ffffff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#d97706' }} />}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}

            {/* 2. True / False */}
            {currentQ.question_type === 'tf' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                {['صح', 'خطأ'].map((opt) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const isTrue = opt === 'صح';
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      style={{
                        padding: '24px', borderRadius: '20px',
                        border: isSelected ? '3px solid #fbbf24' : '2px solid #475569',
                        background: isSelected
                          ? (isTrue ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)')
                          : '#1e293b',
                        color: 'white', fontSize: '28px', fontWeight: '900', cursor: 'pointer',
                        transition: 'all 0.2s ease', textAlign: 'center',
                        boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.4)' : 'none'
                      }}
                    >
                      {opt === 'صح' ? '✅ صح' : '❌ خطأ'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Fill-in-the-blank */}
            {currentQ.question_type === 'fill' && (
              <div style={{ marginBottom: '32px' }}>
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                  placeholder="اكتبي الكلمة المناسبة هنا..."
                  style={{
                    width: '100%', padding: '18px 24px', borderRadius: '18px',
                    border: '3px solid #fbbf24', background: '#0f172a', color: '#ffffff',
                    fontSize: '24px', fontWeight: '800', textAlign: 'center', direction: 'rtl', outline: 'none'
                  }}
                />
              </div>
            )}

            {/* 4. Ordering Events (Reorder) */}
            {currentQ.question_type === 'ordering' && (
              <div style={{ marginBottom: '32px' }}>
                <p style={{ color: '#fbbf24', fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>
                  💡 استخدمي الأسهم ⬆️ ⬇️ لتعديل ترتيب الأحداث من الأنسب إلى الآخير:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(orderingAnswers[currentQ.id] || []).map((itemText, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#1e293b', border: '2px solid #475569', borderRadius: '16px',
                        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '12px', color: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          background: '#f59e0b', color: '#1e293b', width: '32px', height: '32px',
                          borderRadius: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '800' }}>{itemText}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveOrderItem(currentQ.id, idx, idx - 1)}
                          style={{
                            background: idx === 0 ? '#334155' : '#0284c7', color: 'white', border: 'none',
                            padding: '6px 12px', borderRadius: '8px', cursor: idx === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          disabled={idx === (orderingAnswers[currentQ.id] || []).length - 1}
                          onClick={() => handleMoveOrderItem(currentQ.id, idx, idx + 1)}
                          style={{
                            background: idx === (orderingAnswers[currentQ.id] || []).length - 1 ? '#334155' : '#0284c7', color: 'white', border: 'none',
                            padding: '6px 12px', borderRadius: '8px', cursor: idx === (orderingAnswers[currentQ.id] || []).length - 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #334155' }}>
              <button
                disabled={currentIndex === 0}
                onClick={handlePrev}
                style={{
                  background: currentIndex === 0 ? '#334155' : 'rgba(255,255,255,0.1)',
                  color: currentIndex === 0 ? '#64748b' : '#ffffff',
                  border: '1px solid #475569', padding: '12px 28px', borderRadius: '16px',
                  fontWeight: '800', fontSize: '16px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <ArrowRight size={18} />
                <span>السابق</span>
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: 'white', border: 'none', padding: '12px 32px', borderRadius: '16px',
                    fontWeight: '900', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <span>التالي</span>
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={handleFinishQuiz}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white', border: 'none', padding: '14px 36px', borderRadius: '18px',
                    fontWeight: '900', fontSize: '20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Trophy size={22} />
                  <span>إنهاء الاختبار</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* SCREEN 2: FINAL RESULTS VIEW */}
        {/* ================================================= */}
        {screenState === 'results' && (
          <div style={{
            width: '100%', maxWidth: '600px', background: 'rgba(30, 41, 59, 0.95)',
            border: '3px solid #f59e0b', borderRadius: '32px', padding: '40px 28px',
            textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)'
          }}>
            {(() => {
              const resMeta = getResultMessage();
              return (
                <>
                  {/* Trophy Header */}
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5)'
                  }}>
                    <Trophy size={48} color="white" />
                  </div>

                  <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fbbf24', marginBottom: '8px' }}>
                    نتيجة اختبر نفسي
                  </h2>

                  {/* Stars Display */}
                  <div style={{ fontSize: '36px', margin: '14px 0', letterSpacing: '4px' }}>
                    {resMeta.stars}
                  </div>

                  {/* Score Box */}
                  <div style={{
                    background: '#1e293b', border: '2px solid #475569', borderRadius: '20px',
                    padding: '16px 24px', margin: '20px 0', display: 'inline-block'
                  }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '700' }}>النتيجة النهائية</div>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: resMeta.color }}>
                      {score} <span style={{ fontSize: '24px', color: '#64748b' }}>/ {totalQuestions}</span>
                    </div>
                  </div>

                  {/* Encouraging Message */}
                  <div style={{
                    background: resMeta.badgeBg, color: resMeta.color, padding: '16px 20px',
                    borderRadius: '16px', fontSize: '20px', fontWeight: '900', margin: '16px 0 28px 0'
                  }}>
                    {resMeta.msg}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleRestartQuiz}
                      style={{
                        background: '#0284c7', color: 'white', border: 'none', padding: '14px 28px',
                        borderRadius: '16px', fontSize: '17px', fontWeight: '900', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <RotateCcw size={20} />
                      <span>🔄 أعيد الاختبار</span>
                    </button>

                    <button
                      onClick={onClose}
                      style={{
                        background: '#10b981', color: 'white', border: 'none', padding: '14px 28px',
                        borderRadius: '16px', fontSize: '17px', fontWeight: '900', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={20} />
                      <span>العودة إلى الدرس</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
