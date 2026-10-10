import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Upload, Trash2, Edit, Plus, Check, X, LogOut, Eye, 
  AlertTriangle, Sparkles, FileText, Music, PenTool, Edit3, Trophy, Settings as SettingsIcon,
  Menu, Play, Volume2, Image as ImageIcon, Video, ArrowUp, ArrowDown, ArrowRight,
  Brain, Target, MessageCircle, Key, Layers, HelpCircle, FolderCheck, Search, Filter, CheckCircle,
  Users, UserPlus
} from 'lucide-react';

import MediaPickerModal from './admin/MediaPickerModal.jsx';
import ActivityPreviewModal from './admin/ActivityPreviewModal.jsx';
import SectionContentManager from './admin/SectionContentManager.jsx';
import ReviewDrillsManager from './admin/ReviewDrillsManager.jsx';
import WritingManager from './admin/WritingManager.jsx';
import DictationManager from './admin/DictationManager.jsx';
import ExpressionManager from './admin/ExpressionManager.jsx';
import ThinkingKeysManager from './ThinkingKeysManager.jsx';
import QuizManager from './admin/QuizManager.jsx';
import SkillPreviewModal from './admin/SkillPreviewModal.jsx';
import StudentsManager from './admin/StudentsManager.jsx';
import TeacherSettings from './admin/TeacherSettings.jsx';
import { getSectionLabel, SECTION_LABELS } from '../utils/sectionLabels.js';

