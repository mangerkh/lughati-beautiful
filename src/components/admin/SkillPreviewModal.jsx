import React from 'react';
import { X } from 'lucide-react';
import DynamicSectionRenderer from '../sections/DynamicSectionRenderer.jsx';
import WritingSection from '../sections/WritingSection.jsx';
import DictationSection from '../sections/DictationSection.jsx';
import ExpressionSection from '../sections/ExpressionSection.jsx';

export default function SkillPreviewModal({ lessonTitle, sectionTitle, sectionType, contents, lessonId, onClose }) {
  return (
    <div className="feedback-modal" style={{ zIndex: 1700 }}>
      <div className="feedback-card" style={{ maxWidth: '950px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '28px', border: '3px solid #0284c7' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#0284c7', fontWeight: '800', background: '#e0f2fe', padding: '4px 12px', borderRadius: '9999px' }}>
              معاينة واجهة الطالبة 🎓
            </span>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '6px 0 0 0' }}>
              الدرس: {lessonTitle} - مهارة: {sectionTitle || 'أستمع وأكتب'}
            </h3>
          </div>

          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Dynamic Renderer / Writing / Dictation / Expression */}
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '2px solid #cbd5e1' }}>
          {sectionType === 'writing' ? (
            <WritingSection
              writingDrills={contents}
              lessonId={lessonId || 1}
              studentName="طالبة للتجربة (معاينة المعلمة)"
            />
          ) : sectionType === 'dictation' ? (
            <DictationSection
              dictationDrills={contents}
              lessonId={lessonId || 1}
              studentName="طالبة للتجربة (معاينة المعلمة)"
            />
          ) : sectionType === 'expression' ? (
            <ExpressionSection
              expressionDrills={contents}
              lessonId={lessonId || 1}
              studentName="طالبة للتجربة (معاينة المعلمة)"
            />
          ) : (
            <DynamicSectionRenderer
              sectionType={sectionType}
              contents={contents}
              lessonTitle={lessonTitle}
              lessonId={lessonId}
              isPreview={true}
            />
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="teacher-login-btn" onClick={onClose} style={{ minWidth: '140px' }}>
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
}
