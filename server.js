import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'lughati_jameela_secret_key_2026';

APP.use(cors());
APP.use(express.json({ limit: '50mb' }));
APP.use(express.urlencoded({ extended: true, limit: '50mb' }));

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const SUBDIRS = ['images', 'audio', 'video', 'pdf', 'lessons', 'submissions'];

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
SUBDIRS.forEach(sub => {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

APP.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'images';
    const cat = (req.query && req.query.category) || (req.body && req.body.category);
    if (cat && SUBDIRS.includes(cat)) {
      subfolder = cat;
    } else if (file.mimetype.startsWith('audio/')) {
      subfolder = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      subfolder = 'video';
    } else if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      subfolder = 'pdf';
    } else if (file.mimetype.startsWith('image/')) {
      subfolder = 'images';
    }
    const targetDir = path.join(UPLOADS_DIR, subfolder);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

function getRelativeUrl(file) {
  if (!file) return null;
  const relativeFolder = path.relative(path.join(__dirname, 'public'), file.destination).replace(/\\/g, '/');
  return `/${relativeFolder}/${file.filename}`;
}

let db;

async function generateStudentCode(dbInstance) {
  const currentYearSuffix = new Date().getFullYear().toString().slice(-2);
  const prefix = currentYearSuffix;
  const rows = await dbInstance.all(
    "SELECT student_code FROM students WHERE student_code LIKE ?",
    [`${prefix}%`]
  );
  let maxSeq = 0;
  for (const r of rows) {
    if (r.student_code && r.student_code.startsWith(prefix)) {
      const numPart = parseInt(r.student_code.slice(2), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }
  let nextSeq = maxSeq + 1;
  let code = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  while (await dbInstance.get("SELECT id FROM students WHERE student_code = ?", [code])) {
    nextSeq++;
    code = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }
  return code;
}

async function migrateStudents(dbInstance) {
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN student_code TEXT"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN section_group TEXT DEFAULT ''"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN group_name TEXT DEFAULT ''"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN internal_notes TEXT DEFAULT ''"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN notes TEXT DEFAULT ''"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN is_archived INTEGER DEFAULT 0"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN updated_at DATETIME"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN last_activity_at DATETIME"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE students ADD COLUMN last_login_at DATETIME"); } catch (e) { }
  try { await dbInstance.run("ALTER TABLE student_submissions ADD COLUMN student_id INTEGER"); } catch (e) { }

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      section_type TEXT,
      completed INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    );
  `);

  const submissionNames = await dbInstance.all("SELECT DISTINCT student_name FROM student_submissions WHERE student_name IS NOT NULL AND student_name != ''");
  for (const s of submissionNames) {
    const cleanName = s.student_name.trim();
    if (!cleanName) continue;
    let student = await dbInstance.get("SELECT * FROM students WHERE name = ?", [cleanName]);
    if (!student) {
      const code = await generateStudentCode(dbInstance);
      const res = await dbInstance.run(
        "INSERT INTO students (name, student_code, status) VALUES (?, ?, 'active')",
        [cleanName, code]
      );
      student = { id: res.lastID, name: cleanName, student_code: code };
    }
  }

  const studentsWithoutCode = await dbInstance.all("SELECT * FROM students WHERE student_code IS NULL OR student_code = ''");
  for (const st of studentsWithoutCode) {
    const code = await generateStudentCode(dbInstance);
    await dbInstance.run("UPDATE students SET student_code = ?, status = COALESCE(status, 'active') WHERE id = ?", [code, st.id]);
  }

  await dbInstance.run(`
    UPDATE student_submissions 
    SET student_id = (SELECT id FROM students WHERE students.name = student_submissions.student_name)
    WHERE student_id IS NULL OR student_id = 0
  `);
}

APP.get('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    const students = await db.all('SELECT * FROM students ORDER BY id DESC');
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب بيانات الطالبات', error: err.message || String(err) });
  }
});

APP.get('/api/admin/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ success: false, message: 'الطالبة غير موجودة' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب بيانات الطالبة', error: err.message || String(err) });
  }
});

APP.post('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    const name = req.body.name ? req.body.name.trim() : '';
    const section_group = req.body.section_group !== undefined ? req.body.section_group : (req.body.group_name || '');
    const status = req.body.status || 'active';
    const internal_notes = req.body.internal_notes !== undefined ? req.body.internal_notes : (req.body.notes || '');

    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة مطلوب' });
    }

    const existing = await db.get('SELECT id FROM students WHERE LOWER(TRIM(name)) = LOWER(?)', [name]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة موجود بالفعل' });
    }

    const code = await generateStudentCode(db);
    const result = await db.run(
      `INSERT INTO students (name, student_code, section_group, group_name, status, internal_notes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, code, section_group, section_group, status, internal_notes, internal_notes]
    );

    const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    res.json({ success: true, student: newStudent, message: 'تمت إضافة الطالبة بنجاح ✅' });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ success: false, message: 'تعذر إضافة الطالبة', error: err.message || String(err) });
  }
});

