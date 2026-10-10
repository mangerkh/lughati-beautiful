import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Send, CheckCircle, Image as ImageIcon, Edit3, Camera, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

export default function DictationSection({ dictationDrills = [], onCompleteSection, studentName, onRequestLogin, lessonId = 1 }) {
  const [drills, setDrills] = useState(dictationDrills || []);
  const [headerImageUrl, setHeaderImageUrl] = useState('/uploads/read.png');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [studentInputName, setStudentInputName] = useState(() => studentName || localStorage.getItem('lughati_student_name') || '');

  // Fetch header image and drills
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch read.png from media library if available
    const fetchHeaderImage = async () => {
      try {
        const res = await fetch('/api/media');
        if (res.ok) {
          const media = await res.json();
          if (Array.isArray(media)) {
            const readAsset = media.find(m => m.filename === 'read.png' || m.filename?.includes('read'));
            if (readAsset && readAsset.url && isMounted) {
              setHeaderImageUrl(readAsset.url);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching read.png media asset:', err);
      }
    };

    // 2. Fetch fresh dictation drills for lessonId
    const fetchFreshDictationDrills = async () => {
      try {
        const res = await fetch(`/api/student/dictation-drills?lesson_id=${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setDrills(data);
          }
        }
      } catch (err) {
        console.error('Error fetching dictation drills for student:', err);
      }
    };

    fetchHeaderImage();
    fetchFreshDictationDrills();

    return () => { isMounted = false; };
  }, [lessonId]);

  useEffect(() => {
    const activeName = studentName || localStorage.getItem('lughati_student_name') || '';
    if (activeName) {
      setStudentInputName(activeName);
    }
  }, [studentName]);

  const getAnswerState = (drillId) => {
    return answers[drillId] || { mode: 'text', text: '', imageFile: null, imagePreview: null };
  };

  const updateAnswerState = (drillId, patch) => {
    setAnswers(prev => ({
      ...prev,
      [drillId]: { ...getAnswerState(drillId), ...patch }
    }));
  };

  const handleImageChange = (drillId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateAnswerState(drillId, {
      imageFile: file,
      imagePreview: previewUrl
    });
  };

  const handleRemoveImage = (drillId) => {
    updateAnswerState(drillId, {
      imageFile: null,
      imagePreview: null
    });
  };

  const handleSubmitAnswer = async (drill) => {
    const currentAns = getAnswerState(drill.id);
    const activeStudentName = (studentName || studentInputName || (typeof window !== 'undefined' ? localStorage.getItem('lughati_student_name') : '') || '').trim();

    if (!activeStudentName) {
      if (onRequestLogin) {
        onRequestLogin();
      } else {
        alert('يرجى تسجيل الدخول أو إدخال اسمك أولاً لإرسال الإجابة معلمتك ✨');
      }
      return;
    }

    if (currentAns.mode === 'text' && !currentAns.text.trim()) {
      alert('يرجى كتابة النص أولاً قبل الإرسال ✍️');
      return;
    }

    if (currentAns.mode === 'image' && !currentAns.imageFile) {
      alert('يرجى اختيار صورة الإجابة بخط اليد أولاً 📷');
      return;
    }

    setSubmitting(prev => ({ ...prev, [drill.id]: true }));

    try {
      const formData = new FormData();
      formData.append('student_name', activeStudentName);
      formData.append('lesson_id', lessonId);
      formData.append('section_type', 'dictation');
      formData.append('question_id', drill.id);
      formData.append('question_text', drill.title || 'استمعي ثم اكتبي الجملة.');

      if (currentAns.mode === 'image' && currentAns.imageFile) {
        formData.append('submission_type', 'image');
        formData.append('file', currentAns.imageFile);
      } else {
        formData.append('submission_type', 'text');
        formData.append('text_content', currentAns.text.trim());
      }

      const res = await fetch('/api/student/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmitted(prev => ({ ...prev, [drill.id]: true }));
        if (onCompleteSection) onCompleteSection();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'تعذر إرسال الإجابة، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Error submitting dictation answer:', err);
      alert('تعذر إرسال الإجابة، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(prev => ({ ...prev, [drill.id]: false }));
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px 16px 32px 16px', boxSizing: 'border-box' }}>
      
      {/* FIRST: Top Header Image (read.png) */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <img
          src={headerImageUrl}
          alt="أستمع وأكتب"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/uploads/read.png';
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '250px',
            objectFit: 'contain',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)',
            border: '3px solid #e0f2fe'
          }}
        />
      </div>

      {/* SECOND: Short Fixed Instructions Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '3px solid #7dd3fc',
        borderRadius: '24px',
        padding: '18px 24px',
        textAlign: 'center',
        marginBottom: '28px',
        boxShadow: '0 6px 18px rgba(2, 132, 199, 0.08)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c7', color: 'white', padding: '4px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>
          <Sparkles size={16} />
          <span>تعليمات الإملاء</span>
        </div>
        <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#0369a1', margin: 0, lineHeight: '1.4' }}>
          استمعي جيداً، ثم اكتبي ما تسمعينه. 🌸
        </h3>
      </div>

      {/* THIRD: Dictation Exercises List */}
      {drills.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '24px', border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Volume2 size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '18px', fontWeight: '800' }}>لا توجد تمارين إملاء مضافة لهذا الدرس حالياً ✨</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {drills.map((item, idx) => {
            const ans = getAnswerState(item.id);
            const isSubmitting = submitting[item.id];
            const isDone = submitted[item.id];

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  border: isDone ? '3px solid #10b981' : '3px solid #bae6fd',
                  padding: '28px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* Exercise Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: '#0284c7', color: 'white', padding: '6px 14px', borderRadius: '14px', fontWeight: '900', fontSize: '16px' }}>
                      تمرين #{idx + 1}
                    </span>
                    <h4 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                      {item.title || 'استمعي ثم اكتبي الجملة.'}
                    </h4>
                  </div>

                  {isDone && (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={18} />
                      <span>تم الإرسال بنجاح 🌟</span>
                    </span>
                  )}
                </div>

                {/* Audio Player Card */}
                {item.audio ? (
                  <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#e0f2fe', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Volume2 size={24} color="#0284c7" />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1' }}>
                          🔊 اضغطي للاستماع للجملة:
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                          يمكنك الاستماع أكثر من مرة بوضوح
                        </div>
                      </div>
                    </div>

                    <audio controls src={item.audio} style={{ minWidth: '260px', height: '42px', flexGrow: 1, maxWidth: '420px' }} />
                  </div>
                ) : (
                  <div style={{ background: '#fffbe6', border: '2px solid #fef08a', borderRadius: '16px', padding: '12px 16px', color: '#854d0e', fontWeight: '700', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>ملف الصوت غير مرفق لهذا التمرين حالياً.</span>
                  </div>
                )}

                {/* Answer Mode Toggle Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>
                    اختاري طريقة إجابتك:
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => updateAnswerState(item.id, { mode: 'text' })}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '16px',
                        border: ans.mode === 'text' ? '3px solid #0284c7' : '2px solid #cbd5e1',
                        background: ans.mode === 'text' ? '#e0f2fe' : 'white',
                        color: ans.mode === 'text' ? '#0369a1' : '#475569',
                        fontWeight: '900',
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Edit3 size={18} />
                      <span>✏️ أكتب إجابتي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAnswerState(item.id, { mode: 'image' })}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '16px',
                        border: ans.mode === 'image' ? '3px solid #0284c7' : '2px solid #cbd5e1',
                        background: ans.mode === 'image' ? '#e0f2fe' : 'white',
                        color: ans.mode === 'image' ? '#0369a1' : '#475569',
                        fontWeight: '900',
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Camera size={18} />
                      <span>📷 أرفع بخط يدي</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: Lined Notebook Textarea */}
                {ans.mode === 'text' && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '2px solid #94a3b8',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      <textarea
                        rows={4}
                        value={ans.text}
                        onChange={(e) => updateAnswerState(item.id, { text: e.target.value })}
                        placeholder="اكتبي ما سمعتِه هنا..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '16px 20px',
                          fontFamily: 'Cairo, sans-serif',
                          fontSize: '22px',
                          fontWeight: '800',
                          color: '#0f172a',
                          direction: 'rtl',
                          border: 'none',
                          outline: 'none',
                          resize: 'vertical',
                          background: 'repeating-linear-gradient(transparent, transparent 38px, #e2e8f0 39px)',
                          lineHeight: '39px'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* MODE 2: Image Upload with Preview */}
                {ans.mode === 'image' && (
                  <div style={{ marginBottom: '20px' }}>
                    {!ans.imagePreview ? (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '36px 20px',
                        border: '3px dashed #38bdf8',
                        borderRadius: '20px',
                        background: '#f0f9ff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <ImageIcon size={48} color="#0284c7" style={{ marginBottom: '10px' }} />
                        <span style={{ fontSize: '17px', fontWeight: '900', color: '#0369a1', marginBottom: '4px' }}>
                          اضغطي هنا لاختيار صورة إجابتك بخط اليد 📷
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                          الصيغ المقبولة: JPG, PNG, WEBP (يمكن التقاط صورة من الكاميرا)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(item.id, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div style={{ background: '#f8fafc', border: '2px solid #cbd5e1', borderRadius: '20px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ maxHeight: '350px', overflow: 'hidden', borderRadius: '16px', marginBottom: '14px', background: '#e2e8f0' }}>
                          <img
                            src={ans.imagePreview}
                            alt="معاينة إجابتك"
                            style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                          <label style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={16} />
                            <span>تغيير الصورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange(item.id, e)}
                              style={{ display: 'none' }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            style={{ background: '#fef2f2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Trash2 size={16} />
                            <span>حذف الصورة</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Student Name Input if not logged in */}
                {!(studentName || studentInputName || (typeof window !== 'undefined' && localStorage.getItem('lughati_student_name'))) && (
                  <div style={{ marginBottom: '20px', background: '#fffbe6', border: '2px solid #fef08a', borderRadius: '16px', padding: '14px 18px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '900', color: '#854d0e', marginBottom: '6px' }}>
                      ✏️ ادخلي اسمكِ الثلاثي لإرسال الإجابة معلمتكِ:
                    </label>
                    <input
                      type="text"
                      value={studentInputName}
                      onChange={(e) => setStudentInputName(e.target.value)}
                      placeholder="مثال: سارة محمد أحمد"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '800', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* Submission Success Message or Submit Button */}
                {isDone ? (
                  <div style={{ background: '#dcfce7', border: '2px solid #86efac', borderRadius: '16px', padding: '16px', textAlign: 'center', color: '#15803d', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Sparkles size={22} color="#166534" />
                    <span>أحسنتِ 🌟 تم إرسال إجابتك لمعلمتك.</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitAnswer(item)}
                      className="hero-start-btn"
                      style={{
                        background: isSubmitting ? '#94a3b8' : '#0284c7',
                        color: 'white',
                        fontSize: '18px',
                        padding: '12px 36px',
                        borderRadius: '16px',
                        opacity: isSubmitting ? 0.7 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Send size={20} />
                      <span>{isSubmitting ? 'جاري الإرسال...' : '📤 إرسال لمعلمتي'}</span>
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
