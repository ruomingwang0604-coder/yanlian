const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const requiredFiles = [
  'LICENSE',
  'NOTICE.md',
  'THIRD_PARTY_NOTICES.md',
  'build/icon.icns',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'docs/PROJECT.md',
  'docs/BASELINE.md',
  'docs/ROADMAP.md',
  'docs/REPOSITORY.md',
  'docs/iterations/TEMPLATE.md',
  'docs/iterations/2026-09-07-report-loop-v1.1.md'
];
const javascriptFiles = [
  'main.js',
  'preload.js',
  'lib/asr.js',
  'lib/lexicon.js',
  'lib/ai-feedback.js',
  'lib/prompts.js',
  'src/app.js',
  'src/speech-topics.js',
  'src/settings.js'
];

let failed = false;

function pass(message) {
  console.log(`✓ ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`✗ ${message}`);
}

for (const file of requiredFiles) {
  if (existsSync(join(root, file))) pass(`存在 ${file}`);
  else fail(`缺少 ${file}`);
}

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status === 0) pass(`语法检查 ${file}`);
  else fail(`语法检查失败 ${file}\n${result.stderr.trim()}`);
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const expectedIdentity = {
  name: 'yanlian-desktop',
  productName: '言练',
  appId: 'com.ruoming.yanlian'
};
if (
  packageJson.name === expectedIdentity.name &&
  packageJson.productName === expectedIdentity.productName &&
  packageJson.build?.appId === expectedIdentity.appId
) {
  pass('言练独立应用身份完整');
} else {
  fail('言练应用名称、包名或 appId 配置不完整');
}
if (packageJson.build?.extraResources?.some(item => String(item.from || '').startsWith('models/'))) {
  pass('安装包包含本地语音模型资源');
} else {
  fail('安装包未配置本地语音模型资源');
}
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
if (packageJson.version === packageLock.version && packageJson.version === packageLock.packages?.['']?.version) {
  pass(`版本一致 ${packageJson.version}`);
} else {
  fail('package.json 与 package-lock.json 的版本不一致');
}

const license = readFileSync(join(root, 'LICENSE'), 'utf8');
if (license.includes('Copyright (c) 2026 Sisi') && license.includes('MIT License')) {
  pass('保留上游 MIT 版权声明');
} else {
  fail('LICENSE 中缺少上游 MIT 版权声明');
}

const notice = readFileSync(join(root, 'NOTICE.md'), 'utf8');
if (notice.includes('fxy2311-youyou/expression-trainer') && notice.includes('独立改进')) {
  pass('NOTICE 包含上游来源与独立版本说明');
} else {
  fail('NOTICE 的上游来源说明不完整');
}


const trackedResult = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
if (trackedResult.status === 0) {
  const forbidden = trackedResult.stdout.split(/\r?\n/).filter(file =>
    file === 'settings.json' ||
    file.startsWith('node_modules/') ||
    file.startsWith('work/') ||
    /\.(?:onnx|tar|tar\.bz2|zip)$/i.test(file)
  );
  if (forbidden.length === 0) pass('未跟踪模型、密钥或临时构建文件');
  else fail(`发现不应提交的本地文件：${forbidden.join(', ')}`);
} else {
  fail('无法读取 Git 跟踪文件列表');
}

const gitResult = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
if (gitResult.status === 0) pass('git diff 格式检查');
else fail(`git diff 格式检查失败\n${gitResult.stdout}${gitResult.stderr}`);

if (failed) process.exit(1);
console.log('\n项目检查全部通过。');
