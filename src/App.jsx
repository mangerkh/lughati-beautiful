import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StudentHeader from './components/StudentHeader.jsx';
import HomeView from './components/HomeView.jsx';
import LessonDetailView from './components/LessonDetailView.jsx';
import StudentLoginModal from './components/StudentLoginModal.jsx';
import MySubmissionsModal from './components/MySubmissionsModal.jsx';

import ListeningSection from './components/sections/ListeningSection.jsx';
import ObserveSection from './components/sections/ObserveSection.jsx';
import ReadingSection from './components/sections/ReadingSection.jsx';
import VocabularySection from './components/sections/VocabularySection.jsx';
import ComprehensionSection from './components/sections/ComprehensionSection.jsx';
import EnrichmentSection from './components/sections/EnrichmentSection.jsx';
import ReviewSection from './components/sections/ReviewSection.jsx';
import ActivitiesSection from './components/sections/ActivitiesSection.jsx';
import WritingSection from './components/sections/WritingSection.jsx';
import DictationSection from './components/sections/DictationSection.jsx';
import ChantSection from './components/sections/ChantSection.jsx';
import QuizSection from './components/sections/QuizSection.jsx';
import ExpressionSection from './components/sections/ExpressionSection.jsx';
import ThinkingKeysSection from './components/sections/ThinkingKeysSection.jsx';
import ComingSoonPlaceholder from './components/sections/ComingSoonPlaceholder.jsx';
import DynamicSectionRenderer from './components/sections/DynamicSectionRenderer.jsx';

import TeacherLogin from './components/TeacherLogin.jsx';
import TeacherAdmin from './components/TeacherAdmin.jsx';

