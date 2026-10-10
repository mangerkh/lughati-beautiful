import React, { useState, useEffect } from 'react';
import { Gamepad2, CheckCircle, RefreshCw, Star, Sparkles, Award, BookOpenCheck, ArrowRight, Check, X, HelpCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import ReviewSection from './ReviewSection.jsx';

export default function ActivitiesSection({ 
  activities = [], 
  questions = [], 
  sectionContents = [],
  onCompleteSection,
  initialSubMode = null,
  onSubModeChange
}) {
  // subMode: null (showing 2 main cards), 'games' (interactive games), 'review' (review exercises)
  const [subMode, setSubMode] = useState(initialSubMode);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setSubMode(initialSubMode);
  }, [initialSubMode]);

  const handleSubModeChange = (newMode) => {
    setSubMode(newMode);
    if (onSubModeChange) {
      onSubModeChange(newMode);
    }
  };

  // Filter only enabled activities and sort by sort_order
  const enabledActivities = (activities || [])
    .filter(act => act.is_enabled !== 0)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Filter review questions (excluding comprehension and quiz questions)
  const reviewQuestions = (questions || []).filter(q => q.section_type === 'review');

  const triggerVictory = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
    if (onCompleteSection) onCompleteSection('activities');
  };

  // 1. Initial State: Display 2 Main Cards
  if (subMode === null) {
    return (
      <div className="content-box" style={{ maxWidth: '920px', margin: '0 auto', padding: '24px 16px' }}>
        <h2 className="section-title" style={{ color: '#ea580c', justifyContent: 'center', marginBottom: '12px' }}>
          <Gamepad2 size={36} />
          <span>قسم التدريب والتطبيق: أتدرب 🎯</span>
        </h2>
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#64748b', fontWeight: '700', marginBottom: '32px' }}>
          اختاري القسم الذي تفضلينه الآن للتدرب وتثبيت ما تعلمتِ:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Sub Card 1: Games */}
          <div 
            onClick={() => handleSubModeChange('games')}
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '3px solid #fb923c',
              borderRadius: '28px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 10px 25px rgba(234, 88, 12, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            className="hover-card"
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '20px', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.3)' }}>
              <Gamepad2 size={44} />
            </div>
            <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#9a3412', marginBottom: '8px' }}>
              🎮 ألعب وأتدرب
            </h3>
            <p style={{ fontSize: '17px', color: '#c2410c', fontWeight: '700', lineHeight: '1.6' }}>
              ألعاب ممتعة تفاعلية تساعدكِ على تثبيت ما تعلمتِ (ترتيب، صح وخطأ، اختيار، ومطابقة).
            </p>
            <button className="hero-start-btn" style={{ marginTop: '20px', background: '#ea580c', color: 'white', fontSize: '16px', padding: '10px 24px', boxShadow: 'none' }}>
              ابدئي الألعاب 🚀
            </button>
          </div>

          {/* Sub Card 2: Review Exercises */}
          <div 
            onClick={() => handleSubModeChange('review')}
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '3px solid #4ade80',
              borderRadius: '28px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 10px 25px rgba(22, 163, 74, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            className="hover-card"
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '20px', boxShadow: '0 8px 16px rgba(22, 163, 74, 0.3)' }}>
              <BookOpenCheck size={44} />
            </div>
            <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#14532d', marginBottom: '8px' }}>
              📝 أتدرب وأراجع
            </h3>
            <p style={{ fontSize: '17px', color: '#15803d', fontWeight: '700', lineHeight: '1.6' }}>
              تدريبات قصيرة وأوراق عمل تفاعلية لمراجعة وتأكيد فهم الدروس وتدريبات اللغة.
            </p>
            <button className="hero-start-btn" style={{ marginTop: '20px', background: '#16a34a', color: 'white', fontSize: '16px', padding: '10px 24px', boxShadow: 'none' }}>
              ابدئي التمارين 📝
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default HTML5 games for Lesson 4
  const defaultLesson4Games = [
    {
      id: 1,
      title: 'ميّزي حرفي ط / ظ',
      instructions: 'صنّفي الكلمات حسب الحرف المناسب.',
      activity_type: 'html_game',
      activity_data: {
        game_url: '/games/lesson-4/taa-zaa/index.html',
        icon: '🔤',
        description: 'صنّفي الكلمات حسب الحرف المناسب.'
      }
    },
    {
      id: 2,
      title: 'صنّفي الكلمات حسب ع / غ',
      instructions: 'ضعي كل كلمة مع حرفها الصحيح.',
      activity_type: 'html_game',
      activity_data: {
        game_url: '/games/lesson-4/ain-ghain/index.html',
        icon: '🧩',
        description: 'ضعي كل كلمة مع حرفها الصحيح.'
      }
    },
    {
      id: 3,
      title: 'ركّبي المقاطع',
      instructions: 'ركّبي المقاطع لتكوّني كلمات صحيحة.',
      activity_type: 'html_game',
      activity_data: {
        game_url: '/games/lesson-4/syllable-sort/index.html',
        icon: '🧱',
        description: 'ركّبي المقاطع لتكوّني كلمات صحيحة.'
      }
    },
    {
      id: 4,
      title: 'ذاكرة الكلمات',
      instructions: 'طابقي الكلمة مع معناها.',
      activity_type: 'html_game',
      activity_data: {
        game_url: '/games/lesson-4/memory-vocab/index.html',
        icon: '🧠',
        description: 'طابقي الكلمة مع معناها.'
      }
    },
    {
      id: 5,
      title: 'أكملي الكلمة',
      instructions: 'اختاري الحرف الناقص لإكمال الكلمة.',
      activity_type: 'html_game',
      activity_data: {
        game_url: '/games/lesson-4/complete-word/index.html',
        icon: '✏️',
        description: 'اختاري الحرف الناقص لإكمال الكلمة.'
      }
    }
  ];

  // 2. Interactive Games View
  if (subMode === 'games') {
    const listToRender = enabledActivities && enabledActivities.length > 0
      ? enabledActivities
      : defaultLesson4Games;

    const themeStyles = [
      { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#fdba74', btnBg: '#ea580c' },
      { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '#6ee7b7', btnBg: '#059669' },
      { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#93c5fd', btnBg: '#2563eb' },
      { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#c4b5fd', btnBg: '#7c3aed' },
      { bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', border: '#f9a8d4', btnBg: '#db2777' }
    ];

    return (
      <div className="content-box" style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            onClick={() => handleSubModeChange(null)} 
            style={{ 
              background: '#fff7ed', 
              color: '#ea580c', 
              border: '2px solid #fdba74', 
              padding: '10px 20px', 
              borderRadius: '14px', 
              fontWeight: '900', 
              fontSize: '16px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowRight size={22} />
            <span>↩ العودة إلى أتدرب</span>
          </button>

          <h2 className="section-title" style={{ color: '#ea580c', margin: 0, fontSize: '26px' }}>
            <Gamepad2 size={34} />
            <span>🎮 ألعب وأتدرب</span>
          </h2>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '18px', fontWeight: '700', marginBottom: '28px' }}>
          اختر إحدى الألعاب التالية لبدء التحدي وتثبيت المفاهيم بأسلوب ممتع:
        </p>

        {/* 5 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '22px'
        }}>
          {listToRender.map((act, idx) => {
            const data = typeof act.activity_data === 'string' 
              ? JSON.parse(act.activity_data || '{}') 
              : (act.activity_data || {});
            
            const gameUrl = data.game_url || act.game_url || '/games/lesson-4/taa-zaa/index.html';
            const icon = data.icon || (idx === 0 ? '🔤' : idx === 1 ? '🧩' : idx === 2 ? '🧱' : idx === 3 ? '🧠' : '✏️');
            const description = data.description || act.instructions || 'لعبة تعليمية تفاعلية ممتعة.';
            const theme = themeStyles[idx % themeStyles.length];

            return (
              <div 
                key={act.id || idx}
                style={{
                  background: data.bg || theme.bg,
                  border: `3px solid ${data.border || theme.border}`,
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '16px'
                  }}>
                    {icon}
                  </div>

                  <h3 style={{
                    fontFamily: 'Cairo, sans-serif',
                    fontSize: '22px',
                    fontWeight: '900',
                    color: '#1e293b',
                    marginBottom: '10px'
                  }}>
                    {act.title}
                  </h3>

                  <p style={{
                    fontSize: '15px',
                    color: '#475569',
                    fontWeight: '700',
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {description}
                  </p>
                </div>

                <button
                  onClick={() => { window.location.href = gameUrl; }}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    border: 'none',
                    background: theme.btnBg,
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '17px',
                    fontFamily: 'Cairo, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={18} />
                  <span>ابدئي اللعبة 🚀</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Review Exercises View
  if (subMode === 'review') {
    return (
      <div className="content-box" style={{ maxWidth: '920px', margin: '0 auto', padding: '24px 16px' }}>
        <button 
          onClick={() => handleSubModeChange(null)} 
          style={{ background: '#f0fdf4', color: '#16a34a', border: '2px solid #86efac', padding: '8px 18px', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
        >
          <ArrowRight size={20} />
          <span>↩ العودة إلى أتدرب</span>
        </button>

        <ReviewSection questions={reviewQuestions} sectionContents={sectionContents} onCompleteSection={onCompleteSection} />
      </div>
    );
  }

  return null;
}

/* =========================================================================
   1. Game Engine: Ordering Events (ترتيب أحداث القصة)
   ========================================================================= */
function OrderingGameEngine({ data, onWin, gameTitle }) {
  const items = data?.items || [];
  
  // Shuffle function
  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const [currentOrder, setCurrentOrder] = useState(() => shuffleArray(items));
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setCurrentOrder(newOrder);
    setErrorMsg('');
  };

  const handleMoveDown = (index) => {
    if (index === currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setCurrentOrder(newOrder);
    setErrorMsg('');
  };

  const checkOrder = () => {
    const isCorrect = currentOrder.every((val, idx) => val === items[idx]);
    if (isCorrect) {
      setIsCompleted(true);
      if (onWin) onWin();
    } else {
      setErrorMsg('الترتيب غير صحيح بعد يا بطلة، راجعي تسلسل الأحداث وحاولي مجدداً! 💪');
    }
  };

  const handleRestart = () => {
    setCurrentOrder(shuffleArray(items));
    setIsCompleted(false);
    setErrorMsg('');
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '16px', color: '#ea580c', fontWeight: '800' }}>
        💡 استخدمي الأسهم ⬆️ ⬇️ لترتيب الأحداث بالترتيب الزمني الصحيح للقصة:
      </p>

      {currentOrder.map((item, idx) => (
        <div 
          key={idx} 
          style={{
            background: 'white',
            border: '2px solid #fed7aa',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ background: '#ea580c', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>
              {idx + 1}
            </span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{item}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleMoveUp(idx)}
              disabled={idx === 0}
              style={{
                background: idx === 0 ? '#f1f5f9' : '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: '10px',
                padding: '6px 12px',
                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '900',
                fontSize: '18px',
                color: idx === 0 ? '#cbd5e1' : '#c2410c'
              }}
            >
              ⬆️
            </button>
            <button
              onClick={() => handleMoveDown(idx)}
              disabled={idx === currentOrder.length - 1}
              style={{
                background: idx === currentOrder.length - 1 ? '#f1f5f9' : '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: '10px',
                padding: '6px 12px',
                cursor: idx === currentOrder.length - 1 ? 'not-allowed' : 'pointer',
                fontWeight: '900',
                fontSize: '18px',
                color: idx === currentOrder.length - 1 ? '#cbd5e1' : '#c2410c'
              }}
            >
              ⬇️
            </button>
          </div>
        </div>
      ))}

      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', color: '#991b1b', padding: '12px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '16px', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      <button
        onClick={checkOrder}
        className="hero-start-btn"
        style={{ marginTop: '12px', background: '#ea580c', color: 'white', padding: '12px 28px', fontSize: '18px', alignSelf: 'center' }}
      >
        🔍 التحقق من الترتيب
      </button>
    </div>
  );
}

/* =========================================================================
   2. Game Engine: True / False (صح أم خطأ؟)
   ========================================================================= */
function TrueFalseGameEngine({ data, onWin, gameTitle }) {
  const items = data?.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentItem = items[currentIndex] || {};

  const handleAnswer = (userChoice) => {
    if (feedback !== null) return;

    const isCorrect = userChoice === currentItem.answer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < items.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsCompleted(true);
        if (onWin) onWin();
      }
    }, 1200);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} score={`${score} من ${items.length}`} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ fontSize: '16px', color: '#ea580c', fontWeight: '900' }}>
        عبارة ({currentIndex + 1} من {items.length})
      </div>

      <div 
        style={{
          width: '100%',
          background: 'white',
          border: '3px solid #fdba74',
          borderRadius: '20px',
          padding: '28px 20px',
          textAlign: 'center',
          fontSize: '22px',
          fontWeight: '900',
          color: '#1e293b',
          boxShadow: '0 8px 20px rgba(234, 88, 12, 0.08)'
        }}
      >
        "{currentItem.statement}"
      </div>

      {feedback === 'correct' && (
        <div style={{ background: '#d1fae5', border: '2px solid #34d399', color: '#065f46', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '18px' }}>
          🎉 إجابة صحيحة! أحسنتِ يا بطلة!
        </div>
      )}

      {feedback === 'wrong' && (
        <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', color: '#991b1b', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '18px' }}>
          ❌ إجابة غير صحيحة، حاولِ التفكير مرة أخرى!
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', marginTop: '12px' }}>
        <button
          onClick={() => handleAnswer(true)}
          style={{
            flex: 1,
            maxWidth: '220px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            fontSize: '22px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '10px',
            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <CheckCircle size={28} />
          <span>صح ✅</span>
        </button>

        <button
          onClick={() => handleAnswer(false)}
          style={{
            flex: 1,
            maxWidth: '220px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            fontSize: '22px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '10px',
            boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)'
          }}
        >
          <X size={28} />
          <span>خطأ ❌</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   3. Game Engine: Multiple Choice (اختر الإجابة الصحيحة)
   ========================================================================= */
function MultipleChoiceGameEngine({ data, onWin, gameTitle }) {
  const questions = data?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIndex] || {};

  const handleSelectOption = (opt) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsCompleted(true);
        if (onWin) onWin();
      }
    }, 1200);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} score={`${score} من ${questions.length}`} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '16px', color: '#ea580c', fontWeight: '900' }}>
        السؤال ({currentIndex + 1} من {questions.length}):
      </div>

      <div style={{ background: 'white', border: '3px solid #fed7aa', borderRadius: '20px', padding: '24px', fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>
        {currentQ.question}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentQ.options?.map((opt, idx) => {
          let btnBg = 'white';
          let btnBorder = '#cbd5e1';
          let btnColor = '#1e293b';

          if (selectedOption !== null) {
            if (opt === currentQ.correct) {
              btnBg = '#d1fae5';
              btnBorder = '#10b981';
              btnColor = '#065f46';
            } else if (opt === selectedOption) {
              btnBg = '#fee2e2';
              btnBorder = '#ef4444';
              btnColor = '#991b1b';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(opt)}
              style={{
                background: btnBg,
                border: `2px solid ${btnBorder}`,
                color: btnColor,
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '19px',
                fontWeight: '800',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <span>{opt}</span>
              {selectedOption !== null && opt === currentQ.correct && <span>✅</span>}
              {selectedOption !== null && opt === selectedOption && opt !== currentQ.correct && <span>❌</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   4. Game Engine: Matching Words & Meanings (طابق الكلمة بمعناها)
   ========================================================================= */
function MatchEngine({ data, onWin, gameTitle }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matches, setMatches] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const pairs = data?.pairs || [];

  const handleLeftClick = (item) => setSelectedLeft(item);

  const handleRightClick = (rightItem) => {
    if (!selectedLeft) return;
    const found = pairs.find(p => p.left === selectedLeft.left && p.right === rightItem.right);
    if (found) {
      const newMatches = { ...matches, [selectedLeft.left]: rightItem.right };
      setMatches(newMatches);
      setSelectedLeft(null);
      if (Object.keys(newMatches).length === pairs.length) {
        setTimeout(() => {
          setIsCompleted(true);
          if (onWin) onWin();
        }, 500);
      }
    } else {
      alert('إجابة غير صحيحة، جربي كلمة أخرى يا بطلة!');
      setSelectedLeft(null);
    }
  };

  const handleRestart = () => {
    setSelectedLeft(null);
    setMatches({});
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ textAlign: 'center', color: '#ea580c', fontWeight: '900', fontSize: '18px' }}>الكلمة:</h4>
          {pairs.map((p, idx) => {
            const isMatched = matches[p.left] !== undefined;
            const isSelected = selectedLeft?.left === p.left;
            return (
              <div
                key={idx}
                onClick={() => !isMatched && handleLeftClick(p)}
                style={{
                  background: isMatched ? '#d1fae5' : isSelected ? '#fff7ed' : 'white',
                  border: isMatched ? '2px solid #10b981' : isSelected ? '2px solid #ea580c' : '2px solid #cbd5e1',
                  color: isMatched ? '#065f46' : isSelected ? '#c2410c' : '#1e293b',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  fontWeight: '900',
                  fontSize: '18px',
                  cursor: isMatched ? 'default' : 'pointer',
                  textAlign: 'center',
                  boxShadow: isSelected ? '0 4px 12px rgba(234, 88, 12, 0.2)' : 'none'
                }}
              >
                {p.left} {isMatched ? '✅' : ''}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ textAlign: 'center', color: '#0284c7', fontWeight: '900', fontSize: '18px' }}>المعنى:</h4>
          {pairs.map((p, idx) => {
            const isMatched = Object.values(matches).includes(p.right);
            return (
              <div
                key={idx}
                onClick={() => !isMatched && handleRightClick(p)}
                style={{
                  background: isMatched ? '#d1fae5' : 'white',
                  border: isMatched ? '2px solid #10b981' : '2px solid #cbd5e1',
                  color: isMatched ? '#065f46' : '#1e293b',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  fontWeight: '800',
                  fontSize: '17px',
                  cursor: isMatched ? 'default' : 'pointer',
                  textAlign: 'center'
                }}
              >
                {p.right} {isMatched ? '✅' : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. Game Engine: Missing Letter (أكملي الكلمة بالحرف الناقص)
   ========================================================================= */
function MissingLetterGameEngine({ data, onWin, gameTitle }) {
  const items = data?.items || [];
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSelectLetter = (idx, opt, correct) => {
    const nextAnswers = { ...answers, [idx]: opt };
    setAnswers(nextAnswers);

    if (Object.keys(nextAnswers).length === items.length) {
      let isAllCorrect = true;
      items.forEach((item, i) => {
        if (nextAnswers[i] !== item.correct) isAllCorrect = false;
      });
      if (isAllCorrect) {
        setTimeout(() => {
          setIsCompleted(true);
          if (onWin) onWin();
        }, 600);
      }
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: 'white', padding: '20px', borderRadius: '18px', border: '2px solid #fed7aa', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', marginBottom: '16px', fontFamily: 'Cairo, sans-serif' }}>
            {item.word.replace('_', answers[idx] ? `[ ${answers[idx]} ]` : ' ___ ')}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {item.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectLetter(idx, opt, item.correct)}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  fontSize: '22px',
                  fontWeight: '900',
                  border: answers[idx] === opt 
                    ? (opt === item.correct ? '2px solid #10b981' : '2px solid #ef4444')
                    : '2px solid #cbd5e1',
                  background: answers[idx] === opt 
                    ? (opt === item.correct ? '#d1fae5' : '#fee2e2')
                    : 'white',
                  color: answers[idx] === opt 
                    ? (opt === item.correct ? '#065f46' : '#991b1b')
                    : '#1e293b',
                  cursor: 'pointer'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   6. Game Engine: Sentence Order (رتبي الكلمات لتكوين جملة)
   ========================================================================= */
function SentenceOrderGameEngine({ data, onWin, gameTitle }) {
  const sentences = data?.sentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userWords, setUserWords] = useState([]);
  const [availableWords, setAvailableWords] = useState(() => sentences[0]?.words || []);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentSentence = sentences[currentIndex] || {};

  const handlePickWord = (word, index) => {
    const nextUser = [...userWords, word];
    const nextAvail = availableWords.filter((_, i) => i !== index);
    setUserWords(nextUser);
    setAvailableWords(nextAvail);

    if (nextAvail.length === 0) {
      if (JSON.stringify(nextUser) === JSON.stringify(currentSentence.correct)) {
        if (currentIndex + 1 < sentences.length) {
          setTimeout(() => {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setUserWords([]);
            setAvailableWords(sentences[nextIdx].words);
          }, 800);
        } else {
          setTimeout(() => {
            setIsCompleted(true);
            if (onWin) onWin();
          }, 600);
        }
      } else {
        alert('ترتيب الجملة غير صحيح، أعيدي المحاولة يا بطلة!');
        setUserWords([]);
        setAvailableWords(currentSentence.words);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserWords([]);
    setAvailableWords(sentences[0]?.words || []);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c', marginBottom: '16px' }}>
        الجملة ({currentIndex + 1} من {sentences.length}):
      </div>

      <div 
        style={{
          background: 'white',
          border: '2px dashed #fdba74',
          borderRadius: '16px',
          padding: '20px',
          minHeight: '70px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        {userWords.length === 0 ? (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '17px' }}>اضغطي على الكلمات بالترتيب الصحيح لتكوين الجملة...</span>
        ) : (
          userWords.map((w, idx) => (
            <span key={idx} style={{ background: '#d1fae5', border: '2px solid #10b981', color: '#065f46', padding: '8px 18px', borderRadius: '12px', fontWeight: '900', fontSize: '20px' }}>
              {w}
            </span>
          ))
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {availableWords.map((w, idx) => (
          <button
            key={idx}
            onClick={() => handlePickWord(w, idx)}
            style={{ background: 'white', border: '2px solid #cbd5e1', borderRadius: '14px', padding: '10px 20px', fontSize: '20px', fontWeight: '900', cursor: 'pointer' }}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   7. Game Engine: Memory Game (لعبة ذاكرة الكلمات)
   ========================================================================= */
function MemoryEngine({ data, onWin, gameTitle }) {
  const rawPairs = data?.pairs || [];
  
  // Generate cards array
  const [cards, setCards] = useState(() => {
    let generated = [];
    rawPairs.forEach((pair, idx) => {
      generated.push({ id: `l_${idx}`, matchId: idx, text: pair.left });
      generated.push({ id: `r_${idx}`, matchId: idx, text: pair.right });
    });
    return generated.sort(() => Math.random() - 0.5);
  });

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCardClick = (card) => {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.id)) return;

    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const card1 = cards.find(c => c.id === nextFlipped[0]);
      const card2 = cards.find(c => c.id === nextFlipped[1]);

      if (card1.matchId === card2.matchId) {
        const nextMatched = [...matched, card1.id, card2.id];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === cards.length) {
          setTimeout(() => {
            setIsCompleted(true);
            if (onWin) onWin();
          }, 600);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const handleRestart = () => {
    let generated = [];
    rawPairs.forEach((pair, idx) => {
      generated.push({ id: `l_${idx}`, matchId: idx, text: pair.left });
      generated.push({ id: `r_${idx}`, matchId: idx, text: pair.right });
    });
    setCards(generated.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
      {cards.map((c) => {
        const isFlipped = flipped.includes(c.id) || matched.includes(c.id);
        const isMatched = matched.includes(c.id);
        return (
          <div
            key={c.id}
            onClick={() => handleCardClick(c)}
            style={{
              height: '110px',
              borderRadius: '16px',
              background: isMatched ? '#d1fae5' : isFlipped ? '#fff7ed' : '#ea580c',
              border: isMatched ? '3px solid #10b981' : isFlipped ? '3px solid #fb923c' : '3px solid #c2410c',
              color: isMatched ? '#065f46' : isFlipped ? '#c2410c' : 'white',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontSize: isFlipped ? '17px' : '32px',
              fontWeight: '900',
              textAlign: 'center',
              padding: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.3s ease'
            }}
          >
            {isFlipped ? c.text : '❓'}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
   Legacy / Additional Engines (Match Image, Letter Select, Classification, Analysis)
   ========================================================================= */
function MatchImageEngine({ data, onWin, gameTitle }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [matches, setMatches] = useState({});
  const pairs = data?.pairs || [];

  const handleWordClick = (p) => setSelectedWord(p);

  const handleImageClick = (p) => {
    if (!selectedWord) return;
    if (selectedWord.text === p.text) {
      const newMatches = { ...matches, [p.text]: true };
      setMatches(newMatches);
      setSelectedWord(null);
      if (Object.keys(newMatches).length === pairs.length) {
        if (onWin) onWin();
      }
    } else {
      setSelectedWord(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pairs.map((p, i) => (
          <div
            key={i}
            onClick={() => !matches[p.text] && handleWordClick(p)}
            style={{
              padding: '14px', borderRadius: '12px', border: '2px solid #cbd5e1',
              background: matches[p.text] ? '#d1fae5' : selectedWord?.text === p.text ? '#fff7ed' : 'white',
              fontWeight: '800', textAlign: 'center', cursor: 'pointer'
            }}
          >
            {p.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pairs.map((p, i) => (
          <div
            key={i}
            onClick={() => !matches[p.text] && handleImageClick(p)}
            style={{
              padding: '14px', borderRadius: '12px', border: '2px solid #cbd5e1',
              background: matches[p.text] ? '#d1fae5' : 'white',
              fontSize: '32px', textAlign: 'center', cursor: 'pointer'
            }}
          >
            {p.image}
          </div>
        ))}
      </div>
    </div>
  );
}

function LetterSelectEngine({ data, onWin }) {
  const items = data?.items || [];
  const [answers, setAnswers] = useState({});

  const handleSelect = (idx, opt, correct) => {
    const nextAnswers = { ...answers, [idx]: opt };
    setAnswers(nextAnswers);

    if (Object.keys(nextAnswers).length === items.length) {
      let isAllCorrect = true;
      items.forEach((item, i) => {
        if (nextAnswers[i] !== item.correct) isAllCorrect = false;
      });
      if (isAllCorrect && onWin) onWin();
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px' }}>
            {item.prompt}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {item.options.map((opt, i) => (
              <button
                key={i}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  fontSize: '22px',
                  fontWeight: '800',
                  border: answers[idx] === opt ? '2px solid #10b981' : '2px solid #cbd5e1',
                  background: answers[idx] === opt ? '#d1fae5' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelect(idx, opt, item.correct)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassificationEngine({ data, onWin, gameTitle }) {
  const categories = data?.categories || ['حرف ط', 'حرف ظ'];
  const items = data?.items || [];
  const [classified, setClassified] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleClassify = (item, targetCat) => {
    if (item.category === targetCat) {
      const nextClassified = { ...classified, [item.text]: targetCat };
      setClassified(nextClassified);
      setSelectedItem(null);
      setFeedback({ type: 'success', text: 'أحسنتِ 🌟' });
      setTimeout(() => setFeedback(null), 1500);

      if (Object.keys(nextClassified).length === items.length) {
        setTimeout(() => {
          setIsCompleted(true);
          if (onWin) onWin();
        }, 600);
      }
    } else {
      setFeedback({ type: 'error', text: 'حاولي مرة أخرى 💪' });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleCategoryClick = (cat) => {
    if (!selectedItem) return;
    handleClassify(selectedItem, cat);
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.text);
  };

  const handleDrop = (e, cat) => {
    e.preventDefault();
    const itemText = e.dataTransfer.getData('text/plain');
    const item = items.find(i => i.text === itemText);
    if (item) {
      handleClassify(item, cat);
    }
  };

  const handleRestart = () => {
    setClassified({});
    setSelectedItem(null);
    setFeedback(null);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {feedback && (
        <div 
          style={{ 
            background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2', 
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            border: feedback.type === 'success' ? '2px solid #10b981' : '2px solid #ef4444',
            padding: '12px 20px', 
            borderRadius: '16px', 
            fontSize: '19px', 
            fontWeight: '900', 
            textAlign: 'center'
          }}
        >
          {feedback.text}
        </div>
      )}

      <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#c2410c', marginBottom: '12px' }}>
          اسحبي الكلمة أو اضغطي عليها ثم اختاري الصندوق المناسب:
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {items.map((item, idx) => {
            if (classified[item.text]) return null;
            const isSelected = selectedItem?.text === item.text;
            return (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setSelectedItem(isSelected ? null : item)}
                style={{
                  background: isSelected ? '#ea580c' : 'white',
                  color: isSelected ? 'white' : '#1e293b',
                  border: isSelected ? '3px solid #c2410c' : '2px solid #fdba74',
                  padding: '10px 22px',
                  borderRadius: '14px',
                  fontWeight: '900',
                  fontSize: '22px',
                  cursor: 'grab',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                  userSelect: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.text}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {categories.map((cat, i) => (
          <div
            key={i}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, cat)}
            onClick={() => handleCategoryClick(cat)}
            style={{
              background: 'white',
              border: selectedItem ? '3px dashed #ea580c' : '2px solid #cbd5e1',
              borderRadius: '20px',
              padding: '24px',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: selectedItem ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ea580c', marginBottom: '16px', background: '#fff7ed', padding: '6px 20px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
              {cat}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%', justifyContent: 'center' }}>
              {Object.entries(classified)
                .filter(([_, c]) => c === cat)
                .map(([text], idx) => (
                  <span key={idx} style={{ background: '#d1fae5', color: '#065f46', border: '2px solid #10b981', padding: '8px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '20px' }}>
                    {text} ✓
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyllablesCombineEngine({ data, onWin, gameTitle }) {
  const groups = data?.groups || [];
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [completedWords, setCompletedWords] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentGroup = groups[currentGroupIdx] || { prefix: '', suffixes: [] };

  const handleSelectSuffix = (suf) => {
    const wordFormed = suf.result || (currentGroup.prefix + suf.text);
    if (!completedWords.includes(wordFormed)) {
      const nextCompleted = [...completedWords, wordFormed];
      setCompletedWords(nextCompleted);
      setFeedback({ type: 'success', text: `${currentGroup.prefix} + ${suf.text} = ${wordFormed} 🌟 أحسنتِ!` });
      setTimeout(() => setFeedback(null), 1600);

      if (nextCompleted.length === currentGroup.suffixes.length) {
        if (currentGroupIdx + 1 < groups.length) {
          setTimeout(() => {
            setCurrentGroupIdx(currentGroupIdx + 1);
            setCompletedWords([]);
          }, 1500);
        } else {
          setTimeout(() => {
            setIsCompleted(true);
            if (onWin) onWin();
          }, 1500);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentGroupIdx(0);
    setCompletedWords([]);
    setFeedback(null);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return <VictoryScreen gameTitle={gameTitle} onRestart={handleRestart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c' }}>
        المجموعة ({currentGroupIdx + 1} من {groups.length}):
      </div>

      {feedback && (
        <div 
          style={{ 
            background: '#d1fae5', 
            color: '#065f46', 
            border: '2px solid #10b981', 
            padding: '14px 20px', 
            borderRadius: '16px', 
            fontSize: '22px', 
            fontWeight: '900', 
            textAlign: 'center' 
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Syllables Combining Workspace */}
      <div style={{ background: 'white', border: '3px solid #fed7aa', borderRadius: '24px', padding: '28px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#64748b', marginBottom: '20px' }}>
          اضغطي على المقطع المناسب لتركيبه مع المقطع الثابت:
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {/* Fixed Prefix Block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#ea580c' }}>المقطع الثابت</span>
            <div style={{ background: '#ea580c', color: 'white', border: '3px solid #c2410c', borderRadius: '20px', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '900', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.25)' }}>
              {currentGroup.prefix}
            </div>
          </div>

          <span style={{ fontSize: '36px', fontWeight: '900', color: '#fdba74' }}>+</span>

          {/* Suffix Options Blocks */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentGroup.suffixes.map((suf, idx) => {
              const wordFormed = suf.result || (currentGroup.prefix + suf.text);
              const isDone = completedWords.includes(wordFormed);
              return (
                <button
                  key={idx}
                  disabled={isDone}
                  onClick={() => handleSelectSuffix(suf)}
                  style={{
                    background: isDone ? '#d1fae5' : '#fff7ed',
                    color: isDone ? '#065f46' : '#c2410c',
                    border: isDone ? '3px solid #10b981' : '3px solid #fdba74',
                    borderRadius: '20px',
                    width: '100px',
                    height: '100px',
                    fontSize: '32px',
                    fontWeight: '900',
                    cursor: isDone ? 'default' : 'pointer',
                    boxShadow: isDone ? 'none' : '0 6px 14px rgba(0,0,0,0.06)',
                    opacity: isDone ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {suf.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formed Words Area */}
        <div style={{ background: '#fafaf9', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#64748b', marginBottom: '10px' }}>
            الكلمات المكونة حتى الآن:
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {completedWords.length === 0 ? (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>لم تصنعي أي كلمة بعد...</span>
            ) : (
              completedWords.map((w, i) => (
                <span key={i} style={{ background: '#d1fae5', color: '#065f46', border: '2px solid #10b981', padding: '8px 20px', borderRadius: '14px', fontSize: '24px', fontWeight: '900' }}>
                  {w} ✓
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WordAnalysisEngine({ data, onWin }) {
  const items = data?.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userParts, setUserParts] = useState([]);

  const currentItem = items[currentIndex];

  const handleAddPart = (part) => {
    const next = [...userParts, part];
    setUserParts(next);

    if (next.length === currentItem.parts.length) {
      if (JSON.stringify(next) === JSON.stringify(currentItem.parts)) {
        if (currentIndex + 1 < items.length) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
            setUserParts([]);
          }, 800);
        } else {
          if (onWin) onWin();
        }
      } else {
        alert('تحليل غير صحيح، أعد المحاولة يا بطل!');
        setUserParts([]);
      }
    }
  };

  return (
    <div>
      <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '20px', textAlign: 'center' }}>
        الكلمة المراد تحليلها: <span style={{ color: '#ea580c', fontSize: '32px' }}>{currentItem?.word}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        {currentItem?.parts.map((_, i) => (
          <span key={i} style={{ background: '#f1f5f9', border: '2px solid #cbd5e1', padding: '12px 24px', borderRadius: '12px', fontSize: '22px', fontWeight: '900' }}>
            {userParts[i] || '___'}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {currentItem?.parts.map((p, i) => (
          <button key={i} style={{ background: 'white', border: '2px solid #ea580c', padding: '10px 20px', borderRadius: '12px', fontSize: '20px', fontWeight: '800', cursor: 'pointer' }} onClick={() => handleAddPart(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   Victory Screen Component
   ========================================================================= */
function VictoryScreen({ gameTitle, score, onRestart }) {
  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        border: '3px solid #fb923c',
        borderRadius: '24px',
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)' }}>
        <Trophy size={48} />
      </div>

      <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900', color: '#9a3412', margin: 0 }}>
        🌟 أحسنتِ يا بطلة!
      </h3>

      <p style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c', margin: 0 }}>
        لقد أتممتِ لعبة ({gameTitle}) بنجاح وتفوق! 🎉
      </p>

      {score && (
        <div style={{ background: 'white', border: '2px solid #fdba74', padding: '8px 20px', borderRadius: '9999px', fontSize: '18px', fontWeight: '900', color: '#ea580c' }}>
          النتيجة: {score}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onRestart}
          className="hero-start-btn"
          style={{ background: '#ea580c', color: 'white', padding: '12px 28px', fontSize: '17px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={20} />
          <span>🔄 ألعب مرة أخرى</span>
        </button>
      </div>
    </div>
  );
}
