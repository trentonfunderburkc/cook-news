import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const authorsPath = path.join(root, 'src', 'data', 'authors.json');
const avatarsDir = path.join(root, 'public', 'avatars');

const AUTHORS = [
  { id: 1, name: 'Анна Тихонова', role: 'Кулинарный редактор', slug: 'anna', bio: 'Проверяет рецепты на кухне редакции с 2019 года.' },
  { id: 2, name: 'Дмитрий Воронов', role: 'Шеф-консультант', slug: 'dima', bio: 'Специализируется на домашней кухне и выпечке.' },
  { id: 3, name: 'Елена Соколова', role: 'Автор рецептов', slug: 'elena', bio: 'Пишет пошаговые рецепты для начинающих поваров.' },
  { id: 4, name: 'Игорь Мельников', role: 'Обозреватель продуктов', slug: 'igor', bio: 'Рассказывает о сезонных продуктах и заготовках.' },
  { id: 5, name: 'Мария Кузнецова', role: 'Кондитер', slug: 'maria', bio: 'Делится рецептами десертов и выпечки.' },
  { id: 6, name: 'Олег Петров', role: 'Корреспондент', slug: 'oleg', bio: 'Собирает народные рецепты из разных регионов России.' },
  { id: 7, name: 'Светлана Орлова', role: 'Редактор ленты', slug: 'svetlana', bio: 'Отбирает лучшие рецепты и кулинарные советы.' },
  { id: 8, name: 'Алексей Новиков', role: 'Автор', slug: 'alexey', bio: 'Пишет о простых ужинах за 30 минут.' },
  { id: 9, name: 'Наталья Белова', role: 'Редактор', slug: 'natalya', bio: 'Курирует разделы супов, салатов и ПП-рецептов.' },
  { id: 10, name: 'Павел Громов', role: 'Фуд-фотограф', slug: 'pavel', bio: 'Снимает блюда для статей и тестирует рецепты.' },
];

const UNSPLASH_PORTRAITS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519345182560-3f7737a5b5a0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
];

async function downloadAvatar(url, dest) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    fs.writeFileSync(dest, response.data);
    return true;
  } catch {
    return false;
  }
}

function createPlaceholderAvatar(dest, name) {
  const initial = name.charAt(0);
  const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];
  const color = colors[name.length % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="${color}" width="400" height="400"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="160" font-family="Arial,sans-serif">${initial}</text></svg>`;
  fs.writeFileSync(dest.replace('.jpg', '.svg'), svg);
}

async function main() {
  fs.mkdirSync(avatarsDir, { recursive: true });

  const authors = [];

  for (let i = 0; i < AUTHORS.length; i++) {
    const a = AUTHORS[i];
    const filename = `${a.slug}.jpg`;
    const dest = path.join(avatarsDir, filename);
    const avatarPath = `/avatars/${filename}`;

    const downloaded = await downloadAvatar(UNSPLASH_PORTRAITS[i], dest);
    if (!downloaded) {
      createPlaceholderAvatar(dest, a.name);
      authors.push({
        id: a.id,
        name: a.name,
        role: a.role,
        avatar: `/avatars/${a.slug}.svg`,
        bio: a.bio,
      });
    } else {
      authors.push({
        id: a.id,
        name: a.name,
        role: a.role,
        avatar: avatarPath,
        bio: a.bio,
      });
    }
    console.log(`✓ Автор: ${a.name}`);
  }

  fs.mkdirSync(path.dirname(authorsPath), { recursive: true });
  fs.writeFileSync(authorsPath, JSON.stringify(authors, null, 2), 'utf-8');
  console.log(`\nСохранено ${authors.length} авторов в ${authorsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
