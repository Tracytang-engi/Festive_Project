/**
 * 1. 清空 sticker_processed 下 couplets, horse, eve_dinner, fireworks, temple_fair 的旧文件
 * 2. 把 new_stickers_processed 里对应文件夹的内容复制过去，并重命名为英文（folder_1.png, folder_2.png ...）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'client', 'public');
const oldDir = path.join(publicDir, 'sticker_processed');
const newDir = path.join(publicDir, 'new_stickers_processed');

const folders = ['couplets', 'horse', 'eve_dinner', 'fireworks', 'temple_fair'];

for (const folder of folders) {
  const oldFolder = path.join(oldDir, folder);
  const newFolder = path.join(newDir, folder);
  if (!fs.existsSync(newFolder)) continue;

  // 1. 删除旧文件夹内所有文件
  if (fs.existsSync(oldFolder)) {
    const files = fs.readdirSync(oldFolder);
    for (const f of files) {
      fs.unlinkSync(path.join(oldFolder, f));
    }
  } else {
    fs.mkdirSync(oldFolder, { recursive: true });
  }

  // 2. 复制新文件并命名为 folder_1.ext, folder_2.ext ...
  const newFiles = fs.readdirSync(newFolder).sort();
  let i = 1;
  for (const f of newFiles) {
    const ext = path.extname(f);
    const destName = `${folder}_${i}${ext}`;
    fs.copyFileSync(path.join(newFolder, f), path.join(oldFolder, destName));
    console.log(`${folder}: ${f} -> ${destName}`);
    i++;
  }
}

// 根目录单文件（new_stickers_processed 下的 微信图片_20260209130359_52_69.png）
const rootNewFile = fs.readdirSync(newDir).find(f => f.includes('30359'));
if (rootNewFile) {
  const ext = path.extname(rootNewFile);
  fs.copyFileSync(path.join(newDir, rootNewFile), path.join(oldDir, `extra_1${ext}`));
  console.log('root: ' + rootNewFile + ' -> extra_1' + ext);
}

console.log('Done.');
