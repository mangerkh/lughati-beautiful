import React, { useState } from 'react';
import { Music, Play, Pause, CheckCircle2 } from 'lucide-react';

export default function ChantSection({ chantData, onCompleteSection }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const chantTitle = chantData?.title || 'أَطْفالُ فِلَسْطِين';
  const chantAuthor = chantData?.author || 'إبراهيم العلي';
  const rawContent = chantData?.content || 'أَنَا شِبْلٌ أَنَا زَهْرَة | وَهَبْنا الرُّوحَ لِلثَّوْرَة\nبَنَى أَجْدادُنا دَوْراً | لَنا فِي أَرْضِنا الْحُرَّة\nأَنَا شِبْلٌ أَنَا زَهْرَة | حَمَلْنا جَمْرَةَ الثَّوْرَة\nإِلَى حَيْفا إِلَى يافا | إِلَى الأَقْصَى إِلَى الصَّخْرَة';

  const lines = rawContent.split('\n').map(l => {
    const parts = l.split('|');
    return { v1: parts[0]?.trim() || l, v2: parts[1]?.trim() || '' };
  });

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onCompleteSection('chant');
  };

  return (
    <div className="content-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ color: '#c026d3', margin: 0 }}>
          <Music size={32} />
          <span>نغني: {chantTitle} 🎵</span>
        </h2>

        <button 
          className="hero-start-btn"
          style={{ background: '#c026d3', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: 'none' }}
          onClick={handlePlay}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          <span>{isPlaying ? 'إيقاف النشيد' : 'استمع إلى النشيد'}</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <img 
          src={chantData?.image || '/uploads/chant_cover.png'} 
          alt={chantTitle} 
          style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '20px', border: '3px solid #f5d0fe' }}
          onError={(e) => { e.target.src = '/uploads/conv_3.png'; }}
        />
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '32px', fontWeight: '900', color: '#86198f' }}>
          {chantTitle}
        </h3>
        {chantAuthor && (
          <p style={{ fontSize: '16px', color: '#a21caf', fontWeight: '700' }}>
            للشاعر: {chantAuthor}
          </p>
        )}
      </div>

      <div style={{
        background: '#fdf4ff',
        border: '2px solid #f5d0fe',
        borderRadius: '24px',
        padding: '32px 24px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            fontSize: '24px',
            fontWeight: '800',
            color: '#701a75',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <span style={{ flex: '1 1 250px', textAlign: 'center' }}>{line.v1}</span>
            <span style={{ flex: '1 1 250px', textAlign: 'center' }}>{line.v2}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button 
          className="hero-start-btn"
          onClick={() => onCompleteSection('chant')}
          style={{ background: '#c026d3', color: 'white', padding: '12px 32px' }}
        >
          <CheckCircle2 size={22} />
          <span>حفظتُ وقرأتُ النشيد 🌟</span>
        </button>
      </div>
    </div>
  );
}