APP.put('/api/admin/students/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const name = req.body.name ? req.body.name.trim() : '';
    const section_group = req.body.section_group !== undefined ? req.body.section_group : (req.body.group_name || '');
    const status = req.body.status || 'active';
    const internal_notes = req.body.internal_notes !== undefined ? req.body.internal_notes : (req.body.notes || '');

    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة مطلوب' });
    }

    const existingStudent = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'الطالبة غير موجودة' });
    }

    const nameConflict = await db.get(
      'SELECT id FROM students WHERE LOWER(TRIM(name)) = LOWER(?) AND id != ?',
      [name, studentId]
    );
    if (nameConflict) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة مستخدم من قبل طالبة أخرى 🌸' });
    }

    await db.run(
      `UPDATE students 
       SET name = ?, section_group = ?, group_name = ?, status = ?, internal_notes = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, section_group, section_group, status, internal_notes, internal_notes, studentId]
    );

    await db.run('UPDATE student_submissions SET student_name = ? WHERE student_id = ?', [name, studentId]);

    const updatedStudent = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
    res.json({ success: true, student: updatedStudent, message: 'تم تحديث بيانات الطالبة بنجاح ✅' });
  } catch (err) {
    console.error('Error updating student [ID=' + req.params.id + ']:', err);
    res.status(500).json({ success: false, message: 'تعذر تحديث بيانات الطالبة', error: err.message || String(err) });
  }
});

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'lms.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      audio TEXT,
      video TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      image TEXT,
      audio TEXT,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      section_type TEXT NOT NULL,
      question_type TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      image TEXT,
      audio TEXT,
      explanation TEXT,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT,
      activity_data TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrichments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      url TEXT,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS writing_drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      drill_type TEXT NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      target_answer TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dictations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_text TEXT NOT NULL,
      audio TEXT,
      instructions TEXT,
      tolerance_level INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      content TEXT NOT NULL,
      image TEXT,
      audio TEXT,
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expression_drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      question TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS thinking_keys_drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      key_type TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_code TEXT UNIQUE,
      name TEXT UNIQUE NOT NULL,
      section_group TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      internal_notes TEXT DEFAULT '',
      last_activity_at DATETIME,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      student_name TEXT NOT NULL,
      lesson_id INTEGER NOT NULL,
      section_type TEXT NOT NULL,
      activity_id INTEGER,
      submission_type TEXT NOT NULL,
      text_content TEXT,
      file_path TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_section_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      section_type TEXT NOT NULL,
      content_type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      media_url TEXT,
      extra_data TEXT,
      sort_order INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_section_contents_lesson_id ON lesson_section_contents(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_section_contents_section_type ON lesson_section_contents(section_type);
    CREATE INDEX IF NOT EXISTS idx_section_contents_lesson_section ON lesson_section_contents(lesson_id, section_type);

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      student_name TEXT NOT NULL,
      lesson_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      attempt_number INTEGER DEFAULT 1,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await db.run("ALTER TABLE student_submissions ADD COLUMN question_text TEXT");
  } catch (e) { }

  try {
    await db.run("ALTER TABLE student_submissions ADD COLUMN question_id INTEGER");
  } catch (e) { }

  // Ensure is_enabled and sort_order columns exist across all tables
  const tablesToMigrate = ['lessons', 'lesson_sections', 'vocabulary', 'questions', 'activities', 'enrichments', 'writing_drills', 'dictations', 'chants'];
  for (const tbl of tablesToMigrate) {
    try {
      await db.exec(`ALTER TABLE ${tbl} ADD COLUMN is_enabled INTEGER DEFAULT 1`);
    } catch (e) { }
    try {
      await db.exec(`ALTER TABLE ${tbl} ADD COLUMN sort_order INTEGER DEFAULT 1`);
    } catch (e) { }
  }

  try {
    await db.exec(`ALTER TABLE lessons ADD COLUMN welcome_message TEXT DEFAULT 'استعدي لرحلة ممتعة ومبدعة في هذا الدرس يا بطلة!'`);
  } catch (e) { }
  try {
    await db.exec(`ALTER TABLE lessons ADD COLUMN status TEXT DEFAULT 'published'`);
  } catch (e) { }
  try {
    await db.exec(`ALTER TABLE student_submissions ADD COLUMN teacher_note TEXT DEFAULT ''`);
  } catch (e) { }
  try {
    await db.exec(`ALTER TABLE media ADD COLUMN size INTEGER DEFAULT 0`);
  } catch (e) { }
  try {
    await db.exec(`ALTER TABLE media ADD COLUMN mime_type TEXT`);
  } catch (e) { }

  await migrateStudents(db);
  await seedLesson4Quiz(db);

  // Seed Teacher Admin if missing
  const teacherCount = await db.get('SELECT COUNT(*) as count FROM teachers');
  if (teacherCount.count === 0) {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    await db.run('INSERT INTO teachers (username, password_hash) VALUES (?, ?)', ['admin', defaultPasswordHash]);
  }

  // Seed All 12 Grade 2 Lessons
  const grade2Lessons = [
    { id: 1, title: 'الأرض', description: 'درس الأرض - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_1.svg', sort_order: 1 },
    { id: 2, title: 'الرسامة الصغيرة', description: 'درس الرسامة الصغيرة - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_2.svg', sort_order: 2 },
    { id: 3, title: 'عودة الطائر', description: 'درس عودة الطائر - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_3.svg', sort_order: 3 },
    { id: 4, title: 'الغراب والجرة', description: 'درس الغراب والجرة - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_4.svg', sort_order: 4 },
    { id: 5, title: 'مصنع الألبان', description: 'درس مصنع الألبان - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_5.svg', sort_order: 5 },
    { id: 6, title: 'جحا وحميره العشرة', description: 'درس جحا وحميره العشرة - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_6.svg', sort_order: 6 },
    { id: 7, title: 'يوم المرور', description: 'درس يوم المرور - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_7.svg', sort_order: 7 },
    { id: 8, title: 'الخروف والذئب', description: 'درس الخروف والذئب - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_8.svg', sort_order: 8 },
    { id: 9, title: 'طبيبة القرية', description: 'درس طبيبة القرية - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_9.svg', sort_order: 9 },
    { id: 10, title: 'الأسد والفأر', description: 'درس الأسد والفأر - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_10.svg', sort_order: 10 },
    { id: 11, title: 'الصياد', description: 'درس الصياد - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_11.svg', sort_order: 11 },
    { id: 12, title: 'الباحثات الصغيرات', description: 'درس الباحثات الصغيرات - مادة اللغة العربية للصف الثاني الأساسي', image: '/uploads/lesson_12.svg', sort_order: 12 }
  ];

  for (const l of grade2Lessons) {
    const existing = await db.get('SELECT * FROM lessons WHERE id = ?', [l.id]);
    if (!existing) {
      await db.run(
        'INSERT INTO lessons (id, title, description, image, sort_order, is_published) VALUES (?, ?, ?, ?, ?, 1)',
        [l.id, l.title, l.description, l.image, l.sort_order]
      );
    } else if (existing.image && (existing.image.includes('conv_3.png') || existing.image === '')) {
      await db.run('UPDATE lessons SET image = ? WHERE id = ?', [l.image, l.id]);
    }

    if (l.id > 1) {
      const secCount = await db.get('SELECT COUNT(*) as count FROM lesson_sections WHERE lesson_id = ?', [l.id]);
      if (secCount.count === 0) {
        const unifiedSections = [
          { type: 'listening', title: 'أستمع', order: 1 },
          { type: 'observe', title: 'أتحدث', order: 2 },
          { type: 'reading', title: 'أقرأ', order: 3 },
          { type: 'comprehension', title: 'أفكر بذكاء', order: 4 },
          { type: 'activities', title: 'أتدرب', order: 5 },
          { type: 'writing', title: 'أكتب وأنسخ', order: 6 },
          { type: 'dictation', title: 'أملي وأكتب', order: 7 },
          { type: 'expression', title: 'أعبر', order: 8 },
          { type: 'enrichment', title: 'إثراء', order: 9 },
          { type: 'thinking_keys', title: 'مفاتيح التفكير', order: 10 }
        ];
        for (const sec of unifiedSections) {
          await db.run(
            'INSERT INTO lesson_sections (lesson_id, section_type, title, sort_order) VALUES (?, ?, ?, ?)',
            [l.id, sec.type, sec.title, sec.order]
          );
        }
      }
    }
  }

  const lessonId = 1;

  // 1. Seed Sections
  const secCount = await db.get('SELECT COUNT(*) as count FROM lesson_sections WHERE lesson_id = ?', [lessonId]);
  if (secCount.count === 0) {
    const defaultSections = [
      { type: 'listening', title: 'أستمع', content: 'نَسْتَمِعُ إلَى نَصِّ (بِلادِي جَمِيلَةٌ)', audio: '/uploads/listening_audio.mp3', image: '/uploads/pdf_page_1.png', order: 1 },
      { type: 'observe', title: 'ألاحظ وأتحدث', content: 'نتأمل اللوحات الآتية ونناقش معاً', image: '/uploads/conv_1.png', order: 2 },
      { type: 'reading', title: 'أقرأ وأتعلم', content: 'جَمَعَ الْفَلّاحُ أَبْناءَهُ الأَرْبَعَةَ، وَقالَ لَهُمْ: تَرَكْتُ لَكُمْ فِي هٰذِهِ الأَرْضِ كَنزاً كَبيراً، فَابْحَثُوا عَنْهُ.\n\nخَرَجَ الأَبْنَاءُ مِنْ عِنْدِ أَبِيهِمْ، فَحَمَلَ كُلُّ واحِدٍ مِنْهُمْ فَأْسَهُ، وَبَدَأَ يَنْكُشُ الأَرْضَ؛ لِيَبْحَثَ عَنِ الْكَنْزِ، وَلٰكِنَّهُمْ لَمْ يَجِدُوا شَيْئاً.\n\nرَجَعُوا إِلى أَبِيهِمْ، وَقالُوا: لَمْ نَجِدْ كَنزاً فِي الأَرْضِ يا أَبِي.\n\nابْتَسَمَ الأَبُ، وَقالَ: الأَرْضُ هِيَ الْكَنْزُ، حافَظَ عَلَيْها أَجْدادُنا مُنْذُ آلافِ السِّنِينَ؛ فَحافِظُوا عَلَيْها مِثْلَهُمْ، وَازْرَعُوها، وَسَتُعْطِيكُمْ خَيْراتٍ كَثِيرَةً.', video: '/uploads/earth_video.mp4', order: 3 },
      { type: 'vocabulary', title: 'كلماتي الجديدة', content: 'المفردات والتراكيب الجديدة لدرس الأرض', order: 4 },
      { type: 'comprehension', title: 'أفهم النص', content: 'أسئلة فهم واستيعاب أحداث النص', order: 5 },
      { type: 'enrichment', title: 'إثراء', content: 'محتوى إثرائي ومعلومات إضافية', order: 6 },
      { type: 'review', title: 'أراجع', content: 'تمارين ومراجعة على مفاهيم الدرس', order: 7 },
      { type: 'activities', title: 'ألعب وأتعلم', content: 'أنشطة وألعاب تفاعلية لدرس الأرض', order: 8 },
      { type: 'writing', title: 'أكتب', content: 'تمارين الخط والكتابة والنسخ', order: 9 },
      { type: 'dictation', title: 'إملاء', content: 'تدريب الإملاء المنقول والمسموع', order: 10 },
      { type: 'chant', title: 'نغني', content: 'نشيد أطفال فلسطين', order: 11 },
      { type: 'quiz', title: 'اختبر نفسي', content: 'الاختبار النهائي لدرس الأرض', order: 12 }
    ];

    for (const sec of defaultSections) {
      await db.run(
        'INSERT INTO lesson_sections (lesson_id, section_type, title, content, audio, video, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [lessonId, sec.type, sec.title, sec.content, sec.audio || '', sec.video || '', sec.image || '', sec.order]
      );
    }
  }

  // 2. Seed Vocabulary
  const vCount = await db.get('SELECT COUNT(*) as count FROM vocabulary WHERE lesson_id = ?', [lessonId]);
  if (vCount.count === 0) {
    const defaultVocab = [
      { word: 'كَنْزٌ', meaning: 'الشَّيْءُ الثَّمِينُ', image: '🪙', order: 1 },
      { word: 'يَنْكُشُ', meaning: 'يَحْفِرُ فِي الأَرْضِ', image: '⛏️', order: 2 },
      { word: 'رَجَعُوا', meaning: 'عَادُوا', image: '🚶‍♂️', order: 3 },
      { word: 'فَأْسٌ', meaning: 'أَدَاةُ الحَفْرِ والزِّراعَةِ', image: '🪓', order: 4 },
      { word: 'سَهْلٌ', meaning: 'أَرْضٌ مُنْبَسِطَةٌ واسِعَةٌ', image: '🏞️', order: 5 },
      { word: 'جَبَلٌ', meaning: 'أَرْضٌ مُرْتَفِعَةٌ عَنِ الأَرْضِ', image: '🏔️', order: 6 },
      { word: 'زَيْتُونٌ', meaning: 'شَجَرَةٌ مُبارَكَةٌ نَسْتَخْرِجُ مِنْها الزَّيْتَ', image: '🫒', order: 7 },
      { word: 'قَمْحٌ', meaning: 'نَبَاتٌ نَصْنَعُ مِنْهُ الْخُبْزَ', image: '🌾', order: 8 }
    ];
    for (const v of defaultVocab) {
      await db.run(
        'INSERT INTO vocabulary (lesson_id, word, meaning, image, sort_order) VALUES (?, ?, ?, ?, ?)',
        [lessonId, v.word, v.meaning, v.image, v.order]
      );
    }
  }

  // 3. Seed Questions (Listening, Comprehension, Review, Quiz)
  const qCount = await db.get('SELECT COUNT(*) as count FROM questions WHERE lesson_id = ?', [lessonId]);
  if (qCount.count === 0) {
    const defaultQuestions = [
      // Listening
      { section_type: 'listening', question_type: 'mcq', question_text: 'ما اسم النص الصوتي الذي استمعت إليه؟', options: ['بلادي جميلة', 'الأرض الخضراء', 'الأشجار العالية'], correct_answer: 'بلادي جميلة', order: 1 },
      { section_type: 'listening', question_type: 'mcq', question_text: 'ماذا يزرع الفلاح في السهول؟', options: ['القمح والشعير', 'التفاح والبرتقال', 'الأرز'], correct_answer: 'القمح والشعير', order: 2 },

      // Comprehension
      { section_type: 'comprehension', question_type: 'mcq', question_text: 'كم عدد أبناء الفلاح؟', options: ['اثنان', 'ثلاثة', 'أربعة'], correct_answer: 'أربعة', order: 1 },
      { section_type: 'comprehension', question_type: 'mcq', question_text: 'ماذا ترك الفلاح لأبنائه في الأرض؟', options: ['بيتاً', 'كنزاً', 'ثياباً'], correct_answer: 'كنزاً', order: 2 },
      { section_type: 'comprehension', question_type: 'mcq', question_text: 'ماذا حمل كل ابن ليحفر الأرض؟', options: ['فأساً', 'كتاباً', 'قلماً'], correct_answer: 'فأساً', order: 3 },
      { section_type: 'comprehension', question_type: 'tf', question_text: 'وجد الأبناء الكنز مدفوناً في صندوق ذهبي.', options: ['صح', 'خطأ'], correct_answer: 'خطأ', order: 4 },
      { section_type: 'comprehension', question_type: 'mcq', question_text: 'ماذا كان يقصد الفلاح بالكنز؟', options: ['الأرض وزراعتها', 'الذهب والفضة', 'الملابس الجديدة'], correct_answer: 'الأرض وزراعتها', order: 5 },

      // Review
      { section_type: 'review', question_type: 'mcq', question_text: 'خيرات بلادنا فلسطين:', options: ['قليلة', 'كثيرة', 'بعيدة'], correct_answer: 'كثيرة', order: 1 },
      { section_type: 'review', question_type: 'mcq', question_text: 'نزرع القمح والشعير في:', options: ['السهول', 'البحور', 'البيوت'], correct_answer: 'السهول', order: 2 },
      { section_type: 'review', question_type: 'mcq', question_text: 'نزرع في الجبال أشجار:', options: ['الزيتون والتين', 'الموز والنخيل', 'الأرز'], correct_answer: 'الزيتون والتين', order: 3 },
      { section_type: 'review', question_type: 'tf', question_text: 'الأرض لا تعطينا خيراً.', options: ['صح', 'خطأ'], correct_answer: 'خطأ', order: 4 },
      { section_type: 'review', question_type: 'mcq', question_text: 'طلب الأب من أبنائه أن يحافظوا على الأرض و:', options: ['يزرعوها', 'يهملوها', 'يبيعوها'], correct_answer: 'يزرعوها', order: 5 },

      // Quiz Questions (10 items)
      { section_type: 'quiz', question_type: 'mcq', question_text: 'جمع الفلاح أبناءه:', options: ['الاثنين', 'الثلاثة', 'الأربعة'], correct_answer: 'الأربعة', order: 1 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'بدأ الأبناء ينكشون:', options: ['البيت', 'الأرض', 'الطريق'], correct_answer: 'الأرض', order: 2 },
      { section_type: 'quiz', question_type: 'tf', question_text: 'الأرض هي الكنز الحقيقي الذي حافظ عليه أجدادنا.', options: ['صح', 'خطأ'], correct_answer: 'صح', order: 3 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'معنى كلمة (ينكش):', options: ['يغرس', 'يحفر', 'يبني'], correct_answer: 'يحفر', order: 4 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'معنى كلمة (كنز):', options: ['الشيء الثمين', 'البيت القديم', 'الشجرة الكبيرة'], correct_answer: 'الشيء الثمين', order: 5 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'الكلمة التي تحتوي حرف (ض):', options: ['أرض', 'سمك', 'شمس'], correct_answer: 'أرض', order: 6 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'كلمة (الأرض) نوع اللام فيها:', options: ['لام قمرية', 'لام شمسية'], correct_answer: 'لام قمرية', order: 7 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'كلمة (السنين) نوع اللام فيها:', options: ['لام شمسية', 'لام قمرية'], correct_answer: 'لام شمسية', order: 8 },
      { section_type: 'quiz', question_type: 'mcq', question_text: 'الترتيب الصحيح للجملة هو:', options: ['الأرض هي الكنز', 'الكنز الأرض هي', 'هي الكنز الأرض'], correct_answer: 'الأرض هي الكنز', order: 9 },
      { section_type: 'quiz', question_type: 'tf', question_text: 'إذا زرعنا الأرض وحافظنا عليها ستعطينا خيرات كثيرة.', options: ['صح', 'خطأ'], correct_answer: 'صح', order: 10 }
    ];

    for (const q of defaultQuestions) {
      await db.run(
        'INSERT INTO questions (lesson_id, section_type, question_type, question_text, options, correct_answer, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lessonId, q.section_type, q.question_type, q.question_text, JSON.stringify(q.options), q.correct_answer, q.order]
      );
    }
  }

  // 4. Seed 7 Activities
  const aCount = await db.get('SELECT COUNT(*) as count FROM activities WHERE lesson_id = ?', [lessonId]);
  if (aCount.count === 0) {
    const defaultActivities = [
      {
        type: 'match_meaning',
        title: 'صل الكلمة بالمعنى',
        instructions: 'اضغط على الكلمة ثم اضغط على معناها الصحيح',
        data: {
          pairs: [
            { left: 'كَنْزٌ', right: 'الشَّيْءُ الثَّمِينُ' },
            { left: 'يَنْكُشُ', right: 'يَحْفِرُ' },
            { left: 'رَجَعُوا', right: 'عَادُوا' },
            { left: 'فَأْسٌ', right: 'أَدَاةُ الْحَفْرِ' }
          ]
        },
        order: 1
      },
      {
        type: 'match_image',
        title: 'صل الكلمة بالصورة',
        instructions: 'طابق الكلمة بالصورة المناسبة لها',
        data: {
          pairs: [
            { text: 'فَأْسٌ', image: '🪓' },
            { text: 'زَيْتُونٌ', image: '🫒' },
            { text: 'قَمْحٌ', image: '🌾' },
            { text: 'جَبَلٌ', image: '🏔️' }
          ]
        },
        order: 2
      },
      {
        type: 'word_order',
        title: 'ترتيب الكلمات لتكون جملة مفيدة',
        instructions: 'رتب الكلمات التالية لتحصل على جملة صحيحة',
        data: {
          items: [
            {
              words: ['هِيَ', 'الْكَنْزُ', 'الأَرْضُ'],
              correct: ['الأَرْضُ', 'هِيَ', 'الْكَنْزُ']
            },
            {
              words: ['أَجْدادُنا', 'عَلَيْها', 'حافَظَ'],
              correct: ['حافَظَ', 'أَجْدادُنا', 'عَلَيْها']
            }
          ]
        },
        order: 3
      },
      {
        type: 'letter_select',
        title: 'اختر الحرف الصحيح',
        instructions: 'اختر الحرف المناسب لإكمال الكلمة',
        data: {
          items: [
            { prompt: 'الأر...', options: ['ض', 'ص', 'س'], correct: 'ض' },
            { prompt: 'الفلا...', options: ['ح', 'خ', 'ج'], correct: 'ح' },
            { prompt: 'الكن...', options: ['ز', 'ر', 'د'], correct: 'ز' }
          ]
        },
        order: 4
      },
      {
        type: 'classification',
        title: 'تصنيف الكلمات: لام قمرية ولام شمسية',
        instructions: 'صنف الكلمات التالية إلى نوع اللام المناسب',
        data: {
          categories: ['لام قمرية', 'لام شمسية'],
          items: [
            { text: 'الأَرْضُ', category: 'لام قمرية' },
            { text: 'الْفَلّاحُ', category: 'لام قمرية' },
            { text: 'الْكَنْزُ', category: 'لام قمرية' },
            { text: 'السِّنِينَ', category: 'لام شمسية' },
            { text: 'الزَّيْتُونُ', category: 'لام شمسية' }
          ]
        },
        order: 5
      },
      {
        type: 'memory',
        title: 'لعبة الذاكرة: الكلمات والصور',
        instructions: 'افتح البطاقات المتقابلة المتشابهة',
        data: {
          cards: [
            { id: 1, matchId: '1', text: 'فَأْسٌ' },
            { id: 2, matchId: '1', text: '🪓' },
            { id: 3, matchId: '2', text: 'زَيْتُونٌ' },
            { id: 4, matchId: '2', text: '🫒' },
            { id: 5, matchId: '3', text: 'قَمْحٌ' },
            { id: 6, matchId: '3', text: '🌾' },
            { id: 7, matchId: '4', text: 'كَنْزٌ' },
            { id: 8, matchId: '4', text: '🪙' }
          ]
        },
        order: 6
      },
      {
        type: 'word_analysis',
        title: 'تحليل الكلمة إلى مقاطع وحروف',
        instructions: 'حلل الكلمة إلى أجزائها وحروفها الصحيحة',
        data: {
          items: [
            { word: 'أَرْضٌ', parts: ['أَ', 'رْ', 'ضٌ'] },
            { word: 'كَنْزٌ', parts: ['كَ', 'نْ', 'زٌ'] }
          ]
        },
        order: 7
      }
    ];

    for (const act of defaultActivities) {
      await db.run(
        'INSERT INTO activities (lesson_id, activity_type, title, instructions, activity_data, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [lessonId, act.type, act.title, act.instructions, JSON.stringify(act.data), act.order]
      );
    }
  }

  // Seed Lesson 4 (الغراب والجرة) Pre-built HTML5 Games Package
  const l4Check = await db.get("SELECT COUNT(*) as count FROM activities WHERE lesson_id = 4 AND activity_type = 'html_game'");
  if (!l4Check || l4Check.count === 0) {
    await db.run('DELETE FROM activities WHERE lesson_id = 4');
    const lesson4HtmlGames = [
      {
        type: 'html_game',
        title: 'ميّزي حرفي ط / ظ',
        instructions: 'صنّفي الكلمات حسب الحرف المناسب.',
        data: {
          game_url: '/games/lesson-4/taa-zaa/index.html',
          icon: '🔤',
          description: 'صنّفي الكلمات حسب الحرف المناسب.'
        },
        order: 1
      },
      {
        type: 'html_game',
        title: 'صنّفي الكلمات حسب ع / غ',
        instructions: 'ضعي كل كلمة مع حرفها الصحيح.',
        data: {
          game_url: '/games/lesson-4/ain-ghain/index.html',
          icon: '🧩',
          description: 'ضعي كل كلمة مع حرفها الصحيح.'
        },
        order: 2
      },
      {
        type: 'html_game',
        title: 'ركّبي المقاطع',
        instructions: 'ركّبي المقاطع لتكوّني كلمات صحيحة.',
        data: {
          game_url: '/games/lesson-4/syllable-sort/index.html',
          icon: '🧱',
          description: 'ركّبي المقاطع لتكوّني كلمات صحيحة.'
        },
        order: 3
      },
      {
        type: 'html_game',
        title: 'ذاكرة الكلمات',
        instructions: 'طابقي الكلمة مع معناها.',
        data: {
          game_url: '/games/lesson-4/memory-vocab/index.html',
          icon: '🧠',
          description: 'طابقي الكلمة مع معناها.'
        },
        order: 4
      },
      {
        type: 'html_game',
        title: 'أكملي الكلمة',
        instructions: 'اختاري الحرف الناقص لإكمال الكلمة.',
        data: {
          game_url: '/games/lesson-4/complete-word/index.html',
          icon: '✏️',
          description: 'اختاري الحرف الناقص لإكمال الكلمة.'
        },
        order: 5
      }
    ];

    for (const g of lesson4HtmlGames) {
      await db.run(
        'INSERT INTO activities (lesson_id, activity_type, title, instructions, activity_data, sort_order, is_enabled) VALUES (4, ?, ?, ?, ?, ?, 1)',
        [g.type, g.title, g.instructions, JSON.stringify(g.data), g.order]
      );
    }
  }

  // Ensure classification game 'ميزي حرفي ط / ظ' has correct classification data
  const correctData = JSON.stringify({
    categories: ['حرف ط', 'حرف ظ'],
    items: [
      { text: 'الطَّويل', category: 'حرف ط' },
      { text: 'نَظَرَ', category: 'حرف ظ' },
      { text: 'نَظيف', category: 'حرف ظ' },
      { text: 'عَظيم', category: 'حرف ظ' },
      { text: 'ظَرْف', category: 'حرف ظ' }
    ]
  });
  await db.run(
    "UPDATE activities SET activity_data = ? WHERE lesson_id = 4 AND title = 'ميزي حرفي ط / ظ'",
    [correctData]
  );

  // Seed Lesson 4 (الغراب والجرة) 3 Official Review Drills in lesson_section_contents
  const l4RevCheck = await db.get("SELECT COUNT(*) as count FROM lesson_section_contents WHERE lesson_id = 4 AND section_type = 'activities' AND title = ?", ['✅ صح أم خطأ']);
  if (!l4RevCheck || l4RevCheck.count === 0) {
    await db.run("DELETE FROM lesson_section_contents WHERE lesson_id = 4 AND section_type = 'activities'");
    const l4ReviewDrills = [
      {
        title: '✅ صح أم خطأ',
        content: 'اقرئي العبارات، ثم اختاري صح أو خطأ.',
        extra: {
          question_type: 'true_false',
          drill_type: 'true_false',
          items: [
            { id: 1, statement: 'وجد الغراب جرةً فيها ماء.', answer: 'صح' },
            { id: 2, statement: 'استطاع الغراب الوصول إلى الماء بمنقاره بسهولة.', answer: 'خطأ' },
            { id: 3, statement: 'ألقى الغراب الحجارة في الجرة فارتفع الماء.', answer: 'صح' }
          ]
        },
        order: 1
      },
      {
        title: '✏️ أكمل الفراغ',
        content: 'أكملي الجملة بالكلمة المناسبة.',
        extra: {
          question_type: 'short_answer',
          drill_type: 'fill_blank',
          items: [
            { id: 1, question: 'عطش الغراب فأخذ يبحث عن ________.', answer: 'الماء' },
            { id: 2, question: 'وجد الغراب ________ فيها ماء.', answer: 'جرة' },
            { id: 3, question: 'ألقى الغراب ________ في الجرة.', answer: 'الحجارة' }
          ]
        },
        order: 2
      },
      {
        title: '🔤 اختاري الكلمة المناسبة',
        content: 'اختاري الكلمة الصحيحة لإكمال الجملة.',
        extra: {
          question_type: 'mcq',
          drill_type: 'multiple_choice',
          items: [
            { id: 1, question: 'كان يوم الصيف ________.', options: ['بارداً', 'حاراً', 'ممطراً'], answer: 'حاراً' },
            { id: 2, question: 'وجد الغراب حجارة ________.', options: ['صغيرة', 'كبيرة جداً', 'ملونة'], answer: 'صغيرة' },
            { id: 3, question: 'شرب الغراب حتى ________.', options: ['ارتوى', 'نام', 'طار'], answer: 'ارتوى' }
          ]
        },
        order: 3
      }
    ];

    for (const d of l4ReviewDrills) {
      await db.run(
        `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, extra_data, sort_order, is_visible)
         VALUES (4, 'activities', 'question', ?, ?, ?, ?, 1)`,
        [d.title, d.content, JSON.stringify(d.extra), d.order]
      );
    }
  }

  // 5. Seed Writing Drills
  const wCount = await db.get('SELECT COUNT(*) as count FROM writing_drills WHERE lesson_id = ?', [lessonId]);
  if (wCount.count === 0) {
    const defaultWriting = [
      { drill_type: 'copy', title: 'تمرين النسخ', prompt: 'أنسخ الجملة الآتية بخط جميل:', target_answer: 'حَافِظُوا عَلَى الأَرْضِ وَازْرَعُوهَا.', order: 1 },
      { drill_type: 'free', title: 'التعبير الكتابي', prompt: 'أكون وأكتب جملة عن أرضي فلسطين:', target_answer: 'أرضي فلسطين أرض مباركة معطاءة.', order: 2 }
    ];
    for (const w of defaultWriting) {
      await db.run(
        'INSERT INTO writing_drills (lesson_id, drill_type, title, prompt, target_answer, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [lessonId, w.drill_type, w.title, w.prompt, w.target_answer, w.order]
      );
    }
  }

  // 6. Seed Dictation
  const dCount = await db.get('SELECT COUNT(*) as count FROM dictations WHERE lesson_id = ?', [lessonId]);
  if (dCount.count === 0) {
    await db.run(
      'INSERT INTO dictations (lesson_id, title, target_text, audio, instructions, tolerance_level) VALUES (?, ?, ?, ?, ?, ?)',
      [lessonId, 'إملاء درس الأرض', 'الأَرْضُ هِيَ الْكَنْزُ، حافَظَ عَلَيْها أَجْدادُنا.', '/uploads/dictation_audio.mp3', 'استمع جيداً إلى الجملة ثم اكتبها بدون أخطاء إملائية', 1]
    );
  }

  // 7. Seed Chant
  const cCount = await db.get('SELECT COUNT(*) as count FROM chants WHERE lesson_id = ?', [lessonId]);
  if (cCount.count === 0) {
    await db.run(
      'INSERT INTO chants (lesson_id, title, author, content, image, audio) VALUES (?, ?, ?, ?, ?, ?)',
      [
        lessonId,
        'أَطْفالُ فِلَسْطِين',
        'إبراهيم العلي',
        'أَنَا شِبْلٌ أَنَا زَهْرَة | وَهَبْنا الرُّوحَ لِلثَّوْرَة\nبَنَى أَجْدادُنا دَوْراً | لَنا فِي أَرْضِنا الْحُرَّة\nأَنَا شِبْلٌ أَنَا زَهْرَة | حَمَلْنا جَمْرَةَ الثَّوْرَة\nإِلَى حَيْفا إِلَى يافا | إِلَى الأَقْصَى إِلَى الصَّخْرَة',
        '/uploads/chant_cover.png',
        '/uploads/chant_audio.mp3'
      ]
    );
  }

  // 8. Seed Default Media Items
  const mCount = await db.get('SELECT COUNT(*) as count FROM media');
  if (mCount.count === 0) {
    const defaultMedia = [
      { type: 'image', url: '/uploads/conv_1.png', filename: 'conv_1.png' },
      { type: 'image', url: '/uploads/conv_2.png', filename: 'conv_2.png' },
      { type: 'image', url: '/uploads/conv_3.png', filename: 'conv_3.png' },
      { type: 'image', url: '/uploads/pdf_page_1.png', filename: 'pdf_page_1.png' },
      { type: 'image', url: '/uploads/chant_cover.png', filename: 'chant_cover.png' },
      { type: 'video', url: '/uploads/earth_video.mp4', filename: 'earth_video.mp4' }
    ];
    for (const m of defaultMedia) {
      await db.run('INSERT INTO media (type, url, filename) VALUES (?, ?, ?)', [m.type, m.url, m.filename]);
    }
  }

  // 9. Seed Expression Drills for Lesson 4 (الغراب والجرة)
  const expL4Count = await db.get('SELECT COUNT(*) as count FROM expression_drills WHERE lesson_id = 4');
  if (!expL4Count || expL4Count.count === 0) {
    await db.run(
      'INSERT INTO expression_drills (lesson_id, title, question, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?)',
      [4, 'أعبر عن رأيي', 'ما رأيكِ في تصرف الغراب عندما لم يستطع الوصول إلى الماء؟', 1, 1]
    );
    await db.run(
      'INSERT INTO expression_drills (lesson_id, title, question, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?)',
      [4, 'لو كنتُ مكانه', 'ماذا كنتِ ستفعلين لو كنتِ مكان الغراب؟', 2, 1]
    );
  }

  // 10. Seed Lesson 4 Enrichment Contents
  const l4EnrichCheck = await db.get("SELECT COUNT(*) as count FROM lesson_section_contents WHERE lesson_id = 4 AND section_type = 'enrichment'");
  if (!l4EnrichCheck || l4EnrichCheck.count === 0) {
    await db.run("DELETE FROM lesson_section_contents WHERE lesson_id = 4 AND section_type = 'enrichment'");
    const l4EnrichItems = [
      {
        content_type: 'text',
        title: '⭐ إثراء',
        content: 'شاهدي واستمتعي وتعلمي شيئاً جديداً.',
        media_url: '',
        order: 1
      },
      {
        content_type: 'video',
        title: '🎬 شاهدي كيف يرتفع الماء',
        content: 'شاهدي ماذا يحدث لمستوى الماء عندما نضع الحجارة داخل الجرة.',
        media_url: '/uploads/video/water01_1791292361339_2kj5t.mp4',
        order: 2
      },
      {
        content_type: 'image',
        title: '🖼️ ماذا تلاحظين؟',
        content: 'تأملي الصورة ولاحظي كيف يرتفع الماء تدريجياً داخل الجرة.',
        media_url: '/uploads/images/0005_1791292196971_k4lfe.png',
        order: 3
      },
      {
        content_type: 'text',
        title: '💡 معلومة جديدة',
        content: 'عندما نضع الحجارة في الماء فإنها تشغل حيزاً، فيرتفع مستوى الماء.',
        media_url: '',
        order: 4
      }
    ];

    for (const item of l4EnrichItems) {
      await db.run(
        `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, media_url, sort_order, is_visible)
         VALUES (4, 'enrichment', ?, ?, ?, ?, ?, 1)`,
        [item.content_type, item.title, item.content, item.media_url, item.order]
      );
    }
  }

  // 11. Seed Thinking Keys Drills for Lesson 4 (الغراب والجرة) & All Lessons Default
  const tkL4Count = await db.get('SELECT COUNT(*) as count FROM thinking_keys_drills WHERE lesson_id = 4');
  if (!tkL4Count || tkL4Count.count === 0) {
    await db.run(
      'INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order) VALUES (?, ?, ?, 1, 1)',
      [4, 'analyze', 'ما المشكلة التي واجهت الغراب؟ وكيف حلّها؟']
    );
    await db.run(
      'INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order) VALUES (?, ?, ?, 1, 2)',
      [4, 'discuss', 'هل كان تصرف الغراب ذكياً؟ ولماذا؟']
    );
    await db.run(
      'INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order) VALUES (?, ?, ?, 1, 3)',
      [4, 'innovate', 'فكري في طريقة أخرى تساعد الغراب على الوصول إلى الماء.']
    );
    await db.run(
      'INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order) VALUES (?, ?, ?, 1, 4)',
      [4, 'create', 'ارسمي مشهداً من قصة الغراب والجرة، أو صممي حلاً جديداً يساعد الغراب على الوصول إلى الماء.']
    );
  }

  console.log('DB Seed initialization completed successfully.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'غير مصرح بالدخول' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'الجلسة منتهية، يرجى إعادة تسجيل الدخول' });
    req.user = user;
    next();
  });
}

// PUBLIC STUDENT ENDPOINTS
APP.get('/api/student/lessons', async (req, res) => {
  try {
    const lessons = await db.all("SELECT id, title, description, welcome_message, image, sort_order, is_published, status FROM lessons WHERE status != 'hidden' AND is_published != 0 ORDER BY sort_order ASC");
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الدروس' });
  }
});

// Safe Non-Destructive Legacy Migration Helper
async function autoMigrateLegacySectionContent(dbInstance, lessonId, sectionType) {
  if (!lessonId) return;

  const checkQuery = sectionType
    ? 'SELECT COUNT(*) as count FROM lesson_section_contents WHERE lesson_id = ? AND section_type = ?'
    : 'SELECT COUNT(*) as count FROM lesson_section_contents WHERE lesson_id = ?';
  const checkParams = sectionType ? [lessonId, sectionType] : [lessonId];

  const existing = await dbInstance.get(checkQuery, checkParams);
  if (existing && existing.count > 0) {
    return; // Already has content, do not duplicate
  }

  const secTypesToMigrate = sectionType
    ? [sectionType]
    : ['listening', 'observe', 'reading', 'comprehension', 'activities', 'writing', 'dictation', 'expression', 'enrichment', 'thinking_keys', 'quiz'];

  for (const stype of secTypesToMigrate) {
    let orderIndex = 1;

    // 1. lesson_sections
    const sec = await dbInstance.get('SELECT * FROM lesson_sections WHERE lesson_id = ? AND section_type = ?', [lessonId, stype]);
    if (sec) {
      if (sec.content && sec.content.trim() !== '' && sec.content !== 'undefined') {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, stype, 'instructions', sec.title || 'شرح المهارة', sec.content, orderIndex++, sec.is_enabled ?? 1]
        );
      }
      if (sec.image && sec.image.trim() !== '' && sec.image !== 'undefined') {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, media_url, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, stype, 'image', 'صورة التوضيح', sec.image, orderIndex++, sec.is_enabled ?? 1]
        );
      }
      if (sec.audio && sec.audio.trim() !== '' && sec.audio !== 'undefined') {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, media_url, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, stype, 'audio', 'صوت المهارة', sec.audio, orderIndex++, sec.is_enabled ?? 1]
        );
      }
    }

    // 2. questions
    const questions = await dbInstance.all('SELECT * FROM questions WHERE lesson_id = ? AND section_type = ? ORDER BY sort_order ASC, id ASC', [lessonId, stype]);
    for (const q of questions) {
      let optionsList = [];
      try {
        optionsList = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);
      } catch (e) { }
      const extra = JSON.stringify({
        question_type: q.question_type || 'mcq',
        options: optionsList,
        correct_answer: q.correct_answer || ''
      });
      await dbInstance.run(
        `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, extra_data, sort_order, is_visible)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lessonId, stype, 'question', q.question_text || 'سؤال', '', extra, orderIndex++, q.is_enabled ?? 1]
      );
    }

    // 3. vocabulary (for reading)
    if (stype === 'reading') {
      const vocabList = await dbInstance.all('SELECT * FROM vocabulary WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);
      for (const v of vocabList) {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, media_url, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, 'reading', 'text', v.word, `المعنى: ${v.meaning}`, v.image || v.audio || '', orderIndex++, v.is_enabled ?? 1]
        );
      }
    }

    // 4. activities
    if (stype === 'activities') {
      const actList = await dbInstance.all('SELECT * FROM activities WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);
      for (const act of actList) {
        let actData = {};
        try {
          actData = typeof act.activity_data === 'string' ? JSON.parse(act.activity_data || '{}') : (act.activity_data || {});
        } catch (e) { }
        const extra = JSON.stringify({
          activity_type: act.activity_type,
          activity_data: actData
        });
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, extra_data, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, 'activities', 'question', act.title || 'لعبة تفاعلية', act.instructions || '', extra, orderIndex++, act.is_enabled ?? 1]
        );
      }
    }

    // 5. dictation
    if (stype === 'dictation') {
      const dict = await dbInstance.get('SELECT * FROM dictations WHERE lesson_id = ? LIMIT 1', [lessonId]);
      if (dict) {
        if (dict.target_text) {
          await dbInstance.run(
            `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, sort_order, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [lessonId, 'dictation', 'text', dict.title || 'نص الإملاء', dict.target_text, orderIndex++, dict.is_enabled ?? 1]
          );
        }
        if (dict.audio) {
          await dbInstance.run(
            `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, media_url, sort_order, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [lessonId, 'dictation', 'audio', 'صوت الإملاء', dict.audio, orderIndex++, dict.is_enabled ?? 1]
          );
        }
      }
    }

    // 6. enrichment
    if (stype === 'enrichment') {
      const chant = await dbInstance.get('SELECT * FROM chants WHERE lesson_id = ? LIMIT 1', [lessonId]);
      if (chant) {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, media_url, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, 'enrichment', 'text', chant.title || 'النشيد', chant.content || '', chant.audio || chant.image || '', orderIndex++, chant.is_enabled ?? 1]
        );
      }
      const enrichments = await dbInstance.all('SELECT * FROM enrichments WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);
      for (const en of enrichments) {
        await dbInstance.run(
          `INSERT INTO lesson_section_contents (lesson_id, section_type, content_type, title, content, media_url, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [lessonId, 'enrichment', en.type === 'video' ? 'video' : en.type === 'image' ? 'image' : 'text', en.title || 'محتوى إثرائي', en.content || '', en.media_url || '', orderIndex++, en.is_enabled ?? 1]
        );
      }
    }
  }
}

async function autoMigrateLegacyWritingDrills(dbInstance) {
  try {
    const legacyItems = await dbInstance.all(
      "SELECT * FROM lesson_section_contents WHERE section_type = 'writing' AND content IS NOT NULL AND content != ''"
    );
    for (const item of legacyItems) {
      const sentenceText = (item.content || '').trim();
      if (sentenceText.length > 2) {
        const existing = await dbInstance.get(
          'SELECT id FROM writing_drills WHERE lesson_id = ? AND target_answer = ?',
          [item.lesson_id, sentenceText]
        );
        if (!existing) {
          await dbInstance.run(
            `INSERT INTO writing_drills (lesson_id, drill_type, title, prompt, target_answer, sort_order, is_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              item.lesson_id,
              'copy',
              item.title || 'انسخي الجملة الآتية بخط جميل.',
              item.title || 'انسخي الجملة الآتية بخط جميل.',
              sentenceText,
              item.sort_order || 1,
              item.is_visible ?? 1
            ]
          );
        }
      }
    }
  } catch (err) {
    console.error('Error auto migrating writing drills:', err);
  }
}

