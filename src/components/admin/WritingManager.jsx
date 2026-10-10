import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, PenTool, CheckCircle, RefreshCw } from 'lucide-react';

export default function WritingManager({ lessonId, token, showToast, onOpenStudentPreview, onContentUpdated }) {
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    target_answer: '',
    is_enabled: true
  });

  const fetchDrills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/writing-drills?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("WRITING FETCH RESPONSE STATUS:", res.status);
      console.log("WRITING FETCH RESPONSE OK:", res.ok);
      const rawText = await res.text();
      console.log("WRITING FETCH RAW RESPONSE:", rawText);

      if (res.ok) {
        let data = [];
        if (rawText && rawText.trim()) {
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            console.warn("Response is not JSON:", rawText);
          }
        }
        setDrills(Array.isArray(data) ? data : []);
      } else {
        console.error('Fetch writing drills failed:', {
          status: res.status,
          statusText: res.statusText,
          responseBody: rawText
        });
      }
    } catch (err) {
      console.error('Error fetching writing drills:', err);
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
      title: '1. انسخي الجملة الآتية بخط جميل.',
      target_answer: '',
      is_enabled: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || item.prompt || 'انسخي الجملة الآتية بخط جميل.',
      target_answer: item.target_answer || '',
      is_enabled: item.is_enabled !== 0
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.is_enabled !== 0 ? 0 : 1;
    let apiSuccess = false;
    let rawText = '';

    try {
      const res = await fetch(`/api/admin/writing-drills/${item.id}`, {
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

      console.log("WRITING TOGGLE RESPONSE STATUS:", res.status);
      console.log("WRITING TOGGLE RESPONSE OK:", res.ok);
      rawText = await res.text();
      console.log("WRITING TOGGLE RAW RESPONSE:", rawText);

      if (!res.ok) {
        console.error('Toggle status failed:', res.status, res.statusText, rawText);
        showToast('تعذر تغيير حالة التمرين');
        return;
      }

      apiSuccess = true;
    } catch (apiError) {
      console.error('Toggle status API network error:', apiError);
      showToast('تعذر تغيير حالة التمرين');
      return;
    }

    if (apiSuccess) {
      try {
        showToast(newStatus === 1 ? 'تم إظهار التمرين للطالبات 👁️' : 'تم إخفاء التمرين 🙈');
        await fetchDrills();
        if (onContentUpdated) onContentUpdated();
      } catch (uiError) {
        console.error('POST-SUCCESS TOGGLE UI ERROR:', uiError);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنتِ متأكدة من حذف تمرين الكتابة هذا؟')) return;
    
    let apiSuccess = false;
    let rawText = '';

    try {
      const res = await fetch(`/api/admin/writing-drills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("WRITING DELETE RESPONSE STATUS:", res.status);
      console.log("WRITING DELETE RESPONSE OK:", res.ok);
      rawText = await res.text();
      console.log("WRITING DELETE RAW RESPONSE:", rawText);

      if (!res.ok) {
        console.error('Delete writing drill failed:', res.status, res.statusText, rawText);
        showToast('تعذر الحذف');
        return;
      }

      apiSuccess = true;
    } catch (apiError) {
      console.error('Delete writing drill API network error:', apiError);
      showToast('تعذر الحذف');
      return;
    }

    if (apiSuccess) {
      try {
        setDrills(prev => prev.filter(item => item.id !== id));
        showToast('تم حذف تمرين الكتابة بنجاح ✅');
        await fetchDrills();
        if (onContentUpdated) onContentUpdated();
      } catch (uiError) {
        console.error('POST-SUCCESS DELETE UI ERROR:', uiError);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.target_answer.trim()) {
      alert('يرجى إدخال الجملة المطلوب كتابتها');
      return;
    }

    const isEdit = !!editingItem;
    let apiSuccess = false;
    let rawText = '';

    try {
      const url = isEdit 
        ? `/api/admin/writing-drills/${editingItem.id}`
        : '/api/admin/writing-drills';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        lesson_id: lessonId,
        title: formData.title || 'انسخي الجملة الآتية بخط جميل.',
        prompt: formData.title || 'انسخي الجملة الآتية بخط جميل.',
        target_answer: formData.target_answer,
        drill_type: 'copy',
        is_enabled: formData.is_enabled ? 1 : 0
      };

      if (isEdit && editingItem && editingItem.sort_order !== undefined) {
        payload.sort_order = editingItem.sort_order;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log("WRITING UPDATE RESPONSE STATUS:", res.status);
      console.log("WRITING UPDATE RESPONSE OK:", res.ok);
      rawText = await res.text();
      console.log("WRITING UPDATE RAW RESPONSE:", rawText);

      if (!res.ok) {
        console.error('Save writing drill failed:', res.status, res.statusText, rawText);
        showToast(isEdit ? 'خطأ أثناء حفظ التغييرات' : 'تعذر إضافة تمرين الكتابة');
        return;
      }

      apiSuccess = true;
    } catch (apiError) {
      console.error('Submit writing drill API network error:', apiError);
      showToast(isEdit ? 'خطأ أثناء حفظ التغييرات' : 'تعذر إضافة تمرين الكتابة');
      return;
    }

    if (apiSuccess) {
      try {
        setShowModal(false);
        await fetchDrills();
        if (onContentUpdated) onContentUpdated();
        showToast(isEdit ? 'تم حفظ التغييرات بنجاح ✅' : 'تم إضافة تمرين الكتابة بنجاح ✅');
      } catch (uiError) {
        console.error('POST-SUCCESS UI ERROR:', uiError);
      }
    }
  };

  return (
    <div className="content-box">
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={26} />
            <span>إدارة مهارة «أكتب بخط جميل» ✏️</span>
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '700' }}>
            أضيفي وعدّلي تمارين الخط والنسخ للدرس. القالب ثابت وتظهر الجملة داخل صندوق واضح مع سطور كراسة الكتابة للطالبة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onOpenStudentPreview && (
            <button
              type="button"
              onClick={onOpenStudentPreview}
              className="hero-start-btn"
              style={{ fontSize: '14px', padding: '8px 16px', background: '#0284c7', color: 'white', boxShadow: 'none' }}
            >
              👁️ معاينة واجهة الطالبة
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="hero-start-btn"
            style={{ fontSize: '15px', padding: '10px 22px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            <span>+ إضافة تمرين كتابة</span>
          </button>
        </div>
      </div>

      {/* Drills List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px', fontWeight: '700' }}>
          جاري تحميل تمارين الكتابة... ⏳
        </div>
      ) : drills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', color: '#64748b' }}>
          <p style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 12px 0' }}>لا توجد تمارين كتابة مضافة لهذا الدرس بعد.</p>
          <button
            onClick={handleOpenAddModal}
            className="hero-start-btn"
            style={{ fontSize: '14px', padding: '8px 20px', background: '#2563eb', color: 'white', boxShadow: 'none' }}
          >
            + إضافة تمرين كتابة جديد
          </button>
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
                  border: isEnabled ? '2px solid #bfdbfe' : '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  opacity: isEnabled ? 1 : 0.85
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ background: isEnabled ? '#2563eb' : '#94a3b8', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '14px' }}>
                        تمرين #{idx + 1}
                      </span>
                      <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                        {item.title || item.prompt || 'انسخي الجملة الآتية بخط جميل.'}
                      </h4>
                    </div>

                    {/* Sentence Preview Box */}
                    <div style={{ background: '#f0f9ff', border: '2px solid #93c5fd', borderRadius: '12px', padding: '14px 18px', fontSize: '22px', fontWeight: '900', color: '#1d4ed8', marginTop: '10px', textAlign: 'right' }}>
                      "{item.target_answer}"
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: isEnabled ? '#d1fae5' : '#fee2e2',
                        color: isEnabled ? '#065f46' : '#991b1b',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span>{isEnabled ? '👁️ ظاهرة للطالبة ON' : '🙈 مخفية OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit2 size={16} />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                {editingItem ? '✏️ تعديل تمرين كتابة' : '✨ إضافة تمرين كتابة جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '6px' }}>
                  عنوان المهمة:
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: 1. انسخي الجملة الآتية بخط جميل."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontFamily: 'Cairo, sans-serif' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '15px', color: '#334155', marginBottom: '6px' }}>
                  الجملة المطلوب كتابتها:
                </label>
                <textarea
                  rows={3}
                  value={formData.target_answer}
                  onChange={(e) => setFormData({ ...formData, target_answer: e.target.value })}
                  placeholder="اكتبي الجملة بالشكل والمساعد الشفاهي... مثال: في يومٍ صيفيٍّ حارٍّ، عطشَ الغرابُ كثيراً."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '18px', fontFamily: 'Cairo, sans-serif', lineHeight: '1.6' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                <input
                  type="checkbox"
                  id="is_enabled_chk"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is_enabled_chk" style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', cursor: 'pointer' }}>
                  ☑ يظهر للطالبة
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '2px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="hero-start-btn"
                  style={{ padding: '10px 28px', background: '#2563eb', color: 'white', fontSize: '15px', boxShadow: 'none' }}
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
