import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, 
  Check, X, Sparkles, BookOpenCheck, HelpCircle
} from 'lucide-react';

const DEFAULT_LESSON_4_ITEMS = {
  true_false: [
    { id: 'tf_1', statement: 'وجد الغراب جرةً فيها ماء.', answer: 'صح', is_visible: 1, sort_order: 1 },
    { id: 'tf_2', statement: 'استطاع الغراب الوصول إلى الماء بمنقاره بسهولة.', answer: 'خطأ', is_visible: 1, sort_order: 2 },
    { id: 'tf_3', statement: 'ألقى الغراب الحجارة في الجرة فارتفع الماء.', answer: 'صح', is_visible: 1, sort_order: 3 }
  ],
  fill_blank: [
    { id: 'fb_1', question: 'عطش الغراب فأخذ يبحث عن ________.', answer: 'الماء', is_visible: 1, sort_order: 1 },
    { id: 'fb_2', question: 'وجد الغراب ________ فيها ماء.', answer: 'جرة', is_visible: 1, sort_order: 2 },
    { id: 'fb_3', question: 'ألقى الغراب ________ في الجرة.', answer: 'الحجارة', is_visible: 1, sort_order: 3 }
  ],
  multiple_choice: [
    { id: 'mc_1', question: 'كان يوم الصيف ________.', options: ['بارداً', 'حاراً', 'ممطراً'], answer: 'حاراً', is_visible: 1, sort_order: 1 },
    { id: 'mc_2', question: 'وجد الغراب حجارة ________.', options: ['صغيرة', 'كبيرة جداً', 'ملونة'], answer: 'صغيرة', is_visible: 1, sort_order: 2 },
    { id: 'mc_3', question: 'شرب الغراب حتى ________.', options: ['ارتوى', 'نام', 'طار'], answer: 'ارتوى', is_visible: 1, sort_order: 3 }
  ]
};

