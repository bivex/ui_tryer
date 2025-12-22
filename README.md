# Pixel Police - Design Perfection Enforcer 🚔

**The pixel-perfect police force that catches UI crimes!** 👮‍♂️

Chrome extension for automatic validation of web interfaces against design systems. Catches spacing violations, sizing crimes, color offenses, and responsive design infractions.

## 🎯 Цель

Расширение решает ключевые боли UI/UX разработчиков и QA-инженеров при проверке интерфейсов:

- **Время на ручную инспекцию**: автоматическое выявление несоответствий отступам, размерам, цветам
- **Сложность выявления несоответствий**: встроенные правила дизайн-системы
- **Отсутствие стандартизации**: системный подход к проверке UI

## 🏗 Архитектура

Проект построен по принципу **чистой архитектуры** с разделением на слои:

### Domain (Домен)
Чистая бизнес-логика, независимая от Chrome API:
- `ElementInspector` - анализ отдельных элементов
- `ResponsiveChecker` - проверка адаптивности
- `ElementComparator` - сравнение элементов
- `DesignRules` - правила дизайн-системы

### Application (Приложение)
Use cases - оркестрация домена и инфраструктуры:
- `InspectElementUseCase` - инспекция элемента
- `CheckResponsiveUseCase` - проверка responsive
- `CompareElementsUseCase` - сравнение элементов
- `GenerateReportUseCase` - генерация отчетов

### Infrastructure (Инфраструктура)
Адаптеры для внешних зависимостей:
- `TabAdapter` - работа с вкладками Chrome
- `StorageAdapter` - хранение настроек
- `ScriptingAdapter` - выполнение скриптов
- `ElementInspector` - DOM манипуляции

### Presentation (Презентация)
UI компоненты:
- `Popup` - главное окно расширения
- `Overlay` - визуальные накладки на элементы
- `Options` - страница настроек

## 🔒 Безопасность и Permissions

### Минимальный набор разрешений:
```json
{
  "permissions": [
    "activeTab",     // Доступ к текущей вкладке
    "storage",       // Сохранение настроек
    "scripting"      // Выполнение скриптов (Manifest V3)
  ],
  "host_permissions": [
    "<all_urls>"     // Чтение DOM (минимально необходимо)
  ]
}
```

### Принципы безопасности:
- ✅ **Наименьшие привилегии**: только необходимые permissions
- ✅ **Read-only режим**: расширение не изменяет контент страниц
- ✅ **Изоляция**: content scripts работают в изолированном мире
- ✅ **Валидация данных**: все входные данные проверяются
- ✅ **CSP compliance**: код соответствует Content Security Policy

## 📋 Функциональные требования

### 1. Инспекция элементов
- Наведение курсора на элемент → показ overlay с box-model
- Отображение числовых значений margin/padding/size
- Предупреждения о несоответствиях дизайн-системе

### 2. Правила дизайн-системы
- Настраиваемая сетка отступов (4px/8px/16px...)
- Минимальные размеры кликабельных элементов (44px)
- Палитра цветов
- Брейкпоинты responsive

### 3. Responsive проверки
- Симуляция разных размеров экрана
- Автоматическое выявление проблем overflow
- Проверка доступности на мобильных

### 4. Сравнение элементов
- Консистентность отступов между кнопками
- Одинаковые размеры однотипных компонентов
- Групповой анализ

### 5. Отчеты
- JSON/HTML/Markdown экспорт
- Скриншоты проблемных зон
- Интеграция с Jira/Linear

## 🚀 Установка и разработка

```bash
# Клонирование
git clone <repository>
cd ui-inspector

# Установка зависимостей
npm install

# Сборка
npm run build

# Загрузка в Chrome
# 1. Открыть chrome://extensions/
# 2. Включить "Developer mode"
# 3. "Load unpacked" → выбрать dist/
```

## 📊 Пользовательские сценарии

### Сценарий 1: Быстрая инспекция
1. Пользователь открывает страницу
2. Кликает иконку расширения
3. Включает "Inspect mode"
4. Наводит курсор на элемент
5. Видит overlay + предупреждения

### Сценарий 2: Responsive проверка
1. Выбор breakpoint "Mobile 375px"
2. Расширение симулирует размер
3. Подсвечивает проблемы
4. Генерирует отчет

### Сценарий 3: Командная работа
1. QA находит проблемы
2. Генерирует отчет с багом
3. Копирует описание для Jira
4. Дизайнер/разработчик получает четкое ТЗ

## 🛠 Технические решения

### Message Passing
```typescript
// Явные контракты сообщений
interface Message<T> {
  type: MessageType;
  payload: T;
  source: 'popup' | 'content' | 'background';
  target: 'popup' | 'content' | 'background';
}
```

### Service Worker (Manifest V3)
- Background скрипт как service worker
- Обработка пробуждения/засыпания
- State хранится в chrome.storage

### Content Scripts
- Минимальный размер (только DOM операции)
- Бизнес-логика в отдельных слоях
- Read-only доступ к странице

## 🎨 UI/UX принципы

- **Минималистичный интерфейс**: toggle on/off, режимы, горячие клавиши
- **Производительность**: не замедляет страницу
- **Доступность**: работает на всех сайтах
- **Локализация**: поддержка i18n

## 🔄 Развитие

### Roadmap
- [ ] Интеграция с Figma
- [ ] Кастомные правила дизайн-систем
- [ ] Автоматизированное тестирование
- [ ] CI/CD pipeline
- [ ] Performance monitoring

### Технический долг
- [ ] Полная типизация
- [ ] Unit/integration тесты
- [ ] E2E тесты
- [ ] Documentation
- [ ] Performance optimization

## 📄 Лицензия

MIT License - см. LICENSE файл.

## 🤝 Контрибьютинг

1. Fork проект
2. Создать feature branch
3. Commit изменения
4. Push и создать PR
5. Code review и merge

Подробные инструкции в CONTRIBUTING.md
