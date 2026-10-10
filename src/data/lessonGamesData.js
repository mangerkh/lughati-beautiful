export const PREBUILT_LESSON_GAMES = {
  // Lesson 4: الغراب والجرة (10 ألعاب تفاعلية)
  4: [
    {
      id: 401,
      lesson_id: 4,
      activity_type: 'classification',
      title: 'ميزي حرفي ط / ظ',
      instructions: 'اقرئي الكلمات جيداً، ثم صنفي كل كلمة حسب الحرف الموجود فيها.',
      activity_data: {
        categories: ['حرف ط', 'حرف ظ'],
        items: [
          { text: 'الطَّويل', category: 'حرف ط' },
          { text: 'نَظَرَ', category: 'حرف ظ' },
          { text: 'نَظيف', category: 'حرف ظ' },
          { text: 'عَظيم', category: 'حرف ظ' },
          { text: 'ظَرْف', category: 'حرف ظ' }
        ]
      },
      sort_order: 1,
      is_enabled: 1
    },
    {
      id: 402,
      lesson_id: 4,
      activity_type: 'classification',
      title: 'صنفي الكلمات حسب ع / غ',
      instructions: 'اقرئي الكلمات، ثم اسحبي كل كلمة إلى العمود المناسب.',
      activity_data: {
        categories: ['حرف ع', 'حرف غ'],
        items: [
          { text: 'غراب', category: 'حرف غ' },
          { text: 'أعلى', category: 'حرف ع' },
          { text: 'صغيرة', category: 'حرف ع' },
          { text: 'ارتفع', category: 'حرف ع' },
          { text: 'صنع', category: 'حرف ع' },
          { text: 'زرع', category: 'حرف ع' },
          { text: 'سعيد', category: 'حرف ع' },
          { text: 'فارغ', category: 'حرف غ' }
        ]
      },
      sort_order: 2,
      is_enabled: 1
    },
    {
      id: 403,
      lesson_id: 4,
      activity_type: 'syllables_combine',
      title: 'ركبي المقاطع',
      instructions: 'ركبي المقاطع لتكوّني كلمة صحيحة.',
      activity_data: {
        groups: [
          {
            prefix: 'عا',
            suffixes: [
              { text: 'دل', result: 'عادل' },
              { text: 'صم', result: 'عاصم' },
              { text: 'مل', result: 'عامل' }
            ]
          },
          {
            prefix: 'غا',
            suffixes: [
              { text: 'ئم', result: 'غائم' },
              { text: 'ئب', result: 'غائب' },
              { text: 'لب', result: 'غالب' }
            ]
          }
        ]
      },
      sort_order: 3,
      is_enabled: 1
    },
    {
      id: 404,
      lesson_id: 4,
      activity_type: 'ordering',
      title: 'رتبي أحداث قصة الغراب والجرة',
      instructions: 'اسحبي الأحداث وضعيها بالترتيب الصحيح.',
      activity_data: {
        items: [
          'عطش الغراب وأخذ يبحث عن الماء.',
          'وجد الغراب جرة فيها ماء.',
          'لم يستطع الوصول إلى الماء بمنقاره.',
          'وجد حجارة صغيرة حوله.',
          'ألقى الحجارة في الجرة.',
          'ارتفع الماء إلى أعلى.',
          'شرب الغراب حتى ارتوى.'
        ]
      },
      sort_order: 4,
      is_enabled: 1
    },
    {
      id: 405,
      lesson_id: 4,
      activity_type: 'true_false',
      title: 'صح أم خطأ؟',
      instructions: 'اقرئي العبارة ثم حددي إن كانت صحيحة أم خاطئة:',
      activity_data: {
        items: [
          { statement: 'وجد الغراب جرةً فيها ماء.', answer: true },
          { statement: 'استطاع الغراب الوصول إلى الماء مباشرة بمنقاره.', answer: false },
          { statement: 'وجد الغراب حجارة صغيرة.', answer: true },
          { statement: 'ألقى الغراب الحجارة خارج الجرة.', answer: false },
          { statement: 'ارتفع الماء بعد أن ألقى الغراب الحجارة في الجرة.', answer: true },
          { statement: 'شرب الغراب حتى ارتوى.', answer: true }
        ]
      },
      sort_order: 5,
      is_enabled: 1
    },
    {
      id: 406,
      lesson_id: 4,
      activity_type: 'multiple_choice',
      title: 'اختاري الإجابة الصحيحة',
      instructions: 'اختاري الإجابة المناسبة لكل سؤال:',
      activity_data: {
        questions: [
          {
            question: 'لماذا كان الغراب يبحث عن الماء؟',
            options: ['لأنه كان عطشاناً', 'لأنه كان جائعاً', 'لأنه أراد النوم'],
            correct: 'لأنه كان عطشاناً'
          },
          {
            question: 'ماذا وجد الغراب بعد البحث؟',
            options: ['شجرة', 'جرة فيها ماء', 'بيتاً'],
            correct: 'جرة فيها ماء'
          },
          {
            question: 'ماذا وجد الغراب حول الجرة؟',
            options: ['حجارة صغيرة', 'أقلاماً', 'ألعاباً'],
            correct: 'حجارة صغيرة'
          },
          {
            question: 'ماذا حدث للماء بعد إلقاء الحجارة؟',
            options: ['اختفى', 'ارتفع إلى أعلى', 'تغير لونه'],
            correct: 'ارتفع إلى أعلى'
          },
          {
            question: 'ماذا فعل الغراب في النهاية؟',
            options: ['نام', 'طار بعيداً', 'شرب حتى ارتوى'],
            correct: 'شرب حتى ارتوى'
          }
        ]
      },
      sort_order: 6,
      is_enabled: 1
    },
    {
      id: 407,
      lesson_id: 4,
      activity_type: 'matching',
      title: 'صلي الكلمة بمعناها',
      instructions: 'طابقي كل كلمة بمعناها المناسب:',
      activity_data: {
        pairs: [
          { left: 'عَطِشَ', right: 'احتاج إلى الماء.' },
          { left: 'مِنْقَارِهِ', right: 'فم الطائر الصلب.' },
          { left: 'حِجَارَة', right: 'قطع صغيرة من الصخر.' },
          { left: 'اِرْتَفَعَ', right: 'صار أعلى.' },
          { left: 'اِرْتَوَى', right: 'شرب حتى زال عطشه.' }
        ]
      },
      sort_order: 7,
      is_enabled: 1
    },
    {
      id: 408,
      lesson_id: 4,
      activity_type: 'missing_letter',
      title: 'أكملي الكلمة',
      instructions: 'اختاري الحرف الناقص لإكمال الكلمة الصحيحة:',
      activity_data: {
        items: [
          { word: 'غُرَا_', correct: 'ب', options: ['ب', 'ت', 'ث'] },
          { word: 'جَرَّ_', correct: 'ة', options: ['ة', 'ه', 'ت'] },
          { word: 'مَـا_', correct: 'ء', options: ['ء', 'ا', 'ى'] },
          { word: 'حِجَارَ_', correct: 'ة', options: ['ة', 'ت', 'ه'] },
          { word: 'مِنْقَا_', correct: 'ر', options: ['ر', 'ز', 'د'] }
        ]
      },
      sort_order: 8,
      is_enabled: 1
    },
    {
      id: 409,
      lesson_id: 4,
      activity_type: 'sentence_order',
      title: 'رتبي الكلمات لتكوين جملة',
      instructions: 'رتب الكلمات التالية لتكوين جملة صحيحة:',
      activity_data: {
        sentences: [
          {
            words: ['الغراب', 'عن', 'الماء', 'بحث'],
            correct: ['بحث', 'الغراب', 'عن', 'الماء']
          },
          {
            words: ['وجد', 'جرة', 'الغراب', 'فيها', 'ماء'],
            correct: ['وجد', 'الغراب', 'جرة', 'فيها', 'ماء']
          },
          {
            words: ['الحجارة', 'الجرة', 'في', 'ألقى', 'الغراب'],
            correct: ['ألقى', 'الغراب', 'الحجارة', 'في', 'الجرة']
          },
          {
            words: ['الماء', 'ارتفع', 'أعلى', 'إلى'],
            correct: ['ارتفع', 'الماء', 'إلى', 'أعلى']
          }
        ]
      },
      sort_order: 9,
      is_enabled: 1
    },
    {
      id: 410,
      lesson_id: 4,
      activity_type: 'memory',
      title: 'لعبة ذاكرة الكلمات',
      instructions: 'افتحي البطاقات المتقابلة المتشابهة لتطابق الكلمات بمعانيها:',
      activity_data: {
        pairs: [
          { left: 'عطش', right: 'احتاج إلى الماء' },
          { left: 'منقار', right: 'فم الطائر' },
          { left: 'حجارة', right: 'قطع من الصخر' },
          { left: 'ارتفع', right: 'صار أعلى' },
          { left: 'ارتوى', right: 'شرب حتى زال عطشه' }
        ]
      },
      sort_order: 10,
      is_enabled: 1
    }
  ]
};

export function getPrebuiltGamesForLesson(lessonId) {
  return PREBUILT_LESSON_GAMES[lessonId] || [];
}