APP.get('/api/student/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });

    await autoMigrateLegacyWritingDrills(db);

    const sections = await db.all('SELECT * FROM lesson_sections WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC', [lessonId]);
    const vocabulary = await db.all('SELECT * FROM vocabulary WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC', [lessonId]);
    const questions = await db.all('SELECT * FROM questions WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC', [lessonId]);
    const activities = await db.all('SELECT * FROM activities WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC', [lessonId]);
    const enrichments = await db.all('SELECT * FROM enrichments WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC', [lessonId]);
    const writing = await db.all('SELECT * FROM writing_drills WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC, id ASC', [lessonId]);
    const dictation = await db.get('SELECT * FROM dictations WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC LIMIT 1', [lessonId]);
    const chant = await db.get('SELECT * FROM chants WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC LIMIT 1', [lessonId]);

    let section_contents = await db.all('SELECT * FROM lesson_section_contents WHERE lesson_id = ? AND is_visible = 1 ORDER BY sort_order ASC, id ASC', [lessonId]);
    if (section_contents.length === 0) {
      await autoMigrateLegacySectionContent(db, lessonId, null);
      section_contents = await db.all('SELECT * FROM lesson_section_contents WHERE lesson_id = ? AND is_visible = 1 ORDER BY sort_order ASC, id ASC', [lessonId]);
    }

    res.json({
      lesson,
      sections,
      vocabulary,
      questions,
      activities,
      enrichments,
      writing,
      dictation,
      chant,
      section_contents
    });
  } catch (err) {
    console.error('Error in /api/student/lessons/:id:', err);
    res.status(500).json({ message: 'تعذر تحميل بيانات الدرس', error: err.message });
  }
});

