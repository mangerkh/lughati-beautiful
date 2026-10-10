import React, { useState } from 'react';
import { Layers, Volume2, Sparkles, CheckCircle } from 'lucide-react';

export default function VocabularySection({ vocabulary = [], onCompleteSection }) {
  const [activeWord, setActiveWord] = useState(null);

  const defaultVocab = [
    { word: 'كَنْزٌ', meaning: 'الشَّيْءُ الثَّمِينُ', icon: '🪙' },
    { word: 'يَنْكُشُ', meaning: 'يَحْفِرُ فِي الأَرْضِ', icon: '⛏️' },
    { word: 'رَجَعُوا', meaning: 'عَادُوا', icon: '🚶‍♂️' },
    { word: 'فَأْسٌ', meaning: 'أَدَاةُ الحَفْرِ والزِّراعَةِ', icon: '🪓' },
    { word: 'سَهْلٌ', meaning: 'أَرْضٌ مُنْبَسِطَةٌ واسِعَةٌ', icon: '🏞️' },
    { word: 'جَبَلٌ', meaning: 'أَرْضٌ مُرْتَفِعَةٌ عَنِ الأَرْضِ', icon: '🏔️' },
    { word: 'زَيْتُونٌ', meaning: 'شَجَرَةٌ مُبارَكَةٌ نَسْتَخْرِجُ مِنْها الزَّيْتَ', icon: '🫒' },
    { word: 'قَمْحٌ', meaning: 'نَبَاتٌ نَصْنَعُ مِنْهُ الْخُبْزَ', icon: '🌾' }
  ];

  const vocabList = vocabulary.length > 0 ? vocabulary : defaultVocab;

  const handleSpeak = (w) => {
    setActiveWord(w.word);
    onCompleteSection('vocabulary');
  };

  return (
    <div className="content-box">
      <h2 className="section-title" style={{ color: '#d97706' }}>
        <Layers size={32} />
        <span>كلماتي الجديدة: نتعلم معاني الكلمات</span>
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
        marginTop: '24px'
      }}>
        {vocabList.map((item, idx) => (
          <div
            key={idx}
            className="activity-card"
            style={{
              margin: 0,
              background: activeWord === item.word ? '#fef3c7' : 'white',
              borderColor: activeWord === item.word ? '#f59e0b' : '#e2e8f0',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>
              {item.icon || '✨'}
            </div>

            <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>
              {item.word}
            </div>

            <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669', marginBottom: '16px' }}>
              المعنى: {item.meaning}
            </div>

            <button
              className="teacher-login-btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: '#fffbeb',
                borderColor: '#fde68a',
                color: '#b45309'
              }}
              onClick={() => handleSpeak(item)}
            >
              <Volume2 size={20} />
              <span>نطق الكلمة</span>
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button 
          className="hero-start-btn"
          onClick={() => onCompleteSection('vocabulary')}
          style={{ background: '#d97706', color: 'white', padding: '12px 32px' }}
        >
          <CheckCircle size={22} />
          <span>أتقنتُ الكلمات الجديدة 🌟</span>
        </button>
      </div>
    </div>
  );
}
