import React, { useState, useEffect, useRef } from 'react';
import { Key, Search, MessageSquare, Lightbulb, Palette, Mic, Square, Play, Trash2, RotateCcw, Send, Upload, Image as ImageIcon, Edit3, Check, Star, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ThinkingKeysSection({
  lessonId = 4,
  studentName = '',
  onRequestLogin,
  onCompleteSection
}) {
  const [keysData, setKeysData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKeyId, setActiveKeyId] = useState('analyze');
  const [activeTabMode, setActiveTabMode] = useState('text'); // 'audio', 'text', 'image'
  
  // Inputs state
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [completedKeys, setCompletedKeys] = useState([]);

  // Audio Recorder State
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const keyMetaMap = {
    analyze: {
      label: 'نحلّل',
      title: '🔍 نحلّل',
      icon: <Search size={24} color="#0284c7" />,
      bg: '#f0f9ff',
      border: '#38bdf8',
      text: '#0284c7',
      badgeBg: '#e0f2fe',
      allowModes: ['audio', 'text', 'image'],
      defaultMode: 'text'
    },
    discuss: {
      label: 'نناقش',
      title: '💬 نناقش',
      icon: <MessageSquare size={24} color="#16a34a" />,
      bg: '#f0fdf4',
      border: '#4ade80',
      text: '#16a34a',
      badgeBg: '#dcfce7',
      allowModes: ['audio', 'text', 'image'],
      defaultMode: 'audio'
    },
    innovate: {
      label: 'نبتكر',
      title: '💡 نبتكر',
      icon: <Lightbulb size={24} color="#d97706" />,
      bg: '#fffbe6',
      border: '#fbbf24',
      text: '#d97706',
      badgeBg: '#fef3c7',
      allowModes: ['audio', 'text', 'image'],
      defaultMode: 'text'
    },
    create: {
      label: 'نبدع',
      title: '🎨 نبدع',
      icon: <Palette size={24} color="#9333ea" />,
      bg: '#faf5ff',
      border: '#c084fc',
      text: '#9333ea',
      badgeBg: '#f3e8ff',
      allowModes: ['image', 'text'],
      defaultMode: 'image'
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [lessonId]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/thinking-keys-drills?lesson_id=${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setKeysData(data);
        if (data.length > 0) {
          const firstKey = data[0].key_type;
          setActiveKeyId(firstKey);
          setActiveTabMode(keyMetaMap[firstKey]?.defaultMode || 'text');
        }
      }
    } catch (e) {
      console.error('Error fetching thinking keys drills:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentKeyObj = keysData.find(k => k.key_type === activeKeyId) || {
    key_type: activeKeyId,
    prompt_text: 'فكري بطريقة إبداعية وشاركي فكرتكِ!'
  };

  const meta = keyMetaMap[activeKeyId] || keyMetaMap.analyze;

  const handleSelectKey = (keyType) => {
    setActiveKeyId(keyType);
    const newMeta = keyMetaMap[keyType] || keyMetaMap.analyze;
    setActiveTabMode(newMeta.defaultMode);
    resetFormState();
  };

  const resetFormState = () => {
    setTextInput('');
    setImageFile(null);
    setImagePreview(null);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecording(false);
    setRecordingTime(0);
    setSubmissionSuccess(false);
  };

  // Audio Recorder logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('لم يتم السماح بالوصول إلى المايكروفون التسجيل');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const resetAudio = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  // Image Upload logic
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!studentName) {
      if (onRequestLogin) onRequestLogin();
      return;
    }

    if (activeTabMode === 'text' && !textInput.trim()) {
      alert('يرجى كتابة فكرتكِ أولاً!');
      return;
    }
    if (activeTabMode === 'audio' && !audioBlob) {
      alert('يرجى تسجيل صوتكِ أولاً!');
      return;
    }
    if (activeTabMode === 'image' && !imageFile) {
      alert('يرجى رفع صيدكِ أو رسمتكِ أولاً!');
      return;
    }

    setSubmitting(true);

    try {
      const questionLabel = `${meta.title}: ${currentKeyObj.prompt_text}`;
      const formData = new FormData();
      formData.append('student_name', studentName);
      formData.append('lesson_id', lessonId);
      formData.append('section_type', 'thinking_keys');
      formData.append('question_text', questionLabel);
      formData.append('submission_type', activeTabMode);

      if (activeTabMode === 'text') {
        formData.append('text_content', textInput);
      } else if (activeTabMode === 'audio' && audioBlob) {
        formData.append('text_content', 'تم تسجيل الفكرة صوتياً 🎙️');
        formData.append('file', audioBlob, 'audio_submission.webm');
      } else if (activeTabMode === 'image' && imageFile) {
        formData.append('text_content', 'تم إرفاق صورة الفكرة 🎨');
        formData.append('file', imageFile);
      }

      const res = await fetch('/api/student/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmissionSuccess(true);
        if (!completedKeys.includes(activeKeyId)) {
          setCompletedKeys([...completedKeys, activeKeyId]);
        }
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        if (onCompleteSection) onCompleteSection('thinking_keys');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'حدث خطأ أثناء إرسال الإجابة، يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      console.error('Error submitting thinking key:', err);
      alert('تعذر الاتصال بالسيرفر، يرجى إعادة المحاولة.');
    } finally {
      setSubmitting(false);
    }
  };

  const keysOrder = ['analyze', 'discuss', 'innovate', 'create'];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '10px 16px 40px 16px', direction: 'rtl' }}>
      
      {/* 1. TOP HEADER & INSTRUCTIONS */}
      <div className="content-box" style={{ background: '#faf5ff', border: '3px solid #c084fc', borderRadius: '24px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#f3e8ff', color: '#7e22ce', padding: '10px 24px', borderRadius: '9999px', fontSize: '24px', fontWeight: '900', marginBottom: '14px', border: '2px solid #d8b4fe' }}>
          <Key size={30} color="#9333ea" />
          <span>🔑 مفاتيح التفكير</span>
        </div>

        <div style={{ background: 'white', border: '2px solid #e9d5ff', borderRadius: '18px', padding: '14px 20px', fontSize: '18px', fontWeight: '800', color: '#6b21a8', maxWidth: '680px', margin: '0 auto', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.06)' }}>
          "فكري بطرق مختلفة، واختاري المفتاح الذي يساعدكِ على التعبير عن فكرتكِ." ✨
        </div>
      </div>

      {/* 2. THE 4 KEYS GRID (Responsive: 2x2 Desktop/Tablet, 1 column Mobile) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {keysOrder.map((keyType) => {
          const itemMeta = keyMetaMap[keyType];
          const isActive = activeKeyId === keyType;
          const isDone = completedKeys.includes(keyType);

          return (
            <button
              key={keyType}
              onClick={() => handleSelectKey(keyType)}
              style={{
                background: isActive ? itemMeta.bg : 'white',
                border: `3px solid ${isActive ? itemMeta.border : '#e2e8f0'}`,
                borderRadius: '24px',
                padding: '20px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontSize: '22px',
                fontWeight: '900',
                color: itemMeta.text,
                boxShadow: isActive ? `0 10px 24px -4px ${itemMeta.border}66` : '0 4px 10px rgba(0,0,0,0.03)',
                transition: 'all 0.25s ease-in-out',
                position: 'relative',
                transform: isActive ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {isDone && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '-10px',
                  background: '#16a34a', color: 'white', borderRadius: '50%',
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(22, 163, 74, 0.4)'
                }}>
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              {itemMeta.icon}
              <span>{itemMeta.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE KEY TASK CARD */}
      <div style={{
        background: 'white',
        border: `3px solid ${meta.border}`,
        borderRadius: '28px',
        padding: '28px',
        boxShadow: `0 12px 30px ${meta.border}33`,
        position: 'relative'
      }}>
        {/* Task Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ background: meta.badgeBg, color: meta.text, padding: '8px 18px', borderRadius: '9999px', fontSize: '18px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {meta.icon}
            <span>{meta.title}</span>
          </span>
        </div>

        {/* Task Prompt Text */}
        <div style={{
          background: meta.bg,
          border: `2px solid ${meta.border}`,
          borderRadius: '20px',
          padding: '20px 24px',
          fontSize: '20px',
          fontWeight: '900',
          color: meta.text,
          lineHeight: '1.7',
          marginBottom: '24px'
        }}>
          {loading ? 'جاري التحميل... ⏳' : currentKeyObj.prompt_text}
        </div>

        {/* 4. ANSWER MODES SELECTION BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {meta.allowModes.includes('audio') && (
            <button
              onClick={() => setActiveTabMode('audio')}
              style={{
                flex: '1 1 140px',
                padding: '12px 18px',
                borderRadius: '16px',
                border: activeTabMode === 'audio' ? `2px solid ${meta.border}` : '2px solid #cbd5e1',
                background: activeTabMode === 'audio' ? meta.border : '#f8fafc',
                color: activeTabMode === 'audio' ? 'white' : '#334155',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeTabMode === 'audio' ? `0 4px 14px ${meta.border}55` : 'none'
              }}
            >
              <Mic size={18} />
              <span>🎙️ أجيب بصوتي</span>
            </button>
          )}

          {meta.allowModes.includes('text') && (
            <button
              onClick={() => setActiveTabMode('text')}
              style={{
                flex: '1 1 140px',
                padding: '12px 18px',
                borderRadius: '16px',
                border: activeTabMode === 'text' ? `2px solid ${meta.border}` : '2px solid #cbd5e1',
                background: activeTabMode === 'text' ? meta.border : '#f8fafc',
                color: activeTabMode === 'text' ? 'white' : '#334155',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeTabMode === 'text' ? `0 4px 14px ${meta.border}55` : 'none'
              }}
            >
              <Edit3 size={18} />
              <span>{activeKeyId === 'create' ? '✏️ أكتب فكرتي' : '✏️ أكتب إجابتي'}</span>
            </button>
          )}

          {meta.allowModes.includes('image') && (
            <button
              onClick={() => setActiveTabMode('image')}
              style={{
                flex: '1 1 140px',
                padding: '12px 18px',
                borderRadius: '16px',
                border: activeTabMode === 'image' ? `2px solid ${meta.border}` : '2px solid #cbd5e1',
                background: activeTabMode === 'image' ? meta.border : '#f8fafc',
                color: activeTabMode === 'image' ? 'white' : '#334155',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeTabMode === 'image' ? `0 4px 14px ${meta.border}55` : 'none'
              }}
            >
              <ImageIcon size={18} />
              <span>{activeKeyId === 'create' ? '📷 أرفع عملي (رسمة / تصميم)' : '📷 أرفع بخط يدي'}</span>
            </button>
          )}
        </div>

        {/* 5. RESPONSE INPUT AREA */}
        
        {/* TEXT INPUT MODE */}
        {activeTabMode === 'text' && (
          <div style={{ marginBottom: '24px' }}>
            <textarea
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="اكتبي فكرتكِ هنا..."
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '20px',
                border: `2px solid ${meta.border}`,
                fontSize: '18px',
                fontFamily: 'Tajawal, sans-serif',
                lineHeight: '1.8',
                outline: 'none',
                direction: 'rtl'
              }}
            />
          </div>
        )}

        {/* AUDIO RECORDING MODE */}
        {activeTabMode === 'audio' && (
          <div style={{ background: '#f8fafc', border: `2px solid ${meta.border}`, borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            {!audioUrl ? (
              <div>
                {!recording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    style={{
                      background: '#ef4444', color: 'white', border: 'none', padding: '14px 28px',
                      borderRadius: '9999px', fontSize: '18px', fontWeight: '900', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <Mic size={22} />
                    <span>بدء التسجيل الصوتي 🎙️</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444', animation: 'pulse 1.5s infinite' }}>
                      🔴 جاري التسجيل... ({recordingTime} ثانية)
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      style={{
                        background: '#1e293b', color: 'white', border: 'none', padding: '12px 28px',
                        borderRadius: '9999px', fontSize: '17px', fontWeight: '900', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '10px'
                      }}
                    >
                      <Square size={20} />
                      <span>إيقاف التسجيل ⏹️</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#16a34a' }}>
                  ✅ تم تسجيل صوتكِ بنجاح!
                </div>
                <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '420px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={resetAudio}
                    style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px',
                      borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>إعادة التسجيل</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMAGE UPLOAD MODE */}
        {activeTabMode === 'image' && (
          <div style={{ background: '#f8fafc', border: `2px solid ${meta.border}`, borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            {!imagePreview ? (
              <label style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                padding: '24px 36px', border: `2px dashed ${meta.border}`, borderRadius: '20px',
                background: 'white', cursor: 'pointer', width: '100%', maxWidth: '400px'
              }}>
                <Upload size={32} color={meta.text} />
                <span style={{ fontSize: '18px', fontWeight: '900', color: meta.text }}>
                  اضغطي هنا لاختيار صورة العمل (JPG, PNG, WEBP) 📷
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <img
                  src={imagePreview}
                  alt="معاينة الصورة"
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '16px', border: '2px solid #cbd5e1', objectFit: 'contain' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{
                    background: '#e0f2fe', color: '#0284c7', padding: '8px 16px', borderRadius: '12px',
                    fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Upload size={16} />
                    <span>تغيير الصورة</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px',
                      borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Trash2 size={16} />
                    <span>حذف الصورة</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBMIT BUTTON & SUCCESS TOAST */}
        {submissionSuccess ? (
          <div style={{
            background: '#dcfce7', border: '2px solid #86efac', borderRadius: '20px',
            padding: '20px', textAlign: 'center', color: '#15803d', fontSize: '20px', fontWeight: '900',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}>
            <Star size={26} fill="#f59e0b" color="#d97706" />
            <span>رائع 🌟 تم إرسال فكرتكِ لمعلمتكِ.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="hero-start-btn"
            style={{
              width: '100%',
              background: meta.border,
              color: 'white',
              padding: '16px',
              fontSize: '20px',
              fontWeight: '900',
              borderRadius: '20px',
              boxShadow: `0 8px 20px ${meta.border}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {submitting ? (
              <span>جاري إرسال الفكرة... ⏳</span>
            ) : (
              <>
                <Send size={22} />
                <span>إرسال الفكرة للمعلمة ✨</span>
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}
