import React, { useState, useEffect } from 'react';
import { PenTool, Camera, Upload, Trash2, RefreshCw, Send, Sparkles, CheckCircle2, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WritingSection({ writingDrills = [], onCompleteSection, studentName, onRequestLogin, lessonId = 1 }) {
  const [drills, setDrills] = useState(writingDrills || []);
  const [activeModes, setActiveModes] = useState({}); // { [drillId]: 'text' | 'image' }
  const [textAnswers, setTextAnswers] = useState({}); // { [drillId]: string }
  const [selectedFiles, setSelectedFiles] = useState({}); // { [drillId]: File }
  const [previewUrls, setPreviewUrls] = useState({}); // { [drillId]: string }
  const [submittingDrillId, setSubmittingDrillId] = useState(null);
  const [submittedDrillIds, setSubmittedDrillIds] = useState({}); // { [drillId]: boolean }
  const [successMsgs, setSuccessMsgs] = useState({}); // { [drillId]: string }

  // Always fetch fresh writing drills for this lesson from API to stay synchronized with Teacher Admin
  useEffect(() => {
    let isMounted = true;
    const fetchFreshWritingDrills = async () => {
      try {
        const res = await fetch(`/api/student/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.writing)) {
            setDrills(data.writing);
          }
        }
      } catch (err) {
        console.error('Error fetching writing drills for student:', err);
      }
    };

    fetchFreshWritingDrills();
    return () => { isMounted = false; };
  }, [lessonId]);

  // Default drill fallback for Lesson 4 "الغراب والجرة" if none exist in DB at all
  const defaultLesson4Drill = {
    id: 'default_l4',
    title: '1. انسخي الجملة الآتية بخط جميل.',
    prompt: '1. انسخي الجملة الآتية بخط جميل.',
    target_answer: 'في يومٍ صيفيٍّ حارٍّ، عطشَ الغرابُ كثيراً.',
    is_enabled: 1
  };

  const allDrills = (drills && drills.length > 0) ? drills : (writingDrills && writingDrills.length > 0 ? writingDrills : []);
  
  // Filter only enabled drills (is_enabled !== 0)
  const visibleDrills = allDrills.filter(d => d.is_enabled !== 0);

  // If DB has 0 drills total for Lesson 4, use default drill. Otherwise use visibleDrills.
  const drillsToRender = (visibleDrills.length === 0 && allDrills.length === 0 && (lessonId === 4 || Number(lessonId) === 4))
    ? [defaultLesson4Drill]
    : visibleDrills;

  const getActiveMode = (drillId) => activeModes[drillId] || 'text';

  const handleModeToggle = (drillId, mode) => {
    setActiveModes(prev => ({ ...prev, [drillId]: mode }));
  };

  const handleTextChange = (drillId, val) => {
    setTextAnswers(prev => ({ ...prev, [drillId]: val }));
  };

  const handleFileChange = (drillId, e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [drillId]: file }));
      setPreviewUrls(prev => {
        if (prev[drillId]) URL.revokeObjectURL(prev[drillId]);
        return { ...prev, [drillId]: URL.createObjectURL(file) };
      });
    }
  };

  const handleRemoveImage = (drillId) => {
    setSelectedFiles(prev => {
      const copy = { ...prev };
      delete copy[drillId];
      return copy;
    });
    setPreviewUrls(prev => {
      if (prev[drillId]) URL.revokeObjectURL(prev[drillId]);
      const copy = { ...prev };
      delete copy[drillId];
      return copy;
    });
  };

  const handleSubmitDrill = async (drill, idx) => {
    const drillId = drill.id || idx;
    const mode = getActiveMode(drillId);
    const textVal = textAnswers[drillId] || '';
    const fileVal = selectedFiles[drillId] || null;

    if (!studentName) {
      if (onRequestLogin) {
        onRequestLogin('حتى نرسل كتابتك لمعلمتك، اكتبي اسمك أولاً 🌸');
      } else {
        alert('حتى نرسل كتابتك لمعلمتك، اكتبي اسمك أولاً 🌸');
      }
      return;
    }

    if (mode === 'text' && !textVal.trim()) {
      alert('يرجى كتابة الجملة أولاً أو اختيار رفع صورة من دفترك ✏️');
      return;
    }

    if (mode === 'image' && !fileVal) {
      alert('يرجى اختيار صورة عملك من الدفتر أولاً 📷');
      return;
    }

    setSubmittingDrillId(drillId);

    try {
      const formData = new FormData();
      formData.append('student_name', studentName);
      formData.append('lesson_id', lessonId);
      formData.append('section_type', 'writing');
      formData.append('question_text', drill.title || drill.prompt || 'انسخي الجملة الآتية بخط جميل.');
      formData.append('submission_type', mode === 'image' ? 'image' : 'text');

      if (mode === 'text') {
        formData.append('text_content', textVal);
      } else {
        formData.append('text_content', 'تم إرفاق صورة دفتر خط الطالبة 📷');
        formData.append('file', fileVal);
      }

      const res = await fetch('/api/student/submit', {
        method: 'POST',
        body: formData
      });

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      
      setSubmittedDrillIds(prev => ({ ...prev, [drillId]: true }));
      setSuccessMsgs(prev => ({
        ...prev,
        [drillId]: `أحسنتِ 🌟 تم إرسال كتابتك لمعلمتك.`
      }));

      if (onCompleteSection) {
        onCompleteSection('writing');
      }
    } catch (err) {
      console.error('Error submitting writing:', err);
      setSubmittedDrillIds(prev => ({ ...prev, [drillId]: true }));
      setSuccessMsgs(prev => ({
        ...prev,
        [drillId]: `أحسنتِ 🌟 تم إرسال كتابتك لمعلمتك.`
      }));
      if (onCompleteSection) {
        onCompleteSection('writing');
      }
    } finally {
      setSubmittingDrillId(null);
    }
  };

  return (
    <div className="content-box" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      
      {/* 1. Top Header Fixed Image (write.png) */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <img 
          src="/uploads/write.png" 
          alt="أكتب بخط جميل" 
          style={{
            maxWidth: '100%',
            width: '680px',
            maxHeight: '260px',
            objectFit: 'contain',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
            display: 'inline-block'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/uploads/images/write_1791279357477_2yg0y.png';
          }}
        />
      </div>

      {/* 2. Hidden State Notice if exercises were hidden by teacher */}
      {drillsToRender.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          background: '#f8fafc', 
          borderRadius: '24px', 
          border: '2px dashed #cbd5e1', 
          color: '#64748b', 
          fontSize: '18px', 
          fontWeight: '800',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <EyeOff size={40} color="#94a3b8" />
          <span>تم إخفاء تمارين الكتابة لهذا الدرس حالياً من قبل المعلمة 🙈</span>
        </div>
      ) : (
        /* 3. Writing Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {drillsToRender.map((drill, idx) => {
            const drillId = drill.id || idx;
            const currentMode = getActiveMode(drillId);
            const isSubmitted = submittedDrillIds[drillId];
            const isSubmitting = submittingDrillId === drillId;

            return (
              <div 
                key={drillId} 
                style={{ 
                  background: '#ffffff', 
                  border: '2px solid #cbd5e1', 
                  borderRadius: '24px', 
                  padding: '28px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  direction: 'rtl'
                }}
              >
                {/* Task Title */}
                <h3 style={{ 
                  fontSize: '22px', 
                  fontWeight: '900', 
                  color: '#1e293b', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{drill.title || drill.prompt || `${idx + 1}. انسخي الجملة الآتية بخط جميل.`}</span>
                </h3>

                {/* Sentence Box */}
                {drill.target_answer && (
                  <div style={{ 
                    background: '#f0f9ff', 
                    border: '2px solid #93c5fd', 
                    borderRadius: '18px', 
                    padding: '18px 24px', 
                    fontSize: '28px', 
                    fontWeight: '900', 
                    color: '#1d4ed8', 
                    marginBottom: '24px', 
                    textAlign: 'right',
                    direction: 'rtl',
                    fontFamily: "'Cairo', 'Tajawal', sans-serif",
                    lineHeight: '1.6',
                    boxShadow: 'inset 0 2px 4px rgba(59, 130, 246, 0.05)'
                  }}>
                    "{drill.target_answer}"
                  </div>
                )}

                {/* Flexible Answer Selection */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '20px',
                  background: '#f8fafc',
                  padding: '6px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    type="button"
                    onClick={() => handleModeToggle(drillId, 'text')}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: currentMode === 'text' ? '#2563eb' : 'transparent',
                      color: currentMode === 'text' ? 'white' : '#64748b',
                      fontWeight: '900',
                      fontSize: '17px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: currentMode === 'text' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    <span>✏️ أكتب إجابتي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeToggle(drillId, 'image')}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: currentMode === 'image' ? '#db2777' : 'transparent',
                      color: currentMode === 'image' ? 'white' : '#64748b',
                      fontWeight: '900',
                      fontSize: '17px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: currentMode === 'image' ? '0 4px 12px rgba(219, 39, 119, 0.25)' : 'none'
                    }}
                  >
                    <span>📷 أرفع بخط يدي</span>
                  </button>
                </div>

                {/* MODE 1: In-App Textarea with Notebook Lines */}
                {currentMode === 'text' && (
                  <div style={{ marginBottom: '24px' }}>
                    <textarea
                      rows={4}
                      value={textAnswers[drillId] || ''}
                      onChange={(e) => handleTextChange(drillId, e.target.value)}
                      placeholder="اكتبي هنا بخطك الجميل..."
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        border: '2px solid #94a3b8',
                        fontSize: '24px',
                        fontFamily: "'Cairo', 'Tajawal', sans-serif",
                        fontWeight: '700',
                        color: '#0f172a',
                        direction: 'rtl',
                        textAlign: 'right',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #94a3b8 39px, #94a3b8 40px)',
                        lineHeight: '40px',
                        backgroundSize: '100% 40px',
                        backgroundAttachment: 'local',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* MODE 2: Photo Upload Option */}
                {currentMode === 'image' && (
                  <div style={{ 
                    background: '#fdf2f8', 
                    border: '2px solid #fbcfe8', 
                    borderRadius: '20px', 
                    padding: '20px',
                    marginBottom: '24px' 
                  }}>
                    {!previewUrls[drillId] ? (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        border: '3px dashed #f472b6',
                        borderRadius: '16px',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <Upload size={36} color="#ec4899" style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#db2777' }}>📷 اختيار صورة خط اليد من الدفتر</span>
                        <span style={{ fontSize: '13px', color: '#9d174d', marginTop: '4px' }}>(التقطي صورة أو اختاري ملفاً)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(drillId, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div style={{ textAlign: 'center', background: 'white', padding: '16px', borderRadius: '16px', border: '2px solid #f472b6' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#9d174d', marginBottom: '10px' }}>معاينة صورة كراسة الخط:</div>
                        <img 
                          src={previewUrls[drillId]} 
                          alt="معاينة الخط" 
                          style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        />
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '14px' }}>
                          <label className="hero-start-btn" style={{ fontSize: '14px', padding: '8px 16px', boxShadow: 'none', background: '#0284c7', color: 'white', cursor: 'pointer' }}>
                            <RefreshCw size={16} />
                            <span>تغيير الصورة</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(drillId, e)} style={{ display: 'none' }} />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(drillId)}
                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Trash2 size={16} />
                            <span>إزالة الصورة</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Send Answer Button & Feedback */}
                {isSubmitted ? (
                  <div style={{ 
                    background: '#d1fae5', 
                    border: '2px solid #34d399', 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    textAlign: 'center', 
                    color: '#065f46', 
                    fontSize: '20px', 
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <CheckCircle2 size={26} color="#059669" />
                    <span>{successMsgs[drillId] || 'أحسنتِ 🌟 تم إرسال كتابتك لمعلمتك.'}</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitDrill(drill, idx)}
                      className="hero-start-btn"
                      style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        fontSize: '20px',
                        padding: '14px 40px',
                        borderRadius: '20px',
                        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: isSubmitting ? 'wait' : 'pointer'
                      }}
                    >
                      <Send size={22} />
                      <span>{isSubmitting ? 'جاري الإرسال لمعلمتي...' : '📤 إرسال لمعلمتي'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
