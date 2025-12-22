/**
 * Анализ потенциальных false positives в расширенной тестовой странице
 */

console.log('🔍 АНАЛИЗ FALSE POSITIVES ДЛЯ UI INSPECTOR\n');

// Категории false positives с анализом того, как наш алгоритм может их обработать
const falsePositiveCategories = [
  {
    category: 'Декоративные элементы',
    elements: ['decorative-icon (16x16)', 'bullet-point (6x6)'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Маленькие элементы без явных интерактивных признаков могут быть пропущены',
    improvement: 'Добавить проверку на минимальный размер для декоративных элементов'
  },
  {
    category: 'Кастомные курсоры',
    elements: ['crosshair', 'zoom-in', 'help', 'wait'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Курсоры как crosshair, zoom-in, help не означают кликабельность',
    improvement: 'Расширить список не-кликабельных курсоров'
  },
  {
    category: 'Отключенные элементы форм',
    elements: ['disabled inputs', 'readonly inputs'],
    currentAlgorithm: '✅ ДОЛЖЕН ОБРАБАТЫВАТЬ',
    issue: 'pointer-events: none и disabled атрибуты должны исключать из анализа',
    improvement: 'Улучшить проверку disabled/readonly состояний'
  },
  {
    category: 'Скрытые элементы',
    elements: ['aria-hidden', 'visually-hidden', 'clipped'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'ARIA-hidden элементы всё равно видны и могут быть flagged',
    improvement: 'Добавить проверку aria-hidden и визуальной скрытности'
  },
  {
    category: 'Tabindex элементы',
    elements: ['tabindex="0"', 'tabindex="-1"'],
    currentAlgorithm: '✅ ДОЛЖЕН ОБРАБАТЫВАТЬ',
    issue: 'Элементы с tabindex должны считаться фокусируемыми',
    improvement: 'Улучшить логику определения фокусируемых элементов'
  },
  {
    category: 'Маленький текст',
    elements: ['11px labels', '9px micro-text'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Некоторые маленькие тексты приемлемы (labels, captions)',
    improvement: 'Добавить контекстный анализ размера текста'
  },
  {
    category: 'Overflow элементы',
    elements: ['scrollable containers', 'text-overflow: ellipsis'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Scrollable области могут показаться слишком маленькими',
    improvement: 'Исключать элементы с overflow: auto/scroll'
  },
  {
    category: 'Позиционированные элементы',
    elements: ['fixed', 'absolute', 'sticky'],
    currentAlgorithm: '✅ ДОЛЖЕН ОБРАБАТЫВАТЬ',
    issue: 'Позиционированные элементы могут быть функциональными',
    improvement: 'Учитывать контекст позиционирования'
  },
  {
    category: 'Transform элементы',
    elements: ['rotated', 'scaled elements'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Transform может сделать элемент visually confusing',
    improvement: 'Анализировать transform свойства'
  },
  {
    category: 'Pointer events',
    elements: ['pointer-events: none'],
    currentAlgorithm: '✅ ДОЛЖЕН ОБРАБАТЫВАТЬ',
    issue: 'pointer-events: none делает элемент неинтерактивным',
    improvement: 'Улучшить проверку pointer-events'
  },
  {
    category: 'Очень маленькие интерактивные',
    elements: ['20x20 buttons', '16x16 icons'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Очень маленькие интерактивные элементы могут быть функциональными',
    improvement: 'Добавить минимальный размер с учётом контекста'
  },
  {
    category: 'ARIA без cursor:pointer',
    elements: ['role="button"', 'role="link"'],
    currentAlgorithm: '❌ МОЖЕТ ПРОПУСТИТЬ',
    issue: 'ARIA roles могут указывать на интерактивность без cursor:pointer',
    improvement: 'Улучшить анализ ARIA ролей'
  },
  {
    category: 'Низкая opacity',
    elements: ['opacity: 0.3'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Полупрозрачные элементы могут показаться неинтерактивными',
    improvement: 'Учитывать opacity в визуальном анализе'
  },
  {
    category: 'Без визуального оформления',
    elements: ['text-only links'],
    currentAlgorithm: '❌ МОЖЕТ ПРОПУСТИТЬ',
    issue: 'Текстовые элементы без фона/границ могут быть пропущены',
    improvement: 'Улучшить анализ текстовых интерактивных элементов'
  },
  {
    category: 'Нестандартные курсоры',
    elements: ['cursor: help', 'cursor: wait'],
    currentAlgorithm: '❌ МОЖЕТ ОШИБИТЬСЯ',
    issue: 'Help/wait курсоры не всегда означают кликабельность',
    improvement: 'Контекстный анализ курсоров'
  }
];

console.log('📊 СТАТИСТИКА ПО КАТЕГОРИЯМ:\n');

let totalElements = 0;
let highRiskCategories = 0;
let mediumRiskCategories = 0;

falsePositiveCategories.forEach((cat, index) => {
  const risk = cat.currentAlgorithm.includes('❌') ? 'ВЫСОКИЙ' : 'НИЗКИЙ';
  if (risk === 'ВЫСОКИЙ') highRiskCategories++;
  else mediumRiskCategories++;

  totalElements += cat.elements.length;

  console.log(`${index + 1}. ${cat.category}`);
  console.log(`   📏 Элементы: ${cat.elements.join(', ')}`);
  console.log(`   🎯 Статус: ${cat.currentAlgorithm}`);
  console.log(`   ⚠️  Проблема: ${cat.issue}`);
  console.log(`   💡 Улучшение: ${cat.improvement}`);
  console.log('');
});

console.log('📈 ИТОГИ АНАЛИЗА:');
console.log(`   • Всего категорий false positives: ${falsePositiveCategories.length}`);
console.log(`   • Всего тестовых элементов: ${totalElements}`);
console.log(`   • Высокий риск false positives: ${highRiskCategories} категорий`);
console.log(`   • Низкий риск: ${mediumRiskCategories} категорий`);
console.log('');

console.log('🎯 ПРИОРИТЕТНЫЕ УЛУЧШЕНИЯ:');
console.log('1. 🏆 Расширить анализ курсоров (crosshair, zoom, help, wait)');
console.log('2. 🥈 Улучшить обработку ARIA атрибутов (hidden, roles)');
console.log('3. 🥉 Добавить анализ opacity и transform');
console.log('4. ➕ Улучшить определение декоративных элементов');
console.log('5. ➕ Контекстный анализ маленьких элементов');

console.log('\n🧪 РЕКОМЕНДАЦИИ ДЛЯ ТЕСТИРОВАНИЯ:');
console.log('• Запустить инспекцию на расширенной тестовой странице');
console.log('• Проверить каждый false positive элемент');
console.log('• Измерить точность обнаружения (precision/recall)');
console.log('• Добавить unit тесты для каждого типа false positive');