// Admin: Section Contents CRUD
APP.get('/api/admin/section-contents', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const sectionType = req.query.section_type;

    if (sectionType) {
      await autoMigrateLegacySectionContent(db, lessonId, sectionType);
    } else {
      await autoMigrateLegacySectionContent(db, lessonId, null);
    }

    let query = 'SELECT * FROM lesson_section_contents WHERE lesson_id = ?';
    let params = [lessonId];
    if (sectionType) {
      query += ' AND section_type = ?';
      params.push(sectionType);
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const list = await db.all(query, params);
    res.json(list);
  } catch (err) {
    console.error('Error fetching section contents:', err);
    res.status(500).json({ message: 'تعذر تحميل محتوى القسم' });
  }
});

APP.post('/api/admin/section-contents', authenticateToken, async (req, res) => {
  const { lesson_id, section_type, content_type, title, content, media_url, extra_data, sort_order, is_visible } = req.body;
  try {
    const extraDataStr = typeof extra_data === 'object' ? JSON.stringify(extra_data) : (extra_data || '');
    const result = await db.run(
      `INSERT INTO lesson_section_contents 
       (lesson_id, section_type, content_type, title, content, media_url, extra_data, sort_order, is_visible) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lesson_id || 1,
        section_type || 'listening',
        content_type || 'text',
        title || '',
        content || '',
        media_url || '',
        extraDataStr,
        sort_order || 1,
        is_visible ?? 1
      ]
    );
    res.json({ id: result.lastID, message: 'تم إضافة المحتوى بنجاح ✅' });
  } catch (err) {
    console.error('Error inserting section content:', err);
    res.status(500).json({ message: 'تعذر إضافة المحتوى' });
  }
});

APP.put('/api/admin/section-contents/reorder', authenticateToken, async (req, res) => {
  const { items } = req.body;
  try {
    if (Array.isArray(items)) {
      for (const item of items) {
        await db.run('UPDATE lesson_section_contents SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
    }
    res.json({ message: 'تم تحديث الترتيب بنجاح ✅' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث الترتيب' });
  }
});

APP.put('/api/admin/section-contents/:id', authenticateToken, async (req, res) => {
  const { content_type, title, content, media_url, extra_data, sort_order, is_visible } = req.body;
  try {
    const extraDataStr = typeof extra_data === 'object' ? JSON.stringify(extra_data) : (extra_data || '');
    await db.run(
      `UPDATE lesson_section_contents 
       SET content_type = ?, title = ?, content = ?, media_url = ?, extra_data = ?, sort_order = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [content_type, title || '', content || '', media_url || '', extraDataStr, sort_order || 1, is_visible ?? 1, req.params.id]
    );
    res.json({ message: 'تم تحديث المحتوى بنجاح ✅' });
  } catch (err) {
    console.error('Error updating section content:', err);
    res.status(500).json({ message: 'تعذر تحديث المحتوى' });
  }
});

APP.delete('/api/admin/section-contents/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM lesson_section_contents WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف العنصر بنجاح ✅' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر حذف العنصر' });
  }
});

// Admin: Writing Drills CRUD ("أكتب بخط جميل")
APP.get('/api/admin/writing-drills', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    await autoMigrateLegacyWritingDrills(db);
    const drills = await db.all(
      'SELECT * FROM writing_drills WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC',
      [lessonId]
    );
    res.json(drills);
  } catch (err) {
    console.error('Error fetching writing drills:', err);
    res.status(500).json({ message: 'تعذر تحميل تمارين الكتابة' });
  }
});

