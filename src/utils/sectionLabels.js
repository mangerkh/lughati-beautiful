export const SECTION_LABELS = {
  listening: 'أستمع 🎧',
  observe: 'أتحدث 🗣️',
  reading: 'أقرأ 📖',
  vocabulary: 'المفردات 📖',
  comprehension: 'أفكر بذكاء 🧠',
  activities: 'أتدرب 🎯',
  writing: 'أكتب بخط جميل ✏️',
  dictation: 'أستمع وأكتب 🔊',
  expression: 'أعبر 🗣️',
  chant: 'نغني 🎵',
  enrichment: 'إثراء ⭐',
  thinking_keys: 'مفاتيح التفكير 🔑',
  review: 'أراجع 🔄',
  quiz: 'اختبر نفسي 📝',
  general: 'عام 📌'
};

export function getSectionLabel(sectionType) {
  if (!sectionType) return 'عام 📌';
  return SECTION_LABELS[sectionType] || sectionType;
}
