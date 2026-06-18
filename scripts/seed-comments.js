import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import dotenv from 'dotenv';
import { atomicWriteFile } from './lib/retry.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storiesDir = path.join(__dirname, '..', 'src', 'content', 'stories');

const COMMENT_NAMES = [
  'Александр К.', 'Ольга М.', 'Виктор С.', 'Татьяна Л.', 'Сергей Д.',
  'Ирина П.', 'Максим В.', 'Юлия Н.', 'Андрей Ф.', 'Екатерина Р.',
  'Николай Б.', 'Людмила Г.', 'Роман Ж.', 'Алина К.', 'Денис Ш.',
];

const COMMENT_TEMPLATES = [
  'Спасибо за рецепт — обязательно попробую на выходных!',
  'Отличный пошаговый разбор, всё понятно даже новичку.',
  'Сохранила в закладки, как раз искала что-то подобное.',
  'Получилось с первого раза, семья в восторге!',
  'Хороший совет по продуктам — пригодится в магазине.',
  'Красиво расписано, читается легко.',
  'Попробовала в аэрогриле — вышло даже лучше, чем ожидала.',
  'Интересная идея, раньше так не готовила.',
  'Спасибо авторам за подборку полезных кулинарных материалов.',
  'Пойду читать оригинал на источнике — хочу сравнить детали.',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateComments(count) {
  const usedNames = new Set();
  const comments = [];

  for (let i = 0; i < count; i++) {
    let name;
    do {
      name = randomItem(COMMENT_NAMES);
    } while (usedNames.has(name) && usedNames.size < COMMENT_NAMES.length);
    usedNames.add(name);

    const daysAgo = randomInt(1, 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    comments.push({
      name,
      text: randomItem(COMMENT_TEMPLATES),
      date: date.toISOString().split('T')[0],
    });
  }

  return comments;
}

function main() {
  const force = process.argv.includes('--force');

  if (!fs.existsSync(storiesDir)) {
    console.log('Папка stories не найдена. Сначала запустите fetch-articles.js');
    return;
  }

  const files = fs.readdirSync(storiesDir).filter((f) => f.endsWith('.md'));
  let updated = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const filePath = path.join(storiesDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      if (!force && data.comments && data.comments.length >= 3) continue;

      data.comments = generateComments(randomInt(3, 5));
      const output = matter.stringify(content, data);
      atomicWriteFile(filePath, output);
      updated++;
    } catch (err) {
      errors++;
      console.warn(`✗ ${file}: ${err.message}`);
    }
  }

  console.log(`✓ Комментарии добавлены к ${updated} статьям (${files.length} всего)`);
  if (errors > 0) {
    console.warn(`⚠  Ошибок: ${errors}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
