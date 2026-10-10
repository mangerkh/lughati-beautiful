import React, { useState } from 'react';
import { Sparkles, Clock, Heart, Star, Palette, ArrowRight } from 'lucide-react';

export default function ComingSoonPlaceholder({ sectionTitle = 'هذا القسم', lessonTitle = 'الدرس', onBack }) {
  const [doodleColor, setDoodleColor] = useState('#db2777');
  const [hearts, setHearts] = useState([]);

  const handleAddHeart = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHearts([...hearts, { id: Date.now(), x, y }]);
  };

  return (
    <div className="content-box" style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f0fdf4 100%)', borderColor: '#f472b6', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        background: '#fce7f3',
        color: '#db2777',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
        boxShadow: '0 10px 20px rgba(219, 39, 119, 0.2)'
      }}>
        <Clock size={48} />
      </div>

      <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '32px', fontWeight: '900', color: '#831843', marginBottom: '12px' }}>
        سيتم إضافة المحتوى قريباً! 🌸✨
      </h2>

      <p style={{ fontSize: '20px', color: '#be185d', fontWeight: '700', maxWidth: '600px', margin: '0 auto 28px auto', lineHeight: '1.7' }}>
        قسم ({sectionTitle}) لـ {lessonTitle} قيد الإعداد والتجهيز بواسطة المعلمة. انتظريننا في التحديث القادم مع أمتع الألعاب والتمارين! 💕
      </p>

      {/* Interactive Doodle & Heart Board for the Little Girl */}
      <div 
        onClick={handleAddHeart}
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '24px',
          border: '3px dashed #f472b6',
          maxWidth: '500px',
          margin: '0 auto 28px auto',
          position: 'relative',
          minHeight: '160px',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: '0 6px 16px -4px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ fontSize: '15px', color: '#9d174d', fontWeight: '800', marginBottom: '8px' }}>
          اضغطي هنا لنشر القلوب والزهور الزاهية! 💖✨
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          انقري في أي مكان داخل هذا المربع
        </div>

        {hearts.map((h) => (
          <span 
            key={h.id} 
            style={{
              position: 'absolute',
              left: `${h.x}px`,
              top: `${h.y}px`,
              fontSize: '24px',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              animation: 'bounce 0.5s ease'
            }}
          >
            🌸
          </span>
        ))}
      </div>

      <button
        onClick={onBack}
        className="hero-start-btn"
        style={{
          background: '#db2777',
          color: 'white',
          margin: '0 auto',
          fontSize: '18px',
          padding: '12px 32px'
        }}
      >
        <ArrowRight size={20} />
        <span>العودة لأقسام الدرس</span>
      </button>
    </div>
  );
}
