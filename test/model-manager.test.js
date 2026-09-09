const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const test = require('node:test');
const { ModelManager } = require('../lib/model-manager');

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fixtureManifest(files) {
  return {
    id: 'test-model',
    revision: 'test-revision',
    totalBytes: files.reduce((sum, file) => sum + file.content.length, 0),
    files: files.map(file => ({
      name: file.name,
      size: file.content.length,
      sha256: digest(file.content),
      urls: [`https://example.test/${file.name}`]
    }))
  };
}

function fakeFetch(files, corrupt = new Set()) {
  return async url => {
    const name = url.split('/').pop();
    const file = files.find(item => item.name === name);
    if (!file) return { ok: false, status: 404, body: null };
    const content = corrupt.has(name) ? Buffer.from('corrupt') : file.content;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': String(content.length) }),
      body: Readable.from([content.subarray(0, 2), content.subarray(2)])
    };
  };
}

async function makeManager(t, files, options = {}) {
  const modelsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yanlian-model-test-'));
  t.after(() => fs.rm(modelsRoot, { recursive: true, force: true }));
  return new ModelManager({
    modelsRoot,
    manifest: fixtureManifest(files),
    fetchImpl: fakeFetch(files, options.corrupt)
  });
}

test('downloads every model file, reports progress, and verifies the result', async t => {
  const files = [
    { name: 'encoder.int8.onnx', content: Buffer.from('encoder') },
    { name: 'decoder.int8.onnx', content: Buffer.from('decoder') },
    { name: 'tokens.txt', content: Buffer.from('tokens') }
  ];
  const manager = await makeManager(t, files);
  const states = [];
  manager.on('progress', progress => states.push(progress.state));

  const result = await manager.download();

  assert.equal(result.ready, true);
  assert.equal((await manager.getStatus({ verify: true })).ready, true);
  assert.ok(states.includes('downloading'));
  assert.ok(states.includes('verifying'));
  assert.equal(states.at(-1), 'ready');
});

test('keeps valid files and downloads only missing files on retry', async t => {
  const files = [
    { name: 'encoder.int8.onnx', content: Buffer.from('encoder') },
    { name: 'decoder.int8.onnx', content: Buffer.from('decoder') }
  ];
  const requested = [];
  const manager = await makeManager(t, files);
  await fs.mkdir(manager.modelDir, { recursive: true });
  await fs.writeFile(path.join(manager.modelDir, files[0].name), files[0].content);
  manager.fetchImpl = async url => {
    requested.push(url);
    return fakeFetch(files)(url);
  };

  await manager.download();

  assert.deepEqual(requested, ['https://example.test/decoder.int8.onnx']);
});

test('rejects corrupted downloads and removes partial files', async t => {
  const files = [{ name: 'encoder.int8.onnx', content: Buffer.from('encoder') }];
  const manager = await makeManager(t, files, { corrupt: new Set(['encoder.int8.onnx']) });

  await assert.rejects(manager.download(), /下载失败/);
  await assert.rejects(fs.stat(path.join(manager.modelDir, 'encoder.int8.onnx.part')), { code: 'ENOENT' });
  assert.equal((await manager.getStatus()).ready, false);
});

test('uses the next source when the primary download fails', async t => {
  const files = [{ name: 'tokens.txt', content: Buffer.from('tokens') }];
  const manifest = fixtureManifest(files);
  manifest.files[0].urls.push('https://backup.test/tokens.txt');
  const modelsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yanlian-model-test-'));
  t.after(() => fs.rm(modelsRoot, { recursive: true, force: true }));
  const requested = [];
  const manager = new ModelManager({
    modelsRoot,
    manifest,
    fetchImpl: async url => {
      requested.push(url);
      if (url.includes('example.test')) return { ok: false, status: 503, body: null };
      return fakeFetch(files)(url);
    }
  });

  assert.equal((await manager.download()).ready, true);
  assert.deepEqual(requested, [
    'https://example.test/tokens.txt',
    'https://backup.test/tokens.txt'
  ]);
});

test('downloads large files in parallel ranges before verification', async t => {
  const content = Buffer.from('0123456789');
  const files = [{ name: 'encoder.int8.onnx', content }];
  const manifest = fixtureManifest(files);
  const modelsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yanlian-model-test-'));
  t.after(() => fs.rm(modelsRoot, { recursive: true, force: true }));
  const ranges = [];
  const manager = new ModelManager({
    modelsRoot,
    manifest,
    rangeThreshold: 1,
    chunkSize: 4,
    rangeConcurrency: 2,
    fetchImpl: async (url, options) => {
      const match = options.headers.Range.match(/bytes=(\d+)-(\d+)/);
      const start = Number(match[1]);
      const end = Number(match[2]);
      ranges.push([start, end]);
      const chunk = content.subarray(start, end + 1);
      return {
        ok: true,
        status: 206,
        headers: new Headers({ 'content-range': `bytes ${start}-${end}/${content.length}` }),
        body: Readable.from([chunk])
      };
    }
  });

  assert.equal((await manager.download()).ready, true);
  assert.deepEqual(ranges.sort((a, b) => a[0] - b[0]), [[0, 3], [4, 7], [8, 9]]);
  assert.deepEqual(await fs.readFile(path.join(manager.modelDir, files[0].name)), content);
});
