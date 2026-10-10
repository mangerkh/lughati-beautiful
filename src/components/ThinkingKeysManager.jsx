import React, { useState, useEffect } from 'react';
import { Key, Search, MessageSquare, Lightbulb, Palette, Edit3, Eye, EyeOff, Check, X, Save, Sparkles } from 'lucide-react';

export default function ThinkingKeysManager({ lessonId = 4, token, showToast }) {
  const [keysList, setKeysList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editPromptText, setEditPromptText] = useState('');
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState(null);

  const keysMeta = {
    analyze: {
      title: '🔍 نحلّل',
      label: 'نحلّل',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#38bdf8',
      icon: <Search size={22} color="#0284c7" />
    },
    discuss: {
      title: '💬 نناقش',
      label: 'نناقش',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#4ade80',
      icon: <MessageSquare size={22} color="#16a34a" />
    },
    innovate: {
      title: '💡 نبتكر',
      label: 'نبتكر',
      color: '#d97706',
      bg: '#fffbe6',
      border: '#fbbf24',
      icon: <Lightbulb size={22} color="#d97706" />
    },
    create: {
      title: '🎨 نبدع',
      label: 'نبدع',
      color: '#9333ea',
      bg: '#faf5ff',
      border: '#c084fc',
      icon: <Palette size={22} color="#9333ea" />
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [lessonId]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/thinking-keys-drills?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeysList(data);
      }
    } catch (e) {
      console.error('Error fetching admin thinking keys:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (item) => {
    const updatedStatus = item.is_visible === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/thinking-keys-drills/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt_text: item.prompt_text,
          is_visible: updatedStatus
        })
      });

      if (res.ok) {
        setKeysList(keysList.map(k => k.id === item.id ? { ...k, is_visible: updatedStatus } : k));
        if (showToast) {
          showToast(updatedStatus === 1 ? 'تم إظهار المفتاح للطالبات 👁️' : 'تم إخفاء المفتاح عن الطالبات 🙈');
        }
      }
    } catch (e) {
      if (showToast) showToast('تعذر تغيير الحالة');
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditPromptText(item.prompt_text || '');
    setEditIsVisible(item.is_visible === 1);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/thinking-keys-drills/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt_text: editPromptText,
          is_visible: editIsVisible ? 1 : 0
        })
      });

      if (res.ok) {
        setKeysList(keysList.map(k => k.id === editingItem.id ? { ...k, prompt_text: editPromptText, is_visible: editIsVisible ? 1 : 0 } : k));
        setEditingItem(null);
        if (showToast) showToast('تم حفظ التعديلات بنجاح ✅');
      } else {
        if (showToast) showToast('حدث خطأ أثناء حفظ التعديلات');
      }
    } catch (e) {
      if (showToast) showToast('تعذر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const fixedKeysOrder = ['analyze', 'discuss', 'innovate', 'create'];

  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '2px solid #e2e8f0', direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #f1f5f9', pb: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#7e22ce', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={28} color="#9333ea" />
            <span>إدارة مهارة: مفاتيح التفكير 🔑</span>
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px', fontWeight: '700' }}>
            إدارة المفاتيح الأربعة الثابتة وتعديل مهمة كل مفتاح لهذا الدرس.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#64748b', fontWeight: '800' }}>
          جاري تحميل مفاتيح التفكير... ⏳
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {fixedKeysOrder.map((keyType) => {
            const meta = keysMeta[keyType];
            const item = keysList.find(k => k.key_type === keyType) || {
              id: keyType,
              key_type: keyType,
              prompt_text: 'نص المهمة الافتراضي',
              is_visible: 1
            };

            const isVisible = item.is_visible === 1;

            return (
              <div
                key={keyType}
                style={{
                  background: meta.bg,
                  border: `2px solid ${meta.border}`,
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  opacity: isVisible ? 1 : 0.7
                }}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '900', color: meta.color }}>
                      {meta.icon}
                      <span>{meta.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '900',
                        background: isVisible ? '#dcfce7' : '#fee2e2',
                        color: isVisible ? '#15803d' : '#b91c1c'
                      }}>
                        {isVisible ? 'ظاهر للطالبة 👁️' : 'مخفي 🙈'}
                      </span>
                    </div>
                  </div>

                  {/* Task Prompt Text */}
                  <div style={{
                    background: 'white',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#1e293b',
                    lineHeight: '1.7',
                    minHeight: '80px',
                    marginBottom: '16px'
                  }}>
                    {item.prompt_text}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      flex: 1,
                      background: meta.color,
                      color: 'white',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit3 size={16} />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(item)}
                    style={{
                      background: isVisible ? '#f1f5f9' : '#fee2e2',
                      color: isVisible ? '#475569' : '#dc2626',
                      border: '1px solid #cbd5e1',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{isVisible ? 'إخفاء' : 'إظهار'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    style={{
                      background: '#f8fafc',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={16} />
                    <span>معاينة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', direction: 'rtl'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '28px',
            width: '100%', maxWidth: '540px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', pb: '14px' }}>
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '900', color: keysMeta[editingItem.key_type]?.color || '#7e22ce', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>تعديل مهمة مفتاح: {keysMeta[editingItem.key_type]?.title || editingItem.key_type}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '900', fontSize: '15px', color: '#334155', marginBottom: '8px' }}>
                نص المهمة:
              </label>
              <textarea
                rows={4}
                value={editPromptText}
                onChange={(e) => setEditPromptText(e.target.value)}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #cbd5e1',
                  fontSize: '16px', fontFamily: 'Tajawal, sans-serif', lineHeight: '1.7', outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="editIsVisible"
                checked={editIsVisible}
                onChange={(e) => setEditIsVisible(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#7e22ce', cursor: 'pointer' }}
              />
              <label htmlFor="editIsVisible" style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', cursor: 'pointer' }}>
                ☑ يظهر للطالبة
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  background: '#7e22ce', color: 'white', border: 'none', padding: '10px 24px',
                  borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Save size={18} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px',
                  borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', direction: 'rtl'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '28px',
            width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '900', color: keysMeta[previewItem.key_type]?.color || '#0284c7', margin: 0 }}>
                👁️ معاينة المفتاح
              </h3>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{
              background: keysMeta[previewItem.key_type]?.bg || '#f0f9ff',
              border: `2px solid ${keysMeta[previewItem.key_type]?.border || '#38bdf8'}`,
              borderRadius: '20px', padding: '20px', color: keysMeta[previewItem.key_type]?.color || '#0284c7',
              fontSize: '18px', fontWeight: '900', lineHeight: '1.7', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>
                {keysMeta[previewItem.key_type]?.title}
              </div>
              <div>{previewItem.prompt_text}</div>
            </div>

            <button
              onClick={() => setPreviewItem(null)}
              style={{
                width: '100%', background: '#1e293b', color: 'white', border: 'none', padding: '10px',
                borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer'
              }}
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