const DRILL_CATEGORIES_CONFIG = [
  {
    type: 'true_false',
    title: '✅ صح أم خطأ',
    instructions: 'اقرئي العبارات، ثم اختاري صح أو خطأ.',
    color: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  {
    type: 'fill_blank',
    title: '✏️ أكمل الفراغ',
    instructions: 'أكملي الجملة بالكلمة المناسبة.',
    color: '#0369a1',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd'
  },
  {
    type: 'multiple_choice',
    title: '🔤 اختاري الكلمة المناسبة',
    instructions: 'اختاري الكلمة الصحيحة لإكمال الجملة.',
    color: '#6b21a8',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff'
  }
];

export default function ReviewDrillsManager({ 
  lessonId, 
  token, 
  showToast, 
  onOpenStudentPreview,
  onContentUpdated 
}) {
  const [loading, setLoading] = useState(false);
  const [drillsData, setDrillsData] = useState([]);
  
  // Modal states
  const [activeModalType, setActiveModalType] = useState(null); // 'true_false', 'fill_blank', 'multiple_choice'
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Form Fields - True / False
  const [tfStatement, setTfStatement] = useState('');
  const [tfAnswer, setTfAnswer] = useState('صح');
  const [tfIsVisible, setTfIsVisible] = useState(true);

  // Form Fields - Fill in the Blank
  const [fbQuestion, setFbQuestion] = useState('');
  const [fbAnswer, setFbAnswer] = useState('');
  const [fbIsVisible, setFbIsVisible] = useState(true);

  // Form Fields - Multiple Choice
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['خيار 1', 'خيار 2', 'خيار 3']);
  const [mcqAnswer, setMcqAnswer] = useState('خيار 1');
  const [mcqIsVisible, setMcqIsVisible] = useState(true);

  useEffect(() => {
    if (lessonId) {
      fetchDrills();
    }
  }, [lessonId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModalType) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalType]);

  const fetchDrills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/section-contents?lesson_id=${lessonId}&section_type=activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const rawContents = await res.json();
        
        // Map raw contents into 3 fixed drill categories
        const mappedDrills = DRILL_CATEGORIES_CONFIG.map(config => {
          const existingRow = rawContents.find(c => {
            let extra = {};
            try {
              extra = typeof c.extra_data === 'string' ? JSON.parse(c.extra_data || '{}') : (c.extra_data || {});
            } catch (e) {}

            const drillType = extra.drill_type || extra.question_type;
            if (drillType === config.type) return true;
            if (config.type === 'true_false' && (c.title?.includes('صح') || c.title?.includes('خطأ'))) return true;
            if (config.type === 'fill_blank' && (c.title?.includes('أكمل') || c.title?.includes('الفراغ'))) return true;
            if (config.type === 'multiple_choice' && c.title?.includes('اختر')) return true;
            return false;
          });

          let items = [];
          if (existingRow) {
            let extra = {};
            try {
              extra = typeof existingRow.extra_data === 'string' ? JSON.parse(existingRow.extra_data || '{}') : (existingRow.extra_data || {});
            } catch (e) {}
            items = extra.items || [];
          } else if (Number(lessonId) === 4) {
            // Fallback for Lesson 4 initial seed
            items = DEFAULT_LESSON_4_ITEMS[config.type] || [];
          }

          return {
            rowId: existingRow ? existingRow.id : null,
            type: config.type,
            title: existingRow?.title || config.title,
            instructions: existingRow?.content || config.instructions,
            sort_order: existingRow?.sort_order || 1,
            is_visible: existingRow ? existingRow.is_visible : 1,
            items: items.map((it, idx) => ({
              ...it,
              id: it.id || `item_${Date.now()}_${idx}`,
              is_visible: it.is_visible ?? 1,
              sort_order: it.sort_order || idx + 1
            }))
          };
        });

        setDrillsData(mappedDrills);
      }
    } catch (err) {
      console.error('Error fetching review drills:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveCategoryToBackend = async (categoryData) => {
    try {
      const extraDataObj = {
        question_type: categoryData.type,
        drill_type: categoryData.type,
        items: categoryData.items
      };

      const payload = {
        lesson_id: lessonId,
        section_type: 'activities',
        content_type: 'question',
        title: categoryData.title,
        content: categoryData.instructions,
        extra_data: JSON.stringify(extraDataObj),
        sort_order: categoryData.sort_order || 1,
        is_visible: categoryData.is_visible ?? 1
      };

      let res;
      if (categoryData.rowId) {
        res = await fetch(`/api/admin/section-contents/${categoryData.rowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/section-contents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        if (showToast) showToast('تم حفظ التعديلات بنجاح ✅');
        fetchDrills();
        if (onContentUpdated) onContentUpdated();
      }
    } catch (err) {
      console.error('Error saving review drill category:', err);
      if (showToast) showToast('حدث خطأ أثناء الحفظ ❌');
    }
  };

  const closeModal = () => {
    setActiveModalType(null);
    setEditingItem(null);
    // Reset inputs
    setTfStatement('');
    setTfAnswer('صح');
    setTfIsVisible(true);

    setFbQuestion('');
    setFbAnswer('');
    setFbIsVisible(true);

    setMcqQuestion('');
    setMcqOptions(['خيار 1', 'خيار 2', 'خيار 3']);
    setMcqAnswer('خيار 1');
    setMcqIsVisible(true);
  };

  const openAddModal = (drillType) => {
    setEditingItem(null);
    if (drillType === 'true_false') {
      setTfStatement('');
      setTfAnswer('صح');
      setTfIsVisible(true);
    } else if (drillType === 'fill_blank') {
      setFbQuestion('');
      setFbAnswer('');
      setFbIsVisible(true);
    } else if (drillType === 'multiple_choice') {
      setMcqQuestion('');
      setMcqOptions(['خيار 1', 'خيار 2', 'خيار 3']);
      setMcqAnswer('خيار 1');
      setMcqIsVisible(true);
    }
    setActiveModalType(drillType);
  };

  const openEditModal = (drillType, item) => {
    setEditingItem(item);
    if (drillType === 'true_false') {
      setTfStatement(item.statement || item.question || '');
      setTfAnswer(item.answer || 'صح');
      setTfIsVisible(item.is_visible !== 0);
    } else if (drillType === 'fill_blank') {
      setFbQuestion(item.question || '');
      setFbAnswer(item.answer || '');
      setFbIsVisible(item.is_visible !== 0);
    } else if (drillType === 'multiple_choice') {
      setMcqQuestion(item.question || '');
      const opts = Array.isArray(item.options) && item.options.length > 0 ? item.options : ['خيار 1', 'خيار 2', 'خيار 3'];
      setMcqOptions(opts);
      setMcqAnswer(item.answer || opts[0] || '');
      setMcqIsVisible(item.is_visible !== 0);
    }
    setActiveModalType(drillType);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!activeModalType) return;

    const catIndex = drillsData.findIndex(d => d.type === activeModalType);
    if (catIndex === -1) return;

    const currentCat = { ...drillsData[catIndex] };
    let newItems = [...(currentCat.items || [])];

    if (activeModalType === 'true_false') {
      if (!tfStatement.trim()) {
        alert('يرجى كتابة نص العبارة');
        return;
      }
      const itemObj = {
        id: editingItem ? editingItem.id : `tf_${Date.now()}`,
        statement: tfStatement.trim(),
        answer: tfAnswer,
        is_visible: tfIsVisible ? 1 : 0,
        sort_order: editingItem ? (editingItem.sort_order || 1) : newItems.length + 1
      };

      if (editingItem) {
        newItems = newItems.map(it => it.id === editingItem.id ? itemObj : it);
      } else {
        newItems.push(itemObj);
      }
    } else if (activeModalType === 'fill_blank') {
      if (!fbQuestion.trim()) {
        alert('يرجى كتابة نص الجملة');
        return;
      }
      if (!fbAnswer.trim()) {
        alert('يرجى كتابة الإجابة الصحيحة');
        return;
      }
      const itemObj = {
        id: editingItem ? editingItem.id : `fb_${Date.now()}`,
        question: fbQuestion.trim(),
        answer: fbAnswer.trim(),
        is_visible: fbIsVisible ? 1 : 0,
        sort_order: editingItem ? (editingItem.sort_order || 1) : newItems.length + 1
      };

      if (editingItem) {
        newItems = newItems.map(it => it.id === editingItem.id ? itemObj : it);
      } else {
        newItems.push(itemObj);
      }
    } else if (activeModalType === 'multiple_choice') {
      if (!mcqQuestion.trim()) {
        alert('يرجى كتابة نص السؤال');
        return;
      }
      const validOptions = mcqOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        alert('يرجى إدخال خيارين على الأقل');
        return;
      }

      const itemObj = {
        id: editingItem ? editingItem.id : `mc_${Date.now()}`,
        question: mcqQuestion.trim(),
        options: validOptions,
        answer: mcqAnswer || validOptions[0],
        is_visible: mcqIsVisible ? 1 : 0,
        sort_order: editingItem ? (editingItem.sort_order || 1) : newItems.length + 1
      };

      if (editingItem) {
        newItems = newItems.map(it => it.id === editingItem.id ? itemObj : it);
      } else {
        newItems.push(itemObj);
      }
    }

    currentCat.items = newItems;
    closeModal();
    await saveCategoryToBackend(currentCat);
  };

  const handleToggleItemVisibility = async (drillType, itemId) => {
    const cat = drillsData.find(d => d.type === drillType);
    if (!cat) return;

    const updatedItems = cat.items.map(it => {
      if (it.id === itemId) {
        return { ...it, is_visible: it.is_visible === 1 ? 0 : 1 };
      }
      return it;
    });

    const updatedCat = { ...cat, items: updatedItems };
    await saveCategoryToBackend(updatedCat);
  };

  const handleDeleteItem = async (drillType, itemId) => {
    const cat = drillsData.find(d => d.type === drillType);
    if (!cat) return;

    const updatedItems = cat.items.filter(it => it.id !== itemId);
    const updatedCat = { ...cat, items: updatedItems };
    setDeleteConfirmItem(null);
    await saveCategoryToBackend(updatedCat);
  };

  const handleMoveItem = async (drillType, index, direction) => {
    const cat = drillsData.find(d => d.type === drillType);
    if (!cat) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cat.items.length) return;

    const newItems = [...cat.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update sort_order
    newItems.forEach((it, idx) => {
      it.sort_order = idx + 1;
    });

    const updatedCat = { ...cat, items: newItems };
    await saveCategoryToBackend(updatedCat);
  };

  // Helper for adding/removing MCQ option fields
  const handleOptionChange = (idx, value) => {
    const newOptions = [...mcqOptions];
    newOptions[idx] = value;
    setMcqOptions(newOptions);
    if (mcqAnswer === mcqOptions[idx]) {
      setMcqAnswer(value);
    }
  };

  const handleAddOptionField = () => {
    setMcqOptions([...mcqOptions, `خيار ${mcqOptions.length + 1}`]);
  };

  const handleRemoveOptionField = (idx) => {
    if (mcqOptions.length <= 2) {
      alert('يجب الإبقاء على خيارين على الأقل');
      return;
    }
    const removedVal = mcqOptions[idx];
    const newOptions = mcqOptions.filter((_, i) => i !== idx);
    setMcqOptions(newOptions);
    if (mcqAnswer === removedVal) {
      setMcqAnswer(newOptions[0] || '');
    }
  };

  return (
    <div className="content-box">
      {/* Top Bar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '20px',
        border: '2px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpenCheck size={32} color="#16a34a" />
          <div>
            <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              إدارة أسئلة "أتدرب وأراجع"
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '700' }}>
              إدارة التدريبات الثلاثة المخصصة للدرس دون استخدام CMS العام
            </p>
          </div>
        </div>

        {onOpenStudentPreview && (
          <button
            onClick={onOpenStudentPreview}
            className="hero-start-btn"
            style={{ fontSize: '15px', padding: '10px 20px', background: '#16a34a', color: 'white' }}
          >
            <Eye size={18} />
            <span>معاينة واجهة الطالبة 👁️</span>
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', fontWeight: '800', color: '#64748b' }}>
          جاري تحميل التدريبات... ⏳
        </div>
      )}

      {/* 3 Main Fixed Drill Categories */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {DRILL_CATEGORIES_CONFIG.map(config => {
            const catData = drillsData.find(d => d.type === config.type) || { items: [] };
            const items = catData.items || [];

            return (
              <div
                key={config.type}
                style={{
                  background: config.bgColor,
                  border: `3px solid ${config.borderColor}`,
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.03)'
                }}
              >
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  borderBottom: `2px dashed ${config.borderColor}`,
                  paddingBottom: '16px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', color: config.color, margin: 0 }}>
                      {config.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}>
                      💡 {config.instructions}
                    </div>
                  </div>

                  <button
                    onClick={() => openAddModal(config.type)}
                    className="hero-start-btn"
                    style={{
                      background: config.color,
                      color: 'white',
                      fontSize: '15px',
                      padding: '10px 20px',
                      boxShadow: 'none'
                    }}
                  >
                    <Plus size={20} />
                    <span>إضافة سؤال</span>
                  </button>
                </div>

                {/* Question Items List */}
                {items.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    background: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    color: '#64748b',
                    fontWeight: '800'
                  }}>
                    لا يوجد أسئلة حالياً في هذا القسم. اضغطي على زر [ + إضافة سؤال ] لإضافة سؤال جديد 🌸
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map((item, idx) => {
                      const isVisible = item.is_visible !== 0;

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: isVisible ? 'white' : '#f8fafc',
                            border: `2px solid ${isVisible ? '#e2e8f0' : '#cbd5e1'}`,
                            borderRadius: '18px',
                            padding: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            opacity: isVisible ? 1 : 0.65,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Item Content Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>
                              {idx + 1}. {config.type === 'true_false' ? item.statement : item.question}
                            </div>

                            {/* Options Display for MCQ */}
                            {config.type === 'multiple_choice' && Array.isArray(item.options) && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {item.options.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    style={{
                                      background: opt === item.answer ? '#f3e8ff' : '#f1f5f9',
                                      border: `1.5px solid ${opt === item.answer ? '#c084fc' : '#cbd5e1'}`,
                                      color: opt === item.answer ? '#7e22ce' : '#475569',
                                      padding: '3px 10px',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      fontWeight: '800'
                                    }}
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Correct Answer Badge */}
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Check size={16} />
                              <span>الإجابة الصحيحة: <strong>{item.answer}</strong></span>
                            </div>
                          </div>

                          {/* Controls & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {/* Sort Order Up/Down */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveItem(config.type, idx, 'up')}
                                style={{
                                  background: idx === 0 ? '#f1f5f9' : '#e2e8f0',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                  color: '#334155'
                                }}
                                title="تحريك لأعلى"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                disabled={idx === items.length - 1}
                                onClick={() => handleMoveItem(config.type, idx, 'down')}
                                style={{
                                  background: idx === items.length - 1 ? '#f1f5f9' : '#e2e8f0',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                                  color: '#334155'
                                }}
                                title="تحريك لأسفل"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>

                            {/* Visibility Toggle ON/OFF */}
                            <button
                              onClick={() => handleToggleItemVisibility(config.type, item.id)}
                              style={{
                                background: isVisible ? '#dcfce7' : '#fee2e2',
                                color: isVisible ? '#166534' : '#991b1b',
                                border: `1.5px solid ${isVisible ? '#86efac' : '#fca5a5'}`,
                                padding: '8px 14px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                              <span>{isVisible ? 'ON ظاهرة' : 'OFF مخفية'}</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(config.type, item)}
                              style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1.5px solid #93c5fd',
                                padding: '8px 14px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Edit size={16} />
                              <span>تعديل</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteConfirmItem({ drillType: config.type, itemId: item.id })}
                              style={{
                                background: '#fff1f2',
                                color: '#e11d48',
                                border: '1.5px solid #fca5a5',
                                padding: '8px 14px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Trash2 size={16} />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- MODALS FOR ADD / EDIT ---------------- */}

      {/* 1. True / False Modal */}
      {activeModalType === 'true_false' && (
        <div className="modal-overlay" onClick={closeModal} style={{ background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, position: 'fixed', inset: 0, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #e2e8f0' }}>
            
            {/* Header (Fixed Top) */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{editingItem ? '✏️ تعديل السؤال' : '➕ إضافة سؤال جديد'}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
                  صح أم خطأ
                </span>
              </h3>
              <button type="button" onClick={closeModal} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s ease' }} title="إغلاق">
                <X size={20} />
              </button>
            </div>

            {/* Form wrapping scrollable Body & fixed Footer */}
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              
              {/* Body (Scrollable) */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    نص العبارة:
                  </label>
                  <textarea
                    rows={3}
                    value={tfStatement}
                    onChange={(e) => setTfStatement(e.target.value)}
                    placeholder="اكتبي العبارة هنا..."
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '16px', fontFamily: 'Tajawal, sans-serif' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    الإجابة الصحيحة:
                  </label>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '17px', color: '#065f46' }}>
                      <input
                        type="radio"
                        name="tf_answer"
                        value="صح"
                        checked={tfAnswer === 'صح'}
                        onChange={() => setTfAnswer('صح')}
                        style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
                      />
                      <span>✅ صح</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '17px', color: '#991b1b' }}>
                      <input
                        type="radio"
                        name="tf_answer"
                        value="خطأ"
                        checked={tfAnswer === 'خطأ'}
                        onChange={() => setTfAnswer('خطأ')}
                        style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
                      />
                      <span>❌ خطأ</span>
                    </label>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '800', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={tfIsVisible}
                      onChange={(e) => setTfIsVisible(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                    />
                    <span>☑ يظهر للطالبة</span>
                  </label>
                </div>
              </div>

              {/* Footer (Fixed Bottom) */}
              <div style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '2px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="hero-start-btn"
                  style={{ background: '#16a34a', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: 'none' }}
                >
                  حفظ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Fill in the Blank Modal */}
      {activeModalType === 'fill_blank' && (
        <div className="modal-overlay" onClick={closeModal} style={{ background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, position: 'fixed', inset: 0, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #e2e8f0' }}>
            
            {/* Header (Fixed Top) */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{editingItem ? '✏️ تعديل السؤال' : '➕ إضافة سؤال جديد'}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', background: '#e0f2fe', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #bae6fd' }}>
                  أكمل الفراغ
                </span>
              </h3>
              <button type="button" onClick={closeModal} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s ease' }} title="إغلاق">
                <X size={20} />
              </button>
            </div>

            {/* Form wrapping scrollable Body & fixed Footer */}
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              
              {/* Body (Scrollable) */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    نص الجملة:
                  </label>
                  <textarea
                    rows={3}
                    value={fbQuestion}
                    onChange={(e) => setFbQuestion(e.target.value)}
                    placeholder="مثال: عطش الغراب فأخذ يبحث عن ________."
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '16px', fontFamily: 'Tajawal, sans-serif' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    الإجابة الصحيحة:
                  </label>
                  <input
                    type="text"
                    value={fbAnswer}
                    onChange={(e) => setFbAnswer(e.target.value)}
                    placeholder="الماء"
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '16px', fontFamily: 'Tajawal, sans-serif' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '800', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={fbIsVisible}
                      onChange={(e) => setFbIsVisible(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                    />
                    <span>☑ يظهر للطالبة</span>
                  </label>
                </div>
              </div>

              {/* Footer (Fixed Bottom) */}
              <div style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '2px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="hero-start-btn"
                  style={{ background: '#0284c7', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: 'none' }}
                >
                  حفظ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Multiple Choice Modal */}
      {activeModalType === 'multiple_choice' && (
        <div className="modal-overlay" onClick={closeModal} style={{ background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, position: 'fixed', inset: 0, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #e2e8f0' }}>
            
            {/* Header (Fixed Top) */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#6b21a8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{editingItem ? '✏️ تعديل السؤال' : '➕ إضافة سؤال جديد'}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#7e22ce', background: '#faf5ff', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #e9d5ff' }}>
                  اختاري الكلمة المناسبة
                </span>
              </h3>
              <button type="button" onClick={closeModal} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s ease' }} title="إغلاق">
                <X size={20} />
              </button>
            </div>

            {/* Form wrapping scrollable Body & fixed Footer */}
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              
              {/* Body (Scrollable) */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    نص السؤال:
                  </label>
                  <textarea
                    rows={3}
                    value={mcqQuestion}
                    onChange={(e) => setMcqQuestion(e.target.value)}
                    placeholder="مثال: كان يوم الصيف ________."
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '16px', fontFamily: 'Tajawal, sans-serif' }}
                  />
                </div>

                {/* Options Fields */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '800', fontSize: '15px', color: '#334155' }}>
                      الخيارات:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #c084fc', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} />
                      <span>+ إضافة خيار</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mcqOptions.map((optVal, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', minWidth: '60px' }}>
                          الخيار {oIdx + 1}:
                        </span>
                        <input
                          type="text"
                          value={optVal}
                          onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                          placeholder={`خيار ${oIdx + 1}`}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '15px' }}
                        />
                        {mcqOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(oIdx)}
                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                            title="حذف هذا الخيار"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer Selector */}
                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                    الإجابة الصحيحة:
                  </label>
                  <select
                    value={mcqAnswer}
                    onChange={(e) => setMcqAnswer(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800', fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {mcqOptions.map((optVal, oIdx) => (
                      <option key={oIdx} value={optVal.trim()}>{optVal.trim() || `خيار ${oIdx + 1}`}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '800', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={mcqIsVisible}
                      onChange={(e) => setMcqIsVisible(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#7e22ce' }}
                    />
                    <span>☑ يظهر للطالبة</span>
                  </label>
                </div>
              </div>

              {/* Footer (Fixed Bottom) */}
              <div style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '2px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="hero-start-btn"
                  style={{ background: '#7e22ce', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: 'none' }}
                >
                  حفظ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmItem(null)} style={{ background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, position: 'fixed', inset: 0, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', padding: '28px', borderRadius: '24px', textAlign: 'center', background: 'white', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#991b1b', marginBottom: '12px' }}>
              تأكيد حذف السؤال ⚠️
            </h3>
            <p style={{ fontSize: '15px', color: '#475569', fontWeight: '700', marginBottom: '24px' }}>
              هل أنتِ متأكدة من رغبتكِ في حذف هذا السؤال؟ لن يظهر للطالبات في التمارين.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmItem.drillType, deleteConfirmItem.itemId)}
                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                نعم، احذف السؤال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
