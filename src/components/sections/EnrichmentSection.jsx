import React, { useState } from 'react';
import { Sparkles, Video, Image as ImageIcon, Lightbulb, X, Maximize2 } from 'lucide-react';

export default function EnrichmentSection({ contents = [], enrichments = [], onCompleteSection, lessonTitle = 'الغراب والجرة' }) {
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Use section_contents if provided, otherwise fallback to enrichments prop
  let itemsToDisplay = [];
  if (Array.isArray(contents) && contents.length > 0) {
    itemsToDisplay = contents.filter(c => c.is_visible !== 0);
  } else if (Array.isArray(enrichments) && enrichments.length > 0) {
    itemsToDisplay = enrichments.filter(e => e.is_enabled !== 0);
  }

  // Fallback default items if database is empty for lesson 4
  if (itemsToDisplay.length === 0) {
    itemsToDisplay = [
      {
        id: 'default-1',
        title: '⭐ إثراء',
        content: 'شاهدي واستمتعي وتعلمي شيئاً جديداً.',
        content_type: 'header',
        sort_order: 1
      },
      {
        id: 'default-2',
        title: '🎬 شاهدي كيف يرتفع الماء',
        content: 'شاهدي ماذا يحدث لمستوى الماء عندما نضع الحجارة داخل الجرة.',
        media_url: '/uploads/video/water01_1791292361339_2kj5t.mp4',
        content_type: 'video',
        sort_order: 2
      },
      {
        id: 'default-3',
        title: '🖼️ ماذا تلاحظين؟',
        content: 'تأملي الصورة ولاحظي كيف يرتفع الماء تدريجياً داخل الجرة.',
        media_url: '/uploads/images/0005_1791292196971_k4lfe.png',
        content_type: 'image',
        sort_order: 3
      },
      {
        id: 'default-4',
        title: '💡 معلومة جديدة',
        content: 'عندما نضع الحجارة في الماء فإنها تشغل حيزاً، فيرتفع مستوى الماء.',
        content_type: 'text',
        sort_order: 4
      }
    ];
  }

  // Sort items by order
  const sortedItems = [...itemsToDisplay].sort((a, b) => (a.sort_order || a.order || 0) - (b.sort_order || b.order || 0));

  // Extract header item if exists (e.g. title: "⭐ إثراء")
  const headerItem = sortedItems.find(item => 
    item.title?.includes('إثراء') || item.content_type === 'header'
  );
  
  // Non-header content items
  const bodyItems = sortedItems.filter(item => item !== headerItem);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px 16px 32px 16px', boxSizing: 'border-box', direction: 'rtl' }}>
      
      {/* 1. MAIN HEADER & SHORT INSTRUCTIONS CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        border: '3px solid #fbcfe8',
        borderRadius: '28px',
        padding: '24px 28px',
        textAlign: 'center',
        marginBottom: '32px',
        boxShadow: '0 8px 24px rgba(219, 39, 119, 0.08)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#db2777', color: 'white', padding: '6px 20px', borderRadius: '9999px', fontSize: '18px', fontWeight: '900', marginBottom: '12px' }}>
          <Sparkles size={20} />
          <span>{headerItem?.title || '⭐ إثراء'}</span>
        </div>
        
        <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#9d174d', margin: 0, lineHeight: '1.4' }}>
          {headerItem?.content || 'شاهدي واستمتعي وتعلمي شيئاً جديداً.'}
        </h2>
      </div>

      {/* 2. ENRICHMENT CONTENT ITEMS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {bodyItems.map((item, idx) => {
          const type = item.content_type || item.type || (item.media_url?.endsWith('.mp4') ? 'video' : item.media_url ? 'image' : 'text');
          const mediaUrl = item.media_url || item.url || item.video || item.image || '';

          // A) VIDEO CARD
          if (type === 'video' || (mediaUrl && (mediaUrl.includes('/video/') || mediaUrl.endsWith('.mp4')))) {
            return (
              <div
                key={item.id || idx}
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  border: '3px solid #cbd5e1',
                  padding: '24px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: '#0284c7', color: 'white', padding: '8px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={22} />
                  </div>
                  <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#0369a1', margin: 0 }}>
                    {item.title || '🎬 شاهدي كيف يرتفع الماء'}
                  </h3>
                </div>

                {item.content && (
                  <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: '17px', color: '#475569', fontWeight: '700', marginBottom: '18px', lineHeight: '1.5' }}>
                    {item.content}
                  </p>
                )}

                {mediaUrl && (
                  <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#0f172a', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                    <video
                      controls
                      preload="metadata"
                      src={mediaUrl}
                      style={{ width: '100%', maxHeight: '420px', display: 'block', borderRadius: '20px' }}
                    >
                      متصفحكِ لا يدعم تشغيل الفيديو.
                    </video>
                  </div>
                )}
              </div>
            );
          }

          // B) IMAGE CARD
          if (type === 'image' || (mediaUrl && (mediaUrl.includes('/images/') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.jpg')))) {
            return (
              <div
                key={item.id || idx}
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  border: '3px solid #cbd5e1',
                  padding: '24px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ background: '#059669', color: 'white', padding: '8px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={22} />
                  </div>
                  <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#047857', margin: 0 }}>
                    {item.title || '🖼️ ماذا تلاحظين؟'}
                  </h3>
                </div>

                {item.content && (
                  <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: '17px', color: '#475569', fontWeight: '700', marginBottom: '18px', lineHeight: '1.5' }}>
                    {item.content}
                  </p>
                )}

                {mediaUrl && (
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <div
                      onClick={() => setEnlargedImage(mediaUrl)}
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                        border: '2px solid #e2e8f0'
                      }}
                    >
                      <img
                        src={mediaUrl}
                        alt={item.title || 'صورة إثرائية'}
                        style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block', margin: '0 auto', transition: 'transform 0.2s ease' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: 'rgba(0,0,0,0.65)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Maximize2 size={14} />
                        <span>اضغطي لتكبير الصورة 🔍</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // C) INFO / TEXT CARD (💡 معلومة جديدة)
          return (
            <div
              key={item.id || idx}
              style={{
                background: 'linear-gradient(135deg, #fffbe6 0%, #fef9c3 100%)',
                borderRadius: '28px',
                border: '3px solid #fef08a',
                padding: '24px',
                boxShadow: '0 6px 20px rgba(234, 179, 8, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#ca8a04', color: 'white', padding: '8px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={22} />
                </div>
                <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#854d0e', margin: 0 }}>
                  {item.title || '💡 معلومة جديدة'}
                </h3>
              </div>

              <div style={{
                fontFamily: 'Cairo, sans-serif',
                fontSize: '22px',
                fontWeight: '900',
                color: '#713f12',
                lineHeight: '1.6',
                background: 'white',
                padding: '18px 22px',
                borderRadius: '20px',
                border: '2px solid #fef08a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {item.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. IMAGE ENLARGEMENT MODAL */}
      {enlargedImage && (
        <div className="feedback-modal" style={{ zIndex: 1800, background: 'rgba(0,0,0,0.85)' }} onClick={() => setEnlargedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setEnlargedImage(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 10
              }}
            >
              <X size={24} />
            </button>
            <img
              src={enlargedImage}
              alt="صورة مكبرة"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'block' }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
