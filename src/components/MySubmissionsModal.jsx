import React, { useState, useEffect } from 'react';
import { FolderCheck, X, FileText, Image as ImageIcon, Volume2, CheckCircle, MessageCircle } from 'lucide-react';
import { getSectionLabel } from '../utils/sectionLabels.js';

export default function MySubmissionsModal({ studentName, studentId, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeStudentId = studentId || localStorage.getItem('lughati_student_id');
  const activeStudentName = studentName || localStorage.getItem('lughati_student_name');

  useEffect(() => {
    fetchSubmissions();
  }, [activeStudentId, activeStudentName]);

  const fetchSubmissions = async () => {
    try {
      let url = '/api/student/submissions?';
      if (activeStudentId) {
        url += `student_id=${encodeURIComponent(activeStudentId)}`;
      } else if (activeStudentName) {
        url += `student_name=${encodeURIComponent(activeStudentName)}`;
      } else {
        setLoading(false);
        return;
      }

      const res = await fetch(url);
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-modal" style={{ zIndex: 1900 }}>
      <div className="feedback-card" style={{ maxWidth: '680px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, borderRadius: '28px' }}>
        
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
            <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FolderCheck size={26} />
              <span>أعمالي وحوافظي 📂 ({activeStudentName})</span>
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              قائمة بالتسليمات والأنشطة التي أرسلتِها لمعلمتكِ وملاحظاتها المشجعة:
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '9999px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#0284c7', fontWeight: '800' }}>جاري جلب أعمالك...</div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', color: '#64748b', fontWeight: '700' }}>
              لم تقومي بإرسال أعمال أو إجابات بعد. ابدئي بدراسة الدرس وأرسلي إجاباتكِ! 🌸
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {submissions.map((sub) => {
                const isReviewed = sub.status === 'reviewed';
                const isViewed = sub.status === 'viewed';

                return (
                  <div key={sub.id} style={{ background: isReviewed ? '#f0fdf4' : '#f0f9ff', border: isReviewed ? '2px solid #86efac' : '2px solid #bae6fd', borderRadius: '18px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: '900', color: isReviewed ? '#166534' : '#0369a1' }}>
                          {sub.lesson_title || 'درس الأرض'} - {getSectionLabel(sub.section_type)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          التاريخ: {new Date(sub.created_at).toLocaleDateString('ar-EG')} - {new Date(sub.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '12px', padding: '4px 12px', borderRadius: '9999px', fontWeight: '900',
                        background: isReviewed ? '#dcfce7' : isViewed ? '#e0f2fe' : '#fef3c7',
                        color: isReviewed ? '#15803d' : isViewed ? '#0369a1' : '#b45309'
                      }}>
                        {isReviewed ? 'تمت المراجعة ✅' : isViewed ? 'تمت المشاهدة 👁️' : 'مرسلة للمعلمة ⏳'}
                      </span>
                    </div>

                    {sub.question_text && (
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>
                        السؤال: {sub.question_text}
                      </div>
                    )}

                    {sub.text_content && (
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', background: 'white', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '6px' }}>
                        إجابتكِ: "{sub.text_content}"
                      </div>
                    )}

                    {sub.file_path && sub.submission_type === 'image' && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={sub.file_path} alt="مرفق إجابتك" style={{ maxHeight: '180px', borderRadius: '12px', border: '2px solid #cbd5e1', objectFit: 'contain' }} />
                      </div>
                    )}

                    {sub.file_path && sub.submission_type === 'audio' && (
                      <div style={{ marginTop: '8px' }}>
                        <audio controls src={sub.file_path} style={{ width: '100%', maxWidth: '400px' }} />
                      </div>
                    )}

                    {sub.teacher_note && (
                      <div style={{ marginTop: '12px', background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '14px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#be185d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageCircle size={16} />
                          <span>ملاحظة معلمتكِ:</span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#9d174d', marginTop: '4px' }}>
                          "{sub.teacher_note}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="teacher-login-btn" onClick={onClose}>إغلاق</button>
        </div>

      </div>
    </div>
  );
}