APP.post('/api/admin/writing-drills', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, title, prompt, target_answer, drill_type, sort_order, is_enabled } = req.body;
    const taskTitle = title || prompt || 'انسخي الجملة الآتية بخط جميل.';
    const sentence = target_answer || '';

    const maxOrderRes = await db.get('SELECT MAX(sort_order) as m FROM writing_drills WHERE lesson_id = ?', [lesson_id || 1]);
    const nextOrder = sort_order || ((maxOrderRes?.m || 0) + 1);

    const result = await db.run(
      `INSERT INTO writing_drills (lesson_id, drill_type, title, prompt, target_answer, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        lesson_id || 1,
        drill_type || 'copy',
        taskTitle,
        taskTitle,
        sentence,
        nextOrder,
        is_enabled ?? 1
      ]
    );

    const created = await db.get('SELECT * FROM writing_drills WHERE id = ?', [result.lastID]);
    res.json({ success: true, item: created, message: 'تم إضافة تمرين الكتابة بنجاح ✅' });
  } catch (err) {
    console.error('Error adding writing drill:', err);
    res.status(500).json({ message: 'تعذر إضافة تمرين الكتابة' });
  }
});

APP.put('/api/admin/writing-drills/:id', authenticateToken, async (req, res) => {
  try {
    const { title, prompt, target_answer, is_enabled, sort_order } = req.body;
    const taskTitle = title || prompt || 'انسخي الجملة الآتية بخط جميل.';
    const sentence = target_answer || '';

    await db.run(
      `UPDATE writing_drills 
       SET title = ?, prompt = ?, target_answer = ?, is_enabled = ?, sort_order = ?
       WHERE id = ?`,
      [
        taskTitle,
        taskTitle,
        sentence,
        is_enabled ?? 1,
        sort_order || 1,
        req.params.id
      ]
    );
    const updated = await db.get('SELECT * FROM writing_drills WHERE id = ?', [req.params.id]);
    res.json({ success: true, item: updated, message: 'تم تحديث تمرين الكتابة بنجاح ✅' });
  } catch (err) {
    console.error('Error updating writing drill:', err);
    res.status(500).json({ message: 'تعذر تحديث تمرين الكتابة' });
  }
});

APP.delete('/api/admin/writing-drills/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM writing_drills WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف تمرين الكتابة بنجاح ✅' });
  } catch (err) {
    console.error('Error deleting writing drill:', err);
    res.status(500).json({ message: 'تعذر حذف تمرين الكتابة' });
  }
});

// Admin: Dictation Drills CRUD ("أستمع وأكتب")
APP.get('/api/admin/dictation-drills', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const drills = await db.all(
      'SELECT * FROM dictations WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC',
      [lessonId]
    );
    res.json(drills);
  } catch (err) {
    console.error('Error fetching dictation drills:', err);
    res.status(500).json({ message: 'تعذر تحميل تمارين الإملاء' });
  }
});

APP.post('/api/admin/dictation-drills', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, title, target_text, audio, instructions, sort_order, is_enabled } = req.body;
    const taskTitle = title || 'استمعي ثم اكتبي الجملة.';
    const targetText = target_text || '';
    const audioUrl = audio || '';

    const maxOrderRes = await db.get('SELECT MAX(sort_order) as m FROM dictations WHERE lesson_id = ?', [lesson_id || 1]);
    const nextOrder = sort_order || ((maxOrderRes?.m || 0) + 1);

    const result = await db.run(
      `INSERT INTO dictations (lesson_id, title, target_text, audio, instructions, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        lesson_id || 1,
        taskTitle,
        targetText,
        audioUrl,
        instructions || 'استمعي جيداً، ثم اكتبي ما تسمعينه.',
        nextOrder,
        is_enabled ?? 1
      ]
    );

    const created = await db.get('SELECT * FROM dictations WHERE id = ?', [result.lastID]);
    res.json({ success: true, item: created, message: 'تم إضافة تمرين الإملاء بنجاح ✅' });
  } catch (err) {
    console.error('Error adding dictation drill:', err);
    res.status(500).json({ message: 'تعذر إضافة تمرين الإملاء' });
  }
});

APP.put('/api/admin/dictation-drills/:id', authenticateToken, async (req, res) => {
  try {
    const { title, target_text, audio, instructions, is_enabled, sort_order } = req.body;
    const taskTitle = title || 'استمعي ثم اكتبي الجملة.';
    const targetText = target_text || '';
    const audioUrl = audio || '';

    await db.run(
      `UPDATE dictations 
       SET title = ?, target_text = ?, audio = ?, instructions = ?, is_enabled = ?, sort_order = ?
       WHERE id = ?`,
      [
        taskTitle,
        targetText,
        audioUrl,
        instructions || 'استمعي جيداً، ثم اكتبي ما تسمعينه.',
        is_enabled ?? 1,
        sort_order || 1,
        req.params.id
      ]
    );
    const updated = await db.get('SELECT * FROM dictations WHERE id = ?', [req.params.id]);
    res.json({ success: true, item: updated, message: 'تم تحديث تمرين الإملاء بنجاح ✅' });
  } catch (err) {
    console.error('Error updating dictation drill:', err);
    res.status(500).json({ message: 'تعذر تحديث تمرين الإملاء' });
  }
});

APP.delete('/api/admin/dictation-drills/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM dictations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف تمرين الإملاء بنجاح ✅' });
  } catch (err) {
    console.error('Error deleting dictation drill:', err);
    res.status(500).json({ message: 'تعذر حذف تمرين الإملاء' });
  }
});

// Student Dictation Endpoint
APP.get('/api/student/dictation-drills', async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const drills = await db.all(
      'SELECT id, lesson_id, title, audio, instructions, sort_order FROM dictations WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC, id ASC',
      [lessonId]
    );
    res.json(drills);
  } catch (err) {
    console.error('Error fetching student dictation drills:', err);
    res.status(500).json({ message: 'تعذر تحميل تمارين الإملاء للطالبة' });
  }
});

// Admin: Expression Drills CRUD ("أعبر")
APP.get('/api/admin/expression-drills', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const drills = await db.all(
      'SELECT * FROM expression_drills WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC',
      [lessonId]
    );
    res.json(drills);
  } catch (err) {
    console.error('Error fetching expression drills:', err);
    res.status(500).json({ message: 'تعذر تحميل مهام التعبير' });
  }
});

APP.post('/api/admin/expression-drills', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, title, question, sort_order, is_enabled } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'عنوان المهمة مطلوب' });
    }
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'نص السؤال مطلوب' });
    }

    const maxSort = await db.get('SELECT MAX(sort_order) as maxSort FROM expression_drills WHERE lesson_id = ?', [lesson_id || 1]);
    const nextOrder = sort_order || ((maxSort?.maxSort || 0) + 1);

    const result = await db.run(
      `INSERT INTO expression_drills (lesson_id, title, question, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [lesson_id || 1, title.trim(), question.trim(), nextOrder, is_enabled ?? 1]
    );

    const newDrill = await db.get('SELECT * FROM expression_drills WHERE id = ?', [result.lastID]);
    res.json({ success: true, item: newDrill, message: 'تم حفظ مهمة التعبير بنجاح ✅' });
  } catch (err) {
    console.error('Error creating expression drill:', err);
    res.status(500).json({ message: 'تعذر إضافة مهمة التعبير' });
  }
});

APP.put('/api/admin/expression-drills/:id', authenticateToken, async (req, res) => {
  try {
    const { title, question, sort_order, is_enabled } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'عنوان المهمة مطلوب' });
    }
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'نص السؤال مطلوب' });
    }

    await db.run(
      `UPDATE expression_drills 
       SET title = ?, question = ?, sort_order = ?, is_enabled = ?
       WHERE id = ?`,
      [title.trim(), question.trim(), sort_order || 1, is_enabled ?? 1, req.params.id]
    );

    const updated = await db.get('SELECT * FROM expression_drills WHERE id = ?', [req.params.id]);
    res.json({ success: true, item: updated, message: 'تم تحديث مهمة التعبير بنجاح ✅' });
  } catch (err) {
    console.error('Error updating expression drill:', err);
    res.status(500).json({ message: 'تعذر تحديث مهمة التعبير' });
  }
});

APP.delete('/api/admin/expression-drills/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM expression_drills WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف مهمة التعبير بنجاح ✅' });
  } catch (err) {
    console.error('Error deleting expression drill:', err);
    res.status(500).json({ message: 'تعذر حذف مهمة التعبير' });
  }
});

// Student Expression Endpoint
APP.get('/api/student/expression-drills', async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const drills = await db.all(
      'SELECT id, lesson_id, title, question, sort_order FROM expression_drills WHERE lesson_id = ? AND is_enabled = 1 ORDER BY sort_order ASC, id ASC',
      [lessonId]
    );
    res.json(drills);
  } catch (err) {
    console.error('Error fetching student expression drills:', err);
    res.status(500).json({ message: 'تعذر تحميل مهام التعبير للطالبة' });
  }
});

// STUDENT LOGIN & SUBMISSIONS API
APP.post('/api/student/login', async (req, res) => {
  try {
    const { student_code, code, name } = req.body;
    const inputCode = (student_code || code || '').toString().trim();
    const inputName = (name || '').toString().trim();

    let student = null;

    if (inputCode) {
      student = await db.get('SELECT * FROM students WHERE student_code = ?', [inputCode]);
      if (!student) {
        return res.status(400).json({ message: 'رمز الدخول غير صحيح' });
      }
    } else if (inputName) {
      student = await db.get('SELECT * FROM students WHERE name = ?', [inputName]);
      if (!student) {
        const newCode = await generateStudentCode(db);
        const result = await db.run('INSERT INTO students (name, student_code, status) VALUES (?, ?, "active")', [inputName, newCode]);
        student = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
      }
    } else {
      return res.status(400).json({ message: 'يرجى إدخال رمز الدخول' });
    }

    if (student.status !== 'active') {
      return res.status(403).json({ message: 'حسابك غير مفعّل حالياً، راجعي معلمتك.' });
    }

    await db.run('UPDATE students SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [student.id]);
    res.json(student);
  } catch (err) {
    console.error('Error in student login:', err);
    res.status(500).json({ message: 'تعذر تسجيل دخول الطالبة' });
  }
});

APP.post('/api/student/submit', upload.single('file'), async (req, res) => {
  try {
    const { student_id, student_code, student_name, lesson_id, section_type, activity_id, question_id, question_text, submission_type, text_content } = req.body;

    let student = null;
    if (student_id) {
      student = await db.get('SELECT * FROM students WHERE id = ?', [student_id]);
    } else if (student_code) {
      student = await db.get('SELECT * FROM students WHERE student_code = ?', [student_code]);
    } else if (student_name && student_name.trim()) {
      const cleanStudentName = student_name.trim();
      student = await db.get('SELECT * FROM students WHERE name = ?', [cleanStudentName]);
      if (!student) {
        const newCode = await generateStudentCode(db);
        const sRes = await db.run('INSERT INTO students (name, student_code, status) VALUES (?, ?, "active")', [cleanStudentName, newCode]);
        student = { id: sRes.lastID, name: cleanStudentName, student_code: newCode };
      }
    }

    if (!student) {
      return res.status(400).json({ message: 'لم يتم التعرف على الطالبة' });
    }

    let filePath = null;
    if (req.file) {
      filePath = getRelativeUrl(req.file);
    }

    const targetQId = question_id || activity_id || null;
    const targetQText = question_text || null;

    let existing = null;
    if (targetQId || targetQText) {
      existing = await db.get(
        `SELECT * FROM student_submissions 
         WHERE student_id = ? AND lesson_id = ? AND section_type = ? 
         AND (
           (? IS NOT NULL AND question_id = ?) OR 
           (? IS NOT NULL AND question_text = ?) OR
           (? IS NOT NULL AND activity_id = ?)
         )`,
        [student.id, lesson_id || 1, section_type || 'general', targetQId, targetQId, targetQText, targetQText, targetQId, targetQId]
      );
    }

    await db.run('UPDATE students SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?', [student.id]);

    if (existing) {
      await db.run(
        `UPDATE student_submissions 
         SET submission_type = ?, text_content = ?, file_path = ?, status = 'resubmitted', created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [submission_type || 'text', text_content || null, filePath || existing.file_path, existing.id]
      );
      res.json({ success: true, id: existing.id, updated: true, message: 'أحسنتِ 🌟 تم تحديث إجابتكِ وإرسالها لمعلمتكِ' });
    } else {
      const result = await db.run(
        `INSERT INTO student_submissions 
         (student_id, student_name, lesson_id, section_type, activity_id, question_id, question_text, submission_type, text_content, file_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
        [student.id, student.name, lesson_id || 1, section_type || 'general', targetQId, targetQId, targetQText, submission_type || 'text', text_content || null, filePath]
      );
      res.json({ success: true, id: result.lastID, updated: false, message: 'أحسنتِ 🌟 تم إرسال إجابتكِ لمعلمتكِ' });
    }
  } catch (err) {
    console.error('Error submitting work:', err);
    res.status(500).json({ message: 'تعذر إرسال العمل' });
  }
});

APP.get('/api/student/submissions', async (req, res) => {
  try {
    const { student_id, student_name, student_code, lesson_id, section_type } = req.query;
    let query = `SELECT s.*, l.title as lesson_title 
                 FROM student_submissions s 
                 LEFT JOIN lessons l ON s.lesson_id = l.id 
                 WHERE 1=1`;
    const params = [];

    if (student_id) {
      query += ` AND s.student_id = ?`;
      params.push(student_id);
    } else if (student_code) {
      const st = await db.get('SELECT id FROM students WHERE student_code = ?', [student_code]);
      if (st) {
        query += ` AND s.student_id = ?`;
        params.push(st.id);
      } else {
        return res.json([]);
      }
    } else if (student_name) {
      query += ` AND (s.student_name = ? OR s.student_id = (SELECT id FROM students WHERE name = ?))`;
      params.push(student_name.trim(), student_name.trim());
    } else {
      return res.json([]);
    }

    if (lesson_id) {
      query += ` AND s.lesson_id = ?`;
      params.push(lesson_id);
    }
    if (section_type) {
      query += ` AND s.section_type = ?`;
      params.push(section_type);
    }
    query += ` ORDER BY s.created_at DESC`;
    const submissions = await db.all(query, params);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'تعذر جلب الأعمال' });
  }
});

// ADMIN STUDENTS MANAGEMENT ENDPOINTS
APP.get('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT st.*, 
        (SELECT COUNT(*) FROM student_submissions sub WHERE sub.student_id = st.id) as submissions_count,
        (SELECT COUNT(*) FROM student_submissions sub WHERE sub.student_id = st.id AND sub.status = 'reviewed') as reviewed_count,
        (SELECT MAX(created_at) FROM student_submissions sub WHERE sub.student_id = st.id) as last_submission_at
      FROM students st
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND st.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (st.name LIKE ? OR st.student_code LIKE ? OR st.section_group LIKE ? OR st.group_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY COALESCE(st.last_activity_at, st.last_login_at, st.created_at) DESC`;

    const students = await db.all(query, params);
    res.json(students || []);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, message: 'تعذر تحميل قائمة الطالبات', error: err.message || String(err) });
  }
});

