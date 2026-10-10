import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, RefreshCw, Key, Edit, Archive, 
  Trash2, Eye, CheckCircle2, XCircle, AlertTriangle, X, Shield, 
  Award, Clock, BookOpen, FolderCheck, Sparkles, ChevronRight, RotateCcw
} from 'lucide-react';

export default function StudentsManager({ token, showToast, onNavigateToSubmissions }) {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [regenCodeStudent, setRegenCodeStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);

  // Add/Edit Form state
  const [formName, setFormName] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formNotes, setFormNotes] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students?status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ([]));
      if (res.ok) {
        setAllStudents(Array.isArray(data) ? data : []);
      } else {
        console.error('Fetch students failed:', { status: res.status, body: data });
        showToast(data.message || 'تعذر تحميل قائمة الطالبات');
      }
    } catch (e) {
      console.error('Fetch students exception:', e);
      showToast('تعذر الاتصال بالسيرفر لتحميل الطالبات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      showToast('اسم الطالبة مطلوب');
      return;
    }
    setSubmittingForm(true);
    try {
      const payload = {
        name: formName.trim(),
        section_group: formSection.trim(),
        group_name: formSection.trim(),
        status: formStatus,
        internal_notes: formNotes.trim(),
        notes: formNotes.trim()
      };

      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`تمت إضافة الطالبة بنجاح ✅ رمز الدخول: ${data.student?.student_code || ''}`);
        setShowAddModal(false);
        resetForm();
        fetchStudents();
      } else {
        console.error('Add student failed:', {
          status: res.status,
          statusText: res.statusText,
          body: data,
          error: data.error || data.message
        });
        showToast(data.message || 'حدث خطأ أثناء إضافة الطالبة');
      }
    } catch (e) {
      console.error('Add student exception:', e);
      showToast('حدث خطأ أثناء الاتصال بالخادم لإضافة الطالبة');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    if (e) e.preventDefault();
    if (!editStudent || !formName.trim()) return;
    setSubmittingForm(true);
    try {
      const payload = {
        name: formName.trim(),
        section_group: formSection.trim(),
        group_name: formSection.trim(),
        status: formStatus,
        internal_notes: formNotes.trim(),
        notes: formNotes.trim()
      };

      const res = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('تم تحديث بيانات الطالبة بنجاح ✅');
        setEditStudent(null);
        resetForm();
        fetchStudents();
      } else {
        console.error('Update student failed:', { status: res.status, body: data, error: data.error || data.message });
        showToast(data.message || 'تعذر تحديث البيانات');
      }
    } catch (e) {
      console.error('Update student exception:', e);
      showToast('خطأ في الاتصال بالخادم أثناء التحديث');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: student.name,
          section_group: student.section_group || student.group_name || '',
          group_name: student.section_group || student.group_name || '',
          status: newStatus,
          internal_notes: student.internal_notes || student.notes || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(newStatus === 'active' ? 'تم تفعيل حساب الطالبة ✅' : 'تم إيقاف/تعطيل حساب الطالبة ⛔');
        fetchStudents();
      } else {
        console.error('Toggle status failed:', { status: res.status, body: data });
        showToast(data.message || 'تعذر تغيير حالة الطالبة');
      }
    } catch (e) {
      console.error('Toggle status exception:', e);
      showToast('تعذر تغيير حالة الطالبة');
    }
  };

  const handleArchiveStudent = async (student, shouldArchive = true) => {
    const newStatus = shouldArchive ? 'archived' : 'active';
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: student.name,
          section_group: student.section_group || student.group_name || '',
          group_name: student.section_group || student.group_name || '',
          status: newStatus,
          internal_notes: student.internal_notes || student.notes || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(shouldArchive ? 'تم نقل الطالبة إلى الأرشيف 📦' : 'تم استعادة الطالبة من الأرشيف بنجاح 🔄');
        fetchStudents();
      } else {
        console.error('Archive student failed:', { status: res.status, body: data });
        showToast(data.message || 'تعذر تعديل أرشفة الطالبة');
      }
    } catch (e) {
      console.error('Archive student exception:', e);
      showToast('تعذر تعديل أرشفة الطالبة');
    }
  };

  const handleRegenerateCode = async () => {
    if (!regenCodeStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${regenCodeStudent.id}/regenerate-code`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`تم تغيير رمز الدخول بنجاح 🔑 الرمز الجديد: ${data.student_code}`);
        setRegenCodeStudent(null);
        fetchStudents();
      } else {
        console.error('Regenerate code failed:', { status: res.status, body: data });
        showToast(data.message || 'تعذر تغيير رمز الدخول');
      }
    } catch (e) {
      console.error('Regenerate code exception:', e);
      showToast('خطأ أثناء إعادة توليد الرمز');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${deleteStudent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('تم حذف الطالبة وبياناتها نهائياً 🗑️');
        setDeleteStudent(null);
        fetchStudents();
      } else {
        console.error('Delete student failed:', { status: res.status, body: data });
        showToast(data.message || 'تعذر حذف الطالبة');
      }
    } catch (e) {
      console.error('Delete student exception:', e);
      showToast('تعذر حذف الطالبة');
    }
  };

  const openProfileModal = async (student) => {
    setProfileStudent(student);
    setLoadingProfile(true);
    setProfileData(null);
    try {
      const res = await fetch(`/api/admin/students/${student.id}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProfileData(await res.json());
      }
    } catch (e) {
      showToast('تعذر تحميل ملف الطالبة');
    } finally {
      setLoadingProfile(false);
    }
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormName(student.name || '');
    setFormSection(student.section_group || student.group_name || '');
    setFormStatus(student.status || 'active');
    setFormNotes(student.internal_notes || student.notes || '');
  };

  const resetForm = () => {
    setFormName('');
    setFormSection('');
    setFormStatus('active');
    setFormNotes('');
  };

  // Stats calculation over complete dataset
  const totalCount = allStudents.length;
  const activeCount = allStudents.filter(s => s.status === 'active' || !s.status).length;
  const inactiveCount = allStudents.filter(s => s.status === 'inactive').length;
  const archivedCount = allStudents.filter(s => s.status === 'archived').length;

  // Filtered dataset for current table view
  const displayedStudents = useMemo(() => {
    return allStudents.filter(st => {
      if (statusFilter !== 'all' && st.status !== statusFilter) {
        if (statusFilter === 'active' && !st.status) {
          // treat default as active
        } else {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = (st.name || '').toLowerCase().includes(q);
        const codeMatch = (st.student_code || '').toLowerCase().includes(q);
        const secMatch = (st.section_group || st.group_name || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || secMatch;
      }
      return true;
    });
  }, [allStudents, statusFilter, search]);

  return (
    <div className="content-box">
      
      {/* Header & Stats Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#0284c7', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={30} />
            <span>نظام إدارة الطالبات 👧🌸</span>
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            إدارة حسابات الطالبات، رموز الدخول الرقمية، التفعيل والأرشفة ومتابعة التقدم.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="hero-start-btn"
          style={{ background: '#db2777', color: 'white', padding: '12px 24px', fontSize: '16px', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.4)' }}
        >
          <UserPlus size={20} />
          <span>+ إضافة طالبة جديدة</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '800' }}>إجمالي الطالبات</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0c4a6e' }}>{totalCount}</div>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#15803d', fontWeight: '800' }}>مفعلة</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d' }}>{activeCount}</div>
          </div>
        </div>

        <div style={{ background: '#fef2f2', border: '2px solid #fecdd3', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '800' }}>غير مفعلة</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#7f1d1d' }}>{inactiveCount}</div>
          </div>
        </div>

        <div style={{ background: '#fffbeb', border: '2px solid #fef3c7', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#d97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Archive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#b45309', fontWeight: '800' }}>في الأرشيف</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#78350f' }}>{archivedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'الجميع 👥' },
            { id: 'active', label: 'مفعلات ✅' },
            { id: 'inactive', label: 'غير مفعلات ⛔' },
            { id: 'archived', label: 'الأرشيف 📦' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '14px',
                fontWeight: '900',
                fontSize: '14px',
                border: statusFilter === tab.id ? '2px solid #0284c7' : '2px solid #cbd5e1',
                background: statusFilter === tab.id ? '#0284c7' : 'white',
                color: statusFilter === tab.id ? 'white' : '#475569',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '360px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '12px', right: '14px' }} />
          <input
            type="text"
            placeholder="ابحثي بالاسم، الرمز الرقمي، أو الشعبة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 42px 10px 14px',
              borderRadius: '14px',
              border: '2px solid #cbd5e1',
              fontSize: '15px',
              fontWeight: '700',
              outline: 'none',
              background: 'white'
            }}
          />
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div style={{ padding: '50px', textAlign: 'center', color: '#0284c7', fontWeight: '800' }}>جاري تحميل الطالبات... 🌸</div>
      ) : displayedStudents.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', color: '#64748b', fontWeight: '800' }}>
          لا يوجد طالبات مطابقة للبحث أو التصفية الحالية.
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'right' }}>
                <th style={{ padding: '14px 16px', borderRadius: '0 14px 14px 0' }}>الطالبة</th>
                <th style={{ padding: '14px 16px' }}>رمز الدخول 🔑</th>
                <th style={{ padding: '14px 16px' }}>الشعبة / المجموعة</th>
                <th style={{ padding: '14px 16px' }}>الحالة</th>
                <th style={{ padding: '14px 16px' }}>التسليمات</th>
                <th style={{ padding: '14px 16px' }}>آخر نشاط</th>
                <th style={{ padding: '14px 16px', borderRadius: '14px 0 0 14px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((st) => {
                const isActive = st.status === 'active' || !st.status;
                const isArchived = st.status === 'archived';

                return (
                  <tr key={st.id} style={{ background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    
                    {/* Name */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', borderRight: '2px solid #f1f5f9', borderRadius: '0 14px 14px 0' }}>
                      <div style={{ fontWeight: '900', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👧</span>
                        <span>{st.name}</span>
                      </div>
                      {(st.internal_notes || st.notes) && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          📝 {st.internal_notes || st.notes}
                        </div>
                      )}
                    </td>

                    {/* Student Code */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fdf2f8', border: '1.5px solid #fbcfe8', padding: '4px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '15px', color: '#be185d', letterSpacing: '1px' }}>
                        <Key size={14} />
                        <span>{st.student_code || '---'}</span>
                      </div>
                    </td>

                    {/* Section / Group */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569' }}>
                        {st.section_group || st.group_name || 'غير محددة'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '900',
                        background: isActive ? '#dcfce7' : isArchived ? '#fef3c7' : '#fee2e2',
                        color: isActive ? '#15803d' : isArchived ? '#b45309' : '#b91c1c'
                      }}>
                        {isActive ? 'مفعلة ✅' : isArchived ? 'مؤرشفة 📦' : 'معطلة ⛔'}
                      </span>
                    </td>

                    {/* Submissions Stats */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0369a1' }}>
                        {st.submissions_count || 0} عمل (مراجعة {st.reviewed_count || 0})
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                      {st.last_submission_at ? new Date(st.last_submission_at).toLocaleDateString('ar-EG') : st.last_login_at ? new Date(st.last_login_at).toLocaleDateString('ar-EG') : 'لم تدخل بعد'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', borderLeft: '2px solid #f1f5f9', borderRadius: '14px 0 0 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        
                        <button
                          onClick={() => openProfileModal(st)}
                          title="عرض الملف الكامل"
                          style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} />
                          <span>الملف</span>
                        </button>

                        <button
                          onClick={() => openEditModal(st)}
                          title="تعديل البيانات"
                          style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit size={14} />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => setRegenCodeStudent(st)}
                          title="تغيير رمز الدخول"
                          style={{ background: '#fdf2f8', color: '#be185d', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Key size={14} />
                          <span>تغيير الرمز</span>
                        </button>

                        {isActive ? (
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title="تعطيل الحساب"
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                          >
                            تعطيل
                          </button>
                        ) : !isArchived ? (
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title="تفعيل الحساب"
                            style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                          >
                            تفعيل
                          </button>
                        ) : null}

                        {!isArchived ? (
                          <button
                            onClick={() => handleArchiveStudent(st, true)}
                            title="نقل للأرشيف"
                            style={{ background: '#fef3c7', color: '#b45309', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                          >
                            أرشفة
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveStudent(st, false)}
                            title="استعادة من الأرشيف"
                            style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                          >
                            استعادة
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteStudent(st)}
                          title="حذف نهائي"
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL (Responsive 90vh Flex Layout) */}
      {(showAddModal || editStudent) && (
        <div className="feedback-modal" style={{ zIndex: 1900 }}>
          <div className="feedback-card" style={{ maxWidth: '520px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            
            {/* Modal Header */}
            <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '22px', fontWeight: '900', color: '#0284c7', margin: 0 }}>
                {editStudent ? `✏️ تعديل بيانات الطالبة: ${editStudent.name}` : '🌸 إضافة طالبة جديدة'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditStudent(null); resetForm(); }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '9999px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form id="studentForm" onSubmit={editStudent ? handleUpdateStudent : handleCreateStudent} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  1. اسم الطالبة الثلاثي (مطلوب):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة أحمد محمود"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  2. الشعبة / المجموعة (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: الشعبة الأولى (أ)"
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  3. حالة الحساب:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800', background: 'white' }}
                >
                  <option value="active">مفعلة ✅ (تستطيع الدخول للدروس والتسليم)</option>
                  <option value="inactive">غير مفعلة ⛔ (معطلة مؤقتاً)</option>
                  <option value="archived">مؤرشفة 📦 (في الأرشيف)</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  4. ملاحظات داخلية للمعلمة (اختياري):
                </label>
                <textarea
                  rows={3}
                  placeholder="ملاحظات خاصة عن الطالبة ومستواها..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              {!editStudent && (
                <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', color: '#be185d', fontWeight: '800' }}>
                  🔑 سيتم توليد رمز دخول رقمي فريد تلقائياً (مثال: 26001) فور الحفظ.
                </div>
              )}
            </form>

            {/* Modal Footer (Fixed at bottom) */}
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditStudent(null); resetForm(); }}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="studentForm"
                disabled={submittingForm}
                className="hero-start-btn"
                style={{ background: '#db2777', color: 'white', padding: '10px 24px', fontSize: '15px', boxShadow: 'none' }}
              >
                {submittingForm ? 'جاري الحفظ...' : editStudent ? '💾 حفظ التعديلات' : '✨ إضافة الطالبة'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL (Responsive 90vh Flex Layout) */}
      {profileStudent && (
        <div className="feedback-modal" style={{ zIndex: 1900 }}>
          <div className="feedback-card" style={{ maxWidth: '680px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '24px', fontWeight: '900', color: '#0284c7', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👧</span>
                <span>الملف الشامل للطالبة: {profileStudent.name}</span>
              </h3>
              <button
                onClick={() => setProfileStudent(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '9999px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
              {loadingProfile ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#0284c7', fontWeight: '800' }}>جاري تحميل الملف البيانات...</div>
              ) : profileData ? (
                <div>
                  
                  {/* Information Card */}
                  <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '20px', padding: '20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '800' }}>رمز الدخول الرقمي:</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#be185d', letterSpacing: '1px' }}>🔑 {profileData.student?.student_code || '---'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '800' }}>الشعبة / المجموعة:</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{profileData.student?.section_group || profileData.student?.group_name || 'غير محددة'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '800' }}>حالة الحساب:</div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: profileData.student?.status === 'active' || !profileData.student?.status ? '#15803d' : '#b91c1c' }}>
                        {profileData.student?.status === 'active' || !profileData.student?.status ? 'مفعلة ✅' : 'غير مفعلة ⛔'}
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#be185d', fontWeight: '800' }}>إجمالي التسليمات</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#9d174d' }}>{profileData.stats?.submissions_count || 0}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: '800' }}>أعمال مراجعة</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#14532d' }}>{profileData.stats?.reviewed_count || 0}</div>
                    </div>
                    <div style={{ background: '#fffbeb', border: '2px solid #fef3c7', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '800' }}>الدروس المتاحة</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#78350f' }}>{profileData.stats?.unlocked_lessons || 0}</div>
                    </div>
                  </div>

                  {/* Submissions List */}
                  <h4 style={{ fontFamily: 'Cairo', fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>
                    📂 أعمال وتطبيقات الطالبة:
                  </h4>
                  {(!profileData.submissions || profileData.submissions.length === 0) ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', color: '#64748b', fontWeight: '700' }}>
                      لم تقم الطالبة بإرسال أعمال بعد.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {profileData.submissions.map(s => (
                        <div key={s.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '900', fontSize: '15px', color: '#0369a1' }}>
                              {s.lesson_title || 'الدرس'} - {s.section_type}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {new Date(s.created_at).toLocaleString('ar-EG')}
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '9999px', background: s.status === 'reviewed' ? '#dcfce7' : '#fef3c7', color: s.status === 'reviewed' ? '#15803d' : '#b45309' }}>
                            {s.status === 'reviewed' ? 'مراجعة ✅' : 'جديد 🆕'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              {onNavigateToSubmissions && profileStudent && (
                <button
                  className="hero-start-btn"
                  style={{ background: '#db2777', color: 'white', padding: '10px 20px', fontSize: '14px', boxShadow: 'none' }}
                  onClick={() => {
                    const sName = profileStudent.name;
                    setProfileStudent(null);
                    onNavigateToSubmissions(sName);
                  }}
                >
                  👧 عرض جميع تسليماتها في صفحة التسليمات
                </button>
              )}
              <button
                className="teacher-login-btn"
                onClick={() => setProfileStudent(null)}
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REGENERATE CODE CONFIRMATION MODAL */}
      {regenCodeStudent && (
        <div className="feedback-modal" style={{ zIndex: 1950 }}>
          <div className="feedback-card" style={{ maxWidth: '440px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, border: '3px solid #f472b6' }}>
            <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', background: 'white' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>🔑</div>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '22px', fontWeight: '900', color: '#be185d', margin: 0 }}>
                إعادة توليد رمز الدخول
              </h3>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                هل أنتِ متأكدة من تغيير رمز دخول الطالبة <strong>({regenCodeStudent.name})</strong>؟
                <br />
                <span style={{ color: '#dc2626', fontWeight: '800' }}>لن يتمكن الحساب من الدخول بالرمز القديم بعد التغيير.</span>
              </p>
            </div>
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="hero-start-btn"
                style={{ background: '#db2777', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: 'none' }}
                onClick={handleRegenerateCode}
              >
                🔑 تغيير الرمز فوراً
              </button>
              <button
                className="teacher-login-btn"
                onClick={() => setRegenCodeStudent(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteStudent && (
        <div className="feedback-modal" style={{ zIndex: 1950 }}>
          <div className="feedback-card" style={{ maxWidth: '450px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, border: '3px solid #ef4444' }}>
            <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', background: 'white' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>⚠️</div>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '22px', fontWeight: '900', color: '#dc2626', margin: 0 }}>
                حذف الطالبة نهائياً
              </h3>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                تحذير: سيتم حذف الطالبة <strong>({deleteStudent.name})</strong> وكافة أسلوب تقدمها وتسليماتها البالغة ({deleteStudent.submissions_count || 0}) عمل بشكل نهائي.
                <br />
                <strong style={{ color: '#dc2626' }}>لا يمكن التراجع عن هذه العملية بعد التنفيذ.</strong>
              </p>
            </div>
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="hero-start-btn"
                style={{ background: '#dc2626', color: 'white', padding: '10px 20px', fontSize: '15px', boxShadow: 'none' }}
                onClick={handleDeleteStudent}
              >
                🗑️ نعم، حذف نهائي
              </button>
              <button
                className="teacher-login-btn"
                onClick={() => setDeleteStudent(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
