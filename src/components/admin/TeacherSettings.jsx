import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, ShieldCheck, Lock, CheckCircle, AlertCircle, Building2, Image as ImageIcon, Upload, RotateCcw, Save, Sparkles, User, Code2 } from 'lucide-react';

export default function TeacherSettings({ token, username, showToast, openMediaPickerFor }) {
  const [activeTab, setActiveTab] = useState('identity'); // identity | account | general

  // Site Identity State
  const [settings, setSettings] = useState({
    hero_welcome_image: '/uploads/images/main01_1791184907790_p3b9e.png',
    country: 'دولة فلسطين',
    ministry: 'وزارة التربية والتعليم العالي',
    directorate: 'مديرية التربية والتعليم - الخليل',
    school: 'مدرسة السيدة هاجر للبنات',
    teacher_name: 'نسرين بوجه الحسيني',
    grade: 'الصف الثاني الأساسي',
    book: 'لغتنا الجميلة',
    show_identity_card: 'true',
    show_developer_signature: 'true',
    developer_signature: 'eng.Khalil'
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [passError, setPassError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('تم حفظ إعدادات هوية الموقع بنجاح ✅');
        setSettingsMsg('تم حفظ إعدادات هوية الموقع بنجاح ✅');
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } else {
        showToast(data.message || 'تعذر حفظ إعدادات الموقع');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('خطأ في الاتصال بالخادم أثناء حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUploadWelcomeImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setSettings(prev => ({ ...prev, hero_welcome_image: data.url }));
        showToast('تم رفع الصورة بنجاح (اضغطي حفظ التغييرات لاكتمال التحديث)');
      } else {
        showToast('فشل رفع الصورة');
      }
    } catch (err) {
      showToast('خطأ أثناء رفع الصورة');
    }
  };

  const handleResetDefaultWelcomeImage = () => {
    const defaultImg = '/uploads/images/main01_1791184907790_p3b9e.png';
    setSettings(prev => ({ ...prev, hero_welcome_image: defaultImg }));
    showToast('تمت استعادة الصورة الافتراضية main01 (اضغطي حفظ التغييرات)');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    setPassError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('جميع حقول كلمة المرور مطلوبة');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('كلمة المرور الجديدة والتأكيد غير متطابقين');
      return;
    }

    if (newPassword.length < 4) {
      setPassError('كلمة المرور الجديدة يجب أن تكون 4 أحرف أو أرقام على الأقل');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPassMsg(data.message || 'تم تغيير كلمة المرور بنجاح ✅');
        showToast('تم تغيير كلمة المرور بنجاح ✅');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(data.message || 'تعذر تغيير كلمة المرور');
      }
    } catch (err) {
      setPassError('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="content-box">
      {/* Settings Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#0284c7', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={28} />
          <span>إعدادات منظومة لغتي الجميلة ⚙️</span>
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px', margin: 0 }}>
          إدارة هوية الموقع، وحساب المعلمة، والإعدادات العامة.
        </p>
      </div>

      {/* Settings Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('identity')}
          style={{
            padding: '10px 20px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'identity' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'identity' ? 'white' : '#475569',
            fontWeight: '900',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Building2 size={18} />
          <span>1. 🏫 هوية الموقع</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '10px 20px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'account' ? '#db2777' : '#f1f5f9',
            color: activeTab === 'account' ? 'white' : '#475569',
            fontWeight: '900',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <User size={18} />
          <span>2. 👤 حساب المعلم</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 20px',
            borderRadius: '14px',
            border: 'none',
            background: activeTab === 'general' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'general' ? 'white' : '#475569',
            fontWeight: '900',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <SettingsIcon size={18} />
          <span>3. ⚙️ إعدادات عامة</span>
        </button>
      </div>

      {/* SECTION 1: SITE IDENTITY */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {settingsMsg && (
            <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', color: '#15803d', padding: '12px 18px', borderRadius: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span>{settingsMsg}</span>
            </div>
          )}

          {/* 1. Welcome Image Card */}
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={22} color="#0284c7" />
              <span>صورة الترحيب (Hero Welcome Image)</span>
            </h3>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '160px',
                height: '140px',
                borderRadius: '16px',
                border: '2px dashed #cbd5e1',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '8px'
              }}>
                <img
                  src={settings.hero_welcome_image}
                  alt="صورة الترحيب"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = '/uploads/images/main01_1791184907790_p3b9e.png'; }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '240px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700' }}>
                  الصورة تظهر في الجهة اليسرى من هيرو الصفحة الرئيسية للطالبة (الافتراضية: main01):
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ background: '#d97706', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
                    onClick={() => {
                      if (openMediaPickerFor) {
                        openMediaPickerFor((selectedUrl) => {
                          setSettings(prev => ({ ...prev, hero_welcome_image: selectedUrl }));
                          showToast('تم اختيار الصورة من المكتبة (اضغطي حفظ التغييرات)');
                        });
                      } else {
                        showToast('مكتبة الوسائط غير متاحة حالياً');
                      }
                    }}
                  >
                    <ImageIcon size={16} />
                    <span>اختيار من مكتبة الوسائط</span>
                  </button>

                  <label style={{ background: '#0284c7', color: 'white', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    <Upload size={16} />
                    <span>رفع صورة جديدة</span>
                    <input type="file" accept="image/*" onChange={handleUploadWelcomeImage} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetDefaultWelcomeImage}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
                  >
                    <RotateCcw size={16} />
                    <span>استعادة الصورة الافتراضية (main01)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. School Info Fields */}
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={22} color="#0284c7" />
              <span>بيانات هوية المدرسة والمادة</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>الدولة:</label>
                <input
                  type="text"
                  value={settings.country || ''}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>الوزارة:</label>
                <input
                  type="text"
                  value={settings.ministry || ''}
                  onChange={(e) => setSettings({ ...settings, ministry: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>المديرية:</label>
                <input
                  type="text"
                  value={settings.directorate || ''}
                  onChange={(e) => setSettings({ ...settings, directorate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>المدرسة:</label>
                <input
                  type="text"
                  value={settings.school || ''}
                  onChange={(e) => setSettings({ ...settings, school: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>اسم المعلمة:</label>
                <input
                  type="text"
                  value={settings.teacher_name || ''}
                  onChange={(e) => setSettings({ ...settings, teacher_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>الصف الدراسي:</label>
                <input
                  type="text"
                  value={settings.grade || ''}
                  onChange={(e) => setSettings({ ...settings, grade: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>اسم الكتاب / المقرر:</label>
                <input
                  type="text"
                  value={settings.book || ''}
                  onChange={(e) => setSettings({ ...settings, book: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Identity Card & Signature Controls */}
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={22} color="#7c3aed" />
              <span>خيارات العرض والتوقيع في الصفحة الرئيسية</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'white', padding: '14px 18px', borderRadius: '16px', border: '1.5px solid #cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={settings.show_identity_card === 'true' || settings.show_identity_card === true}
                  onChange={(e) => setSettings({ ...settings, show_identity_card: e.target.checked ? 'true' : 'false' })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  إظهار بطاقة هوية الموقع في أسفل الصفحة الرئيسية للطالبة
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'white', padding: '14px 18px', borderRadius: '16px', border: '1.5px solid #cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={settings.show_developer_signature === 'true' || settings.show_developer_signature === true}
                  onChange={(e) => setSettings({ ...settings, show_developer_signature: e.target.checked ? 'true' : 'false' })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  إظهار توقيع المطور أسفل بطاقة الهوية
                </span>
              </label>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  توقيع المطور:
                </label>
                <input
                  type="text"
                  value={settings.developer_signature || 'eng.Khalil'}
                  onChange={(e) => setSettings({ ...settings, developer_signature: e.target.value })}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700' }}
                />
              </div>
            </div>
          </div>

          {/* Save Settings Action Button */}
          <div>
            <button
              type="submit"
              disabled={savingSettings}
              className="hero-start-btn"
              style={{
                background: '#0284c7',
                color: 'white',
                padding: '14px 32px',
                fontSize: '18px',
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Save size={20} />
              <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات 💾'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: TEACHER ACCOUNT */}
      {activeTab === 'account' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '24px', padding: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={30} />
            </div>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0369a1', marginBottom: '8px' }}>
              معلومات الحساب الحالي
            </h3>
            <p style={{ fontSize: '14px', color: '#0c4a6e', fontWeight: '700', marginBottom: '16px' }}>
              أهلاً بكِ معلمتنا الفاضلة. حسابكِ محمي بكلمة مرور لتوفير أقصى درجات الخصوصية للأعمال والطالبات.
            </p>
            <div style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: '16px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                اسم المستخدم: <strong style={{ color: '#0f172a', fontSize: '16px' }}>{username}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                نوع الحساب: <strong style={{ color: '#0284c7' }}>معلمة المادة (صلاحيات كاملة)</strong>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={22} color="#db2777" />
              <span>تغيير كلمة المرور 🔑</span>
            </h3>

            {passMsg && (
              <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', color: '#15803d', padding: '12px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                <span>{passMsg}</span>
              </div>
            )}

            {passError && (
              <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  كلمة المرور الحالية:
                </label>
                <input
                  type="password"
                  required
                  placeholder="أدخلي كلمة المرور الحالية..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  كلمة المرور الجديدة:
                </label>
                <input
                  type="password"
                  required
                  placeholder="أدخلي كلمة المرور الجديدة..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '900', fontSize: '14px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  تأكيد كلمة المرور الجديدة:
                </label>
                <input
                  type="password"
                  required
                  placeholder="أعيدي كتابة كلمة المرور الجديدة..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="hero-start-btn"
                style={{ background: '#db2777', color: 'white', padding: '12px 20px', fontSize: '16px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(219, 39, 119, 0.3)', marginTop: '8px' }}
              >
                <Lock size={18} />
                <span>{changingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور 🔐'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Cairo', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={22} color="#7c3aed" />
            <span>معلومات وبيئة التشغيل</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>إصدار المنظومة</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#7c3aed' }}>Lughati LMS v1.0.0</div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>قاعدة البيانات</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7' }}>SQLite3 (محلية وآمنة)</div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>منظومة الاستضافة</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>Express / Node.js</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
