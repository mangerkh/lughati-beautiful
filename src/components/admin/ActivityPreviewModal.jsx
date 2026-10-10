import React from 'react';
import { X, Play, ExternalLink } from 'lucide-react';
import ActivitiesSection from '../sections/ActivitiesSection.jsx';

export default function ActivityPreviewModal({ activity, onClose }) {
  if (!activity) return null;

  const data = typeof activity.activity_data === 'string'
    ? JSON.parse(activity.activity_data || '{}')
    : (activity.activity_data || {});
  
  const gameUrl = data.game_url || activity.game_url;

  return (
    <div className="feedback-modal" style={{ zIndex: 1200 }}>
      <div className="feedback-card" style={{ maxWidth: '900px', width: '95%', textAlign: 'right', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={24} color="#ea580c" />
            <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#ea580c' }}>
              معاينة اللعبة: {activity.title}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        {gameUrl ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '700' }}>المسار: {gameUrl}</span>
              <a 
                href={gameUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: '#ea580c', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>فتح النافذة بالحجم الكامل</span>
                <ExternalLink size={16} />
              </a>
            </div>
            <iframe 
              src={gameUrl} 
              title={activity.title}
              style={{ width: '100%', height: '550px', border: '2px solid #fdba74', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </div>
        ) : (
          <ActivitiesSection
            activities={[activity]}
            initialSubMode="games"
            onCompleteSection={() => alert('🌟 تم إنجاز النشاط بنجاح في وضع المعاينة!')}
          />
        )}
      </div>
    </div>
  );
}
