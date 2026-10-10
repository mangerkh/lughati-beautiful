import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit3, Trash2, Eye, ArrowUp, ArrowDown, Check, X, EyeOff, Sparkles, Users, RefreshCw } from 'lucide-react';

export default function QuizManager({ lessonId, token, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('questions'); // 'questions' | 'results'
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    question_type: 'mcq',
    question_text: '',
    mcq_options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث'],
    mcq_correct: 'الخيار الأول',
    tf_correct: 'صح',
    fill_correct: '',
    ordering_events: ['الحدث الأول', 'الحدث الثاني', 'الحدث الثالث'],
    sort_order: 1,
    is_enabled: 1
  });

  useEffect(() => {
    fetchQuestions();
    fetchResults();
  }, [lessonId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quiz-questions?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (e) {
      console.error('Error fetching quiz questions:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/admin/quiz-results?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error('Error fetching quiz results:', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      question_type: 'mcq',
      question_text: '',
      mcq_options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث'],
      mcq_correct: 'الخيار الأول',
      tf_correct: 'صح',
      fill_correct: '',
      ordering_events: ['وجد الغراب الجرة.', 'لم يستطع الوصول إلى الماء.', 'ألقى الحجارة في الجرة.', 'ارتفع الماء.'],
      sort_order: questions.length + 1,
      is_enabled: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q.id);
    let mcqOpts = ['الخيار الأول', 'الخيار الثاني'];
    let orderingEvents = [];
    try {
      if (q.question_type === 'mcq') mcqOpts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      if (q.question_type === 'ordering') orderingEvents = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : (q.correct_answer || []);
    } catch (e) {}

    setFormData({
      question_type: q.question_type || 'mcq',
      question_text: q.question_text || '',
      mcq_options: mcqOpts.length > 0 ? mcqOpts : ['الخيار الأول', 'الخيار الثاني'],
      mcq_correct: q.question_type === 'mcq' ? q.correct_answer : (mcqOpts[0] || ''),
      tf_correct: q.question_type === 'tf' ? q.correct_answer : 'صح',
      fill_correct: q.question_type === 'fill' ? q.correct_answer : '',
      ordering_events: orderingEvents.length > 0 ? orderingEvents : ['حدث 1', 'حدث 2'],
      sort_order: q.sort_order || 1,
      is_enabled: q.is_enabled ?? 1
    });
    setShowModal(true);
  };

  const handleToggleVisibility = async (qId) => {
    try {
      const res = await fetch(`/api/admin/quiz-questions/${qId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('تم تحديث حالة ظهور السؤال');
        fetchQuestions();
      }
    } catch (e) {}
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('هل أنتِ متأكدة من حذف هذا السؤال؟')) return;
    try {
      const res = await fetch(`/api/admin/quiz-questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('تم حذف السؤال بنجاح');
        fetchQuestions();
      }
    } catch (e) {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.question_text.trim()) {
      alert('يرجى كتابة نص السؤال!');
      return;
    }

    let optionsPayload = [];
    let correctAnswerPayload = '';

    if (formData.question_type === 'mcq') {
      optionsPayload = formData.mcq_options.filter(o => o.trim());
      correctAnswerPayload = formData.mcq_correct;
    } else if (formData.question_type === 'tf') {
      optionsPayload = ['صح', 'خطأ'];
      correctAnswerPayload = formData.tf_correct;
    } else if (formData.question_type === 'fill') {
      optionsPayload = [];
      correctAnswerPayload = formData.fill_correct.trim();
    } else if (formData.question_type === 'ordering') {
      const events = formData.ordering_events.filter(e => e.trim());
      optionsPayload = events;
      correctAnswerPayload = JSON.stringify(events);
    }

    const payload = {
      lesson_id: lessonId,
      question_type: formData.question_type,
      question_text: formData.question_text,
      options: optionsPayload,
      correct_answer: correctAnswerPayload,
      sort_order: formData.sort_order,
      is_enabled: formData.is_enabled
    };

    try {
      const url = editingId ? `/api/admin/quiz-questions/${editingId}` : '/api/admin/quiz-questions';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingId ? 'تم تحديث السؤال بنجاح ✅' : 'تم إضافة السؤال بنجاح ✅');
        setShowModal(false);
        fetchQuestions();
      }
    } catch (e) {
      alert('حدث خطأ أثناء حفظ السؤال');
    }
  };

  // Move Question UP / DOWN
  const handleMoveQuestion = async (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const list = [...questions];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Update sort_order locally and sync
    setQuestions(list);
    try {
      await Promise.all([
        fetch(`/api/admin/quiz-questions/${list[index].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...list[index], sort_order: index + 1 })
        }),
        fetch(`/api/admin/quiz-questions/${list[targetIdx].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...list[targetIdx], sort_order: targetIdx + 1 })
        })
      ]);
    } catch (e) {}
  };

  return (
    <div className="content-box" style={{ direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#b45309', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} color="#d97706" />
            <span>🏆 مدير الاختبار النهائي (اختبر نفسي)</span>
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            إدارة أسئلة الاختبار الختامي المستقل ونتائج محاولات الطالبات للدرس
          </p>
        </div>

        {/* Sub Tabs Toggle */}
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('questions')}
            style={{
              padding: '8px 18px', borderRadius: '10px', border: 'none',
              background: activeSubTab === 'questions' ? '#d97706' : 'transparent',
              color: activeSubTab === 'questions' ? 'white' : '#64748b',
              fontWeight: '800', fontSize: '15px', cursor: 'pointer'
            }}
          >
            📋 قائمة الأسئلة ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('results')}
            style={{
              padding: '8px 18px', borderRadius: '10px', border: 'none',
              background: activeSubTab === 'results' ? '#d97706' : 'transparent',
              color: activeSubTab === 'results' ? 'white' : '#64748b',
              fontWeight: '800', fontSize: '15px', cursor: 'pointer'
            }}
          >
            📊 نتائج الطالبات ({results.length})
          </button>
        </div>
      </div>

      {/* SUB TAB 1: QUESTIONS MANAGEMENT */}
      {activeSubTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={handleOpenAdd}
              className="hero-start-btn"
              style={{ background: '#d97706', color: 'white', padding: '10px 22px', fontSize: '15px', boxShadow: 'none' }}
            >
              <Plus size={18} />
              <span>+ إضافة سؤال جديد</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, idx) => {
              const isEnabled = q.is_enabled !== 0;

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'white', border: isEnabled ? '2px solid #fde68a' : '2px solid #cbd5e1',
                    borderRadius: '18px', padding: '20px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '16px', opacity: isEnabled ? 1 : 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <span style={{
                      background: isEnabled ? '#d97706' : '#94a3b8', color: 'white',
                      padding: '6px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '16px'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                          {q.question_text}
                        </h4>
                        <span style={{
                          background: '#fef3c7', color: '#b45309', padding: '3px 10px',
                          borderRadius: '8px', fontSize: '12px', fontWeight: '800'
                        }}>
                          {q.question_type === 'mcq' && 'اختيار من متعدد'}
                          {q.question_type === 'tf' && 'صح / خطأ'}
                          {q.question_type === 'fill' && 'إكمال الفراغ'}
                          {q.question_type === 'ordering' && 'ترتيب أحداث'}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: '700' }}>
                        الإجابة الصحيحة: <strong style={{ color: '#059669' }}>{q.correct_answer}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Sort controls */}
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <ArrowDown size={16} />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleToggleVisibility(q.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '9999px', border: 'none',
                        background: isEnabled ? '#d1fae5' : '#fee2e2', color: isEnabled ? '#065f46' : '#991b1b',
                        fontWeight: '800', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      {isEnabled ? '👁️ ظاهرة ON' : '🙈 مخفية OFF'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      <Edit3 size={16} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(q.id)}
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {questions.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px', fontWeight: '700' }}>
                لا توجد أسئلة حالياً لهذا الاختبار. يمكنكِ إضافة سؤال جديد بالضغط على الزر أعلاه! 💡
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: STUDENT QUIZ RESULTS */}
      {activeSubTab === 'results' && (
        <div>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px', fontWeight: '800' }}>
              لا توجد محاولات اختبار مسجلة للطالبات بهذا الدرس حتى الآن.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#fffbe6', color: '#92400e', borderBottom: '2px solid #fde68a' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>اسم الطالبة</th>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>الدرس</th>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>النتيجة</th>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>النسبة</th>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>رقم المحاولة</th>
                    <th style={{ padding: '14px 18px', fontWeight: '900' }}>تاريخ المحاولة</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '900', color: '#1e293b' }}>{r.student_name}</td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#475569' }}>{r.lesson_title || 'الغراب والجرة'}</td>
                      <td style={{ padding: '14px 18px', fontWeight: '900', color: '#d97706' }}>
                        {r.score} / {r.total_questions}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: r.percentage >= 80 ? '#d1fae5' : r.percentage >= 60 ? '#fef3c7' : '#fee2e2',
                          color: r.percentage >= 80 ? '#065f46' : r.percentage >= 60 ? '#92400e' : '#991b1b',
                          padding: '4px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '13px'
                        }}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0284c7' }}>
                        المحاولة #{r.attempt_number || 1}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>
                        {r.completed_at ? new Date(r.completed_at).toLocaleString('ar-EG') : 'الآن'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT QUESTION */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#b45309', margin: 0 }}>
                {editingId ? '✏️ تعديل سؤال الاختيار' : '➕ إضافة سؤال جديد للاختبار الختامي'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Question Type Selection */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  نوع السؤال:
                </label>
                <select
                  value={formData.question_type}
                  onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800' }}
                >
                  <option value="mcq">اختيار من متعدد</option>
                  <option value="tf">صح / خطأ</option>
                  <option value="fill">إكمال الفراغ</option>
                  <option value="ordering">ترتيب أحداث القصة</option>
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  نص السؤال / العبارة:
                </label>
                <input
                  type="text"
                  required
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="مثال: لماذا كان الغراب يبحث عن الماء؟"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px' }}
                />
              </div>

              {/* TYPE 1: MCQ FIELDS */}
              {formData.question_type === 'mcq' && (
                <div style={{ background: '#fffbe6', border: '1px solid #fde68a', padding: '16px', borderRadius: '14px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '800', color: '#b45309', display: 'block', marginBottom: '8px' }}>
                    خيارات الإجابة:
                  </label>
                  {formData.mcq_options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...formData.mcq_options];
                          copy[idx] = e.target.value;
                          setFormData({ ...formData, mcq_options: copy });
                        }}
                        style={{ flexGrow: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  ))}

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '800', color: '#059669', display: 'block', marginBottom: '6px' }}>
                      تحديد الإجابة الصحيحة:
                    </label>
                    <select
                      value={formData.mcq_correct}
                      onChange={(e) => setFormData({ ...formData, mcq_correct: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #10b981', fontWeight: '800' }}
                    >
                      {formData.mcq_options.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TYPE 2: TRUE / FALSE */}
              {formData.question_type === 'tf' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '14px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '800', color: '#166534', display: 'block', marginBottom: '6px' }}>
                    الإجابة الصحيحة:
                  </label>
                  <select
                    value={formData.tf_correct}
                    onChange={(e) => setFormData({ ...formData, tf_correct: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #22c55e', fontWeight: '800' }}
                  >
                    <option value="صح">صح ✅</option>
                    <option value="خطأ">خطأ ❌</option>
                  </select>
                </div>
              )}

              {/* TYPE 3: FILL IN BLANK */}
              {formData.question_type === 'fill' && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '14px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '800', color: '#0369a1', display: 'block', marginBottom: '6px' }}>
                    الكلمة المناسبة (الإجابة الصحيحة):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fill_correct}
                    onChange={(e) => setFormData({ ...formData, fill_correct: e.target.value })}
                    placeholder="مثال: ارتوى"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #0284c7' }}
                  />
                </div>
              )}

              {/* TYPE 4: ORDERING EVENTS */}
              {formData.question_type === 'ordering' && (
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '16px', borderRadius: '14px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '800', color: '#7e22ce', display: 'block', marginBottom: '8px' }}>
                    أحداث القصة بالترتيب الصحيح (من الأول للآخر):
                  </label>
                  {formData.ordering_events.map((ev, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '900', color: '#7e22ce' }}>{idx + 1}.</span>
                      <input
                        type="text"
                        value={ev}
                        onChange={(e) => {
                          const copy = [...formData.ordering_events];
                          copy[idx] = e.target.value;
                          setFormData({ ...formData, ordering_events: copy });
                        }}
                        style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ordering_events: [...formData.ordering_events, `حدث ${formData.ordering_events.length + 1}`] })}
                    style={{ background: '#e9d5ff', color: '#6b21a8', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}
                  >
                    + إضافة حدث جديد
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="hero-start-btn"
                  style={{ background: '#d97706', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: 'none' }}
                >
                  حفظ السؤال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