APP.post('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    const name = req.body.name ? req.body.name.trim() : '';
    const section_group = req.body.section_group !== undefined ? req.body.section_group : (req.body.group_name || '');
    const status = req.body.status || 'active';
    const internal_notes = req.body.internal_notes !== undefined ? req.body.internal_notes : (req.body.notes || '');

    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة مطلوب' });
    }

    const existing = await db.get('SELECT id FROM students WHERE LOWER(TRIM(name)) = LOWER(?)', [name]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة موجود بالفعل' });
    }

    const code = await generateStudentCode(db);
    const result = await db.run(
      `INSERT INTO students (name, student_code, section_group, group_name, status, internal_notes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, code, section_group, section_group, status, internal_notes, internal_notes]
    );

    const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    res.json({ success: true, student: newStudent, message: 'تمت إضافة الطالبة بنجاح ✅' });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ success: false, message: 'تعذر إضافة الطالبة', error: err.message || String(err) });
  }
});

APP.put('/api/admin/students/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const name = req.body.name ? req.body.name.trim() : '';
    const section_group = req.body.section_group !== undefined ? req.body.section_group : (req.body.group_name || '');
    const status = req.body.status || 'active';
    const internal_notes = req.body.internal_notes !== undefined ? req.body.internal_notes : (req.body.notes || '');

    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم الطالبة مطلوب' });
    }

    await db.run(
      `UPDATE students 
       SET name = ?, section_group = ?, group_name = ?, status = ?, internal_notes = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, section_group, section_group, status, internal_notes, internal_notes, studentId]
    );

    await db.run('UPDATE student_submissions SET student_name = ? WHERE student_id = ?', [name, studentId]);

    const updatedStudent = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
    res.json({ success: true, student: updatedStudent, message: 'تم تحديث بيانات الطالبة بنجاح ✅' });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ success: false, message: 'تعذر تحديث بيانات الطالبة', error: err.message || String(err) });
  }
});

APP.put('/api/admin/students/:id/regenerate-code', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ message: 'الطالبة غير موجودة' });

    const newCode = await generateStudentCode(db);
    await db.run('UPDATE students SET student_code = ? WHERE id = ?', [newCode, studentId]);

    res.json({ success: true, student_code: newCode, message: `تم إعادة توليد رمز الدخول بنجاح: ${newCode}` });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إعادة توليد الرمز' });
  }
});

APP.delete('/api/admin/students/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    await db.run('DELETE FROM student_submissions WHERE student_id = ?', [studentId]);
    await db.run('DELETE FROM student_progress WHERE student_id = ?', [studentId]);
    await db.run('DELETE FROM students WHERE id = ?', [studentId]);
    res.json({ success: true, message: 'تم حذف الطالبة وبياناتها نهائياً ✅' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر حذف الطالبة' });
  }
});

APP.get('/api/admin/students/:id/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ message: 'الطالبة غير موجودة' });

    const submissionsCount = await db.get('SELECT COUNT(*) as c FROM student_submissions WHERE student_id = ?', [studentId]);
    const reviewedCount = await db.get('SELECT COUNT(*) as c FROM student_submissions WHERE student_id = ? AND status = "reviewed"', [studentId]);
    const lastActivity = await db.get('SELECT MAX(created_at) as last_time FROM student_submissions WHERE student_id = ?', [studentId]);
    const submissions = await db.all('SELECT s.*, l.title as lesson_title FROM student_submissions s LEFT JOIN lessons l ON s.lesson_id = l.id WHERE s.student_id = ? ORDER BY s.created_at DESC', [studentId]);

    res.json({
      student,
      stats: {
        submissions_count: submissionsCount.c,
        reviewed_count: reviewedCount.c,
        unlocked_lessons: 12,
        progress_percent: submissionsCount.c > 0 ? Math.min(100, Math.round((submissionsCount.c / 20) * 100)) : 0,
        last_activity: lastActivity.last_time || student.last_activity_at || student.last_login_at || student.created_at
      },
      submissions
    });
  } catch (err) {
    res.status(500).json({ message: 'تعذر جلب ملف الطالبة' });
  }
});

APP.post('/api/admin/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة والتأكيد غير متطابقين' });
    }

    if (new_password.length < 4) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف أو أرقام على الأقل' });
    }

    const teacherId = req.user.id;
    const teacher = await db.get('SELECT * FROM teachers WHERE id = ?', [teacherId]);
    if (!teacher) {
      return res.status(404).json({ message: 'حساب المعلم غير موجود' });
    }

    const isMatch = await bcrypt.compare(current_password, teacher.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.run('UPDATE teachers SET password_hash = ? WHERE id = ?', [newHash, teacherId]);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح ✅' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'تعذر تغيير كلمة المرور' });
  }
});

APP.get('/api/admin/submissions', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, student_name, section_type, submission_type, status, search } = req.query;
    let query = `SELECT s.*, l.title as lesson_title 
                 FROM student_submissions s 
                 LEFT JOIN lessons l ON s.lesson_id = l.id 
                 WHERE 1=1`;
    const params = [];
    if (lesson_id && lesson_id !== 'all') {
      query += ` AND s.lesson_id = ?`;
      params.push(lesson_id);
    }
    if (student_name && student_name !== 'all') {
      query += ` AND s.student_name = ?`;
      params.push(student_name);
    }
    if (section_type && section_type !== 'all') {
      query += ` AND s.section_type = ?`;
      params.push(section_type);
    }
    if (submission_type && submission_type !== 'all') {
      query += ` AND s.submission_type = ?`;
      params.push(submission_type);
    }
    if (status && status !== 'all') {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    if (search && search.trim()) {
      query += ` AND s.student_name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }
    query += ` ORDER BY s.created_at DESC`;
    const submissions = await db.all(query, params);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'تعذر جلب تسليمات الطالبات' });
  }
});

APP.put('/api/admin/submissions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.run('UPDATE student_submissions SET status = ? WHERE id = ?', [status || 'viewed', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث الحالة' });
  }
});

// --- SITE SETTINGS APIS ---

APP.get('/api/settings/public', async (req, res) => {
  try {
    const rows = await db.all('SELECT key, value FROM settings');
    const settingsMap = {};
    for (const r of rows) {
      settingsMap[r.key] = r.value;
    }

    const main01Media = await db.get("SELECT url FROM media WHERE filename LIKE '%main01%' OR url LIKE '%main01%' LIMIT 1");
    const defaultWelcomeImage = main01Media ? main01Media.url : '/uploads/images/main01_1791184907790_p3b9e.png';

    const defaultSettings = {
      hero_welcome_image: defaultWelcomeImage,
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
    };

    res.json({ success: true, settings: { ...defaultSettings, ...settingsMap } });
  } catch (err) {
    console.error('Error fetching public settings:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب إعدادات الموقع' });
  }
});

APP.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const rows = await db.all('SELECT key, value FROM settings');
    const settingsMap = {};
    for (const r of rows) {
      settingsMap[r.key] = r.value;
    }

    const main01Media = await db.get("SELECT url FROM media WHERE filename LIKE '%main01%' OR url LIKE '%main01%' LIMIT 1");
    const defaultWelcomeImage = main01Media ? main01Media.url : '/uploads/images/main01_1791184907790_p3b9e.png';

    const defaultSettings = {
      hero_welcome_image: defaultWelcomeImage,
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
    };

    res.json({ success: true, settings: { ...defaultSettings, ...settingsMap } });
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب الإعدادات' });
  }
});

APP.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const settingsObj = req.body;
    if (!settingsObj || typeof settingsObj !== 'object') {
      return res.status(400).json({ success: false, message: 'بيانات الإعدادات غير صالحة' });
    }

    for (const [key, val] of Object.entries(settingsObj)) {
      const existing = await db.get('SELECT id FROM settings WHERE key = ?', [key]);
      if (existing) {
        await db.run('UPDATE settings SET value = ? WHERE key = ?', [String(val), key]);
      } else {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(val)]);
      }
    }

    const rows = await db.all('SELECT key, value FROM settings');
    const updatedSettings = {};
    for (const r of rows) {
      updatedSettings[r.key] = r.value;
    }

    res.json({ success: true, settings: updatedSettings, message: 'تم حفظ إعدادات هوية الموقع بنجاح ✅' });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, message: 'تعذر حفظ الإعدادات', error: err.message });
  }
});

APP.put('/api/admin/submissions/:id/note', authenticateToken, async (req, res) => {
  try {
    const { status, teacher_note } = req.body;
    await db.run(
      'UPDATE student_submissions SET status = ?, teacher_note = ? WHERE id = ?',
      [status || 'reviewed', teacher_note || '', req.params.id]
    );
    res.json({ success: true, message: 'تم حفظ الملاحظة وتحديث الحالة' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر حفظ الملاحظة' });
  }
});

// TEACHER AUTH & ADMIN ENDPOINTS
APP.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });

  try {
    const teacher = await db.get('SELECT * FROM teachers WHERE username = ?', [username]);
    if (!teacher) return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const isMatch = await bcrypt.compare(password, teacher.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: teacher.id, username: teacher.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: teacher.username });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

APP.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const lessons = await db.get('SELECT COUNT(*) as c FROM lessons');
    const activities = await db.get('SELECT COUNT(*) as c FROM activities');
    const questions = await db.get('SELECT COUNT(*) as c FROM questions');
    const media = await db.get('SELECT COUNT(*) as c FROM media');
    const vocab = await db.get('SELECT COUNT(*) as c FROM vocabulary');

    res.json({
      lessons: lessons.c,
      activities: activities.c,
      questions: questions.c,
      media: media.c,
      vocab: vocab.c
    });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الإحصائيات' });
  }
});

// Admin: Lessons
APP.get('/api/admin/lessons', authenticateToken, async (req, res) => {
  try {
    const lessons = await db.all('SELECT * FROM lessons ORDER BY sort_order ASC');
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الدروس' });
  }
});

APP.post('/api/admin/lessons', authenticateToken, async (req, res) => {
  const { title, description, image, sort_order, is_published } = req.body;
  if (!title) return res.status(400).json({ message: 'اسم الدرس مطلوب' });

  try {
    const result = await db.run(
      'INSERT INTO lessons (title, description, image, sort_order, is_published) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', image || '', sort_order || 1, is_published ?? 1]
    );

    const newLessonId = result.lastID;
    const defaultSections = [
      { type: 'listening', title: 'أستمع', order: 1 },
      { type: 'observe', title: 'ألاحظ وأتحدث', order: 2 },
      { type: 'reading', title: 'أقرأ وأتعلم', order: 3 },
      { type: 'vocabulary', title: 'كلماتي الجديدة', order: 4 },
      { type: 'comprehension', title: 'أفهم النص', order: 5 },
      { type: 'enrichment', title: 'إثراء', order: 6 },
      { type: 'review', title: 'أراجع', order: 7 },
      { type: 'activities', title: 'ألعب وأتعلم', order: 8 },
      { type: 'writing', title: 'أكتب', order: 9 },
      { type: 'dictation', title: 'إملاء', order: 10 },
      { type: 'chant', title: 'نغني', order: 11 },
      { type: 'quiz', title: 'اختبر نفسي', order: 12 }
    ];

    for (const sec of defaultSections) {
      await db.run(
        'INSERT INTO lesson_sections (lesson_id, section_type, title, sort_order) VALUES (?, ?, ?, ?)',
        [newLessonId, sec.type, sec.title, sec.order]
      );
    }

    res.json({ id: newLessonId, message: 'تم إضافة الدرس بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة الدرس' });
  }
});

APP.put('/api/admin/lessons/:id', authenticateToken, async (req, res) => {
  const { title, description, welcome_message, image, sort_order, status, is_published } = req.body;
  try {
    const lessonStatus = status || (is_published === 0 ? 'hidden' : 'published');
    const pubVal = lessonStatus === 'hidden' ? 0 : 1;
    await db.run(
      `UPDATE lessons SET 
         title = ?, 
         description = ?, 
         welcome_message = ?, 
         image = ?, 
         sort_order = ?, 
         status = ?, 
         is_published = ?, 
         updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        title,
        description || '',
        welcome_message || 'استعدي لرحلة ممتعة ومبدعة في هذا الدرس يا بطلة!',
        image || '',
        sort_order || 1,
        lessonStatus,
        pubVal,
        req.params.id
      ]
    );

    // If image is uploaded/set, ensure it's recorded in media library
    if (image && image.startsWith('/uploads/')) {
      const existingMedia = await db.get('SELECT * FROM media WHERE url = ?', [image]);
      if (!existingMedia) {
        const filename = image.split('/').pop();
        await db.run('INSERT INTO media (type, url, filename) VALUES (?, ?, ?)', ['image', image, filename]);
      }
    }

    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ message: 'تعذر تحديث الدرس' });
  }
});

APP.delete('/api/admin/lessons/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM lessons WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف الدرس بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر حذف الدرس' });
  }
});

// Admin: Lesson Sections GET & PUT
APP.get('/api/admin/sections', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const sections = await db.all('SELECT * FROM lesson_sections WHERE lesson_id = ? ORDER BY sort_order ASC', [lessonId]);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل أقسام الدرس' });
  }
});

APP.put('/api/admin/sections/:id', authenticateToken, async (req, res) => {
  const { title, content, audio, video, image, is_enabled } = req.body;
  try {
    await db.run(
      'UPDATE lesson_sections SET title = ?, content = ?, audio = ?, video = ?, image = ?, is_enabled = ? WHERE id = ?',
      [title, content, audio || '', video || '', image || '', is_enabled ?? 1, req.params.id]
    );
    res.json({ message: 'تم تحديث بيانات القسم بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث القسم' });
  }
});