export default function TeacherAdmin({ token, username, onLogout, onGoToStudentView }) {
  // Main Navigation State: 'overview', 'lessons', 'submissions_page', 'single_lesson_manage', 'media', 'settings'
  const [activeMainTab, setActiveMainTab] = useState('lessons');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [skillPreviewState, setSkillPreviewState] = useState(null);

  // Lessons Data
  const [stats, setStats] = useState({ lessons: 0, activities: 0, questions: 0, media: 0, vocab: 0 });
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Basic Lesson Data Form State
  const [basicForm, setBasicForm] = useState({
    title: '',
    description: '',
    welcome_message: '',
    image: '',
    status: 'published',
    sort_order: 1
  });
  const [tempImagePreview, setTempImagePreview] = useState(null);

  // Standalone Submissions Page State & Filters
  const [filterLessonId, setFilterLessonId] = useState('all');
  const [filterStudentName, setFilterStudentName] = useState('all');
  const [filterSectionType, setFilterSectionType] = useState('all');
  const [filterSubmissionType, setFilterSubmissionType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [pageSubmissions, setPageSubmissions] = useState([]);
  const [modalTeacherNote, setModalTeacherNote] = useState('');

  // Inner Lesson Management Tab State
  // 'basic', 'listening', 'observe', 'reading', 'comprehension', 'activities', 'writing', 'dictation', 'expression', 'enrichment', 'thinking_keys', 'quiz'
  const [innerLessonTab, setInnerLessonTab] = useState('basic');
  const [adminAtadarrabSubTab, setAdminAtadarrabSubTab] = useState('games');

  const GAME_TYPE_LABELS = {
    ordering: 'ترتيب أحداث القصة',
    true_false: 'صح أم خطأ',
    multiple_choice: 'اختيار من متعدد',
    matching: 'توصيل الكلمات',
    missing_letter: 'حرف ناقص',
    sentence_order: 'ترتيب كلمات الجملة',
    memory: 'لعبة الذاكرة',
    match_meaning: 'توصيل المعاني',
    match_image: 'توصيل الصور',
    word_order: 'ترتيب الكلمات',
    letter_select: 'اختيار الحرف',
    classification: 'تصنيف الكلمات',
    syllables_combine: 'تركيب المقاطع',
    word_analysis: 'تحليل الكلمات',
    html_game: 'لعبة HTML5 جاهزة 🎮'
  };

  // Loaded Data for Selected Lesson
  const [sectionsList, setSectionsList] = useState([]);
  const [vocabularyList, setVocabularyList] = useState([]);
  const [comprehensionQuestions, setComprehensionQuestions] = useState([]);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [enrichmentList, setEnrichmentList] = useState([]);
  const [writingList, setWritingList] = useState([]);
  const [dictationData, setDictationData] = useState({ title: '', target_text: '', audio: '', instructions: '', is_enabled: 1 });
  const [chantData, setChantData] = useState({ title: '', author: '', content: '', image: '', audio: '', is_enabled: 1 });
  const [mediaList, setMediaList] = useState([]);

  // Modals & Controls
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState(null);
  const [showActivityPreview, setShowActivityPreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [viewSubmissionModal, setViewSubmissionModal] = useState(null);

  // Vocab Modal
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [vocabForm, setVocabForm] = useState({ word: '', meaning: '', image: '', audio: '', sort_order: 1, is_enabled: 1 });
  const [editingVocabId, setEditingVocabId] = useState(null);

  // Question Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionSectionTarget, setQuestionSectionTarget] = useState('comprehension');
  const [questionForm, setQuestionForm] = useState({
    question_type: 'mcq',
    question_text: '',
    options: ['إجابة 1', 'إجابة 2', 'إجابة 3'],
    correct_answer: 'إجابة 1',
    sort_order: 1,
    is_enabled: 1
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Activity Modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'match_meaning',
    title: '',
    instructions: '',
    activity_data: { pairs: [{ left: 'الكلمة', right: 'المعنى' }] },
    sort_order: 1,
    is_enabled: 1
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    fetchStats();
    fetchLessons();
    fetchMedia();
  }, []);

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonAllData(selectedLesson.id);
    }
  }, [selectedLesson]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  };

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/admin/lessons', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
        if (data.length > 0 && !selectedLesson) {
          setSelectedLesson(data[0]);
        }
      }
    } catch (e) {}
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMediaList(await res.json());
    } catch (e) {}
  };

  const fetchLessonAllData = async (lessonId) => {
    try {
      const [secRes, vRes, qRes, aRes, eRes, wRes, dRes, cRes] = await Promise.all([
        fetch(`/api/admin/sections?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/vocabulary?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/questions?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/activities?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/enrichments?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/writing?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/dictation?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/chant?lesson_id=${lessonId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (secRes.ok) setSectionsList(await secRes.json());
      if (vRes.ok) setVocabularyList(await vRes.json());
      if (qRes.ok) {
        const allQ = await qRes.json();
        setComprehensionQuestions(allQ.filter(q => q.section_type === 'comprehension'));
        setReviewQuestions(allQ.filter(q => q.section_type === 'review'));
        setQuizQuestions(allQ.filter(q => q.section_type === 'quiz'));
      }
      if (aRes.ok) setActivitiesList(await aRes.json());
      if (eRes.ok) setEnrichmentList(await eRes.json());
      if (wRes.ok) setWritingList(await wRes.json());
      if (dRes.ok) setDictationData(await dRes.json());
      if (cRes.ok) setChantData(await cRes.json());

      // Fetch Submissions for this lesson
      fetchAdminSubmissions(lessonId);
    } catch (e) {}
  };

  const fetchAdminSubmissions = async (lessonId) => {
    try {
      const res = await fetch(`/api/admin/submissions?lesson_id=${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminSubmissions(await res.json());
      }
    } catch (e) {}
  };

  const openMediaPickerFor = (callback) => {
    setMediaPickerTarget(() => callback);
    setShowMediaPicker(true);
  };

  useEffect(() => {
    if (activeMainTab === 'submissions_page') {
      fetchPageSubmissions();
    }
  }, [activeMainTab, filterLessonId, filterStudentName, filterSectionType, filterSubmissionType, filterStatus, filterSearch]);

  const fetchPageSubmissions = async () => {
    try {
      const queryParams = new URLSearchParams({
        lesson_id: filterLessonId,
        student_name: filterStudentName,
        section_type: filterSectionType,
        submission_type: filterSubmissionType,
        status: filterStatus,
        search: filterSearch
      });
      const res = await fetch(`/api/admin/submissions?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPageSubmissions(await res.json());
      }
    } catch (e) {}
  };

  const handleOpenLessonManage = (lesson) => {
    setSelectedLesson(lesson);
    setBasicForm({
      title: lesson.title || '',
      description: lesson.description || '',
      welcome_message: lesson.welcome_message || 'استعدي لرحلة ممتعة ومبدعة في هذا الدرس يا بطلة!',
      image: lesson.image || '',
      status: lesson.status || (lesson.is_published === 0 ? 'hidden' : 'published'),
      sort_order: lesson.sort_order || 1
    });
    setTempImagePreview(null);
    setActiveMainTab('single_lesson_manage');
    setInnerLessonTab('basic');
  };

  const handleOpenSkillPreview = async (secType) => {
    if (!selectedLesson) return;
    try {
      let contents = [];
      if (secType === 'writing') {
        const res = await fetch(`/api/admin/writing-drills?lesson_id=${selectedLesson.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          contents = await res.json();
        }
      } else if (secType === 'dictation') {
        const res = await fetch(`/api/admin/dictation-drills?lesson_id=${selectedLesson.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          contents = await res.json();
        }
      } else if (secType === 'expression') {
        const res = await fetch(`/api/admin/expression-drills?lesson_id=${selectedLesson.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          contents = await res.json();
        }
      } else {
        const res = await fetch(`/api/admin/section-contents?lesson_id=${selectedLesson.id}&section_type=${secType}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          contents = await res.json();
        }
      }

      const tabObj = innerTabs.find(t => t.id === secType);
      setSkillPreviewState({
        lessonTitle: selectedLesson.title,
        sectionTitle: tabObj ? tabObj.title : (secType === 'writing' ? 'أكتب بخط جميل' : secType),
        sectionType: secType,
        lessonId: selectedLesson.id,
        contents
      });
    } catch (e) {
      console.error('Error in handleOpenSkillPreview:', e);
    }
  };

  const handleSaveBasicData = async () => {
    if (!selectedLesson) return;
    try {
      const finalImage = tempImagePreview !== null ? tempImagePreview : basicForm.image;
      const res = await fetch(`/api/admin/lessons/${selectedLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...basicForm,
          image: finalImage,
          is_published: basicForm.status === 'hidden' ? 0 : 1
        })
      });
      if (res.ok) {
        showToast('تم حفظ بيانات الدرس بنجاح ✅');
        const updatedLesson = { ...selectedLesson, ...basicForm, image: finalImage, is_published: basicForm.status === 'hidden' ? 0 : 1 };
        setSelectedLesson(updatedLesson);
        setBasicForm(prev => ({ ...prev, image: finalImage }));
        setTempImagePreview(null);
        fetchLessons();
      }
    } catch (e) {
      showToast('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'lessons');

    try {
      const res = await fetch('/api/admin/upload?category=lessons', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.fileUrl || data.url;
        setTempImagePreview(uploadedUrl);
        setBasicForm(prev => ({ ...prev, image: uploadedUrl }));
        showToast('تم رفع الصورة بنجاح ✅');
        if (typeof fetchMedia === 'function') {
          fetchMedia();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Upload Error Details:', { status: res.status, statusText: res.statusText, body: errData });
        showToast('تعذر رفع الصورة');
      }
    } catch (err) {
      console.error('Upload Exception:', err);
      showToast('تعذر رفع الصورة');
    }
  };

  const handleToggleLessonPublished = async (lesson) => {
    try {
      const currentStatus = lesson.status || (lesson.is_published ? 'published' : 'hidden');
      const nextStatus = currentStatus === 'published' ? 'hidden' : 'published';
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...lesson, status: nextStatus, is_published: nextStatus === 'hidden' ? 0 : 1 })
      });
      if (res.ok) {
        showToast('تم تحديث حالة نشر الدرس');
        fetchLessons();
      }
    } catch (e) {}
  };

  const handleSaveSection = async (sec) => {
    try {
      const res = await fetch(`/api/admin/sections/${sec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sec)
      });
      if (res.ok) {
        showToast('تم حفظ التعديلات بنجاح');
        fetchLessonAllData(selectedLesson.id);
      }
    } catch (e) {}
  };

  const handleToggleActivityStatus = async (act) => {
    try {
      await fetch(`/api/admin/activities/${act.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...act, is_enabled: act.is_enabled ? 0 : 1 })
      });
      showToast('تم تحديث حالة إظهار اللعبة');
      fetchLessonAllData(selectedLesson.id);
    } catch (e) {}
  };

  const handleReorderActivity = async (index, direction) => {
    if (!activitiesList || activitiesList.length < 2) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activitiesList.length) return;

    const currentAct = activitiesList[index];
    const targetAct = activitiesList[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/admin/activities/${currentAct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...currentAct, sort_order: targetAct.sort_order || targetIndex + 1 })
        }),
        fetch(`/api/admin/activities/${targetAct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...targetAct, sort_order: currentAct.sort_order || index + 1 })
        })
      ]);
      showToast('تم تحديث ترتيب اللعبة');
      if (selectedLesson?.id) fetchLessonAllData(selectedLesson.id);
    } catch (e) {
      showToast('تعذر تحديث الترتيب');
    }
  };

  const handleSaveVocab = async (e) => {
    e.preventDefault();
    try {
      const url = editingVocabId ? `/api/admin/vocabulary/${editingVocabId}` : '/api/admin/vocabulary';
      const method = editingVocabId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...vocabForm, lesson_id: selectedLesson.id })
      });
      if (res.ok) {
        showToast('تم حفظ الكلمة بنجاح');
        setShowVocabModal(false);
        fetchLessonAllData(selectedLesson.id);
      }
    } catch (e) {}
  };

  const handleSaveDictation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/dictation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...dictationData, lesson_id: selectedLesson?.id || 1 })
      });
      if (res.ok) showToast('تم حفظ الإملاء بنجاح');
    } catch (e) {}
  };

  const handleSaveChant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/chant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...chantData, lesson_id: selectedLesson?.id || 1 })
      });
      if (res.ok) showToast('تم حفظ بيانات النشيد بنجاح');
    } catch (e) {}
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    let endpoint = '';
    if (type === 'vocabulary') endpoint = `/api/admin/vocabulary/${id}`;
    if (type === 'question') endpoint = `/api/admin/questions/${id}`;
    if (type === 'activity') endpoint = `/api/admin/activities/${id}`;
    if (type === 'media') endpoint = `/api/admin/media/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteConfirm(null);
        showToast('تم الحذف بنجاح');
        fetchMedia();
        if (selectedLesson) fetchLessonAllData(selectedLesson.id);
      }
    } catch (e) {}
  };

  // Main Sidebar Items
  const mainSidebarItems = [
    { id: 'overview', title: 'نظرة عامة', icon: <LayoutDashboard size={22} /> },
    { id: 'lessons', title: 'الدروس', icon: <BookOpen size={22} /> },
    { id: 'students', title: 'الطالبات', icon: <Users size={22} /> },
    { id: 'submissions_page', title: 'أعمال الطالبات', icon: <FolderCheck size={22} /> },
    { id: 'media', title: 'مكتبة الوسائط', icon: <Upload size={22} /> },
    { id: 'settings', title: 'الإعدادات', icon: <SettingsIcon size={22} /> }
  ];

  // 13 Inner Lesson Management Tabs
  const innerTabs = [
    { id: 'submissions', title: 'أعمال الطالبات', icon: '👧' },
    { id: 'basic', title: 'البيانات الأساسية', icon: '📋' },
    { id: 'listening', title: 'أستمع', icon: '🎧' },
    { id: 'observe', title: 'أتحدث', icon: '💬' },
    { id: 'reading', title: 'أقرأ (والكلمات)', icon: '📖' },
    { id: 'comprehension', title: 'أفكر بذكاء', icon: '🧠' },
    { id: 'activities', title: 'أتدرب (الألعاب)', icon: '🎯' },
    { id: 'writing', title: 'أكتب بخط جميل', icon: '✏️' },
    { id: 'dictation', title: 'أستمع وأكتب', icon: '🔊' },
    { id: 'expression', title: 'أعبر', icon: '🗣️' },
    { id: 'enrichment', title: 'إثراء', icon: '⭐' },
    { id: 'thinking_keys', title: 'مفاتيح التفكير', icon: '🔑' },
    { id: 'quiz', title: 'الاختبار النهائي', icon: '🏆' }
  ];

  return (
    <div className="admin-container">
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '9999px',
          fontWeight: '800', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Menu Header */}
      <div className="mobile-admin-header">
        <div style={{ fontWeight: '900', fontSize: '20px', color: '#38bdf8' }}>لوحة المعلم 🏫</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div 
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Sidebar Navigation (Only 6 Items) */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '0 8px 20px 8px', borderBottom: '1px solid #1e293b', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>
            لوحة المعلم 🏫
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>أهلاً بك، {username}</p>
        </div>

        <nav style={{ flexGrow: 1 }}>
          {mainSidebarItems.map((item) => (
            <div
              key={item.id}
              className={`admin-nav-item ${activeMainTab === item.id || (activeMainTab === 'single_lesson_manage' && item.id === 'lessons') ? 'active' : ''}`}
              onClick={() => {
                setActiveMainTab(item.id);
                setSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.title}</span>
            </div>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="teacher-login-btn" onClick={onGoToStudentView} style={{ width: '100%', justifyContent: 'center', background: '#1e293b', color: '#38bdf8', borderColor: '#0284c7' }}>
            <Eye size={18} />
            <span>🎓 واجهة الطالبة</span>
          </button>
          <button className="teacher-login-btn" onClick={onLogout} style={{ width: '100%', justifyContent: 'center', background: '#450a0a', color: '#fca5a5', borderColor: '#991b1b' }}>
            <LogOut size={18} />
            <span>🚪 تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* 1. OVERVIEW TAB */}
        {activeMainTab === 'overview' && (
          <div>
            <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900', marginBottom: '24px' }}>
              📊 نظرة عامة وإحصائيات المنظومة
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="progress-card" style={{ borderRight: '6px solid #10b981', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '700' }}>دروس المنهاج</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>{stats.lessons || 12}</div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #0284c7', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '700' }}>الأنشطة والألعاب</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>{stats.activities}</div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #7c3aed', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '700' }}>الأسئلة والتمارين</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#7c3aed', marginTop: '4px' }}>{stats.questions}</div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #d97706', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '700' }}>الكلمات والمفردات</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>{stats.vocab}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LESSONS DIRECTORY TAB (ALL 12 LESSONS) */}
        {activeMainTab === 'lessons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900' }}>
                📚 جميع دروس الصف الثاني الأساسي (12 درساً)
              </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {lessons.map((lesson) => {
                const status = lesson.status || (lesson.is_published ? 'published' : 'hidden');
                const isPublished = status === 'published';
                const isDraft = status === 'draft';
                const isDisabled = status === 'disabled';

                return (
                  <div key={lesson.id} style={{ background: 'white', borderRadius: '20px', border: '2px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#fdf2f8', border: '2px solid #fbcfe8', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={lesson.image || `/uploads/lesson_${lesson.id}.svg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/uploads/lesson_1.svg'; }} />
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>{lesson.title}</h3>
                          <span style={{ 
                            fontSize: '12px', 
                            padding: '3px 10px', 
                            borderRadius: '9999px', 
                            background: isPublished ? '#d1fae5' : isDraft ? '#fef3c7' : isDisabled ? '#fee2e2' : '#f1f5f9', 
                            color: isPublished ? '#065f46' : isDraft ? '#b45309' : isDisabled ? '#991b1b' : '#475569', 
                            fontWeight: '800' 
                          }}>
                            {isPublished ? 'منشور ✅' : isDraft ? 'قيد الإعداد ⏳' : isDisabled ? 'غير فعال ⛔' : 'مخفي 👁️‍🗨️'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
                        {lesson.description || 'لا يوجد وصف مختصر محدد للدرس بعد'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="hero-start-btn"
                        style={{ fontSize: '14px', padding: '8px 16px', boxShadow: 'none', background: '#0284c7', color: 'white', flexGrow: 1, justifyContent: 'center' }}
                        onClick={() => handleOpenLessonManage(lesson)}
                      >
                        <Edit size={16} />
                        <span>إدارة الدرس</span>
                      </button>

                      <button
                        style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                        onClick={() => handleToggleLessonPublished(lesson)}
                      >
                        {isPublished ? 'تغيير إلى مخفي 🙈' : 'تغيير إلى منشور 👁️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. STANDALONE SUBMISSIONS PAGE TAB */}
        {activeMainTab === 'submissions_page' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>
                  👧 أعمال الطالبات وتسليماتهن
                </h1>
                <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>
                  استعرضي وراجعي جميع الأعمال المرسلة من طالبات الصف الثاني
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="progress-card" style={{ borderRight: '6px solid #0284c7', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '800' }}>إجمالي التسليمات</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>{pageSubmissions.length}</div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #d97706', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '800' }}>أعمال جديدة 🆕</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
                  {pageSubmissions.filter(s => s.status === 'new').length}
                </div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #059669', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '800' }}>تمت المشاهدة 👁️</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                  {pageSubmissions.filter(s => s.status === 'viewed').length}
                </div>
              </div>
              <div className="progress-card" style={{ borderRight: '6px solid #7c3aed', margin: 0 }}>
                <div style={{ color: '#64748b', fontWeight: '800' }}>تمت المراجعة ✅</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#7c3aed', marginTop: '4px' }}>
                  {pageSubmissions.filter(s => s.status === 'reviewed').length}
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} color="#0284c7" />
                <span>تصفية وتصفية الأعمال:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {/* الدرس Filter */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>الدرس:</label>
                  <select
                    value={filterLessonId}
                    onChange={(e) => setFilterLessonId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', fontWeight: '800', background: 'white' }}
                  >
                    <option value="all">جميع الدروس (الكل) ▼</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                {/* المهارة Filter */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>المهارة:</label>
                  <select
                    value={filterSectionType}
                    onChange={(e) => setFilterSectionType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', fontWeight: '800', background: 'white' }}
                  >
                    <option value="all">جميع المهارات (الكل) ▼</option>
                    {Object.keys(SECTION_LABELS).map((stype) => (
                      <option key={stype} value={stype}>{SECTION_LABELS[stype]}</option>
                    ))}
                  </select>
                </div>

                {/* نوع العمل Filter */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>نوع العمل:</label>
                  <select
                    value={filterSubmissionType}
                    onChange={(e) => setFilterSubmissionType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', fontWeight: '800', background: 'white' }}
                  >
                    <option value="all">جميع الأنواع (الكل) ▼</option>
                    <option value="text">نص ✏️</option>
                    <option value="image">صورة 📷</option>
                    <option value="audio">صوت 🎤</option>
                  </select>
                </div>

                {/* الحالة Filter */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>الحالة:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', fontWeight: '800', background: 'white' }}
                  >
                    <option value="all">جميع الحالات (الكل) ▼</option>
                    <option value="new">جديد 🆕</option>
                    <option value="viewed">تمت المشاهدة 👁️</option>
                    <option value="reviewed">تمت المراجعة ✅</option>
                  </select>
                </div>

                {/* بحث باسم الطالبة */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>بحث:</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="ابحثي باسم الطالبة..."
                      style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', fontWeight: '800' }}
                    />
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            {pageSubmissions.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#64748b', fontWeight: '800' }}>
                لا توجد أعمال مطابقة للفلاتر المحددة حالياً.
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>الطالبة</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>الدرس</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>المهارة</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>السؤال</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>نوع العمل</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>التاريخ</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900' }}>الحالة</th>
                        <th style={{ padding: '14px 18px', fontWeight: '900', textAlign: 'center' }}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageSubmissions.map((sub) => {
                        const isNew = sub.status === 'new';
                        const isReviewed = sub.status === 'reviewed';

                        return (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', background: isNew ? '#fffbe6' : 'white' }}>
                            <td style={{ padding: '16px 18px', fontWeight: '900', color: '#1e293b' }}>
                              {sub.student_name}
                            </td>
                            <td style={{ padding: '16px 18px', fontWeight: '800', color: '#0284c7' }}>
                              {sub.lesson_title || 'الدرس'}
                            </td>
                            <td style={{ padding: '16px 18px', fontWeight: '700', color: '#475569' }}>
                              {getSectionLabel(sub.section_type)}
                            </td>
                            <td style={{ padding: '16px 18px', fontWeight: '800', color: '#9d174d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.question_text || 'سؤال المهارة'}
                            </td>
                            <td style={{ padding: '16px 18px', fontWeight: '700' }}>
                              {sub.submission_type === 'image' ? '📷 صورة' : sub.submission_type === 'audio' ? '🎤 صوت' : '✏️ نص'}
                            </td>
                            <td style={{ padding: '16px 18px', fontSize: '13px', color: '#64748b' }}>
                              {new Date(sub.created_at).toLocaleDateString('ar-EG')}
                            </td>
                            <td style={{ padding: '16px 18px' }}>
                              <span style={{ 
                                padding: '4px 12px', 
                                borderRadius: '9999px', 
                                fontSize: '13px', 
                                fontWeight: '900', 
                                background: isNew ? '#fef08a' : isReviewed ? '#dcfce7' : '#e0f2fe', 
                                color: isNew ? '#854d0e' : isReviewed ? '#166534' : '#0369a1' 
                              }}>
                                {isNew ? 'جديد 🆕' : isReviewed ? 'تمت المراجعة ✅' : 'تمت المشاهدة 👁️'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                              <button
                                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                                onClick={async () => {
                                  setViewSubmissionModal(sub);
                                  setModalTeacherNote(sub.teacher_note || '');
                                  if (sub.status === 'new') {
                                    try {
                                      await fetch(`/api/admin/submissions/${sub.id}/status`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ status: 'viewed' })
                                      });
                                      fetchPageSubmissions();
                                    } catch (e) {}
                                  }
                                }}
                              >
                                👁️ عرض العمل
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SINGLE LESSON MANAGEMENT VIEW (`إدارة درس: الأرض`) */}
        {activeMainTab === 'single_lesson_manage' && selectedLesson && (
          <div>
            {/* Top Bar Navigation & Header */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '20px 24px', border: '2px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setActiveMainTab('lessons')}
                  style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowRight size={18} />
                  <span>العودة للدروس</span>
                </button>

                <div>
                  <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '26px', fontWeight: '900', color: '#0284c7' }}>
                    إدارة درس: {selectedLesson.title}
                  </h1>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="hero-start-btn"
                  style={{ fontSize: '14px', padding: '8px 16px', boxShadow: 'none', background: '#10b981', color: 'white' }}
                  onClick={onGoToStudentView}
                >
                  <Eye size={16} />
                  <span>معاينة كطالبة</span>
                </button>
              </div>
            </div>

            {/* Inner Horizontal Tabs (12 Skills & Components) */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
              {innerTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInnerLessonTab(tab.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '16px',
                    border: innerLessonTab === tab.id ? '2px solid #0284c7' : '2px solid #e2e8f0',
                    background: innerLessonTab === tab.id ? '#0284c7' : 'white',
                    color: innerLessonTab === tab.id ? 'white' : '#334155',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}

            {/* TAB: Student Submissions Link ("أعمال الطالبات لهذا الدرس") */}
            {innerLessonTab === 'submissions' && (
              <div className="content-box">
                <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#db2777', marginBottom: '20px' }}>
                  👧 أعمال طالبات درس ({selectedLesson.title})
                </h2>

                <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '20px', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#be185d', marginBottom: '8px' }}>
                      ملخص تسليمات درس {selectedLesson.title} 🌸
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '16px', fontWeight: '800', color: '#831843', flexWrap: 'wrap' }}>
                      <span>إجمالي الأعمال المرفوعة: <strong style={{ color: '#0284c7' }}>{adminSubmissions.length}</strong></span>
                      <span>أعمال جديدة لم تشاهد: <strong style={{ color: '#d97706' }}>{adminSubmissions.filter(s => s.status === 'new').length}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFilterLessonId(selectedLesson.id.toString());
                      setActiveMainTab('submissions_page');
                    }}
                    className="hero-start-btn"
                    style={{ background: '#db2777', color: 'white', padding: '12px 28px', fontSize: '16px', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.4)' }}
                  >
                    👧 عرض أعمال وتسليمات هذا الدرس
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Basic Data ("البيانات الأساسية للدرس") */}
            {innerLessonTab === 'basic' && (
              <div className="content-box">
                <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '24px', fontWeight: '900', color: '#0284c7', marginBottom: '20px' }}>
                  📋 البيانات الأساسية لدرس ({selectedLesson?.title})
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* 1. اسم الدرس */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      1. اسم الدرس (يعرض للطالبة بدون أرقام):
                    </label>
                    <input
                      type="text"
                      value={basicForm.title}
                      onChange={(e) => setBasicForm({ ...basicForm, title: e.target.value })}
                      placeholder="اسم الدرس..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '18px', fontWeight: '800' }}
                    />
                  </div>

                  {/* 2. الوصف المختصر */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      2. الوصف المختصر (يظهر في بطاقة الدرس بالصفحة الرئيسية):
                    </label>
                    <textarea
                      rows={3}
                      value={basicForm.description}
                      onChange={(e) => setBasicForm({ ...basicForm, description: e.target.value })}
                      placeholder="الوصف المختصر للدرس..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', lineHeight: '1.6' }}
                    />
                  </div>

                  {/* 3. العبارة الترحيبية */}
                  <div>
                    <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      3. العبارة الترحيبية (تظهر في أعلى صفحة الدرس للطالبة):
                    </label>
                    <input
                      type="text"
                      value={basicForm.welcome_message}
                      onChange={(e) => setBasicForm({ ...basicForm, welcome_message: e.target.value })}
                      placeholder="العبارة الترحيبية..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '700' }}
                    />
                  </div>

                  {/* 4. الصورة الرئيسية للدرس */}
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0' }}>
                    <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>
                      4. الصورة الرئيسية للدرس:
                    </label>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '140px', height: '140px', borderRadius: '16px', border: '3px solid #0284c7', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img
                          src={tempImagePreview !== null ? tempImagePreview : (basicForm.image || '/uploads/lesson_1.svg')}
                          alt="الصورة الرئيسية"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = '/uploads/lesson_1.svg'; }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '700' }}>
                          {tempImagePreview !== null ? 'معاينة الصورة الجديدة (اضغطي حفظ التعديلات لاعتمادها):' : 'الصورة الحالية للدرس:'}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <label className="hero-start-btn" style={{ background: '#0284c7', color: 'white', padding: '8px 18px', fontSize: '14px', boxShadow: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={16} />
                            <span>رفع صورة جديدة</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                          </label>

                          <button
                            type="button"
                            className="hero-start-btn"
                            style={{ background: '#d97706', color: 'white', padding: '8px 18px', fontSize: '14px', boxShadow: 'none' }}
                            onClick={() => {
                              openMediaPickerFor((selectedUrl) => {
                                setTempImagePreview(selectedUrl);
                                showToast('تم اختيار الصورة من المكتبة (اضغطي حفظ التعديلات)');
                              });
                            }}
                          >
                            🖼️ اختيار من مكتبة الوسائط
                          </button>

                          {tempImagePreview !== null && (
                            <button
                              type="button"
                              onClick={() => setTempImagePreview(null)}
                              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                            >
                              ↩️ إلغاء التغيير
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. حالة الدرس & 6. الترتيب */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                        5. حالة الدرس:
                      </label>
                      <select
                        value={basicForm.status}
                        onChange={(e) => setBasicForm({ ...basicForm, status: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800', background: 'white' }}
                      >
                        <option value="published">منشور ✅ (متاح للطالبات)</option>
                        <option value="draft">قيد الإعداد ⏳ (يظهر شارة قيد الإعداد)</option>
                        <option value="disabled">غير فعال ⛔ (غير متاح حالياً)</option>
                        <option value="hidden">مخفي 👁️‍🗨️ (لا يظهر للطالبات)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                        6. الترتيب الداخلي (للعرض فقط):
                      </label>
                      <input
                        type="number"
                        value={basicForm.sort_order}
                        onChange={(e) => setBasicForm({ ...basicForm, sort_order: parseInt(e.target.value, 10) || 1 })}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800' }}
                      />
                    </div>
                  </div>

                  {/* 7. زر حفظ التعديلات */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={handleSaveBasicData}
                      className="hero-start-btn"
                      style={{ background: '#059669', color: 'white', padding: '12px 32px', fontSize: '18px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
                    >
                      💾 حفظ التعديلات
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* TAB: Comprehension ("أفكر بذكاء") */}
            {innerLessonTab === 'comprehension' && (
              <div className="content-box">
                <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#7c3aed', marginBottom: '20px' }}>
                  🧠 أسئلة الفهم والإستيعاب والتفكير
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {comprehensionQuestions.map((q) => (
                    <div key={q.id} style={{ background: '#f3e8ff', border: '2px solid #d8b4fe', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#5b21b6' }}>{q.question_text}</div>
                        <div style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '700', marginTop: '4px' }}>الإجابة الصحيحة: {q.correct_answer}</div>
                      </div>
                      <button
                        style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                        onClick={() => setDeleteConfirm({ type: 'question', id: q.id, title: q.question_text })}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Activities & Pre-built Interactive Games ("أتدرب") */}
            {innerLessonTab === 'activities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Sub-Tab Navigation Header */}
                <div className="content-box" style={{ padding: '16px 20px', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#ea580c', margin: 0 }}>
                        🎯 مهارة أتدرب (الألعاب والتمارين)
                      </h2>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '700' }}>
                        تحكمي بإظهار وإخفاء الألعاب الجاهزة للطالبات أو إدارة تمارين المراجعة.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setAdminAtadarrabSubTab('games')}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '14px',
                          border: adminAtadarrabSubTab === 'games' ? '2px solid #ea580c' : '2px solid #cbd5e1',
                          background: adminAtadarrabSubTab === 'games' ? '#fff7ed' : 'white',
                          color: adminAtadarrabSubTab === 'games' ? '#c2410c' : '#64748b',
                          fontWeight: '900',
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🎮 ألعب وأتدرب (الألعاب الجاهزة)</span>
                      </button>

                      <button
                        onClick={() => setAdminAtadarrabSubTab('review')}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '14px',
                          border: adminAtadarrabSubTab === 'review' ? '2px solid #16a34a' : '2px solid #cbd5e1',
                          background: adminAtadarrabSubTab === 'review' ? '#f0fdf4' : 'white',
                          color: adminAtadarrabSubTab === 'review' ? '#15803d' : '#64748b',
                          fontWeight: '900',
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📝 أتدرب وأراجع (CMS التمارين)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SUB TAB 1: PREBUILT GAMES CONTROL PANEL */}
                {adminAtadarrabSubTab === 'games' && (
                  <div className="content-box">
                    {/* Statistics Header */}
                    <div style={{ background: '#fff7ed', border: '2px solid #ffedd5', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🎮</span>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#9a3412', margin: 0 }}>
                            حزمة الألعاب الجاهزة لدرس ({selectedLesson.title})
                          </h3>
                          <div style={{ fontSize: '14px', color: '#c2410c', fontWeight: '700', marginTop: '2px' }}>
                            الألعاب مجهزة ومسبقة التعبئة تلقائياً للدرس. لا تتطلب كتابة أسئلة يدوياً!
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontWeight: '800', fontSize: '15px' }}>
                        <span style={{ background: 'white', padding: '6px 14px', borderRadius: '10px', color: '#1e293b', border: '1px solid #fed7aa' }}>
                          إجمالي الألعاب: <strong style={{ color: '#ea580c' }}>{activitiesList.length}</strong>
                        </span>
                        <span style={{ background: 'white', padding: '6px 14px', borderRadius: '10px', color: '#1e293b', border: '1px solid #fed7aa' }}>
                          الظاهرة للطالبات: <strong style={{ color: '#16a34a' }}>{activitiesList.filter(a => a.is_enabled !== 0).length}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Games List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {activitiesList.map((act, idx) => {
                        const gameTypeLabel = GAME_TYPE_LABELS[act.activity_type] || 'لعبة تفاعلية';
                        const isEnabled = act.is_enabled !== 0;
                        const data = typeof act.activity_data === 'string'
                          ? JSON.parse(act.activity_data || '{}')
                          : (act.activity_data || {});
                        const gamePath = data.game_url || act.game_url;

                        return (
                          <div 
                            key={act.id} 
                            style={{ 
                              background: 'white', 
                              border: isEnabled ? '2px solid #fed7aa' : '2px solid #e2e8f0', 
                              borderRadius: '16px', 
                              padding: '20px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              flexWrap: 'wrap', 
                              gap: '16px',
                              opacity: isEnabled ? 1 : 0.85
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                              <span style={{ background: isEnabled ? '#ea580c' : '#94a3b8', color: 'white', padding: '6px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '16px' }}>
                                #{idx + 1}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <h4 style={{ fontSize: '19px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{act.title}</h4>
                                  <span style={{ background: '#ffedd5', color: '#c2410c', padding: '3px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}>
                                    {gameTypeLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                                  {act.instructions || 'اتبعي التعليمات للحل الصحيح'}
                                </div>
                                {gamePath && (
                                  <div style={{ fontSize: '13px', color: '#ea580c', marginTop: '4px', fontWeight: '700', fontFamily: 'monospace' }}>
                                    📂 {gamePath}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              {/* Reorder Buttons */}
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  disabled={idx === 0}
                                  onClick={() => handleReorderActivity(idx, 'up')}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: idx === 0 ? '#f1f5f9' : 'white',
                                    color: idx === 0 ? '#94a3b8' : '#475569',
                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="أعلى"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  disabled={idx === activitiesList.length - 1}
                                  onClick={() => handleReorderActivity(idx, 'down')}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: idx === activitiesList.length - 1 ? '#f1f5f9' : 'white',
                                    color: idx === activitiesList.length - 1 ? '#94a3b8' : '#475569',
                                    cursor: idx === activitiesList.length - 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="أسفل"
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </div>

                              {/* Visibility Toggle Switch */}
                              <button
                                onClick={() => handleToggleActivityStatus(act)}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '9999px',
                                  border: 'none',
                                  background: isEnabled ? '#d1fae5' : '#fee2e2',
                                  color: isEnabled ? '#065f46' : '#991b1b',
                                  fontWeight: '800',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{isEnabled ? '👁️ ظاهرة للطالبة ON' : '🙈 مخفية OFF'}</span>
                              </button>

                              {/* Preview Button */}
                              <button
                                className="hero-start-btn"
                                style={{ fontSize: '14px', padding: '8px 16px', boxShadow: 'none', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => setShowActivityPreview(act)}
                              >
                                <Eye size={16} />
                                <span>معاينة اللعبة</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {activitiesList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '17px', fontWeight: '700' }}>
                          جارٍ تحميل حزمة الألعاب التفاعلية للدرس... ⏳
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB TAB 2: REVIEW EXERCISES (DEDICATED 3-DRILLS MANAGER) */}
                {adminAtadarrabSubTab === 'review' && (
                  <ReviewDrillsManager
                    lessonId={selectedLesson.id}
                    token={token}
                    showToast={showToast}
                    onOpenStudentPreview={() => handleOpenSkillPreview('activities')}
                    onContentUpdated={() => {
                      if (selectedLesson?.id) fetchLessonAllData(selectedLesson.id);
                    }}
                  />
                )}
              </div>
            )}

            {/* TAB: Dictation ("أستمع وأكتب") */}
            {innerLessonTab === 'dictation' && (
              <div className="content-box">
                <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: '900', color: '#dc2626', marginBottom: '20px' }}>
                  🔊 الإملاء والتدريب المنقول والمسموع
                </h2>

                <form onSubmit={handleSaveDictation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontWeight: '800', fontSize: '15px' }}>نص الإملاء الصحيح:</label>
                    <textarea
                      rows={3}
                      value={dictationData.target_text || ''}
                      onChange={(e) => setDictationData({ ...dictationData, target_text: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '18px', marginTop: '6px' }}
                    />
                  </div>

                  <button type="submit" className="hero-start-btn" style={{ background: '#dc2626', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: 'none', alignSelf: 'flex-start' }}>
                    حفظ بيانات الإملاء
                  </button>
                </form>
              </div>
            )}


            {/* DEDICATED WRITING MANAGER FOR "أكتب بخط جميل" */}
            {innerLessonTab === 'writing' && (
              <WritingManager
                lessonId={selectedLesson.id}
                token={token}
                showToast={showToast}
                onOpenStudentPreview={() => handleOpenSkillPreview('writing')}
                onContentUpdated={() => {
                  if (onLessonUpdated) onLessonUpdated();
                }}
              />
            )}

            {/* DEDICATED DICTATION MANAGER FOR "أستمع وأكتب" */}
            {innerLessonTab === 'dictation' && (
              <DictationManager
                lessonId={selectedLesson.id}
                token={token}
                showToast={showToast}
                openMediaPickerFor={openMediaPickerFor}
                onOpenStudentPreview={() => handleOpenSkillPreview('dictation')}
                onContentUpdated={() => {
                  if (onLessonUpdated) onLessonUpdated();
                }}
              />
            )}

            {/* DEDICATED EXPRESSION MANAGER FOR "أعبر" */}
            {innerLessonTab === 'expression' && (
              <ExpressionManager
                lessonId={selectedLesson.id}
                token={token}
                showToast={showToast}
                onOpenStudentPreview={() => handleOpenSkillPreview('expression')}
                onContentUpdated={() => {
                  if (onLessonUpdated) onLessonUpdated();
                }}
              />
            )}

            {/* DEDICATED THINKING KEYS MANAGER FOR "مفاتيح التفكير" */}
            {innerLessonTab === 'thinking_keys' && (
              <ThinkingKeysManager
                lessonId={selectedLesson.id}
                token={token}
                showToast={showToast}
              />
            )}

            {/* DEDICATED QUIZ MANAGER FOR "الاختبار النهائي (اختبر نفسي)" */}
            {innerLessonTab === 'quiz' && (
              <QuizManager
                lessonId={selectedLesson.id}
                token={token}
                showToast={showToast}
              />
            )}

            {/* DYNAMIC SKILL CONTENT MANAGER FOR OTHER SKILL TABS */}
            {innerLessonTab !== 'basic' && innerLessonTab !== 'submissions' && innerLessonTab !== 'activities' && innerLessonTab !== 'writing' && innerLessonTab !== 'dictation' && innerLessonTab !== 'expression' && innerLessonTab !== 'thinking_keys' && innerLessonTab !== 'quiz' && (
              <SectionContentManager
                lessonId={selectedLesson.id}
                sectionType={innerLessonTab}
                sectionTitle={innerTabs.find(t => t.id === innerLessonTab)?.title || innerLessonTab}
                token={token}
                showToast={showToast}
                openMediaPickerFor={openMediaPickerFor}
                onOpenStudentPreview={() => handleOpenSkillPreview(innerLessonTab)}
                onContentUpdated={() => {
                  if (onLessonUpdated) onLessonUpdated();
                }}
              />
            )}

          </div>
        )}

        {/* 4. MEDIA LIBRARY TAB */}
        {activeMainTab === 'media' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: '900' }}>
                📁 مكتبة الوسائط والملفات
              </h1>

              <label
                className="hero-start-btn"
                style={{ background: '#0284c7', color: 'white', padding: '10px 22px', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: 'none' }}
              >
                <Upload size={18} />
                <span>+ رفع ملف جديد</span>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await fetch('/api/admin/media/upload', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                      });
                      if (res.ok) {
                        showToast('تم رفع الملف بنجاح ✅');
                        fetchMedia();
                      } else {
                        showToast('تعذر رفع الملف');
                      }
                    } catch (err) {
                      showToast('تعذر رفع الملف');
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px' }}>
              {mediaList.map((m) => (
                <div key={m.id} style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  {m.type === 'image' ? (
                    <img src={m.url} alt={m.filename} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px' }} />
                  ) : m.type === 'audio' ? (
                    <div style={{ height: '110px', background: '#fef3c7', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Volume2 size={40} color="#d97706" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#92400e' }}>ملف صوتي</span>
                    </div>
                  ) : m.type === 'video' ? (
                    <div style={{ height: '110px', background: '#f3e8ff', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Video size={40} color="#7c3aed" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#6b21a8' }}>فيديو</span>
                    </div>
                  ) : (
                    <div style={{ height: '110px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FileText size={40} color="#64748b" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>مستند PDF</span>
                    </div>
                  )}

                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', margin: '8px 0 4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {m.filename}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                      معاينة 🔗
                    </a>
                    <button
                      onClick={async () => {
                        if (window.confirm('هل أنتِ متأكدة من حذف هذا الملف من الوسائط؟')) {
                          try {
                            const res = await fetch(`/api/admin/media/${m.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.ok) {
                              showToast('تم حذف الملف بنجاح ✅');
                              fetchMedia();
                            }
                          } catch (e) {}
                        }
                      }}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. STUDENTS TAB */}
        {activeMainTab === 'students' && (
          <StudentsManager
            token={token}
            showToast={showToast}
            onNavigateToSubmissions={(studentName) => {
              setFilterStudentName(studentName);
              setActiveMainTab('submissions_page');
            }}
          />
        )}

        {/* 6. SETTINGS TAB */}
        {activeMainTab === 'settings' && (
          <TeacherSettings
            token={token}
            username={username}
            showToast={showToast}
            openMediaPickerFor={openMediaPickerFor}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="feedback-modal" style={{ zIndex: 1300 }}>
          <div className="feedback-card" style={{ maxWidth: '400px' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>تأكيد الحذف</h3>
            <p style={{ fontSize: '16px', color: '#64748b', margin: '12px 0 24px 0' }}>
              هل أنت متأكد من الحذف؟
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="hero-start-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 24px', fontSize: '16px', boxShadow: 'none' }} onClick={executeDelete}>
                نعم، احذف
              </button>
              <button className="teacher-login-btn" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          token={token}
          onSelectMedia={(url) => { if (mediaPickerTarget) mediaPickerTarget(url); }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Activity Preview Modal */}
      {showActivityPreview && (
        <ActivityPreviewModal
          activity={showActivityPreview}
          onClose={() => setShowActivityPreview(null)}
        />
      )}

      {/* Student Submission View Modal */}
      {viewSubmissionModal && (
        <div className="feedback-modal" style={{ zIndex: 1900 }}>
          <div className="feedback-card" style={{ maxWidth: '640px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, border: '3px solid #0284c7' }}>
            
            {/* Modal Header */}
            <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <h3 style={{ fontFamily: 'Cairo', fontSize: '22px', fontWeight: '900', color: '#0369a1', margin: 0 }}>
                معاينة تسليم الطالبة: {viewSubmissionModal.student_name} 👧
              </h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '900',
                background: viewSubmissionModal.status === 'reviewed' ? '#dcfce7' : viewSubmissionModal.status === 'viewed' ? '#e0f2fe' : '#fef08a',
                color: viewSubmissionModal.status === 'reviewed' ? '#166534' : viewSubmissionModal.status === 'viewed' ? '#0369a1' : '#854d0e'
              }}>
                {viewSubmissionModal.status === 'reviewed' ? 'تمت المراجعة ✅' : viewSubmissionModal.status === 'viewed' ? 'تمت المشاهدة 👁️' : 'جديد 🆕'}
              </span>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>الدرس: <strong>{viewSubmissionModal.lesson_title || 'الدرس'}</strong></span>
                <span>المهارة: <strong>{getSectionLabel(viewSubmissionModal.section_type)}</strong></span>
                <span>التاريخ: <strong>{new Date(viewSubmissionModal.created_at).toLocaleString('ar-EG')}</strong></span>
              </div>

              {viewSubmissionModal.question_text && (
                <div style={{ background: '#fff1f2', border: '2px solid #fecdd3', borderRadius: '16px', padding: '14px 18px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#9f1239', marginBottom: '4px' }}>❓ السؤال المطلوبة إجابته:</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#be185d' }}>{viewSubmissionModal.question_text}</div>
                </div>
              )}

              {viewSubmissionModal.text_content && (
                <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', textAlign: 'right' }}>
                  النص المكتوب: "{viewSubmissionModal.text_content}"
                </div>
              )}

              {viewSubmissionModal.file_path && viewSubmissionModal.submission_type === 'image' && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <img src={viewSubmissionModal.file_path} alt="واجب الطالبة" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '16px', border: '2px solid #bae6fd', objectFit: 'contain' }} />
                </div>
              )}

              {viewSubmissionModal.file_path && viewSubmissionModal.submission_type === 'audio' && (
                <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '2px solid #bbf7d0' }}>
                  <div style={{ fontWeight: '800', color: '#166534', marginBottom: '10px' }}>استماع للتسجيل الصوتي للطالبة:</div>
                  <audio controls src={viewSubmissionModal.file_path} style={{ width: '100%' }} />
                </div>
              )}

              {/* Teacher Note Input Section */}
              <div style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '16px', padding: '16px' }}>
                <label style={{ fontWeight: '900', fontSize: '15px', color: '#be185d', display: 'block', marginBottom: '8px' }}>
                  ✍️ ملاحظة وتقييم المعلمة للطالبة:
                </label>
                <textarea
                  rows={3}
                  value={modalTeacherNote}
                  onChange={(e) => setModalTeacherNote(e.target.value)}
                  placeholder="اكتبي ملاحظاتكِ وتشجيعكِ للطالبة هنا..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #f472b6', fontSize: '15px', fontWeight: '700' }}
                />
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="hero-start-btn"
                    style={{ background: '#db2777', color: 'white', padding: '8px 18px', fontSize: '14px', boxShadow: 'none' }}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/submissions/${viewSubmissionModal.id}/note`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ status: 'reviewed', teacher_note: modalTeacherNote })
                        });
                        if (res.ok) {
                          showToast('تم حفظ الملاحظة وتحديث الحالة بنجاح ✅');
                          setViewSubmissionModal(prev => ({ ...prev, status: 'reviewed', teacher_note: modalTeacherNote }));
                          if (activeMainTab === 'submissions_page') fetchPageSubmissions();
                        }
                      } catch (e) {
                        showToast('تعذر حفظ الملاحظة');
                      }
                    }}
                  >
                    💾 حفظ الملاحظة والتقييم
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {viewSubmissionModal.status !== 'reviewed' && (
                <button
                  type="button"
                  className="hero-start-btn"
                  style={{ background: '#059669', color: 'white', padding: '10px 20px', fontSize: '14px', boxShadow: 'none' }}
                  onClick={async () => {
                    try {
                      await fetch(`/api/admin/submissions/${viewSubmissionModal.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ status: 'reviewed' })
                      });
                      showToast('تم تحديد العمل كـ تمت المراجعة ✅');
                      setViewSubmissionModal(prev => ({ ...prev, status: 'reviewed' }));
                      if (activeMainTab === 'submissions_page') fetchPageSubmissions();
                    } catch (e) {}
                  }}
                >
                  ✅ تحديد كـ تمت المراجعة
                </button>
              )}

              {viewSubmissionModal.file_path && (
                <a href={viewSubmissionModal.file_path} target="_blank" rel="noreferrer" className="hero-start-btn" style={{ background: '#0284c7', color: 'white', padding: '10px 20px', fontSize: '14px', boxShadow: 'none', textDecoration: 'none' }}>
                  فتح الملف 🔗
                </a>
              )}
              <button className="teacher-login-btn" onClick={() => setViewSubmissionModal(null)}>إغلاق</button>
            </div>

          </div>
        </div>
      )}

      {/* Skill Preview Modal */}
      {skillPreviewState && (
        <SkillPreviewModal
          lessonTitle={skillPreviewState.lessonTitle}
          sectionTitle={skillPreviewState.sectionTitle}
          sectionType={skillPreviewState.sectionType}
          contents={skillPreviewState.contents}
          lessonId={skillPreviewState.lessonId}
          onClose={() => setSkillPreviewState(null)}
        />
      )}
    </div>
  );
}
