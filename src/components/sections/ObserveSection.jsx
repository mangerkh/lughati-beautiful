import React, { useState } from 'react';
import { MessageCircle, Mic, CheckCircle } from 'lucide-react';

export default function ObserveSection({ onCompleteSection }) {
  const [recorded, setRecorded] = useState({});

  const images = [
    { url: '/uploads/conv_1.png', title: 'اللوحة الأولى: الفلاح والأبناء في البيت' },
    { url: '/uploads/conv_2.png', title: 'اللوحة الثانية: الأبناء ينكشون الأرض بالفأس' },
    { url: '/uploads/conv_3.png', title: 'اللوحة الثالثة: حصاد القمح وجمع خيرات الأرض' }
  ];

  const questions = [
    'ماذا ترى في الصورة الأولى؟',
    'ماذا قال الفلاح لأبنائه وهو في الفراش؟',
    'بمَ كان يحفر الأبناء الأرض في الصورة الثانية؟',
    'ماذا نتج عن زراعة الأرض في الصورة الثالثة؟',
    'كيف نحافظ على أرضنا فلسطين؟'
  ];

  const handleSimulateRecord = (idx) => {
    setRecorded({ ...recorded, [idx]: true });
    onCompleteSection('observe');
  };

  return (
    <div className="content-box">
      <h2 className="section-title" style={{ color: '#10b981' }}>
        <MessageCircle size={32} />
        <span>ألاحظ وأتحدث: نتأمل اللوحات الآتية ونناقش</span>
      </h2>

      {/* Images Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '24px 0' }}>
        {images.map((img, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
            <img src={img.url} alt={img.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            <div style={{ padding: '12px', fontWeight: '800', fontSize: '16px', textAlign: 'center', color: '#1e293b' }}>
              {img.title}
            </div>
          </div>
        ))}
      </div>

      {/* Questions & Oral Response */}
      <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '24px', border: '2px solid #bbf7d0', marginTop: '24px' }}>
        <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '800', marginBottom: '16px', color: '#047857' }}>
          أسئلة المناقشة والتحدث:
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, idx) => (
            <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontWeight: '800', fontSize: '19px' }}>
                {idx + 1}. {q}
              </div>

              <button
                className="hero-start-btn"
                style={{
                  fontSize: '15px',
                  padding: '8px 18px',
                  boxShadow: 'none',
                  background: recorded[idx] ? '#10b981' : '#0284c7',
                  color: 'white'
                }}
                onClick={() => handleSimulateRecord(idx)}
              >
                {recorded[idx] ? <CheckCircle size={18} /> : <Mic size={18} />}
                <span>{recorded[idx] ? 'تمت الإجابة بصوتك 🌟' : 'أجب بصوتك'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