// Admin: Writing Drills CRUD
APP.get('/api/admin/writing', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const list = await db.all('SELECT * FROM writing_drills WHERE lesson_id = ? ORDER BY sort_order ASC', [lessonId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل تمارين الكتابة' });
  }
});

APP.post('/api/admin/writing', authenticateToken, async (req, res) => {
  const { lesson_id, drill_type, title, prompt, target_answer, image, sort_order, is_enabled } = req.body;
  try {
    const resDb = await db.run(
      'INSERT INTO writing_drills (lesson_id, drill_type, title, prompt, target_answer, image, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [lesson_id || 1, drill_type || 'copy', title, prompt, target_answer || '', image || '', sort_order || 1, is_enabled ?? 1]
    );
    res.json({ id: resDb.lastID, message: 'تم الحفظ بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة تمرين الكتابة' });
  }
});

APP.put('/api/admin/writing/:id', authenticateToken, async (req, res) => {
  const { drill_type, title, prompt, target_answer, image, sort_order, is_enabled } = req.body;
  try {
    await db.run(
      'UPDATE writing_drills SET drill_type = ?, title = ?, prompt = ?, target_answer = ?, image = ?, sort_order = ?, is_enabled = ? WHERE id = ?',
      [drill_type, title, prompt, target_answer, image, sort_order, is_enabled, req.params.id]
    );
    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر التحديث' });
  }
});

APP.delete('/api/admin/writing/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM writing_drills WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر الحذف' });
  }
});

// Admin: Dictation GET & PUT
APP.get('/api/admin/dictation', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const dict = await db.get('SELECT * FROM dictations WHERE lesson_id = ? LIMIT 1', [lessonId]);
    res.json(dict || {});
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الإملاء' });
  }
});

APP.put('/api/admin/dictation', authenticateToken, async (req, res) => {
  const { lesson_id, title, target_text, audio, instructions, tolerance_level, is_enabled } = req.body;
  try {
    const existing = await db.get('SELECT id FROM dictations WHERE lesson_id = ?', [lesson_id || 1]);
    if (existing) {
      await db.run(
        'UPDATE dictations SET title = ?, target_text = ?, audio = ?, instructions = ?, tolerance_level = ?, is_enabled = ? WHERE id = ?',
        [title, target_text, audio || '', instructions || '', tolerance_level || 1, is_enabled ?? 1, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO dictations (lesson_id, title, target_text, audio, instructions, tolerance_level, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lesson_id || 1, title, target_text, audio || '', instructions || '', tolerance_level || 1, is_enabled ?? 1]
      );
    }
    res.json({ message: 'تم تحديث بيانات الإملاء بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر التحديث' });
  }
});

// Admin: Chant GET & PUT
APP.get('/api/admin/chant', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const chant = await db.get('SELECT * FROM chants WHERE lesson_id = ? LIMIT 1', [lessonId]);
    res.json(chant || {});
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل النشيد' });
  }
});

APP.put('/api/admin/chant', authenticateToken, async (req, res) => {
  const { lesson_id, title, author, content, image, audio, is_enabled } = req.body;
  try {
    const existing = await db.get('SELECT id FROM chants WHERE lesson_id = ?', [lesson_id || 1]);
    if (existing) {
      await db.run(
        'UPDATE chants SET title = ?, author = ?, content = ?, image = ?, audio = ?, is_enabled = ? WHERE id = ?',
        [title, author || '', content, image || '', audio || '', is_enabled ?? 1, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO chants (lesson_id, title, author, content, image, audio, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lesson_id || 1, title, author || '', content, image || '', audio || '', is_enabled ?? 1]
      );
    }
    res.json({ message: 'تم تحديث بيانات النشيد بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر التحديث' });
  }
});

// Vocabulary CRUD
APP.get('/api/admin/vocabulary', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const list = await db.all('SELECT * FROM vocabulary WHERE lesson_id = ? ORDER BY sort_order ASC', [lessonId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الكلمات' });
  }
});

APP.post('/api/admin/vocabulary', authenticateToken, async (req, res) => {
  const { lesson_id, word, meaning, image, audio, sort_order, is_enabled } = req.body;
  try {
    const resDb = await db.run(
      'INSERT INTO vocabulary (lesson_id, word, meaning, image, audio, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lesson_id || 1, word, meaning, image || '', audio || '', sort_order || 1, is_enabled ?? 1]
    );
    res.json({ id: resDb.lastID, message: 'تم الحفظ بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة الكلمة' });
  }
});

APP.put('/api/admin/vocabulary/:id', authenticateToken, async (req, res) => {
  const { word, meaning, image, audio, sort_order, is_enabled } = req.body;
  try {
    await db.run(
      'UPDATE vocabulary SET word = ?, meaning = ?, image = ?, audio = ?, sort_order = ?, is_enabled = ? WHERE id = ?',
      [word, meaning, image, audio, sort_order, is_enabled, req.params.id]
    );
    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث الكلمة' });
  }
});

APP.delete('/api/admin/vocabulary/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM vocabulary WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر الحذف' });
  }
});

// Questions CRUD
APP.get('/api/admin/questions', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const sectionType = req.query.section_type;
    let query = 'SELECT * FROM questions WHERE lesson_id = ?';
    let params = [lessonId];

    if (sectionType) {
      query += ' AND section_type = ?';
      params.push(sectionType);
    }
    query += ' ORDER BY sort_order ASC';

    const list = await db.all(query, params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الأسئلة' });
  }
});

APP.post('/api/admin/questions', authenticateToken, async (req, res) => {
  const { lesson_id, section_type, question_type, question_text, options, correct_answer, image, audio, explanation, sort_order, is_enabled } = req.body;
  try {
    const optionsJson = Array.isArray(options) ? JSON.stringify(options) : (options || '[]');
    const resDb = await db.run(
      `INSERT INTO questions 
       (lesson_id, section_type, question_type, question_text, options, correct_answer, image, audio, explanation, sort_order, is_enabled) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lesson_id || 1, section_type || 'comprehension', question_type || 'mcq', question_text, optionsJson, correct_answer, image || '', audio || '', explanation || '', sort_order || 1, is_enabled ?? 1]
    );
    res.json({ id: resDb.lastID, message: 'تم الحفظ بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة السؤال' });
  }
});

APP.put('/api/admin/questions/:id', authenticateToken, async (req, res) => {
  const { question_type, question_text, options, correct_answer, image, audio, explanation, sort_order, is_enabled } = req.body;
  try {
    const optionsJson = Array.isArray(options) ? JSON.stringify(options) : (options || '[]');
    await db.run(
      `UPDATE questions 
       SET question_type = ?, question_text = ?, options = ?, correct_answer = ?, image = ?, audio = ?, explanation = ?, sort_order = ?, is_enabled = ? 
       WHERE id = ?`,
      [question_type, question_text, optionsJson, correct_answer, image, audio, explanation, sort_order, is_enabled, req.params.id]
    );
    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث السؤال' });
  }
});

APP.delete('/api/admin/questions/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر الحذف' });
  }
});

// Activities CRUD
APP.get('/api/admin/activities', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const list = await db.all('SELECT * FROM activities WHERE lesson_id = ? ORDER BY sort_order ASC', [lessonId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الأنشطة' });
  }
});

APP.post('/api/admin/activities', authenticateToken, async (req, res) => {
  const { lesson_id, activity_type, title, instructions, activity_data, sort_order, is_enabled } = req.body;
  try {
    const dataJson = typeof activity_data === 'object' ? JSON.stringify(activity_data) : activity_data;
    const resDb = await db.run(
      `INSERT INTO activities (lesson_id, activity_type, title, instructions, activity_data, sort_order, is_enabled) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [lesson_id || 1, activity_type, title, instructions || '', dataJson, sort_order || 1, is_enabled ?? 1]
    );
    res.json({ id: resDb.lastID, message: 'تم الحفظ بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة النشاط' });
  }
});

APP.put('/api/admin/activities/:id', authenticateToken, async (req, res) => {
  const { activity_type, title, instructions, activity_data, sort_order, is_enabled } = req.body;
  try {
    const dataJson = typeof activity_data === 'object' ? JSON.stringify(activity_data) : activity_data;
    await db.run(
      `UPDATE activities 
       SET activity_type = ?, title = ?, instructions = ?, activity_data = ?, sort_order = ?, is_enabled = ? 
       WHERE id = ?`,
      [activity_type, title, instructions, dataJson, sort_order, is_enabled, req.params.id]
    );
    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث النشاط' });
  }
});

APP.put('/api/admin/activities/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const act = await db.get('SELECT * FROM activities WHERE id = ?', [req.params.id]);
    if (!act) return res.status(404).json({ message: 'النشاط غير موجود' });
    const newStatus = act.is_enabled === 1 ? 0 : 1;
    await db.run('UPDATE activities SET is_enabled = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, is_enabled: newStatus, message: newStatus === 1 ? 'تم إظهار اللعبة للطالبات 👁️' : 'تم إخفاء اللعبة عن الطالبات 🙈' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تغيير حالة اللعبة' });
  }
});

APP.delete('/api/admin/activities/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر الحذف' });
  }
});

// Enrichments CRUD
APP.get('/api/admin/enrichments', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    const list = await db.all('SELECT * FROM enrichments WHERE lesson_id = ? ORDER BY sort_order ASC', [lessonId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الإثراء' });
  }
});

APP.post('/api/admin/enrichments', authenticateToken, async (req, res) => {
  const { lesson_id, type, title, content, url, sort_order, is_enabled } = req.body;
  try {
    const resDb = await db.run(
      'INSERT INTO enrichments (lesson_id, type, title, content, url, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lesson_id || 1, type || 'text', title, content || '', url || '', sort_order || 1, is_enabled ?? 1]
    );
    res.json({ id: resDb.lastID, message: 'تم الحفظ بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر إضافة العنصر' });
  }
});

APP.put('/api/admin/enrichments/:id', authenticateToken, async (req, res) => {
  const { type, title, content, url, sort_order, is_enabled } = req.body;
  try {
    await db.run(
      'UPDATE enrichments SET type = ?, title = ?, content = ?, url = ?, sort_order = ?, is_enabled = ? WHERE id = ?',
      [type, title, content, url, sort_order, is_enabled, req.params.id]
    );
    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث العنصر' });
  }
});

APP.delete('/api/admin/enrichments/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM enrichments WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر الحذف' });
  }
});

// Thinking Keys Drills Endpoints
APP.get('/api/admin/thinking-keys-drills', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    let list = await db.all('SELECT * FROM thinking_keys_drills WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);

    if (!list || list.length === 0) {
      const defaultKeys = [
        { key_type: 'analyze', prompt_text: lessonId == 4 ? 'ما المشكلة التي واجهت الغراب؟ وكيف حلّها؟' : 'نحلل أحداث النص وفكرته الرئيسية.', sort_order: 1 },
        { key_type: 'discuss', prompt_text: lessonId == 4 ? 'هل كان تصرف الغراب ذكياً؟ ولماذا؟' : 'نناقش الأفكار والقيم المستفادة من الدرس.', sort_order: 2 },
        { key_type: 'innovate', prompt_text: lessonId == 4 ? 'فكري في طريقة أخرى تساعد الغراب على الوصول إلى الماء.' : 'نبتكر أفكاراً جديدة ومبدعة تتعلق بالدرس.', sort_order: 3 },
        { key_type: 'create', prompt_text: lessonId == 4 ? 'ارسمي مشهداً من قصة الغراب والجرة، أو صممي حلاً جديداً يساعد الغراب على الوصول إلى الماء.' : 'ارسمي أو ابتكري حلاً مبدعاً يعبر عن الدرس.', sort_order: 4 }
      ];

      for (const k of defaultKeys) {
        await db.run(
          `INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order)
           VALUES (?, ?, ?, 1, ?)`,
          [lessonId, k.key_type, k.prompt_text, k.sort_order]
        );
      }
      list = await db.all('SELECT * FROM thinking_keys_drills WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل مفاتيح التفكير' });
  }
});

APP.get('/api/thinking-keys-drills', async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 1;
    let list = await db.all('SELECT * FROM thinking_keys_drills WHERE lesson_id = ? AND is_visible = 1 ORDER BY sort_order ASC, id ASC', [lessonId]);

    if (!list || list.length === 0) {
      const allKeys = await db.all('SELECT * FROM thinking_keys_drills WHERE lesson_id = ? ORDER BY sort_order ASC, id ASC', [lessonId]);
      if (!allKeys || allKeys.length === 0) {
        const defaultKeys = [
          { key_type: 'analyze', prompt_text: lessonId == 4 ? 'ما المشكلة التي واجهت الغراب؟ وكيف حلّها؟' : 'نحلل أحداث النص وفكرته الرئيسية.', sort_order: 1 },
          { key_type: 'discuss', prompt_text: lessonId == 4 ? 'هل كان تصرف الغراب ذكياً؟ ولماذا؟' : 'نناقش الأفكار والقيم المستفادة من الدرس.', sort_order: 2 },
          { key_type: 'innovate', prompt_text: lessonId == 4 ? 'فكري في طريقة أخرى تساعد الغراب على الوصول إلى الماء.' : 'نبتكر أفكاراً جديدة ومبدعة تتعلق بالدرس.', sort_order: 3 },
          { key_type: 'create', prompt_text: lessonId == 4 ? 'ارسمي مشهداً من قصة الغراب والجرة، أو صممي حلاً جديداً يساعد الغراب على الوصول إلى الماء.' : 'ارسمي أو ابتكري حلاً مبدعاً يعبر عن الدرس.', sort_order: 4 }
        ];

        for (const k of defaultKeys) {
          await db.run(
            `INSERT INTO thinking_keys_drills (lesson_id, key_type, prompt_text, is_visible, sort_order)
             VALUES (?, ?, ?, 1, ?)`,
            [lessonId, k.key_type, k.prompt_text, k.sort_order]
          );
        }
      }
      list = await db.all('SELECT * FROM thinking_keys_drills WHERE lesson_id = ? AND is_visible = 1 ORDER BY sort_order ASC, id ASC', [lessonId]);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل مفاتيح التفكير' });
  }
});

