import React, { useState } from 'react';
import { BookOpen, Volume2, Pause, Video, CheckCircle2, ZoomIn, ZoomOut } from 'lucide-react';

export default function ReadingSection({ sectionData, onCompleteSection }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fontSize, setFontSize] = useState(28); // Default 28px for desktop/8yo child readability

  const defaultText = `جَمَعَ الْفَلّاحُ أَبْناءَهُ الأَرْبَعَةَ، وَقالَ لَهُمْ: تَرَكْتُ لَكُمْ فِي هٰذِهِ الأَرْضِ كَنزاً كَبيراً، فَابْحَثُوا عَنْهُ.

خَرَجَ الأَبْنَاءُ مِنْ عِنْدِ أَبِيهِمْ، فَحَمَلَ كُلُّ واحِدٍ مِنْهُمْ فَأْسَهُ، وَبَدَأَ يَنْكُشُ الأَرْضَ؛ لِيَبْحَثَ عَنِ الْكَنْزِ، وَلٰكِنَّهُمْ لَمْ يَجِدُوا شَيْئاً.

رَجَعُوا إِلى أَبِيهِمْ، وَقالُوا: لَمْ نَجِدْ كَنزاً فِي الأَرْضِ يا أَبِي.

ابْتَسَمَ الأَبُ، وَقالَ: الأَرْضُ هِيَ الْكَنْزُ، حافَظَ عَلَيْها أَجْدادُنا مُنْذُ آلافِ السِّنِينَ؛ فَحافِظُوا عَلَيْها مِثْلَهُمْ، وَازْرَعُوها، وَسَتُعْطِيكُمْ خَيْراتٍ كَثِيرَةً.`;

  const readingContent = sectionData?.content || defaultText;

  const handleRead = () => {
    setIsPlayingAudio(!isPlayingAudio);
    onCompleteSection('reading');
  };

  const increaseFontSize = () => {
    if (fontSize < 42) setFontSize(prev => prev + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 18) setFontSize(prev => prev - 2);
  };

  return (
    <div className="content-box" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px' }}>
        <h2 className="section-title" style={{ color: '#059669', margin: 0 }}>
          <BookOpen size={34} />
          <span>أقرأ وأتعلم: نص درس (الأرض) 📖</span>
        </h2>

        {/* Font Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px', padding: '6px 14px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>حجم الخط:</span>
          <button 
            type="button"
            onClick={decreaseFontSize}
            style={{ background: 'white', border: '2px solid #86efac', color: '#15803d', borderRadius: '10px', padding: '6px 12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="تصغير الخط"
          >
            <ZoomOut size={16} />
            <span>تصغير [-]</span>
          </button>
          <span style={{ fontWeight: '900', color: '#15803d', minWidth: '32px', textAlign: 'center' }}>{fontSize}px</span>
          <button 
            type="button"
            onClick={increaseFontSize}
            style={{ background: '#166534', border: 'none', color: 'white', borderRadius: '10px', padding: '6px 12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="تكبير الخط"
          >
            <ZoomIn size={16} />
            <span>تكبير [+]</span>
          </button>
        </div>
      </div>

      {/* Prominent Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
        <button 
          className="hero-start-btn" 
          style={{ fontSize: '18px', padding: '14px 28px', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)', background: '#0284c7', color: 'white', borderRadius: '20px' }}
          onClick={handleRead}
        >
          {isPlayingAudio ? <Pause size={24} /> : <Volume2 size={24} />}
          <span>{isPlayingAudio ? 'إيقاف الاستماع' : '🎧 استمع للقراءة'}</span>
        </button>

        <button 
          className="hero-start-btn" 
          style={{ fontSize: '18px', padding: '14px 28px', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)', background: '#8b5cf6', color: 'white', borderRadius: '20px' }}
          onClick={() => { setShowVideo(!showVideo); onCompleteSection('reading'); }}
        >
          <Video size={24} />
          <span>{showVideo ? 'إغلاق الفيديو' : '🎬 شاهد فيديو الدرس'}</span>
        </button>
      </div>

      {showVideo && (
        <div style={{ marginBottom: '28px', background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <video controls width="100%" src="/uploads/earth_video.mp4">
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
      )}

      {/* Main Formatted Reading Text Container */}
      <div style={{ 
        maxWidth: '850px', 
        margin: '0 auto', 
        background: '#fffdf5', 
        border: '3px solid #fef08a', 
        borderRadius: '28px', 
        padding: '36px', 
        boxShadow: '0 8px 20px rgba(234, 179, 8, 0.12)' 
      }}>
        <div 
          className="reading-text" 
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 2.0, 
            whiteSpace: 'pre-line',
            color: '#1e293b',
            fontFamily: "'Cairo', 'Traditional Arabic', sans-serif",
            fontWeight: '700',
            textAlign: 'justify'
          }}
        >
          {readingContent}
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button 
          className="hero-start-btn" 
          onClick={() => onCompleteSection('reading')}
          style={{ background: '#10b981', color: 'white', fontSize: '20px', padding: '14px 36px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}
        >
          <CheckCircle2 size={24} />
          <span>قرأتُ الدرس بنجاح ✨</span>
        </button>
      </div>
    </div>
  );
}
