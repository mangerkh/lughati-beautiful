import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, CheckCircle, Image as ImageIcon, Edit3, Camera, RefreshCw, Trash2, Mic, Square, Play, RotateCcw, AlertCircle, MessageSquare } from 'lucide-react';

export default function ExpressionSection({ expressionDrills = [], onCompleteSection, studentName, onRequestLogin, lessonId = 1 }) {
  const [drills, setDrills] = useState(expressionDrills || []);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [studentInputName, setStudentInputName] = useState(() => studentName || (typeof window !== 'undefined' ? localStorage.getItem('lughati_student_name') : '') || '');

  // Audio recording states per drill
  const [recordingState, setRecordingState] = useState({}); // { [drillId]: { isRecording: bool, audioBlob: Blob, audioUrl: string, mediaRecorder: MediaRecorder } }
  const mediaRecorderRef = useRef({});
  const audioChunksRef = useRef({});

  // Fetch fresh expression drills for lessonId
  useEffect(() => {
    let isMounted = true;
    const fetchFreshDrills = async () => {
      try {
        const res = await fetch(`/api/student/expression-drills?lesson_id=${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setDrills(data);
          }
        }
      } catch (err) {
        console.error('Error fetching expression drills for student:', err);
      }
    };

    fetchFreshDrills();
    return () => { isMounted = false; };
  }, [lessonId]);

  useEffect(() => {
    const activeName = studentName || (typeof window !== 'undefined' ? localStorage.getItem('lughati_student_name') : '') || '';
    if (activeName) {
      setStudentInputName(activeName);
    }
  }, [studentName]);

  const getAnswerState = (drillId) => {
    return answers[drillId] || { mode: null, text: '', imageFile: null, imagePreview: null, audioBlob: null, audioUrl: null };
  };

  const updateAnswerState = (drillId, patch) => {
    setAnswers(prev => ({
      ...prev,
      [drillId]: { ...getAnswerState(drillId), ...patch }
    }));
  };

  // Image Upload Handlers
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

  // Audio Recording Handlers
  const startRecording = async (drillId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current[drillId] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current[drillId].push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current[drillId], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        updateAnswerState(drillId, { audioBlob, audioUrl });
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current[drillId] = mediaRecorder;
      setRecordingState(prev => ({ ...prev, [drillId]: true }));
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('تعذر الوصول للميكروفون. يرجى التأكد من السماح باستخدام الميكروفون في المتصفح.');
    }
  };

  const stopRecording = (drillId) => {
    const recorder = mediaRecorderRef.current[drillId];
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setRecordingState(prev => ({ ...prev, [drillId]: false }));
    }
  };

  const resetRecording = (drillId) => {
    updateAnswerState(drillId, { audioBlob: null, audioUrl: null });
    setRecordingState(prev => ({ ...prev, [drillId]: false }));
  };

  // Submission Handler
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

    if (!currentAns.mode) {
      alert('يرجى اختيار طريقة الإجابة أولاً 🌸');
      return;
    }

    if (currentAns.mode === 'text' && !currentAns.text.trim()) {
      alert('يرجى كتابة التعبير أولاً قبل الإرسال ✍️');
      return;
    }

    if (currentAns.mode === 'image' && !currentAns.imageFile) {
      alert('يرجى اختيار صورة التعبير بخط اليد أولاً 📷');
      return;
    }

    if (currentAns.mode === 'audio' && !currentAns.audioBlob) {
      alert('يرجى تسجيل صوتك أولاً قبل الإرسال 🎙️');
      return;
    }

    setSubmitting(prev => ({ ...prev, [drill.id]: true }));

    try {
      const formData = new FormData();
      formData.append('student_name', activeStudentName);
      formData.append('lesson_id', lessonId);
      formData.append('section_type', 'expression');
      formData.append('question_id', drill.id);
      formData.append('question_text', `${drill.title}: ${drill.question}`);

      if (currentAns.mode === 'audio' && currentAns.audioBlob) {
        formData.append('submission_type', 'audio');
        formData.append('file', currentAns.audioBlob, `expression_audio_${drill.id}_${Date.now()}.webm`);
      } else if (currentAns.mode === 'image' && currentAns.imageFile) {
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
      console.error('Error submitting expression answer:', err);
      alert('تعذر إرسال الإجابة، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(prev => ({ ...prev, [drill.id]: false }));
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px 16px 32px 16px', boxSizing: 'border-box' }}>
      
      {/* FIRST: Main Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '32px', fontWeight: '900', color: '#7c3aed', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span>🗣️ أعبر</span>
        </h2>
      </div>

      {/* SECOND: Short Fixed Instructions Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        border: '3px solid #c4b5fd',
        borderRadius: '24px',
        padding: '18px 24px',
        textAlign: 'center',
        marginBottom: '28px',
        boxShadow: '0 6px 18px rgba(124, 58, 237, 0.08)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7c3aed', color: 'white', padding: '4px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>
          <Sparkles size={16} />
          <span>تعليمات التعبير</span>
        </div>
        <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#5b21b6', margin: 0, lineHeight: '1.4' }}>
          عبّري عن فكرتكِ بطريقتكِ، ثم أرسليها لمعلمتكِ. 🌸
        </h3>
      </div>

      {/* THIRD: Expression Exercises List */}
      {drills.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '24px', border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <MessageSquare size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '18px', fontWeight: '800' }}>لا توجد مهام تعبير مضافة لهذا الدرس حالياً ✨</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {drills.map((item, idx) => {
            const ans = getAnswerState(item.id);
            const isSubmitting = submitting[item.id];
            const isDone = submitted[item.id];
            const isRecording = recordingState[item.id];

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  border: isDone ? '3px solid #10b981' : '3px solid #ddd6fe',
                  padding: '28px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* Task Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: '#7c3aed', color: 'white', padding: '6px 14px', borderRadius: '14px', fontWeight: '900', fontSize: '16px' }}>
                      مهمة #{idx + 1}
                    </span>
                    <h4 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                      {item.title}
                    </h4>
                  </div>

                  {isDone && (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={18} />
                      <span>تم الإرسال بنجاح 🌟</span>
                    </span>
                  )}
                </div>

                {/* Question Prompt */}
                <div style={{ background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: '20px', padding: '18px 22px', marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '900', color: '#4c1d95', lineHeight: '1.5', direction: 'rtl' }}>
                    {item.question}
                  </div>
                </div>

                {/* Selection of Answer Mode */}
                {!ans.mode ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#475569', marginBottom: '14px', textAlign: 'center' }}>
                      ✨ اختاري طريقة إجابتكِ:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      
                      {/* Choice 1: Voice */}
                      <button
                        type="button"
                        onClick={() => updateAnswerState(item.id, { mode: 'audio' })}
                        style={{
                          padding: '16px',
                          borderRadius: '20px',
                          border: '2px solid #c4b5fd',
                          background: '#f5f3ff',
                          color: '#6d28d9',
                          fontWeight: '900',
                          fontSize: '17px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.06)'
                        }}
                      >
                        <div style={{ background: '#7c3aed', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Mic size={24} />
                        </div>
                        <span>🎙️ أجيب بصوتي</span>
                      </button>

                      {/* Choice 2: Text */}
                      <button
                        type="button"
                        onClick={() => updateAnswerState(item.id, { mode: 'text' })}
                        style={{
                          padding: '16px',
                          borderRadius: '20px',
                          border: '2px solid #93c5fd',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: '900',
                          fontSize: '17px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(29, 78, 216, 0.06)'
                        }}
                      >
                        <div style={{ background: '#2563eb', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={24} />
                        </div>
                        <span>✏️ أكتب إجابتي</span>
                      </button>

                      {/* Choice 3: Image Upload */}
                      <button
                        type="button"
                        onClick={() => updateAnswerState(item.id, { mode: 'image' })}
                        style={{
                          padding: '16px',
                          borderRadius: '20px',
                          border: '2px solid #6ee7b7',
                          background: '#ecfdf5',
                          color: '#047857',
                          fontWeight: '900',
                          fontSize: '17px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(4, 120, 87, 0.06)'
                        }}
                      >
                        <div style={{ background: '#059669', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={24} />
                        </div>
                        <span>📷 أرفع بخط يدي</span>
                      </button>

                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {/* Header to show active mode & Change Mode button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>طريقة الإجابة المختارة:</span>
                        <span style={{ color: '#7c3aed', fontWeight: '900' }}>
                          {ans.mode === 'audio' && '🎙️ تسجيل صوتي'}
                          {ans.mode === 'text' && '✏️ كتابة نصية'}
                          {ans.mode === 'image' && '📷 صورة بخط اليد'}
                        </span>
                      </div>

                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => updateAnswerState(item.id, { mode: null })}
                          style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '6px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>↩️ تغيير طريقة الإجابة</span>
                        </button>
                      )}
                    </div>

                    {/* MODE 1: Voice Recording */}
                    {ans.mode === 'audio' && (
                      <div style={{ background: '#faf5ff', border: '2px solid #e9d5ff', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
                        {!ans.audioUrl ? (
                          <div>
                            {!isRecording ? (
                              <button
                                type="button"
                                onClick={() => startRecording(item.id)}
                                style={{
                                  background: '#7c3aed',
                                  color: 'white',
                                  border: 'none',
                                  padding: '14px 32px',
                                  borderRadius: '9999px',
                                  fontSize: '18px',
                                  fontWeight: '900',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)'
                                }}
                              >
                                <Mic size={24} />
                                <span>🎙️ بدء التسجيل</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => stopRecording(item.id)}
                                style={{
                                  background: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  padding: '14px 32px',
                                  borderRadius: '9999px',
                                  fontSize: '18px',
                                  fontWeight: '900',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3)',
                                  animation: 'pulse 1.5s infinite'
                                }}
                              >
                                <Square size={20} />
                                <span>⏹️ إيقاف التسجيل</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#6d28d9' }}>
                              🔊 استمعي لتسجيلكِ قبل الإرسال:
                            </div>
                            <audio controls src={ans.audioUrl} style={{ width: '100%', maxWidth: '450px' }} />
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                type="button"
                                onClick={() => resetRecording(item.id)}
                                style={{ background: '#fef2f2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Trash2 size={16} />
                                <span>حذف التسجيل</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODE 2: Lined Notebook Textarea */}
                    {ans.mode === 'text' && (
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
                          placeholder="اكتبي فكرتكِ هنا..."
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
                    )}

                    {/* MODE 3: Image Upload with Preview */}
                    {ans.mode === 'image' && (
                      <div>
                        {!ans.imagePreview ? (
                          <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '36px 20px',
                            border: '3px dashed #a7f3d0',
                            borderRadius: '20px',
                            background: '#ecfdf5',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}>
                            <ImageIcon size={48} color="#059669" style={{ marginBottom: '10px' }} />
                            <span style={{ fontSize: '17px', fontWeight: '900', color: '#047857', marginBottom: '4px' }}>
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
                    <span>أحسنتِ 🌟 تم إرسال تعبيركِ لمعلمتكِ.</span>
                  </div>
                ) : (
                  ans.mode && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSubmitAnswer(item)}
                        className="hero-start-btn"
                        style={{
                          background: isSubmitting ? '#94a3b8' : '#7c3aed',
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
                  )
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
