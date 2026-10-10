import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Image as ImageIcon, Video, HelpCircle, FileText, 
  Sparkles, Link as LinkIcon, Download, CheckCircle, XCircle, Mic, Camera, RefreshCw, Trash2, Send
} from 'lucide-react';
import WritingSection from './WritingSection.jsx';
import DictationSection from './DictationSection.jsx';
import ExpressionSection from './ExpressionSection.jsx';
import EnrichmentSection from './EnrichmentSection.jsx';
import ThinkingKeysSection from './ThinkingKeysSection.jsx';

function QuestionAnswerWidget({
  item,
  extra,
  lessonId,
  sectionType,
  studentName,
  onRequestLogin,
  onCompleteSection
}) {
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  
  // Choice state for flexible answer modes
  const [chosenMode, setChosenMode] = useState(null);

  // Audio recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');

  // Image upload states (arfa3 be khatt yadak)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Text answer states
  const [textContent, setTextContent] = useState('');

  // Choice / MCQ states
  const [selectedChoice, setSelectedChoice] = useState('');
  const [mcqFeedback, setMcqFeedback] = useState(null);

  // Status & toast
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const imageInputRef = useRef(null);

  // Determine base answer mode
  const rawMode = extra.answer_mode || (
    extra.question_type === 'oral' ? 'audio' :
    extra.question_type === 'mcq' ? 'mcq' :
    extra.question_type === 'true_false' ? 'true_false' :
    extra.question_type === 'short_answer' ? 'short_answer' :
    'text'
  );

  const isFlexible = ['flexible', 'audio_or_text', 'audio_or_text_or_image', 'any', 'all'].includes(rawMode);
  const isHandwritten = ['handwritten', 'image'].includes(rawMode);

  // Fetch existing submission for this student and question
  const fetchExistingSubmission = async () => {
    if (!studentName || !studentName.trim()) return;
    try {
      const res = await fetch(`/api/student/submissions?student_name=${encodeURIComponent(studentName.trim())}&lesson_id=${lessonId || 1}&section_type=${sectionType || 'general'}`);
      if (res.ok) {
        const data = await res.json();
        const matched = data.find(s => 
          (s.question_id && s.question_id === item.id) || 
          (s.question_text && s.question_text === (item.title || item.content)) ||
          (s.activity_id && s.activity_id === item.id)
        );
        if (matched) {
          setExistingSubmission(matched);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchExistingSubmission();
  }, [studentName, lessonId, sectionType, item.id]);

  // Audio recorder logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('يرجى السماح بالوصول للميكروفون لتسجيل إجابتكِ الصوتيّة 🎙️');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetAudio = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingSeconds(0);
  };

  // Image Selection logic
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate type (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP فقط 📷');
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Submit Answer with try/catch/finally
  const handleSubmit = async (overrideType = null, overrideValue = null) => {
    if (!studentName || !studentName.trim()) {
      if (onRequestLogin) onRequestLogin();
      return;
    }

    const activeMode = overrideType || (chosenMode ? chosenMode : rawMode);

    if (activeMode === 'audio' && !audioBlob && !overrideValue) {
      alert('يرجى تسجيل الإجابة الصوتية أولاً 🎙️');
      return;
    }

    if ((activeMode === 'image' || activeMode === 'handwritten') && !imageFile && !overrideValue) {
      alert('يرجى اختيار صورة إجابتكِ بخط اليد أولاً 📷');
      return;
    }

    if ((activeMode === 'text' || activeMode === 'short_answer') && !textContent.trim() && !overrideValue) {
      alert('يرجى كتابة الإجابة أولاً ✏️');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('student_name', studentName.trim());
      formData.append('lesson_id', lessonId || 1);
      formData.append('section_type', sectionType || 'general');
      formData.append('question_id', item.id);
      formData.append('question_text', item.title || item.content || 'سؤال المهارة');

      let subType = 'text';
      if (activeMode === 'audio') subType = 'audio';
      else if (activeMode === 'image' || activeMode === 'handwritten') subType = 'image';
      else if (activeMode === 'mcq' || activeMode === 'true_false') subType = 'choice';

      formData.append('submission_type', subType);

      if (activeMode === 'audio' && audioBlob) {
        formData.append('file', audioBlob, `audio_ans_${Date.now()}.webm`);
      } else if ((activeMode === 'image' || activeMode === 'handwritten') && imageFile) {
        const ext = imageFile.name ? imageFile.name.split('.').pop() : 'png';
        formData.append('file', imageFile, `handwritten_${Date.now()}.${ext}`);
      }

      if (activeMode === 'mcq' || activeMode === 'true_false') {
        formData.append('text_content', overrideValue || selectedChoice);
      } else if (activeMode === 'text' || activeMode === 'short_answer') {
        formData.append('text_content', overrideValue || textContent);
      }

      const res = await fetch('/api/student/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(result.message || 'أحسنتِ 🌟 تم إرسال إجابتك لمعلمتك');
        setIsEditingExisting(false);
        fetchExistingSubmission();
        if (onCompleteSection && sectionType) {
          onCompleteSection(sectionType);
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.error('Submission Failed:', {
          status: res.status,
          statusText: res.statusText,
          body: errText
        });
        alert('حدث خطأ أثناء إرسال الإجابة، يرجى المحاولة مرة أخرى.');
      }
    } catch (e) {
      console.error('Submission Network Error:', e);
      alert('تعذر الاتصال بالسيرفر لإرسال الإجابة.');
    } finally {
      setSubmitting(false);
    }
  };

  // If answerMode === 'none', no answer widget
  if (rawMode === 'none') {
    return null;
  }

  // If already submitted and not editing
  if (existingSubmission && !isEditingExisting) {
    return (
      <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px', padding: '16px', marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '900', color: existingSubmission.status === 'reviewed' ? '#15803d' : '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={20} color={existingSubmission.status === 'reviewed' ? '#166534' : '#0284c7'} />
            <span>{existingSubmission.status === 'reviewed' ? 'تمت مراجعة إجابتكِ من المعلمة ✅' : 'تم إرسال إجابتكِ للمعلمة بنجاح ✨'}</span>
          </span>
          <button
            onClick={() => setIsEditingExisting(true)}
            style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '6px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
          >
            ✏️ تعديل إجابتي
          </button>
        </div>

        {existingSubmission.teacher_note && (
          <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '14px', padding: '12px 16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#be185d', marginBottom: '4px' }}>💬 ملاحظة وتقييم معلمتكِ:</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#9d174d' }}>"{existingSubmission.teacher_note}"</div>
          </div>
        )}

        {existingSubmission.submission_type === 'audio' && existingSubmission.file_path && (
          <div style={{ marginTop: '8px' }}>
            <audio controls src={existingSubmission.file_path} style={{ width: '100%', maxWidth: '450px' }} />
          </div>
        )}

        {existingSubmission.submission_type === 'image' && existingSubmission.file_path && (
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#15803d', fontWeight: '800', marginBottom: '6px' }}>📷 إجابتكِ بخط اليد:</div>
            <img src={existingSubmission.file_path} alt="إجابتك بخط اليد" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '14px', border: '2px solid #86efac', objectFit: 'contain' }} />
          </div>
        )}

        {existingSubmission.text_content && (
          <div style={{ fontSize: '16px', color: '#166534', fontWeight: '800', background: 'white', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', marginTop: '6px' }}>
            إجابتكِ: "{existingSubmission.text_content}"
          </div>
        )}
      </div>
    );
  }

  // Determine active view mode
  const currentActiveMode = isFlexible ? chosenMode : rawMode;

  return (
    <div style={{ marginTop: '16px', background: 'white', borderRadius: '18px', padding: '18px', border: '2px dashed #f472b6' }}>
      
      {/* Flexible Choice Selector (Audio / Text / Image) */}
      {isFlexible && !chosenMode && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#9d174d', marginBottom: '12px' }}>
            اختاري طريقة الإجابة المناسبة لكِ 🌸
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setChosenMode('audio')}
              className="hero-start-btn"
              style={{ background: '#db2777', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: '0 4px 12px rgba(219, 39, 119, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Mic size={18} />
              <span>🎙️ أجيب بصوتي</span>
            </button>
            <button
              type="button"
              onClick={() => setChosenMode('text')}
              className="hero-start-btn"
              style={{ background: '#0284c7', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={18} />
              <span>✏️ أكتب إجابتي</span>
            </button>
            <button
              type="button"
              onClick={() => setChosenMode('image')}
              className="hero-start-btn"
              style={{ background: '#7c3aed', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Camera size={18} />
              <span>📷 أرفع بخط يدي</span>
            </button>
          </div>
        </div>
      )}

      {/* Button to switch choice if in flexible mode and choice is made */}
      {isFlexible && chosenMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => {
              setChosenMode(null);
              resetAudio();
              resetImage();
              setTextContent('');
            }}
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
          >
            ↩️ تغيير طريقة الإجابة
          </button>
        </div>
      )}

      {/* 1. AUDIO RECORDING UI */}
      {currentActiveMode === 'audio' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#9d174d', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Mic size={22} color="#db2777" />
            <span>🎙️ سجّلي إجابتكِ الصوتيّة</span>
          </div>

          {!isRecording && !audioUrl && (
            <button
              type="button"
              onClick={startRecording}
              className="hero-start-btn"
              style={{ background: '#db2777', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.4)', borderRadius: '16px' }}
            >
              🎙️ بدء التسجيل
            </button>
          )}

          {isRecording && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626' }}>
                🔴 جاري التسجيل... ({recordingSeconds} ثانية)
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="hero-start-btn"
                style={{ background: '#dc2626', color: 'white', padding: '10px 24px', fontSize: '15px', boxShadow: 'none' }}
              >
                ⏹ إيقاف التسجيل
              </button>
            </div>
          )}

          {!isRecording && audioUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '420px' }} />
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startRecording}
                  style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={14} />
                  <span>إعادة التسجيل</span>
                </button>
                <button
                  type="button"
                  onClick={resetAudio}
                  style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={14} />
                  <span>حذف التسجيل</span>
                </button>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('audio')}
                  className="hero-start-btn"
                  style={{ background: '#059669', color: 'white', padding: '12px 32px', fontSize: '17px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
                >
                  {submitting ? 'جاري الإرسال... ⏳' : '📤 إرسال لمعلمتي'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. HANDWRITTEN IMAGE UPLOAD UI ("ارفع بخط يدك") */}
      {(currentActiveMode === 'image' || currentActiveMode === 'handwritten') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#6b21a8', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Camera size={24} color="#7c3aed" />
            <span>📷 ارفعي إجابتك بخط يدك</span>
          </div>

          <input
            type="file"
            ref={imageInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          {!imagePreviewUrl ? (
            <div style={{ background: '#faf5ff', border: '2px dashed #c084fc', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: '#6b21a8', fontWeight: '700' }}>
                اكتبي الإجابة في دفترك، ثم التقطي صورة واضحة وارفعيها هنا 🌸
              </div>
              <button
                type="button"
                onClick={() => imageInputRef.current && imageInputRef.current.click()}
                className="hero-start-btn"
                style={{ background: '#7c3aed', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Camera size={20} />
                <span>اختاير صورة إجابتكِ (JPG, PNG, WEBP)</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '3px solid #c084fc', background: '#f8fafc', padding: '8px', maxWidth: '100%' }}>
                <img
                  src={imagePreviewUrl}
                  alt="معاينة إجابتك بخط اليد"
                  style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '12px', objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => imageInputRef.current && imageInputRef.current.click()}
                  style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={15} />
                  <span>تغيير الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={resetImage}
                  style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} />
                  <span>حذف الصورة</span>
                </button>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('image')}
                  className="hero-start-btn"
                  style={{ background: '#059669', color: 'white', padding: '12px 32px', fontSize: '17px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
                >
                  {submitting ? 'جاري الإرسال... ⏳' : '📤 إرسال لمعلمتي'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WRITTEN TEXT UI */}
      {(currentActiveMode === 'text' || currentActiveMode === 'open') && (
        <div>
          <label style={{ fontWeight: '900', fontSize: '15px', color: '#9d174d', display: 'block', marginBottom: '8px' }}>
            اكتبي إجابتكِ هنا ✏️:
          </label>
          <textarea
            rows={4}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="اكتبي إجابتكِ بخط واضح ومفهوم..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '2px solid #fbcfe8', fontSize: '17px', lineHeight: '1.7', fontFamily: 'Cairo, sans-serif' }}
          />
          <div style={{ marginTop: '12px', textAlign: 'left' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('text')}
              className="hero-start-btn"
              style={{ background: '#059669', color: 'white', padding: '10px 26px', fontSize: '16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
            >
              {submitting ? 'جاري الإرسال... ⏳' : '📤 إرسال لمعلمتي'}
            </button>
          </div>
        </div>
      )}

      {/* 4. SHORT ANSWER UI */}
      {currentActiveMode === 'short_answer' && (
        <div>
          <label style={{ fontWeight: '900', fontSize: '15px', color: '#9d174d', display: 'block', marginBottom: '8px' }}>
            إجابة قصيرة ✏️:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="اكتبي الكلمة أو الجملة هنا..."
              style={{ flexGrow: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #fbcfe8', fontSize: '17px', fontWeight: '800' }}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('short_answer')}
              className="hero-start-btn"
              style={{ background: '#059669', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
            >
              {submitting ? 'جاري الإرسال... ⏳' : '📤 إرسال لمعلمتي'}
            </button>
          </div>
        </div>
      )}

      {/* 5. MCQ / TRUE FALSE UI */}
      {(currentActiveMode === 'mcq' || currentActiveMode === 'true_false') && extra.options && extra.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {extra.options.map((opt, oIdx) => {
            const isSelected = selectedChoice === opt;
            return (
              <button
                key={oIdx}
                type="button"
                onClick={() => {
                  setSelectedChoice(opt);
                  const isCorrect = opt === extra.correct_answer;
                  setMcqFeedback({
                    isCorrect,
                    msg: isCorrect ? 'أحسنتِ! إجابة صحيحة 🎉' : 'حاولي مرة أخرى يا بطلة 💪'
                  });
                }}
                style={{
                  padding: '12px 18px', borderRadius: '14px', border: isSelected ? '3px solid #db2777' : '2px solid #e2e8f0',
                  background: isSelected ? '#fbcfe8' : 'white', color: '#1e293b',
                  fontSize: '16px', fontWeight: '900', textAlign: 'right', cursor: 'pointer'
                }}
              >
                {opt}
              </button>
            );
          })}

          {mcqFeedback && (
            <div style={{
              marginTop: '8px', padding: '10px 14px', borderRadius: '12px', fontWeight: '900', fontSize: '15px',
              background: mcqFeedback.isCorrect ? '#d1fae5' : '#fee2e2',
              color: mcqFeedback.isCorrect ? '#065f46' : '#991b1b',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {mcqFeedback.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{mcqFeedback.msg}</span>
            </div>
          )}

          {selectedChoice && (
            <div style={{ marginTop: '8px', textAlign: 'left' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(currentActiveMode, selectedChoice)}
                className="hero-start-btn"
                style={{ background: '#059669', color: 'white', padding: '10px 24px', fontSize: '15px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
              >
                {submitting ? 'جاري الإرسال... ⏳' : '📤 إرسال إجابتي لمعلمتي'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Message Banner */}
      {successMsg && (
        <div style={{ marginTop: '12px', background: '#d1fae5', color: '#065f46', border: '2px solid #6ee7b7', padding: '12px 16px', borderRadius: '14px', fontWeight: '900', fontSize: '16px', textAlign: 'center' }}>
          {successMsg}
        </div>
      )}
    </div>
  );
}

export default function DynamicSectionRenderer({ 
  sectionType, 
  contents = [], 
  lessonTitle = '', 
  lessonId = 1,
  studentName = '',
  onRequestLogin,
  onCompleteSection,
  isPreview = false 
}) {
  if (sectionType === 'writing') {
    return (
      <WritingSection
        writingDrills={contents}
        lessonId={lessonId}
        studentName={studentName}
        onRequestLogin={onRequestLogin}
        onCompleteSection={onCompleteSection}
      />
    );
  }

  if (sectionType === 'dictation') {
    return (
      <DictationSection
        dictationDrills={contents}
        lessonId={lessonId}
        studentName={studentName}
        onRequestLogin={onRequestLogin}
        onCompleteSection={onCompleteSection}
      />
    );
  }

  if (sectionType === 'expression') {
    return (
      <ExpressionSection
        expressionDrills={contents}
        lessonId={lessonId}
        studentName={studentName}
        onRequestLogin={onRequestLogin}
        onCompleteSection={onCompleteSection}
      />
    );
  }

  if (sectionType === 'enrichment') {
    return (
      <EnrichmentSection
        contents={contents}
        lessonTitle={lessonTitle}
        onCompleteSection={onCompleteSection}
      />
    );
  }

  if (sectionType === 'thinking_keys') {
    return (
      <ThinkingKeysSection
        lessonId={lessonId}
        studentName={studentName}
        onRequestLogin={onRequestLogin}
        onCompleteSection={onCompleteSection}
      />
    );
  }

  const visibleContents = (contents || []).filter(c => c.is_visible !== 0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  
  if (!visibleContents || visibleContents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontWeight: '800' }}>
        <Sparkles size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
        <div>لم يتم إضافة محتوى لهذه المهارة بعد ✨</div>
      </div>
    );
  }

  const renderSingleItem = (item) => {
    if (!item) return null;

    let extra = {};
    if (item.extra_data) {
      try {
        extra = typeof item.extra_data === 'string' ? JSON.parse(item.extra_data) : (item.extra_data || {});
      } catch (e) {
        extra = {};
      }
    }

    const isHeading = item.content_type === 'heading';
    const isReading = sectionType === 'reading';
    const isReadingText = isReading && item.content_type === 'text';

    // If item has no renderable content_type or is an image/audio without media & title, skip returning empty wrapper
    if (item.content_type === 'image' && !item.media_url && !item.title) {
      return null;
    }

    return (
      <div
        key={item.id || Math.random()}
        className={isReadingText ? 'reading-text-card' : ''}
        style={{
          background: isReadingText ? '#FFFDF4' : 'white',
          borderRadius: isReadingText ? '24px' : '20px',
          border: isReadingText ? '2px solid #fde047' : '2px solid #e2e8f0',
          padding: isReadingText ? undefined : (isHeading ? '16px 24px' : '20px 24px'),
          boxShadow: isReadingText ? '0 6px 20px rgba(217, 119, 6, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: isReading ? '800px' : undefined,
          margin: isReading ? '0 auto' : undefined
        }}
      >
        {/* HEADING */}
        {item.content_type === 'heading' && (
          <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: isReading ? '24px' : '22px', fontWeight: '900', color: '#0284c7', margin: 0, textAlign: 'center' }}>
            {item.title || item.content}
          </h3>
        )}

        {/* INSTRUCTIONS */}
        {item.content_type === 'instructions' && (
          <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={22} color="#166534" style={{ flexShrink: 0 }} />
            <div>
              {item.title && <div style={{ fontSize: '14px', fontWeight: '900', color: '#166534', marginBottom: '2px' }}>{item.title}</div>}
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#15803d' }}>{item.content || item.title}</div>
            </div>
          </div>
        )}

        {/* TEXT / PARAGRAPH */}
        {item.content_type === 'text' && (
          <div>
            {item.title && (
              <h4 
                className={isReading ? 'reading-title-text' : ''} 
                style={isReading ? undefined : { fontFamily: 'Cairo, sans-serif', fontSize: '19px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}
              >
                {item.title}
              </h4>
            )}
            {item.content && (
              <div 
                className={isReading ? 'reading-passage-text' : ''} 
                style={isReading ? undefined : { fontSize: '18px', color: '#334155', lineHeight: '1.9', whiteSpace: 'pre-wrap', fontFamily: 'Cairo, sans-serif' }}
              >
                {isReading ? (
                  (item.content || '').split('\n').map((paragraph, pIdx) => (
                    paragraph.trim() ? (
                      <p key={pIdx}>
                        {paragraph}
                      </p>
                    ) : null
                  ))
                ) : (
                  item.content
                )}
              </div>
            )}
          </div>
        )}

        {/* IMAGE */}
        {item.content_type === 'image' && (
          <div style={{ textAlign: 'center' }}>
            {item.title && <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>{item.title}</h4>}
            {item.media_url && (
              <div style={{ borderRadius: '18px', overflow: 'hidden', border: '3px solid #bae6fd', display: 'inline-block', maxWidth: '100%' }}>
                <img src={item.media_url} alt={item.title || 'صورة'} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            {extra && extra.description && (
              <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: '700' }}>
                {extra.description}
              </p>
            )}
          </div>
        )}

        {/* AUDIO */}
        {item.content_type === 'audio' && (
          <div style={{ background: '#fef3c7', border: '2px solid #fde047', borderRadius: '18px', padding: '18px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
              <Volume2 size={26} color="#d97706" />
              <span style={{ fontSize: '17px', fontWeight: '900', color: '#78350f' }}>{item.title || 'استمعي للمقطع الصوتي 🎧'}</span>
            </div>
            {item.media_url && (
              <audio controls src={item.media_url} style={{ width: '100%', maxWidth: '500px' }} />
            )}
          </div>
        )}

        {/* VIDEO */}
        {item.content_type === 'video' && item.media_url && (
          <div style={{ textAlign: 'center' }}>
            {item.title && <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>{item.title}</h4>}
            <div style={{ borderRadius: '18px', overflow: 'hidden', border: '3px solid #d8b4fe', background: '#000', display: 'inline-block', width: '100%', maxWidth: '640px' }}>
              <video controls src={item.media_url} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        )}

        {/* QUESTION */}
        {item.content_type === 'question' && (
          <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '18px', padding: '18px' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#9d174d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={24} color="#db2777" />
              <span>{item.title || item.content}</span>
            </div>

            <QuestionAnswerWidget
              item={item}
              extra={extra}
              lessonId={lessonId}
              sectionType={sectionType}
              studentName={studentName}
              onRequestLogin={onRequestLogin}
              onCompleteSection={onCompleteSection}
            />
          </div>
        )}

        {/* FILE */}
        {item.content_type === 'file' && (item.media_url || extra.link_url) && (
          <div style={{ background: '#f1f5f9', border: '2px solid #cbd5e1', borderRadius: '16px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#334155' }}>
              📁 {item.title || 'تحميل الملف المرفق'}
            </div>
            <a
              href={item.media_url || extra.link_url}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} />
              <span>تحميل الملف</span>
            </a>
          </div>
        )}

        {/* LINK */}
        {item.content_type === 'link' && (item.media_url || extra.link_url) && (
          <div style={{ background: '#e0f2fe', border: '2px solid #bae6fd', borderRadius: '16px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1' }}>
              🔗 {item.title || 'رابط خارجي مفيد'}
            </div>
            <a
              href={item.media_url || extra.link_url}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LinkIcon size={16} />
              <span>فتح الرابط</span>
            </a>
          </div>
        )}

      </div>
    );
  };

  const isSpeakingSection = sectionType === 'speaking' || sectionType === 'observe';

  if (isSpeakingSection) {
    const firstImageIndex = visibleContents.findIndex(c => c.content_type === 'image');

    let globalHeaderItems = [];
    let sceneSourceItems = [];

    if (firstImageIndex === -1) {
      globalHeaderItems = visibleContents;
    } else {
      globalHeaderItems = visibleContents.slice(0, firstImageIndex);
      sceneSourceItems = visibleContents.slice(firstImageIndex);
    }

    const scenes = [];
    let currentImageScene = null;
    let explicitFinalQuestions = [];

    sceneSourceItems.forEach((item) => {
      const isExplicitFinalQ = item.content_type === 'question' && 
        ((item.title && (item.title.includes('ختام') || item.title.includes('ختامي'))) || 
         (item.content && (item.content.includes('ختام') || item.content.includes('ختامي'))));

      if (isExplicitFinalQ) {
        explicitFinalQuestions.push(item);
      } else if (item.content_type === 'image') {
        currentImageScene = {
          id: item.id,
          imageItem: item,
          title: item.title || `المشهد ${scenes.length + 1}`,
          items: [item]
        };
        scenes.push(currentImageScene);
      } else if (scenes.length > 0) {
        scenes[scenes.length - 1].items.push(item);
      } else {
        globalHeaderItems.push(item);
      }
    });

    // Detect trailing standalone final question if not explicitly tagged
    let finalQuestionItems = [...explicitFinalQuestions];

    if (finalQuestionItems.length === 0 && scenes.length > 0) {
      const lastScene = scenes[scenes.length - 1];
      if (lastScene.items.length > 2 && lastScene.items[lastScene.items.length - 1].content_type === 'question') {
        const trailingQ = lastScene.items.pop();
        finalQuestionItems.push(trailingQ);
      } else {
        const lastSourceItem = sceneSourceItems[sceneSourceItems.length - 1];
        if (lastSourceItem && lastSourceItem.content_type === 'question') {
          const qCountInLastScene = lastScene.items.filter(i => i.content_type === 'question').length;
          if (qCountInLastScene > 1) {
            const trailingQ = lastScene.items.pop();
            finalQuestionItems.push(trailingQ);
          }
        }
      }
    }

    // Append Final Question Tab if present
    if (finalQuestionItems.length > 0) {
      scenes.push({
        id: 'final_question_tab',
        isFinalQuestion: true,
        title: 'السؤال الختامي',
        items: finalQuestionItems
      });
    }

    if (scenes.length > 0) {
      const currentScene = scenes[Math.min(activeSceneIndex, scenes.length - 1)] || scenes[0];

      return (
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: '10px 16px 24px 16px', boxSizing: 'border-box' }}>
          
          {/* Main Wrapper with Gap 16px */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Global Header Items (Compact Heading, Instructions, etc. with gap 10px) */}
            {globalHeaderItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalHeaderItems.map((item) => renderSingleItem(item))}
              </div>
            )}

            {/* Horizontal Scene Thumbnails Bar */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: '2px solid #e2e8f0',
              padding: '14px 18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={20} color="#0284c7" />
                  <span>اختاري مشهداً لتتحدثي عنه 🌸</span>
                </span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b' }}>
                  {currentScene.isFinalQuestion 
                    ? 'السؤال الختامي ⭐' 
                    : `المشهد ${activeSceneIndex + 1} من ${scenes.filter(s => !s.isFinalQuestion).length}`}
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollBehavior: 'smooth'
              }}>
                {scenes.map((scene, sIdx) => {
                  const isActive = sIdx === activeSceneIndex;

                  if (scene.isFinalQuestion) {
                    return (
                      <div
                        key={scene.id || sIdx}
                        onClick={() => setActiveSceneIndex(sIdx)}
                        style={{
                          flexShrink: 0,
                          cursor: 'pointer',
                          borderRadius: '16px',
                          padding: '6px',
                          background: isActive ? '#fdf2f8' : '#f8fafc',
                          border: isActive ? '3px solid #db2777' : '2px solid #fbcfe8',
                          boxShadow: isActive ? '0 4px 14px rgba(219, 39, 119, 0.25)' : 'none',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          width: '135px'
                        }}
                      >
                        <div style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          height: '80px',
                          background: isActive ? '#fbcfe8' : '#fce7f3',
                          marginBottom: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justify: 'center',
                          position: 'relative'
                        }}>
                          <Sparkles size={32} color={isActive ? '#db2777' : '#be185d'} />
                          {isActive && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: '#db2777',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: '900',
                              padding: '2px 6px',
                              borderRadius: '8px'
                            }}>
                              ختامي ✨
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '900',
                          color: isActive ? '#db2777' : '#be185d',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title="السؤال الختامي">
                          السؤال الختامي 💬
                        </div>
                      </div>
                    );
                  }

                  let extra = {};
                  if (scene.imageItem && scene.imageItem.extra_data) {
                    try {
                      extra = typeof scene.imageItem.extra_data === 'string'
                        ? JSON.parse(scene.imageItem.extra_data)
                        : scene.imageItem.extra_data;
                    } catch (e) {}
                  }
                  const label = (scene.imageItem && scene.imageItem.title) || extra.title || `المشهد ${sIdx + 1}`;

                  return (
                    <div
                      key={scene.id || sIdx}
                      onClick={() => setActiveSceneIndex(sIdx)}
                      style={{
                        flexShrink: 0,
                        cursor: 'pointer',
                        borderRadius: '16px',
                        padding: '6px',
                        background: isActive ? '#f0f9ff' : '#f8fafc',
                        border: isActive ? '3px solid #0284c7' : '2px solid #cbd5e1',
                        boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.2)' : 'none',
                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        width: '135px'
                      }}
                    >
                      <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        height: '80px',
                        background: '#e2e8f0',
                        marginBottom: '6px',
                        position: 'relative'
                      }}>
                        <img
                          src={scene.imageItem.media_url}
                          alt={label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#0284c7',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '900',
                            padding: '2px 6px',
                            borderRadius: '8px'
                          }}>
                            المشهد الحالي ✨
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: isActive ? '#0284c7' : '#475569',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }} title={label}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Scene Items Display (Gap 16px between image and question) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentScene.items.map((item) => renderSingleItem(item))}
            </div>

            {/* Previous / Next Navigation Buttons Footer */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background: 'white',
              borderRadius: '20px',
              border: '2px solid #e2e8f0',
              padding: '14px 20px',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <button
                type="button"
                disabled={activeSceneIndex === 0}
                onClick={() => setActiveSceneIndex(prev => Math.max(0, prev - 1))}
                className="hero-start-btn"
                style={{
                  background: activeSceneIndex === 0 ? '#94a3b8' : '#0284c7',
                  color: 'white',
                  padding: '8px 18px',
                  fontSize: '14px',
                  opacity: activeSceneIndex === 0 ? 0.5 : 1,
                  cursor: activeSceneIndex === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: activeSceneIndex === 0 ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                ⬅️ المشهد السابق
              </button>

              <span style={{ fontSize: '14px', fontWeight: '900', color: '#475569' }}>
                {currentScene.isFinalQuestion 
                  ? 'السؤال الختامي ⭐' 
                  : `المشهد ${activeSceneIndex + 1} من ${scenes.filter(s => !s.isFinalQuestion).length}`}
              </span>

              <button
                type="button"
                disabled={activeSceneIndex === scenes.length - 1}
                onClick={() => setActiveSceneIndex(prev => Math.min(scenes.length - 1, prev + 1))}
                className="hero-start-btn"
                style={{
                  background: activeSceneIndex === scenes.length - 1 ? '#94a3b8' : '#0284c7',
                  color: 'white',
                  padding: '8px 18px',
                  fontSize: '14px',
                  opacity: activeSceneIndex === scenes.length - 1 ? 0.5 : 1,
                  cursor: activeSceneIndex === scenes.length - 1 ? 'not-allowed' : 'pointer',
                  boxShadow: activeSceneIndex === scenes.length - 1 ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                {activeSceneIndex === scenes.length - 2 && scenes[scenes.length - 1].isFinalQuestion 
                  ? 'السؤال الختامي 💬 ➡️' 
                  : 'المشهد التالي ➡️'}
              </button>
            </div>

          </div>
        </div>
      );
    }
  }

  // Reading Section specific renderer with grouped Vocabulary Grid
  if (sectionType === 'reading') {
    const nonVocabContents = visibleContents.filter(c => c.content_type !== 'vocabulary');
    const vocabContents = visibleContents.filter(c => c.content_type === 'vocabulary');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto' }}>
        {nonVocabContents.map((item) => renderSingleItem(item))}

        {vocabContents.length > 0 && (
          <div style={{ marginTop: '12px', width: '100%', maxWidth: '800px', margin: '12px auto 0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px 20px',
              background: '#fef3c7',
              borderRadius: '16px',
              border: '2px solid #fde047'
            }}>
              <Sparkles size={24} color="#d97706" />
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#78350f', margin: 0 }}>
                ✨ كلماتي الجديدة
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {vocabContents.map((vItem) => (
                <div
                  key={vItem.id}
                  style={{
                    background: '#ffffff',
                    border: '2px solid #fde047',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: '23px', fontWeight: '900', color: '#0284c7', marginBottom: '6px' }}>
                    {vItem.title}
                  </div>
                  {vItem.content && (
                    <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: '16px', fontWeight: '700', color: '#475569', lineHeight: '1.5' }}>
                      {vItem.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard renderer for all other sections
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto' }}>
      {visibleContents.map((item) => renderSingleItem(item))}
    </div>
  );
}
