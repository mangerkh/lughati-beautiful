import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';

export default function ExpressionManager({ lessonId, token, showToast, onOpenStudentPreview, onContentUpdated }) {
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    is_enabled: true
  });

  const fetchDrills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/expression-drills?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("EXPRESSION FETCH STATUS:", res.status, "OK:", res.ok);
      const rawText = await res.text();

      if (res.ok) {
        let data = [];
        if (rawText && rawText.trim()) {
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            console.warn("Expression response is not JSON:", rawText);
          }
        }
        setDrills(Array.isArray(data) ? data : []);
      } else {
        console.error('Fetch expression drills failed:', res.status, rawText);
      }
    } catch (err) {
      console.error('Error fetching expression drills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchDrills();
    }
  }, [lessonId]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: 'أعبر عن رأيي',
      question: '',
      is_enabled: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      question: item.question || '',
      is_enabled: item.is_enabled !== 0
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.is_enabled !== 0 ? 0 : 1;
    let apiSuccess = false;

    try {
      const res = await fetch(`/api/admin/expression-drills/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...item,
          is_enabled: newStatus
        })
      });

      console.log("EXPRESSION TOGGLE STATUS:", res.status, "OK:", res.ok);
      await res.text();

      if (res.ok) {
        apiSuccess = true;
      }
    } catch (err) {
      console.error("Error toggling expression status:", err);
    }

    if (apiSuccess) {
      showToast(newStatus === 1 ? 'تم إظهار مهمة التعبير للطالبات 👁️' : 'تم إخفاء مهمة التعبير عن الطالبات 🙈');
      fetchDrills();
      if (onContentUpdated) onContentUpdated();
    } else {
      showToast('تعذر تغيير حالة الظهور');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('يرجى إدخال عنوان المهمة');
      return;
    }
    if (!formData.question.trim()) {
      showToast('يرجى إدخال نص السؤال');
      return;
    }

    const payload = {
      lesson_id: lessonId,
      title: formData.title.trim(),
      question: formData.question.trim(),
      is_enabled: formData.is_enabled ? 1 : 0
    };

    let isSuccess = false;
    try {
      const url = editingItem
        ? `/api/admin/expression-drills/${editingItem.id}`
        : `/api/admin/expression-drills`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log("EXPRESSION SUBMIT STATUS:", res.status, "OK:", res.ok);
      const rawText = await res.text();

      if (res.ok) {
        isSuccess = true;
      } else {
        console.error("Submit expression failed:", res.status, rawText);
      }
    } catch (err) {
      console.error("Error saving expression drill:", err);
    }

    if (isSuccess) {
      showToast(editingItem ? 'تم حفظ التعديلات بنجاح ✅' : 'تم إضافة مهمة التعبير بنجاح ✅');
      setShowModal(false);
      fetchDrills();
      if (onContentUpdated) onContentUpdated();
    } else {
      showToast('خطأ أثناء حفظ التغييرات');
    }
  };

  const handleDelete = async (item) => {
    let isSuccess = false;
    try {
      const res = await fetch(`/api/admin/expression-drills/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("EXPRESSION DELETE STATUS:", res.status, "OK:", res.ok);
      await res.text();

      if (res.ok) {
        isSuccess = true;
      }
    } catch (err) {
      console.error("Error deleting expression drill:", err);
    }

    if (isSuccess) {
      showToast('تم حذف مهمة التعبير بنجاح ✅');
      setDeleteConfirmItem(null);
      fetchDrills();
      if (onContentUpdated) onContentUpdated();
    } else {
      showToast('تعذر الحذف');
    }
  };

  const handleReorder = async (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= drills.length) return;

    const newDrills = [...drills];
    const temp = newDrills[idx];
    newDrills[idx] = newDrills[targetIdx];
    newDrills[targetIdx] = temp;

    setDrills(newDrills);

    try {
      for (let i = 0; i < newDrills.length; i++) {
        await fetch(`/api/admin/expression-drills/${newDrills[i].id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...newDrills[i],
            sort_order: i + 1
          })
        });
      }
      showToast('تم ترتيب المهام بنجاح ↕️');
    } catch (e) {
      console.error('Error reordering expression drills:', e);
    }
  };

  return (
    <div className="content-box">
      {/* Header & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#8b5cf6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗣️ أعبر</span>
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
            إدارة مهام التعبير الحر المخصصة لهذا الدرس
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onOpenStudentPreview && (
            <button
              type="button"
              className="hero-start-btn"
              onClick={onOpenStudentPreview}
              style={{ background: '#8b5cf6', color: 'white', fontSize: '14px', padding: '10px 18px', boxShadow: 'none' }}
            >
              <Eye size={18} />
              <span>معاينة واجهة الطالبة</span>
            </button>
          )}

          <button
            type="button"
            className="hero-start-btn"
            onClick={handleOpenAddModal}
            style={{ background: '#10b981', color: 'white', fontSize: '14px', padding: '10px 18px', boxShadow: 'none' }}
          >
            <Plus size={18} />
            <span>+ إضافة مهمة تعبير</span>
          </button>
        </div>
      </div>

      {/* List of Expression Drills */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          جاري تحميل مهام التعبير... ⏳
        </div>
      ) : drills.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <MessageSquare size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '18px', fontWeight: '800' }}>لا توجد مهام تعبير مضافة لهذا الدرس بعد.</div>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>اضغطي على "+ إضافة مهمة تعبير" لإضافة أول مهمة تعبير صفي.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {drills.map((item, idx) => {
            const isEnabled = item.is_enabled !== 0;

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: isEnabled ? '2px solid #ddd6fe' : '2px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  opacity: isEnabled ? 1 : 0.75,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  
                  {/* Item Info */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ background: isEnabled ? '#8b5cf6' : '#94a3b8', color: 'white', padding: '4px 10px', borderRadius: '10px', fontWeight: '900', fontSize: '14px' }}>
                        مهمة #{idx + 1}
                      </span>
                      <h4 style={{ fontFamily: 'Cairo', fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                        {item.title}
                      </h4>
                      {!isEnabled && (
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                          مخفي عن الطالبة 🙈
                        </span>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '12px 16px', marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: '800', marginBottom: '4px' }}>
                        ❓ السؤال / المهمة:
                      </div>
                      <div style={{ fontFamily: 'Cairo', fontSize: '17px', fontWeight: '800', color: '#4c1d95', direction: 'rtl', lineHeight: '1.5' }}>
                        {item.question}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Reordering */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Reorder Up/Down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, 'up')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '6px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
                      title="تحريك لأعلى"
                    >
                      <ArrowUp size={16} color="#334155" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === drills.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '6px', cursor: idx === drills.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === drills.length - 1 ? 0.4 : 1 }}
                      title="تحريك لأسفل"
                    >
                      <ArrowDown size={16} color="#334155" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isEnabled ? '#dcfce7' : '#fee2e2',
                        color: isEnabled ? '#15803d' : '#b91c1c',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span>{isEnabled ? 'يظهر للطالبة' : 'مخفي'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      style={{ background: '#f3e8ff', color: '#6d28d9', border: 'none', borderRadius: '12px', padding: '8px 14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit2 size={16} />
                      <span>تعديل</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(item)}
                      style={{ background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: '12px', padding: '8px 14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={16} />
                      <span>حذف</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="feedback-modal" style={{ zIndex: 1600 }}>
          <div className="feedback-card" style={{ maxWidth: '650px', width: '92%', borderRadius: '24px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px' }}>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#7c3aed', margin: 0 }}>
                {editingItem ? '✏️ تعديل مهمة تعبير' : '✨ إضافة مهمة تعبير جديدة'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Task Title */}
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                  📌 عنوان المهمة (مثال: أعبر عن رأيي / لو كنتُ مكانه):
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: أعبر عن رأيي"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>

              {/* Task Question / Prompt */}
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                  ❓ نص السؤال أو المهمة:
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="مثال: ما رأيكِ في تصرف الغراب عندما لم يستطع الوصول إلى الماء؟"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '700', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
                />
              </div>

              {/* Visibility Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="expression_is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="expression_is_enabled" style={{ fontWeight: '800', fontSize: '15px', color: '#334155', cursor: 'pointer' }}>
                  إظهار المهمة للطالبات في واجهة الدرس 👁️
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', color: '#475569', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={18} />
                  <span>{editingItem ? 'حفظ التعديلات' : 'حفظ المهمة'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="feedback-modal" style={{ zIndex: 1700 }}>
          <div className="feedback-card" style={{ maxWidth: '440px', width: '90%', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <div style={{ background: '#fef2f2', color: '#dc2626', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: '0 0 10px 0' }}>
              تأكيد الحذف
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px 0', fontWeight: '600' }}>
              هل تريدين حذف مهمة التعبير نهائياً؟
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', color: '#475569', fontWeight: '800', cursor: 'pointer', flex: 1 }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmItem)}
                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', flex: 1 }}
              >
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