APP.put('/api/admin/thinking-keys-drills/:id', authenticateToken, async (req, res) => {
  const { prompt_text, is_visible } = req.body;
  try {
    await db.run(
      'UPDATE thinking_keys_drills SET prompt_text = ?, is_visible = ? WHERE id = ?',
      [prompt_text, is_visible ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'تم تحديث مفتاح التفكير بنجاح ✅' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحديث مفتاح التفكير' });
  }
});

// Helper: Seed Lesson 4 Quiz
async function seedLesson4Quiz(dbInstance) {
  try {
    const check = await dbInstance.get("SELECT COUNT(*) as count FROM questions WHERE lesson_id = 4 AND section_type = 'quiz'");
    if (!check || check.count === 0) {
      const l4QuizQuestions = [
        {
          question_type: 'mcq',
          question_text: 'لماذا كان الغراب يبحث عن الماء؟',
          options: ['لأنه كان عطشاناً', 'لأنه كان جائعاً', 'لأنه أراد النوم'],
          correct_answer: 'لأنه كان عطشاناً',
          order: 1
        },
        {
          question_type: 'tf',
          question_text: 'ألقى الغراب الحجارة في الجرة فارتفع الماء.',
          options: ['صح', 'خطأ'],
          correct_answer: 'صح',
          order: 2
        },
        {
          question_type: 'mcq',
          question_text: 'ماذا وجد الغراب حول الجرة؟',
          options: ['حجارة صغيرة', 'ألعاباً', 'أوراقاً'],
          correct_answer: 'حجارة صغيرة',
          order: 3
        },
        {
          question_type: 'ordering',
          question_text: 'رتبي أحداث القصة بالترتيب الصحيح.',
          options: ['وجد الغراب الجرة.', 'لم يستطع الوصول إلى الماء.', 'ألقى الحجارة في الجرة.', 'ارتفع الماء.', 'شرب الغراب حتى ارتوى.'],
          correct_answer: JSON.stringify(['وجد الغراب الجرة.', 'لم يستطع الوصول إلى الماء.', 'ألقى الحجارة في الجرة.', 'ارتفع الماء.', 'شرب الغراب حتى ارتوى.']),
          order: 4
        },
        {
          question_type: 'fill',
          question_text: 'شرب الغراب حتى ________.',
          options: [],
          correct_answer: 'ارتوى',
          order: 5
        }
      ];

      for (const q of l4QuizQuestions) {
        await dbInstance.run(
          `INSERT INTO questions (lesson_id, section_type, question_type, question_text, options, correct_answer, sort_order, is_enabled)
           VALUES (4, 'quiz', ?, ?, ?, ?, ?, 1)`,
          [q.question_type, q.question_text, JSON.stringify(q.options), typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer), q.order]
        );
      }
    }
  } catch (e) {
    console.error('Error seeding Lesson 4 Quiz:', e);
  }
}

// FINAL QUIZ ("اختبر نفسي") ENDPOINTS

// 1. Student Get Quiz Questions
APP.get('/api/student/quiz', async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 4;
    let questions = await db.all(
      `SELECT * FROM questions WHERE lesson_id = ? AND section_type = 'quiz' AND is_enabled = 1 ORDER BY sort_order ASC, id ASC`,
      [lessonId]
    );

    if ((!questions || questions.length === 0) && (lessonId == 4 || Number(lessonId) === 4)) {
      await seedLesson4Quiz(db);
      questions = await db.all(
        `SELECT * FROM questions WHERE lesson_id = 4 AND section_type = 'quiz' AND is_enabled = 1 ORDER BY sort_order ASC, id ASC`
      );
    }

    res.json(questions || []);
  } catch (err) {
    console.error('Error fetching student quiz questions:', err);
    res.status(500).json({ message: 'تعذر تحميل أسئلة الاختبار' });
  }
});

// 2. Student Submit Quiz Result
APP.post('/api/student/quiz/submit', async (req, res) => {
  try {
    const { student_id, student_name, student_code, lesson_id, score, total_questions } = req.body;
    let student = null;

    if (student_id) {
      student = await db.get('SELECT * FROM students WHERE id = ?', [student_id]);
    } else if (student_code) {
      student = await db.get('SELECT * FROM students WHERE student_code = ?', [student_code]);
    } else if (student_name && student_name.trim()) {
      const cleanName = student_name.trim();
      student = await db.get('SELECT * FROM students WHERE name = ?', [cleanName]);
      if (!student) {
        const newCode = await generateStudentCode(db);
        const sRes = await db.run('INSERT INTO students (name, student_code, status) VALUES (?, ?, "active")', [cleanName, newCode]);
        student = { id: sRes.lastID, name: cleanName, student_code: newCode };
      }
    }

    const sId = student?.id || null;
    const sName = student?.name || student_name || 'طالبة زائرة';
    const lId = lesson_id || 4;
    const sc = Number(score) || 0;
    const tot = Number(total_questions) || 5;
    const percentage = tot > 0 ? Math.round((sc / tot) * 100) : 0;

    const attemptsCountRes = await db.get(
      'SELECT COUNT(*) as c FROM quiz_attempts WHERE (student_id = ? OR student_name = ?) AND lesson_id = ?',
      [sId, sName, lId]
    );
    const attemptNumber = (attemptsCountRes?.c || 0) + 1;

    const result = await db.run(
      `INSERT INTO quiz_attempts (student_id, student_name, lesson_id, score, total_questions, percentage, attempt_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sId, sName, lId, sc, tot, percentage, attemptNumber]
    );

    if (sId) {
      await db.run('UPDATE students SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?', [sId]);
    }

    res.json({
      success: true,
      id: result.lastID,
      score: sc,
      total_questions: tot,
      percentage,
      attempt_number: attemptNumber,
      message: 'تم تسجيل نتيجة الاختبار بنجاح 🌟'
    });
  } catch (err) {
    console.error('Error submitting quiz result:', err);
    res.status(500).json({ message: 'تعذر حفظ نتيجة الاختبار' });
  }
});

// 3. Admin Get Quiz Questions
APP.get('/api/admin/quiz-questions', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.query.lesson_id || 4;
    let questions = await db.all(
      `SELECT * FROM questions WHERE lesson_id = ? AND section_type = 'quiz' ORDER BY sort_order ASC, id ASC`,
      [lessonId]
    );

    if ((!questions || questions.length === 0) && (lessonId == 4 || Number(lessonId) === 4)) {
      await seedLesson4Quiz(db);
      questions = await db.all(
        `SELECT * FROM questions WHERE lesson_id = 4 AND section_type = 'quiz' ORDER BY sort_order ASC, id ASC`
      );
    }

    res.json(questions || []);
  } catch (err) {
    console.error('Error fetching admin quiz questions:', err);
    res.status(500).json({ message: 'تعذر تحميل أسئلة الاختبار' });
  }
});

// 4. Admin Post Quiz Question
APP.post('/api/admin/quiz-questions', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, question_type, question_text, options, correct_answer, sort_order, is_enabled } = req.body;
    const lId = lesson_id || 4;
    const qType = question_type || 'mcq';
    const qText = (question_text || '').trim();
    if (!qText) return res.status(400).json({ message: 'نص السؤال مطلوب' });

    const maxSort = await db.get('SELECT MAX(sort_order) as m FROM questions WHERE lesson_id = ? AND section_type = "quiz"', [lId]);
    const nextSort = sort_order || ((maxSort?.m || 0) + 1);
    const optionsStr = typeof options === 'object' ? JSON.stringify(options) : (options || '[]');
    const correctStr = typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : (correct_answer || '');

    const result = await db.run(
      `INSERT INTO questions (lesson_id, section_type, question_type, question_text, options, correct_answer, sort_order, is_enabled)
       VALUES (?, 'quiz', ?, ?, ?, ?, ?, ?)`,
      [lId, qType, qText, optionsStr, correctStr, nextSort, is_enabled ?? 1]
    );

    const created = await db.get('SELECT * FROM questions WHERE id = ?', [result.lastID]);
    res.json({ success: true, item: created, message: 'تم إضافة السؤال بنجاح ✅' });
  } catch (err) {
    console.error('Error creating quiz question:', err);
    res.status(500).json({ message: 'تعذر إضافة السؤال' });
  }
});

// 5. Admin Put Quiz Question
APP.put('/api/admin/quiz-questions/:id', authenticateToken, async (req, res) => {
  try {
    const { question_type, question_text, options, correct_answer, sort_order, is_enabled } = req.body;
    const qText = (question_text || '').trim();
    if (!qText) return res.status(400).json({ message: 'نص السؤال مطلوب' });

    const optionsStr = typeof options === 'object' ? JSON.stringify(options) : (options || '[]');
    const correctStr = typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : (correct_answer || '');

    await db.run(
      `UPDATE questions 
       SET question_type = ?, question_text = ?, options = ?, correct_answer = ?, sort_order = ?, is_enabled = ?
       WHERE id = ? AND section_type = 'quiz'`,
      [question_type, qText, optionsStr, correctStr, sort_order || 1, is_enabled ?? 1, req.params.id]
    );

    const updated = await db.get('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    res.json({ success: true, item: updated, message: 'تم تحديث السؤال بنجاح ✅' });
  } catch (err) {
    console.error('Error updating quiz question:', err);
    res.status(500).json({ message: 'تعذر تحديث السؤال' });
  }
});

// 6. Admin Delete Quiz Question
APP.delete('/api/admin/quiz-questions/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM questions WHERE id = ? AND section_type = "quiz"', [req.params.id]);
    res.json({ success: true, message: 'تم حذف السؤال بنجاح ✅' });
  } catch (err) {
    console.error('Error deleting quiz question:', err);
    res.status(500).json({ message: 'تعذر حذف السؤال' });
  }
});

// 7. Admin Toggle Quiz Question Visibility
APP.put('/api/admin/quiz-questions/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const q = await db.get('SELECT * FROM questions WHERE id = ? AND section_type = "quiz"', [req.params.id]);
    if (!q) return res.status(404).json({ message: 'السؤال غير موجود' });
    const newStatus = q.is_enabled === 1 ? 0 : 1;
    await db.run('UPDATE questions SET is_enabled = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, is_enabled: newStatus, message: newStatus === 1 ? 'تم تفعيل السؤال للطالبات 👁️' : 'تم إخفاء السؤال عن الطالبات 🙈' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر تغيير حالة السؤال' });
  }
});

// 8. Admin Get Quiz Results
APP.get('/api/admin/quiz-results', authenticateToken, async (req, res) => {
  try {
    const { lesson_id } = req.query;
    let query = `SELECT q.*, l.title as lesson_title 
                 FROM quiz_attempts q 
                 LEFT JOIN lessons l ON q.lesson_id = l.id 
                 WHERE 1=1`;
    const params = [];

    if (lesson_id && lesson_id !== 'all') {
      query += ` AND q.lesson_id = ?`;
      params.push(lesson_id);
    }
    query += ` ORDER BY q.completed_at DESC`;

    const results = await db.all(query, params);
    res.json(results || []);
  } catch (err) {
    console.error('Error fetching quiz results:', err);
    res.status(500).json({ message: 'تعذر جلب نتائج الاختبارات' });
  }
});

// Media Library
APP.get('/api/admin/media', authenticateToken, async (req, res) => {
  try {
    const mediaList = await db.all('SELECT * FROM media ORDER BY created_at DESC');
    res.json(mediaList);
  } catch (err) {
    res.status(500).json({ message: 'تعذر تحميل الوسائط' });
  }
});

const handleMediaUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'لم يتم اختيار ملف للرفع' });

  try {
    const fileUrl = getRelativeUrl(req.file);
    let fileType = 'image';
    if (req.file.mimetype.startsWith('audio/')) fileType = 'audio';
    else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
    else if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) fileType = 'document';

    const fileSize = req.file.size || 0;
    let resDb;
    try {
      resDb = await db.run(
        'INSERT INTO media (type, url, filename, size, mime_type) VALUES (?, ?, ?, ?, ?)',
        [fileType, fileUrl, req.file.originalname, fileSize, req.file.mimetype]
      );
    } catch (dbErr) {
      resDb = await db.run(
        'INSERT INTO media (type, url, filename) VALUES (?, ?, ?)',
        [fileType, fileUrl, req.file.originalname]
      );
    }

    res.json({
      success: true,
      id: resDb.lastID,
      url: fileUrl,
      fileUrl: fileUrl,
      type: fileType,
      filename: req.file.originalname,
      size: fileSize,
      message: 'تم رفع الملف بنجاح ✅'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'تعذر رفع الملف' });
  }
};

APP.post('/api/admin/media/upload', authenticateToken, upload.single('file'), handleMediaUpload);
APP.post('/api/admin/upload', authenticateToken, upload.single('file'), handleMediaUpload);

APP.delete('/api/admin/media/:id', authenticateToken, async (req, res) => {
  try {
    const mediaItem = await db.get('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (mediaItem) {
      const filePath = path.join(__dirname, 'public', mediaItem.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.run('DELETE FROM media WHERE id = ?', [req.params.id]);
    }
    res.json({ message: 'تم حذف الملف بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'تعذر حذف الملف' });
  }
});

async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    APP.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    APP.use(express.static(distPath));
    APP.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  APP.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