function getSkillTitle(skillType) {
  const titles = {
    listening: 'أستمع',
    observe: 'أتحدث',
    speaking: 'أتحدث',
    reading: 'أقرأ',
    comprehension: 'أفكر بذكاء',
    activities: 'أتدرب',
    practice: 'أتدرب',
    writing: 'أكتب بخط جميل',
    dictation: 'أستمع وأكتب',
    expression: 'أعبر',
    enrichment: 'إثراء',
    thinking_keys: 'مفاتيح التفكير',
    thinking: 'مفاتيح التفكير',
    quiz: 'اختبر نفسي'
  };
  return titles[skillType] || skillType;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState('home'); // home | lesson_detail | section | teacher_login | teacher_admin
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonData, setActiveLessonData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [atadarrabSubMode, setAtadarrabSubMode] = useState(null); // null | 'games' | 'review'

  // Student State
  const [studentName, setStudentName] = useState(() => localStorage.getItem('lughati_student_name') || '');
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [studentLoginPrompt, setStudentLoginPrompt] = useState('');
  const [showMySubmissions, setShowMySubmissions] = useState(false);

  // Student Progress & Stars stored in LocalStorage
  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('lughati_completed_sections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stars, setStars] = useState(() => {
    try {
      const saved = localStorage.getItem('lughati_stars');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Teacher Authentication State
  const [teacherToken, setTeacherToken] = useState(() => localStorage.getItem('lughati_teacher_token') || null);
  const [teacherUser, setTeacherUser] = useState(() => localStorage.getItem('lughati_teacher_user') || '');

  // Fetch Lessons on Mount
  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/student/lessons');
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error('Error loading lessons:', err);
    }
  };

  // Sync state based on URL location changes
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/' || pathname === '/home' || pathname === '') {
      setCurrentView('home');
      setActiveLesson(null);
      setActiveLessonData(null);
      setActiveSection(null);
      setAtadarrabSubMode(null);
      return;
    }

    if (pathname.startsWith('/teacher/login')) {
      setCurrentView('teacher_login');
      return;
    }

    if (pathname.startsWith('/teacher/admin')) {
      if (teacherToken) {
        setCurrentView('teacher_admin');
      } else {
        navigate('/teacher/login', { replace: true });
      }
      return;
    }

    // Matching /lesson/:lessonId/...
    const practiceGamesMatch = pathname.match(/^\/lesson\/(\d+)\/practice\/games\/?$/);
    const practiceReviewMatch = pathname.match(/^\/lesson\/(\d+)\/practice\/review\/?$/);
    const practiceHomeMatch = pathname.match(/^\/lesson\/(\d+)\/(?:practice|activities)\/?$/);
    const skillMatch = pathname.match(/^\/lesson\/(\d+)\/([a-zA-Z0-9_-]+)\/?$/);
    const lessonMatch = pathname.match(/^\/lesson\/(\d+)\/?$/);

    const targetLessonId = practiceGamesMatch ? parseInt(practiceGamesMatch[1], 10) :
                           practiceReviewMatch ? parseInt(practiceReviewMatch[1], 10) :
                           practiceHomeMatch ? parseInt(practiceHomeMatch[1], 10) :
                           skillMatch ? parseInt(skillMatch[1], 10) :
                           lessonMatch ? parseInt(lessonMatch[1], 10) : null;

    if (targetLessonId) {
      if (!activeLessonData || activeLessonData.lesson.id !== targetLessonId) {
        fetch(`/api/student/lessons/${targetLessonId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setActiveLessonData(data);
              setActiveLesson(data.lesson);
              syncSectionState(pathname, data, targetLessonId);
            }
          })
          .catch(err => console.error('Error fetching lesson details:', err));
      } else {
        syncSectionState(pathname, activeLessonData, targetLessonId);
      }
    }
  }, [location.pathname, teacherToken]);

  const syncSectionState = (pathname, lessonData, targetLessonId) => {
    if (pathname.match(/^\/lesson\/\d+\/practice\/games\/?$/)) {
      setCurrentView('section');
      setActiveSection({ id: 999, lesson_id: targetLessonId, section_type: 'activities', title: 'أتدرب' });
      setAtadarrabSubMode('games');
    } else if (pathname.match(/^\/lesson\/\d+\/practice\/review\/?$/)) {
      setCurrentView('section');
      setActiveSection({ id: 999, lesson_id: targetLessonId, section_type: 'activities', title: 'أتدرب' });
      setAtadarrabSubMode('review');
    } else if (pathname.match(/^\/lesson\/\d+\/(?:practice|activities)\/?$/)) {
      setCurrentView('section');
      setActiveSection({ id: 999, lesson_id: targetLessonId, section_type: 'activities', title: 'أتدرب' });
      setAtadarrabSubMode(null);
    } else if (pathname.match(/^\/lesson\/\d+\/([a-zA-Z0-9_-]+)\/?$/)) {
      const match = pathname.match(/^\/lesson\/\d+\/([a-zA-Z0-9_-]+)\/?$/);
      const rawSkill = match[1];
      const normalizedSkill = rawSkill === 'speaking' ? 'observe' : 
                              rawSkill === 'thinking' ? 'thinking_keys' :
                              rawSkill === 'activities' ? 'activities' : rawSkill;
      const foundSec = lessonData?.sections?.find(s => s.section_type === normalizedSkill);
      setCurrentView('section');
      setActiveSection(foundSec || { id: 999, lesson_id: targetLessonId, section_type: normalizedSkill, title: getSkillTitle(normalizedSkill) });
      setAtadarrabSubMode(null);
    } else {
      // /lesson/:id
      setCurrentView('lesson_detail');
      setActiveSection(null);
      setAtadarrabSubMode(null);
    }
  };

  const handleSelectLesson = async (lesson) => {
    setActiveLesson(lesson);
    navigate(`/lesson/${lesson.id}`);
  };

  const handleSelectSection = (section) => {
    const lessonId = activeLessonData?.lesson?.id || 1;
    setActiveSection(section);
    if (section.section_type === 'activities') {
      navigate(`/lesson/${lessonId}/practice`);
    } else if (section.section_type === 'observe') {
      navigate(`/lesson/${lessonId}/speaking`);
    } else if (section.section_type === 'thinking_keys') {
      navigate(`/lesson/${lessonId}/thinking`);
    } else {
      navigate(`/lesson/${lessonId}/${section.section_type}`);
    }
  };

  const handleCompleteSection = (secType) => {
    if (!completedSections.includes(secType)) {
      const next = [...completedSections, secType];
      setCompletedSections(next);
      localStorage.setItem('lughati_completed_sections', JSON.stringify(next));

      const nextStars = stars + 1;
      setStars(nextStars);
      localStorage.setItem('lughati_stars', nextStars.toString());
    }
  };

  const handleCompleteQuiz = (score, total) => {
    handleCompleteSection('quiz');
  };

  const handleTeacherLoginSuccess = (token, username) => {
    setTeacherToken(token);
    setTeacherUser(username);
    localStorage.setItem('lughati_teacher_token', token);
    localStorage.setItem('lughati_teacher_user', username);
    navigate('/teacher/admin');
  };

  const handleTeacherLogout = () => {
    setTeacherToken(null);
    setTeacherUser('');
    localStorage.removeItem('lughati_teacher_token');
    localStorage.removeItem('lughati_teacher_user');
    navigate('/');
  };

  const handleStudentLoginSuccess = (name) => {
    setStudentName(name);
    setShowStudentLogin(false);
  };

  const handleStudentLogout = () => {
    setStudentName('');
    localStorage.removeItem('lughati_student_name');
    localStorage.removeItem('lughati_student_id');
  };

  const triggerRequestStudentLogin = (prompt) => {
    setStudentLoginPrompt(prompt || '');
    setShowStudentLogin(true);
  };

  if (currentView === 'teacher_admin') {
    return (
      <TeacherAdmin
        token={teacherToken}
        username={teacherUser}
        onLogout={handleTeacherLogout}
        onGoToStudentView={() => navigate('/')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Student Top Header */}
      <StudentHeader
        stars={stars}
        currentView={currentView}
        studentName={studentName}
        onGoHome={() => navigate('/')}
        onOpenTeacherLogin={() => {
          if (teacherToken) navigate('/teacher/admin');
          else navigate('/teacher/login');
        }}
        onOpenStudentLogin={() => triggerRequestStudentLogin('')}
        onOpenMySubmissions={() => setShowMySubmissions(true)}
        onStudentLogout={handleStudentLogout}
      />

      {/* Main Student Views */}
      {currentView === 'home' && (
        <HomeView
          lessons={lessons}
          onSelectLesson={handleSelectLesson}
        />
      )}

      {/* Disabled Lesson Direct Access Block Screen */}
      {(currentView === 'lesson_detail' || currentView === 'section') && (activeLessonData?.lesson?.status === 'disabled' || activeLesson?.status === 'disabled') && (
        <div style={{
          maxWidth: '520px',
          margin: '60px auto',
          background: 'white',
          borderRadius: '28px',
          border: '3px solid #cbd5e1',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '36px'
          }}>
            🔒
          </div>
          <h2 style={{ fontFamily: 'Cairo', fontSize: '26px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>
            هذا الدرس غير متاح حالياً.
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '700', marginBottom: '28px' }}>
            عذراً، هذا الدرس غير متاح في الوقت الحالي. يمكنكِ اختيار درس آخر من الصفحة الرئيسية.
          </p>
          <button
            className="hero-start-btn"
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              fontSize: '17px',
              padding: '12px 28px'
            }}
          >
            <span>العودة للرئيسية</span>
          </button>
        </div>
      )}

      {currentView === 'lesson_detail' && activeLessonData && activeLessonData.lesson?.status !== 'disabled' && (
        <LessonDetailView
          lessonData={activeLessonData}
          completedSections={completedSections}
          onSelectSection={handleSelectSection}
          onBack={() => navigate('/')}
        />
      )}

      {/* Dynamic Skill Section Component Views */}
      {currentView === 'section' && activeSection && activeLessonData && activeLessonData.lesson?.status !== 'disabled' && (
        <div className="section-container" style={{
          paddingTop: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '6px' : undefined
        }}>
          <div style={{
            maxWidth: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '920px' : '1000px',
            margin: '0 auto 8px auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? 'white' : undefined,
            padding: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '8px 16px' : undefined,
            borderRadius: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '16px' : undefined,
            border: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '1.5px solid #e2e8f0' : undefined,
            boxShadow: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '0 2px 6px rgba(0,0,0,0.02)' : undefined
          }}>
            <button
              className="back-btn"
              onClick={() => navigate(`/lesson/${activeLessonData.lesson.id}`)}
              style={{
                background: (activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') ? '#f8fafc' : 'white',
                color: '#1e293b',
                border: '1.5px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '800'
              }}
            >
              <span>العودة للدرس ↩️</span>
            </button>

            <span style={{ fontSize: '15px', fontWeight: '800', color: '#475569' }}>
              الدرس: <strong style={{ color: '#0284c7' }}>{activeLessonData.lesson.title}</strong>
            </span>
          </div>

          {/* 1. Listening */}
          {activeSection.section_type === 'listening' && (
            (activeLessonData.section_contents?.some(c => c.section_type === 'listening' && c.is_visible !== 0)) ? (
              <DynamicSectionRenderer
                sectionType="listening"
                contents={activeLessonData.section_contents?.filter(c => c.section_type === 'listening') || []}
                lessonTitle={activeLessonData.lesson.title}
                lessonId={activeLessonData.lesson.id}
                studentName={studentName}
                onRequestLogin={triggerRequestStudentLogin}
                onCompleteSection={handleCompleteSection}
              />
            ) : (
              <ListeningSection
                sectionData={activeLessonData.sections?.find(s => s.section_type === 'listening') || {}}
                onCompleteSection={handleCompleteSection}
              />
            )
          )}

          {/* 2. Observe / Speaking */}
          {(activeSection.section_type === 'observe' || activeSection.section_type === 'speaking') && (
            (activeLessonData.section_contents?.some(c => (c.section_type === 'observe' || c.section_type === 'speaking') && c.is_visible !== 0)) ? (
              <DynamicSectionRenderer
                sectionType="observe"
                contents={activeLessonData.section_contents?.filter(c => c.section_type === 'observe' || c.section_type === 'speaking') || []}
                lessonTitle={activeLessonData.lesson.title}
                lessonId={activeLessonData.lesson.id}
                studentName={studentName}
                onRequestLogin={triggerRequestStudentLogin}
                onCompleteSection={handleCompleteSection}
              />
            ) : (
              <ObserveSection
                sectionData={activeLessonData.sections?.find(s => s.section_type === 'observe' || s.section_type === 'speaking') || {}}
                onCompleteSection={handleCompleteSection}
              />
            )
          )}

          {/* 3. Reading */}
          {activeSection.section_type === 'reading' && (
            (activeLessonData.section_contents?.some(c => c.section_type === 'reading' && c.is_visible !== 0)) ? (
              <DynamicSectionRenderer
                sectionType="reading"
                contents={activeLessonData.section_contents?.filter(c => c.section_type === 'reading') || []}
                lessonTitle={activeLessonData.lesson.title}
                lessonId={activeLessonData.lesson.id}
                studentName={studentName}
                onRequestLogin={triggerRequestStudentLogin}
                onCompleteSection={handleCompleteSection}
              />
            ) : (
              <div>
                <ReadingSection
                  sectionData={activeLessonData.sections?.find(s => s.section_type === 'reading') || {}}
                  onCompleteSection={handleCompleteSection}
                />
                {activeLessonData.vocabulary?.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <VocabularySection vocabulary={activeLessonData.vocabulary || []} />
                  </div>
                )}
              </div>
            )
          )}

          {/* 4. Comprehension (Afakkir bi-Thakaa) */}
          {activeSection.section_type === 'comprehension' && (
            (activeLessonData.section_contents?.some(c => c.section_type === 'comprehension' && c.is_visible !== 0)) ? (
              <DynamicSectionRenderer
                sectionType="comprehension"
                contents={activeLessonData.section_contents?.filter(c => c.section_type === 'comprehension') || []}
                lessonTitle={activeLessonData.lesson.title}
                lessonId={activeLessonData.lesson.id}
                studentName={studentName}
                onRequestLogin={triggerRequestStudentLogin}
                onCompleteSection={handleCompleteSection}
              />
            ) : (activeLessonData.questions?.some(q => q.section_type === 'comprehension')) ? (
              <ComprehensionSection
                questions={activeLessonData.questions?.filter(q => q.section_type === 'comprehension') || []}
                onCompleteSection={handleCompleteSection}
              />
            ) : (
              <ComingSoonPlaceholder sectionTitle="أفكر بذكاء 🧠" lessonTitle={activeLessonData.lesson.title} onBack={() => navigate(`/lesson/${activeLessonData.lesson.id}`)} />
            )
          )}

          {/* 5. Activities & Games (Atadarrab) */}
          {activeSection.section_type === 'activities' && (
            (activeLessonData.activities?.length > 0 || activeLessonData.questions?.some(q => q.section_type === 'review') || activeLessonData.section_contents?.some(c => c.section_type === 'activities' && c.is_visible !== 0)) ? (
              <ActivitiesSection
                activities={activeLessonData.activities || []}
                questions={activeLessonData.questions || []}
                sectionContents={activeLessonData.section_contents?.filter(c => c.section_type === 'activities') || []}
                onCompleteSection={handleCompleteSection}
                initialSubMode={atadarrabSubMode}
                onSubModeChange={(newMode) => {
                  const lid = activeLessonData?.lesson?.id || 1;
                  if (newMode === 'games') {
                    navigate(`/lesson/${lid}/practice/games`);
                  } else if (newMode === 'review') {
                    navigate(`/lesson/${lid}/practice/review`);
                  } else {
                    navigate(`/lesson/${lid}/practice`);
                  }
                }}
              />
            ) : (activeLessonData.section_contents?.some(c => c.section_type === 'activities' && c.is_visible !== 0)) ? (
              <DynamicSectionRenderer
                sectionType="activities"
                contents={activeLessonData.section_contents?.filter(c => c.section_type === 'activities') || []}
                lessonTitle={activeLessonData.lesson.title}
                lessonId={activeLessonData.lesson.id}
                studentName={studentName}
                onRequestLogin={triggerRequestStudentLogin}
                onCompleteSection={handleCompleteSection}
              />
            ) : (
              <ComingSoonPlaceholder sectionTitle="أتدرب 🎯" lessonTitle={activeLessonData.lesson.title} onBack={() => navigate(`/lesson/${activeLessonData.lesson.id}`)} />
            )
          )}

          {/* 6. Writing & Copying */}
          {/* 6. Writing ("أكتب بخط جميل") - Always Fixed Dedicated Template */}
          {activeSection.section_type === 'writing' && (
            <WritingSection
              writingDrills={activeLessonData.writing || []}
              onCompleteSection={handleCompleteSection}
              studentName={studentName}
              onRequestLogin={triggerRequestStudentLogin}
              lessonId={activeLessonData.lesson.id}
            />
          )}

          {/* 7. Dictation ("أستمع وأكتب") - Always Fixed Dedicated Template */}
          {activeSection.section_type === 'dictation' && (
            <DictationSection
              dictationDrills={activeLessonData.dictations || activeLessonData.dictationDrills || []}
              onCompleteSection={handleCompleteSection}
              studentName={studentName}
              onRequestLogin={triggerRequestStudentLogin}
              lessonId={activeLessonData.lesson.id}
            />
          )}

          {/* 8. Expression ("أعبر") - Always Fixed Dedicated Template */}
          {activeSection.section_type === 'expression' && (
            <ExpressionSection
              expressionDrills={activeLessonData.expression || activeLessonData.expressionDrills || []}
              onCompleteSection={handleCompleteSection}
              studentName={studentName}
              onRequestLogin={triggerRequestStudentLogin}
              lessonId={activeLessonData.lesson.id}
            />
          )}

          {/* 9. Enrichment ("إثراء") */}
          {activeSection.section_type === 'enrichment' && (
            <EnrichmentSection
              contents={activeLessonData.section_contents?.filter(c => c.section_type === 'enrichment') || []}
              enrichments={activeLessonData.enrichments || []}
              lessonTitle={activeLessonData.lesson?.title}
              onCompleteSection={handleCompleteSection}
            />
          )}

          {/* 10. Thinking Keys */}
          {(activeSection.section_type === 'thinking_keys' || activeSection.section_type === 'thinking') && (
            <ThinkingKeysSection
              lessonId={activeLessonData.lesson.id}
              studentName={studentName}
              onRequestLogin={triggerRequestStudentLogin}
              onCompleteSection={handleCompleteSection}
            />
          )}

          {/* Standalone Final Quiz Section (🏆 اختبر نفسي) */}
          {activeSection.section_type === 'quiz' && (
            <QuizSection
              lessonId={activeLessonData.lesson.id}
              lessonTitle={activeLessonData.lesson.title}
              studentName={studentName}
              onRequestLogin={triggerRequestStudentLogin}
              onClose={() => {
                handleCompleteSection('quiz');
                navigate(`/lesson/${activeLessonData.lesson.id}`);
              }}
            />
          )}
        </div>
      )}

      {/* Teacher Login View */}
      {currentView === 'teacher_login' && (
        <TeacherLogin
          onLoginSuccess={handleTeacherLoginSuccess}
          onCancel={() => navigate('/')}
        />
      )}

      {/* Student Login Modal */}
      {showStudentLogin && (
        <StudentLoginModal
          onLoginSuccess={handleStudentLoginSuccess}
          onClose={() => setShowStudentLogin(false)}
          promptText={studentLoginPrompt}
        />
      )}

      {/* Student My Submissions Modal */}
      {showMySubmissions && (
        <MySubmissionsModal
          studentName={studentName}
          onClose={() => setShowMySubmissions(false)}
        />
      )}
    </div>
  );
}
