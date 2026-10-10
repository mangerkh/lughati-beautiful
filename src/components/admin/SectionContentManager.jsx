import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Upload, 
  Volume2, Image as ImageIcon, Video, FileText, Link as LinkIcon, 
  HelpCircle, Check, X, AlertTriangle, File, Layers, Sparkles
} from 'lucide-react';

export default function SectionContentManager({ 
  lessonId, 
  sectionType, 
  sectionTitle, 
  token, 
  showToast, 
  openMediaPickerFor,
  onOpenStudentPreview,
  onContentUpdated
}) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Primary Form fields
  const [contentType, setContentType] = useState('text'); // text, heading, instructions, image, audio, video, question, file_link
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  
  // Sub-selectors
  const [questionType, setQuestionType] = useState('oral'); // oral, mcq, true_false, short_answer, open
  const [answerMode, setAnswerMode] = useState('audio'); // none, audio, text, audio_or_text, mcq, true_false, short_answer
  const [fileLinkType, setFileLinkType] = useState('file'); // file, link
  const [options, setOptions] = useState(['خيار 1', 'خيار 2', 'خيار 3']);
  const [correctAnswer, setCorrectAnswer] = useState('خيار 1');
  const [description, setDescription] = useState('');

  // Confirmation Delete Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  // Quick Preview Modal
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    if (lessonId && sectionType) {
      fetchContents();
    }
  }, [lessonId, sectionType]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAddEditModal) {
        setShowAddEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddEditModal]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/section-contents?lesson_id=${lessonId}&section_type=${sectionType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContents(data);
        if (onContentUpdated) onContentUpdated();
      }
    } catch (err) {
      console.error('Error fetching section contents:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setContentType('text');
    setTitle('');
    setContent('');
    setMediaUrl('');
    setIsVisible(true);
    setSortOrder(contents.length + 1);
    setQuestionType('oral');
    setAnswerMode('audio');
    setFileLinkType('file');
    setOptions(['خيار 1', 'خيار 2', 'خيار 3']);
    setCorrectAnswer('خيار 1');
    setDescription('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);

    let mainType = item.content_type || 'text';
    if (mainType === 'file' || mainType === 'link') {
      setFileLinkType(mainType);
      mainType = 'file_link';
    }
    setContentType(mainType);

    setTitle(item.title || '');
    setContent(item.content || '');
    setMediaUrl(item.media_url || '');
    setIsVisible(item.is_visible === 1);
    setSortOrder(item.sort_order || 1);

    let extra = {};
    if (item.extra_data) {
      try {
        extra = typeof item.extra_data === 'string' ? JSON.parse(item.extra_data) : item.extra_data;
      } catch (e) {}
    }

    const qType = extra.question_type || 'oral';
    setQuestionType(qType);

    let defaultAnsMode = extra.answer_mode;
    if (!defaultAnsMode) {
      if (qType === 'oral') defaultAnsMode = 'audio';
      else if (qType === 'mcq') defaultAnsMode = 'mcq';
      else if (qType === 'true_false') defaultAnsMode = 'true_false';
      else if (qType === 'short_answer') defaultAnsMode = 'short_answer';
      else defaultAnsMode = 'text';
    }
    setAnswerMode(defaultAnsMode);

    setOptions(Array.isArray(extra.options) && extra.options.length > 0 ? extra.options : ['خيار 1', 'خيار 2', 'خيار 3']);
    setCorrectAnswer(extra.correct_answer || (extra.options ? extra.options[0] : 'خيار 1'));
    setDescription(extra.description || '');

    setShowAddEditModal(true);
  };

  const handleFileUpload = async (file, category = 'images') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch(`/api/admin/upload?category=${category}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.fileUrl || data.url;
        setMediaUrl(uploadedUrl);
        if (showToast) showToast('تم رفع الملف بنجاح ✅');
      } else {
        if (showToast) showToast('تعذر رفع الملف');
      }
    } catch (err) {
      if (showToast) showToast('تعذر رفع الملف');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();

    const finalContentType = editingItem 
      ? (editingItem.content_type || (contentType === 'file_link' ? fileLinkType : contentType))
      : (contentType === 'file_link' ? fileLinkType : contentType);

    if (!title && !['image', 'audio', 'video'].includes(finalContentType)) {
      if (showToast) showToast(finalContentType === 'question' ? 'يرجى كتابة نص السؤال' : finalContentType === 'vocabulary' ? 'يرجى كتابة الكلمة' : 'يرجى كتابة العنوان أو المحتوى');
      return;
    }

    const extraDataObj = {
      description,
      question_type: questionType,
      answer_mode: answerMode,
      options: finalContentType === 'question' && questionType === 'mcq' ? options : (questionType === 'true_false' ? ['صح', 'خطأ'] : []),
      correct_answer: ['true_false', 'mcq', 'short_answer'].includes(questionType) ? correctAnswer : ''
    };

    const payload = {
      lesson_id: lessonId,
      section_type: sectionType,
      content_type: finalContentType,
      title: title || (finalContentType === 'image' ? 'صورة' : finalContentType === 'audio' ? 'صوت' : finalContentType === 'video' ? 'فيديو' : 'محتوى جديد'),
      content,
      media_url: mediaUrl,
      extra_data: JSON.stringify(extraDataObj),
      sort_order: sortOrder,
      is_visible: isVisible ? 1 : 0
    };

    try {
      const url = editingItem ? `/api/admin/section-contents/${editingItem.id}` : '/api/admin/section-contents';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (showToast) showToast(editingItem ? 'تم تحديث المحتوى بنجاح ✅' : 'تم إضافة المحتوى بنجاح ✅');
        setShowAddEditModal(false);
        fetchContents();
      } else {
        if (showToast) showToast('حدث خطأ أثناء حفظ المحتوى');
      }
    } catch (err) {
      if (showToast) showToast('تعذر الاتصال بالسيرفر');
    }
  };

  const handleToggleVisibility = async (item) => {
    try {
      const nextVisible = item.is_visible === 1 ? 0 : 1;
      const res = await fetch(`/api/admin/section-contents/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...item, is_visible: nextVisible })
      });
      if (res.ok) {
        if (showToast) showToast(nextVisible ? 'تم إظهار العنصر للطالبة 👁️' : 'تم إخفاء العنصر 🙈');
        fetchContents();
      }
    } catch (err) {}
  };

  const handleDeleteItem = async (item) => {
    try {
      const res = await fetch(`/api/admin/section-contents/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (showToast) showToast('تم حذف العنصر بنجاح ✅');
        setDeleteConfirmItem(null);
        fetchContents();
      }
    } catch (err) {}
  };

  const handleMoveOrder = async (index, direction) => {
    const newContents = [...contents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newContents.length) return;

    // Swap sort orders
    const tempOrder = newContents[index].sort_order;
    newContents[index].sort_order = newContents[targetIndex].sort_order;
    newContents[targetIndex].sort_order = tempOrder;

    // Swap elements in local list for fast UI response
    const tempItem = newContents[index];
    newContents[index] = newContents[targetIndex];
    newContents[targetIndex] = tempItem;

    setContents(newContents);

    // Save batch order to server
    try {
      const res = await fetch('/api/admin/section-contents/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: newContents.map((c, i) => ({ id: c.id, sort_order: i + 1 }))
        })
      });
      if (res.ok && onContentUpdated) {
        onContentUpdated();
      }
    } catch (e) {}
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'vocabulary': return <Sparkles size={20} color="#d97706" />;
      case 'image': return <ImageIcon size={20} color="#0284c7" />;
      case 'audio': return <Volume2 size={20} color="#d97706" />;
      case 'video': return <Video size={20} color="#7c3aed" />;
      case 'question': return <HelpCircle size={20} color="#dc2626" />;
      case 'instructions': return <Sparkles size={20} color="#059669" />;
      case 'heading': return <FileText size={20} color="#2563eb" />;
      case 'file': return <File size={20} color="#475569" />;
      case 'link': return <LinkIcon size={20} color="#0284c7" />;
      default: return <FileText size={20} color="#334155" />;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'vocabulary': return 'كلمة جديدة';
      case 'text': return 'نص';
      case 'heading': return 'عنوان';
      case 'instructions': return 'تعليمات';
      case 'image': return 'صورة';
      case 'audio': return 'صوت';
      case 'video': return 'فيديو';
      case 'question': return 'سؤال';
      case 'file': return 'ملف';
      case 'link': return 'رابط';
      default: return type;
    }
  };

  const getModalTitle = () => {
    if (!editingItem) return contentType === 'vocabulary' ? '✨ إضافة كلمة جديدة' : '➕ إضافة محتوى جديد للمهارة';

    const type = editingItem.content_type || contentType;
    switch (type) {
      case 'vocabulary': return '✨ تعديل كلمة جديدة';
      case 'question': return '✏️ تعديل سؤال';
      case 'image': return '✏️ تعديل صورة';
      case 'audio': return '✏️ تعديل صوت';
      case 'video': return '✏️ تعديل فيديو';
      case 'text': return '✏️ تعديل نص';
      case 'instructions': return '✏️ تعديل تعليمات';
      case 'heading': return '✏️ تعديل عنوان';
      case 'file':
      case 'link':
      case 'file_link': return '✏️ تعديل ملف / رابط';
      default: return '✏️ تعديل عنصر محتوى';
    }
  };

  const isSpeakingSection = sectionType === 'observe' || sectionType === 'speaking';

  // Compute dynamic scene numbers for image items in speaking/observe section
  let imageSceneCount = 0;
  const sceneNumberMap = {};
  if (isSpeakingSection) {
    contents.forEach((item) => {
      if (item.content_type === 'image') {
        imageSceneCount += 1;
        sceneNumberMap[item.id] = imageSceneCount;
      }
    });
  }

  return (
    <div className="content-box">
      {/* Skill Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#0284c7', margin: 0 }}>
            إدارة محتوى مهارة: {sectionTitle} 🛠️
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            يمكنكِ إضافة وتنسيق وترتيب محتوى هذه المهارة ليظهر للطالبات ديناميكياً.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onOpenStudentPreview && (
            <button
              onClick={onOpenStudentPreview}
              style={{
                background: '#ecfdf5', color: '#047857', border: '2px solid #a7f3d0',
                padding: '10px 18px', borderRadius: '14px', fontWeight: '800', fontSize: '15px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Eye size={18} />
              <span>معاينة للطالبة</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="hero-start-btn"
            style={{ background: '#0284c7', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            <span>+ إضافة محتوى</span>
          </button>
        </div>
      </div>

      {/* Content Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '800' }}>
          جاري تحميل المحتوى... ⏳
        </div>
      ) : contents.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
          <Sparkles size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#334155', marginBottom: '8px' }}>
            لا يوجد محتوى مضاف لهذه المهارة بعد
          </h3>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            اضغطي زر "+ إضافة محتوى" أعلاه للبدء بإضافة صورة، صوت، نص، أو أسئلة لهذه المهارة.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {contents.map((item, idx) => {
            let extra = {};
            if (item.extra_data) {
              try {
                extra = typeof item.extra_data === 'string' ? JSON.parse(item.extra_data) : item.extra_data;
              } catch (e) {}
            }

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: item.is_visible ? '2px solid #e2e8f0' : '2px solid #fed7aa',
                  opacity: item.is_visible ? 1 : 0.75,
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Right Side Info */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexGrow: 1, minWidth: '280px' }}>
                  {/* Sort Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      style={{
                        background: idx === 0 ? '#f1f5f9' : '#e0f2fe',
                        color: idx === 0 ? '#cbd5e1' : '#0284c7',
                        border: 'none', borderRadius: '8px', padding: '4px', cursor: idx === 0 ? 'default' : 'pointer'
                      }}
                      title="أعلى"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#64748b' }}>#{idx + 1}</span>
                    <button
                      disabled={idx === contents.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      style={{
                        background: idx === contents.length - 1 ? '#f1f5f9' : '#e0f2fe',
                        color: idx === contents.length - 1 ? '#cbd5e1' : '#0284c7',
                        border: 'none', borderRadius: '8px', padding: '4px', cursor: idx === contents.length - 1 ? 'default' : 'pointer'
                      }}
                      title="أسفل"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  {/* Icon & Details */}
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#334155' }}>
                        {getContentIcon(item.content_type)}
                        <span>{getTypeName(item.content_type)}</span>
                      </span>

                      {/* Scene Badge for Speaking / Observe skill */}
                      {isSpeakingSection && item.content_type === 'image' && sceneNumberMap[item.id] && (
                        <span style={{
                          background: '#0284c7',
                          color: 'white',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          fontWeight: '900',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                        }}>
                          🎬 مشهد {sceneNumberMap[item.id]}
                        </span>
                      )}

                      <span style={{
                        padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '800',
                        background: item.is_visible ? '#d1fae5' : '#fee2e2',
                        color: item.is_visible ? '#065f46' : '#991b1b'
                      }}>
                        {item.is_visible ? '☑ يظهر للطالبة' : '🙈 مخفي'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: '0 0 6px 0' }}>
                      {item.title}
                    </h4>

                    {item.content_type === 'vocabulary' && (
                      <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: '12px', padding: '10px 14px', marginTop: '6px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#78350f' }}>{item.title}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#b45309', marginTop: '2px' }}>المعنى: {item.content}</div>
                      </div>
                    )}

                    {/* Brief Preview */}
                    {item.content && item.content_type !== 'vocabulary' && (
                      <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 8px 0', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.content}
                      </p>
                    )}

                    {item.content_type === 'image' && item.media_url && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={item.media_url} alt={item.title} style={{ height: '70px', borderRadius: '12px', border: '1px solid #cbd5e1', objectFit: 'cover' }} />
                      </div>
                    )}

                    {item.content_type === 'audio' && item.media_url && (
                      <div style={{ marginTop: '8px', maxWidth: '360px' }}>
                        <audio controls src={item.media_url} style={{ width: '100%', height: '36px' }} />
                      </div>
                    )}

                    {item.content_type === 'video' && item.media_url && (
                      <div style={{ marginTop: '8px' }}>
                        <video controls src={item.media_url} style={{ height: '90px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                      </div>
                    )}

                    {item.content_type === 'question' && (
                      <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '10px', marginTop: '6px', fontSize: '14px', fontWeight: '700', color: '#9d174d' }}>
                        <div>السؤال: {item.title || item.content}</div>
                        {extra.options && extra.options.length > 0 && (
                          <div style={{ fontSize: '13px', color: '#be185d', marginTop: '4px' }}>
                            الخيارات: {extra.options.join(' | ')}
                          </div>
                        )}
                        {extra.correct_answer && (
                          <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px' }}>
                            الإجابة الصحيحة: {extra.correct_answer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Left Side Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPreviewItem(item)}
                    style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={15} />
                    <span>معاينة</span>
                  </button>

                  <button
                    onClick={() => handleToggleVisibility(item)}
                    style={{
                      background: item.is_visible ? '#fff7ed' : '#ecfdf5',
                      color: item.is_visible ? '#c2410c' : '#047857',
                      border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {item.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{item.is_visible ? 'إخفاء' : 'إظهار'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(item)}
                    style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit size={15} />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={15} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Content Modal */}
      {showAddEditModal && (
        <div className="feedback-modal" style={{ zIndex: 1500 }}>
          <div className="feedback-card" style={{ maxWidth: '650px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '22px', fontWeight: '900', color: '#0284c7', margin: 0 }}>
                {getModalTitle()}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Render Content Type Selector ONLY in ADD MODE */}
              {!editingItem && (
                <div>
                  <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                    اختاري نوع المحتوى:
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setContentType(newType);
                      if (newType === 'question') {
                        setQuestionType('oral');
                        setAnswerMode('audio');
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800', background: 'white' }}
                  >
                    <option value="heading">📌 عنوان</option>
                    <option value="text">📝 نص / شرح</option>
                    {sectionType === 'reading' && (
                      <option value="vocabulary">✨ كلمة جديدة</option>
                    )}
                    <option value="instructions">📋 تعليمات</option>
                    <option value="image">🖼️ صورة</option>
                    <option value="audio">🎧 صوت</option>
                    <option value="video">🎬 فيديو</option>
                    <option value="question">❓ سؤال</option>
                    <option value="file_link">📎 ملف / رابط</option>
                  </select>
                </div>
              )}

              {/* VOCABULARY FIELDS: Word & Meaning ONLY */}
              {contentType === 'vocabulary' && (
                <>
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                      1. الكلمة:
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: عَطِشَ"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '18px', fontWeight: '800' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                      2. المعنى:
                    </label>
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="مثال: احتاج إلى الماء."
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '700' }}
                      required
                    />
                  </div>
                </>
              )}

              {/* QUESTION FIELDS CONTAINER */}
              {contentType === 'question' && (
                <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '16px', border: '2px solid #fecdd3', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Sub-question Type Dropdown */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '6px' }}>
                      نوع السؤال:
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setQuestionType(newType);
                        if (newType === 'oral') setAnswerMode('audio');
                        else if (newType === 'mcq') setAnswerMode('mcq');
                        else if (newType === 'true_false') setAnswerMode('true_false');
                        else if (newType === 'short_answer') setAnswerMode('short_answer');
                        else if (newType === 'open') setAnswerMode('text');
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #fda4af', fontSize: '15px', fontWeight: '800', background: 'white' }}
                    >
                      <option value="oral">💬 سؤال شفوي</option>
                      <option value="mcq">🔘 اختيار من متعدد</option>
                      <option value="true_false">☑️ صح / خطأ</option>
                      <option value="short_answer">✏️ إجابة قصيرة</option>
                      <option value="open">📝 سؤال مفتوح</option>
                    </select>
                  </div>

                  {/* Question Text Field */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '6px' }}>
                      نص السؤال:
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="اكتبي نص السؤال هنا..."
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #fda4af', fontSize: '15px', fontWeight: '800' }}
                      required
                    />
                  </div>

                  {/* Short Answer: Model / Correct Answer */}
                  {questionType === 'short_answer' && (
                    <div>
                      <label style={{ fontWeight: '900', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '6px' }}>
                        الإجابة النموذجيّة أو الصحيحة (اختياري):
                      </label>
                      <input
                        type="text"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="اكتبي الإجابة النموذجية..."
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fda4af', fontSize: '14px', background: 'white' }}
                      />
                    </div>
                  )}

                  {/* MCQ: Options & Correct Answer Selector */}
                  {questionType === 'mcq' && (
                    <div style={{ background: 'white', padding: '14px', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                      <label style={{ fontWeight: '900', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '8px' }}>
                        الخيارات المتاحة (حددي الإجابة الصحيحة):
                      </label>
                      {options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <input
                            type="radio"
                            name="correct_answer_radio"
                            checked={correctAnswer === opt}
                            onChange={() => setCorrectAnswer(opt)}
                            title="تحديد كإجابة صحيحة"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...options];
                              newOpts[oIdx] = e.target.value;
                              setOptions(newOpts);
                              if (correctAnswer === opt) setCorrectAnswer(e.target.value);
                            }}
                            placeholder={`خيار ${oIdx + 1}`}
                            style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setOptions(options.filter((_, i) => i !== oIdx))}
                              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setOptions([...options, `خيار ${options.length + 1}`])}
                        style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' }}
                      >
                        + إضافة خيار جديد
                      </button>
                    </div>
                  )}

                  {/* True/False: Correct Answer Selector */}
                  {questionType === 'true_false' && (
                    <div>
                      <label style={{ fontWeight: '800', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '6px' }}>
                        الإجابة الصحيحة:
                      </label>
                      <select
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fda4af', fontSize: '14px', fontWeight: '800', background: 'white' }}
                      >
                        <option value="صح">صح ✅</option>
                        <option value="خطأ">خطأ ❌</option>
                      </select>
                    </div>
                  )}

                  {/* Student Answer Method Field */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '14px', color: '#9f1239', display: 'block', marginBottom: '6px' }}>
                      طريقة إجابة الطالبة:
                    </label>
                    <select
                      value={answerMode}
                      onChange={(e) => setAnswerMode(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #fda4af', fontSize: '15px', fontWeight: '800', background: 'white' }}
                    >
                      <option value="none">🚫 بدون إجابة (عرض فقط)</option>
                      <option value="audio">🎙️ تسجيل صوتي</option>
                      <option value="text">✏️ إجابة كتابية (Textarea)</option>
                      <option value="handwritten">📷 ارفع بخط يدك (رفع صورة)</option>
                      <option value="flexible">🎙️✏️📷 صوت أو كتابة أو خط يد (خيار مرن)</option>
                      <option value="mcq">🔘 اختيار من متعدد</option>
                      <option value="true_false">☑️ صح / خطأ</option>
                      <option value="short_answer">📝 إجابة قصيرة</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STANDARD CONTENT TYPES (text, heading, instructions, image, audio, video, file_link) */}
              {!['vocabulary', 'question'].includes(contentType) && (
                <>
                  {/* Title / Description Field */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                      العنوان / الوصف المختصر:
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        contentType === 'image' ? 'مثال: صورة القصة' :
                        contentType === 'audio' ? 'مثال: التسجيل الصوتي للنص' :
                        contentType === 'video' ? 'مثال: فيديو توضيحي' :
                        contentType === 'file_link' ? 'مثال: ورقة عمل الدرس' :
                        'مثال: عنوان الفقرة / استمعي جيداً...'
                      }
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '700' }}
                    />
                  </div>

                  {/* Text / Instructions / Heading Fields */}
                  {['text', 'instructions', 'heading'].includes(contentType) && (
                    <div>
                      <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                        محتوى النص:
                      </label>
                      <textarea
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="اكتبي النص هنا..."
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', lineHeight: '1.7' }}
                      />
                    </div>
                  )}

                  {/* 1. IMAGE CONTENT TYPE PANEL */}
                  {contentType === 'image' && (
                    <div style={{ background: '#f0f9ff', padding: '18px', borderRadius: '16px', border: '2px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#0369a1', display: 'block', margin: 0 }}>
                        🖼️ إدارة الصورة:
                      </label>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <label className="hero-start-btn" style={{ background: '#0284c7', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Upload size={16} />
                          <span>رفع صورة جديدة</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], 'images');
                              }
                            }} 
                            style={{ display: 'none' }} 
                          />
                        </label>

                        {openMediaPickerFor && (
                          <button
                            type="button"
                            className="hero-start-btn"
                            style={{ background: '#d97706', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              openMediaPickerFor((selectedUrl) => {
                                setMediaUrl(selectedUrl);
                                if (showToast) showToast('تم اختيار الصورة من المكتبة ✅');
                              });
                            }}
                          >
                            <span>🖼️ اختيار من مكتبة الوسائط</span>
                          </button>
                        )}
                      </div>

                      {/* Current Image Preview */}
                      {mediaUrl ? (
                        <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', width: '100%' }}>
                            معاينة الصورة الحالية:
                          </div>
                          <img 
                            src={mediaUrl} 
                            alt="معاينة الصورة" 
                            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left', width: '100%' }}>
                            {mediaUrl}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700', fontStyle: 'italic' }}>
                          لم يتم اختيار صورة بعد. اضغطي رفع صورة جديدة أو اختيار من المكتبة.
                        </div>
                      )}

                      {/* Optional Image Description */}
                      <div>
                        <label style={{ fontWeight: '800', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                          وصف الصورة (اختياري):
                        </label>
                        <input
                          type="text"
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setDescription(e.target.value);
                          }}
                          placeholder="وصف مختصر ينوب عن الصورة أو يشرحها..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. AUDIO CONTENT TYPE PANEL */}
                  {contentType === 'audio' && (
                    <div style={{ background: '#fff7ed', padding: '18px', borderRadius: '16px', border: '2px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#c2410c', display: 'block', margin: 0 }}>
                        🎧 إدارة الملف الصوتي:
                      </label>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <label className="hero-start-btn" style={{ background: '#ea580c', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Upload size={16} />
                          <span>رفع ملف صوتي</span>
                          <input 
                            type="file" 
                            accept="audio/mp3,audio/wav,audio/m4a,audio/*,.mp3,.wav,.m4a" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], 'audio');
                              }
                            }} 
                            style={{ display: 'none' }} 
                          />
                        </label>

                        {openMediaPickerFor && (
                          <button
                            type="button"
                            className="hero-start-btn"
                            style={{ background: '#d97706', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              openMediaPickerFor((selectedUrl) => {
                                setMediaUrl(selectedUrl);
                                if (showToast) showToast('تم اختيار الملف الصوتي من المكتبة ✅');
                              });
                            }}
                          >
                            <span>🎵 اختيار من مكتبة الوسائط</span>
                          </button>
                        )}
                      </div>

                      {/* Current Audio Preview */}
                      {mediaUrl ? (
                        <div style={{ background: 'white', padding: '14px', borderRadius: '14px', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#c2410c' }}>
                            معاينة الملف الصوتي الحالي (Audio Preview):
                          </div>
                          <audio controls src={mediaUrl} style={{ width: '100%', height: '40px' }} />
                          <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left' }}>
                            {mediaUrl}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700', fontStyle: 'italic' }}>
                          لم يتم اختيار ملف صوتي بعد (الصيغ المقبولة: MP3, WAV, M4A).
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. VIDEO CONTENT TYPE PANEL */}
                  {contentType === 'video' && (
                    <div style={{ background: '#f3e8ff', padding: '18px', borderRadius: '16px', border: '2px solid #d8b4fe', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#6b21a8', display: 'block', margin: 0 }}>
                        🎬 إدارة الفيديو:
                      </label>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <label className="hero-start-btn" style={{ background: '#7c3aed', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Upload size={16} />
                          <span>رفع فيديو جديد</span>
                          <input 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], 'video');
                              }
                            }} 
                            style={{ display: 'none' }} 
                          />
                        </label>

                        {openMediaPickerFor && (
                          <button
                            type="button"
                            className="hero-start-btn"
                            style={{ background: '#d97706', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              openMediaPickerFor((selectedUrl) => {
                                setMediaUrl(selectedUrl);
                                if (showToast) showToast('تم اختيار الفيديو من المكتبة ✅');
                              });
                            }}
                          >
                            <span>🎬 اختيار من مكتبة الوسائط</span>
                          </button>
                        )}
                      </div>

                      {/* Current Video Preview */}
                      {mediaUrl ? (
                        <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#6b21a8', width: '100%' }}>
                            معاينة الفيديو الحالي (Video Preview):
                          </div>
                          <video 
                            controls 
                            src={mediaUrl} 
                            style={{ maxHeight: '220px', width: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#000' }} 
                          />
                          <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left', width: '100%' }}>
                            {mediaUrl}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700', fontStyle: 'italic' }}>
                          لم يتم اختيار فيديو بعد.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. FILE / LINK CONTENT TYPE PANEL */}
                  {contentType === 'file_link' && (
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', margin: 0 }}>
                        📎 نوع المرفق / الرابط:
                      </label>

                      {/* Sub-choice Radio options */}
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', color: '#0369a1' }}>
                          <input
                            type="radio"
                            name="file_link_radio"
                            value="file"
                            checked={fileLinkType === 'file'}
                            onChange={() => setFileLinkType('file')}
                            style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                          />
                          <span>📄 ملف</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', color: '#059669' }}>
                          <input
                            type="radio"
                            name="file_link_radio"
                            value="link"
                            checked={fileLinkType === 'link'}
                            onChange={() => setFileLinkType('link')}
                            style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                          />
                          <span>🔗 رابط خارجي</span>
                        </label>
                      </div>

                      {/* If File selected */}
                      {fileLinkType === 'file' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <label className="hero-start-btn" style={{ background: '#0284c7', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Upload size={16} />
                              <span>رفع ملف</span>
                              <input 
                                type="file" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(e.target.files[0], 'pdf');
                                  }
                                }} 
                                style={{ display: 'none' }} 
                              />
                            </label>

                            {openMediaPickerFor && (
                              <button
                                type="button"
                                className="hero-start-btn"
                                style={{ background: '#d97706', color: 'white', padding: '9px 18px', fontSize: '14px', boxShadow: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => {
                                  openMediaPickerFor((selectedUrl) => {
                                    setMediaUrl(selectedUrl);
                                    if (showToast) showToast('تم اختيار الملف من المكتبة ✅');
                                  });
                                }}
                              >
                                <span>📄 اختيار من مكتبة الوسائط</span>
                              </button>
                            )}
                          </div>

                          <div>
                            <label style={{ fontWeight: '800', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                              مسار الملف المرفق:
                            </label>
                            <input
                              type="text"
                              value={mediaUrl}
                              onChange={(e) => setMediaUrl(e.target.value)}
                              placeholder="/uploads/pdf/example.pdf"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14px', direction: 'ltr', textAlign: 'left' }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* If Link selected */
                        <div>
                          <label style={{ fontWeight: '800', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                            رابط URL الخارجي:
                          </label>
                          <input
                            type="text"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="https://example.com/page"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14px', direction: 'ltr', textAlign: 'left' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Visibility Checkbox */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="is_visible_chk"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="is_visible_chk" style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', cursor: 'pointer' }}>
                  ☑ يظهر للطالبة في الواجهة
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="teacher-login-btn" onClick={() => setShowAddEditModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="hero-start-btn" style={{ background: '#0284c7', color: 'white', padding: '10px 28px', fontSize: '16px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}>
                  💾 حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      {deleteConfirmItem && (
        <div className="feedback-modal" style={{ zIndex: 1600 }}>
          <div className="feedback-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>تأكيد الحذف</h3>
            <p style={{ fontSize: '16px', color: '#64748b', margin: '12px 0 24px 0' }}>
              هل تريد حذف هذا العنصر؟ ({deleteConfirmItem.title})
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="hero-start-btn"
                style={{ background: '#ef4444', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: 'none' }}
                onClick={() => handleDeleteItem(deleteConfirmItem)}
              >
                نعم، احذف
              </button>
              <button className="teacher-login-btn" onClick={() => setDeleteConfirmItem(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Item Preview Modal */}
      {previewItem && (
        <div className="feedback-modal" style={{ zIndex: 1600 }}>
          <div className="feedback-card" style={{ maxWidth: '520px', width: '90%', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', margin: 0 }}>
                معاينة العنصر: {previewItem.title}
              </h3>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '20px' }}>
              {previewItem.content_type === 'image' && previewItem.media_url && (
                <img src={previewItem.media_url} alt={previewItem.title} style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px' }} />
              )}

              {previewItem.content_type === 'audio' && previewItem.media_url && (
                <audio controls src={previewItem.media_url} style={{ width: '100%' }} />
              )}

              {previewItem.content_type === 'video' && previewItem.media_url && (
                <video controls src={previewItem.media_url} style={{ width: '100%', maxHeight: '250px', borderRadius: '12px' }} />
              )}

              {previewItem.content && (
                <div style={{ fontSize: '17px', color: '#1e293b', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                  {previewItem.content}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="teacher-login-btn" onClick={() => setPreviewItem(null)}>
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
