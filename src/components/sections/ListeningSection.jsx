import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, CheckCircle2, XCircle } from 'lucide-react';

export default function ListeningSection({ sectionData, questions = [], onCompleteSection }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSelectOption = (qId, option, correctAnswer) => {
    const isCorrect = option === correctAnswer;
    setUserAnswers({ ...userAnswers, [qId]: option });
    setFeedback({ ...feedback, [qId]: isCorrect });

    // If all questions answered correctly, trigger section completion
    const newAnswers = { ...userAnswers, [qId]: option };
    if (questions.length > 0 && Object.keys(newAnswers).length === questions.length) {
      onCompleteSection('listening');
    }
  };

  return (
    <div>
      {/* Listening Header Card */}
      <div className="content-box">
        <h2 className="section-title" style={{ color: '#0284c7' }}>
          <Volume2 size={32} />
          <span>أستمع إلى نص (بلادي جميلة)</span>
        </h2>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <img 
            src="/uploads/pdf_page_1.png" 
            alt="نص الاستماع" 
            style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '16px', border: '2px solid #cbd5e1' }}
          />
        </div>

        {/* Audio Player Controls */}
        <div className="audio-player-card">
          <button className="audio-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginRight: '-2px' }} />}
          </button>

          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>
              {isPlaying ? 'جارٍ تشغيل النص الصوتي...' : 'اضغط للاستماع إلى النص'}
            </div>
            <div className="progress-bar-bg" style={{ height: '8px' }}>
              <div className="progress-bar-fill" style={{ width: isPlaying ? '60%' : '0%' }}></div>
            </div>
          </div>

          <button className="back-btn" onClick={() => setIsPlaying(true)} style={{ padding: '8px 14px' }}>
            <RotateCcw size={20} />
            <span>إعادة</span>
          </button>
        </div>
      </div>

      {/* Listening Questions */}
      <div className="content-box">
        <h3 className="section-title" style={{ fontSize: '22px' }}>أسئلة الاستماع (نُجِيبُ شَفَوِيّاً أو نَخْتَارُ):</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
          {questions.map((q, idx) => {
            const isAnswered = userAnswers[q.id] !== undefined;
            const isCorrect = feedback[q.id];
            const optionsList = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

            return (
              <div key={q.id} className="activity-card" style={{ borderRight: '6px solid #0284c7' }}>
                <div style={{ fontWeight: '800', fontSize: '20px', marginBottom: '16px' }}>
                  {idx + 1}. {q.question_text}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {optionsList.map((opt, i) => {
                    const isSelected = userAnswers[q.id] === opt;
                    let btnStyle = {
                      background: 'white',
                      border: '2px solid #cbd5e1',
                      padding: '12px 24px',
                      borderRadius: '16px',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flex: '1 1 200px'
                    };

                    if (isSelected) {
                      btnStyle.background = isCorrect ? '#d1fae5' : '#fee2e2';
                      btnStyle.borderColor = isCorrect ? '#10b981' : '#ef4444';
                      btnStyle.color = isCorrect ? '#065f46' : '#991b1b';
                    }

                    return (
                      <button
                        key={i}
                        style={btnStyle}
                        onClick={() => handleSelectOption(q.id, opt, q.correct_answer)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '800',
                    fontSize: '18px',
                    color: isCorrect ? '#10b981' : '#ef4444'
                  }}>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={24} />
                        <span>أحسنت يا بطل! إجابة صحيحة ✨</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={24} />
                        <span>حاول مرة أخرى يا بطل 🌸</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
