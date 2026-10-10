import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Image as ImageIcon, Volume2, Video, FileText, X, Check, Search } from 'lucide-react';

export default function MediaPickerModal({ token, onSelectMedia, onClose, allowedTypes = ['image', 'audio', 'video', 'document'] }) {
  const [mediaList, setMediaList] = useState([]);
  const [activeTypeTab, setActiveTypeTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMediaList(await res.json());
      }
    } catch (e) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        onSelectMedia(data.url);
        onClose();
      }
    } catch (e) {
      alert('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = mediaList.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTypeTab === 'all') return matchesSearch;
    return matchesSearch && item.type === activeTypeTab;
  });

  const modalContent = (
    <div 
      className="feedback-modal" 
      style={{ 
        zIndex: 2500, 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(15, 23, 42, 0.7)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justify: 'center' 
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="feedback-card" 
        style={{ 
          maxWidth: '850px', 
          width: '95%', 
          textAlign: 'right', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          borderRadius: '24px',
          border: '2px solid #38bdf8'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
            📁 مكتبة الوسائط والملفات
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTypeTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: activeTypeTab === 'all' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                background: activeTypeTab === 'all' ? '#e0f2fe' : 'white',
                color: activeTypeTab === 'all' ? '#0369a1' : '#64748b',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('image')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: activeTypeTab === 'image' ? '2px solid #10b981' : '1.5px solid #cbd5e1',
                background: activeTypeTab === 'image' ? '#d1fae5' : 'white',
                color: activeTypeTab === 'image' ? '#065f46' : '#64748b',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              الصور
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('audio')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: activeTypeTab === 'audio' ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                background: activeTypeTab === 'audio' ? '#fef3c7' : 'white',
                color: activeTypeTab === 'audio' ? '#92400e' : '#64748b',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              الصوتيات
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('video')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: activeTypeTab === 'video' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                background: activeTypeTab === 'video' ? '#f3e8ff' : 'white',
                color: activeTypeTab === 'video' ? '#6b21a8' : '#64748b',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              الفيديو
            </button>
          </div>

          <label 
            className="hero-start-btn"
            style={{ fontSize: '14px', padding: '8px 16px', boxShadow: 'none', background: '#0284c7', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={18} />
            <span>{uploading ? 'جارٍ الرفع...' : 'رفع ملف جديد'}</span>
            <input type="file" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Media Grid */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', padding: '4px' }}>
          {filteredMedia.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '700' }}>
              لا توجد ملفات في هذه الفئة بعد.
            </div>
          ) : (
            filteredMedia.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMedia(m.url);
                  onClose();
                }}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0',
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                {m.type === 'image' ? (
                  <img src={m.url} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : m.type === 'audio' ? (
                  <div style={{ height: '90px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Volume2 size={36} color="#d97706" />
                  </div>
                ) : m.type === 'video' ? (
                  <div style={{ height: '90px', background: '#f3e8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={36} color="#7c3aed" />
                  </div>
                ) : (
                  <div style={{ height: '90px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={36} color="#64748b" />
                  </div>
                )}

                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.filename}
                </div>

                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', marginTop: '2px' }}>
                  انقري للاختيار ✨
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
