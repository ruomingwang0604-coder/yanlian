const { createHash } = require('node:crypto');
const { EventEmitter } = require('node:events');
const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');

const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024;
const DEFAULT_RANGE_THRESHOLD = 16 * 1024 * 1024;
const DEFAULT_RANGE_CONCURRENCY = 6;

const MODEL_ID = 'sherpa-onnx-streaming-paraformer-bilingual-zh-en';
const MODEL_REVISION = '8e40c43232a1c5c66c82111efc5820d3accca11b';
const HUGGING_FACE_BASE = `https://huggingface.co/csukuangfj/${MODEL_ID}/resolve/${MODEL_REVISION}`;
const MODELSCOPE_BASE = `https://www.modelscope.cn/models/pengzhendong/${MODEL_ID}/resolve/master`;

const DEFAULT_MODEL_MANIFEST = {
  id: MODEL_ID,
  revision: MODEL_REVISION,
  totalBytes: 237202501,
  files: [
    {
      name: 'encoder.int8.onnx',
      size: 165462184,
      sha256: '81a70226a8934e6ed92aa1d4fc486b428b5398e2f2619ed4897b7294cab90e9a',
      urls: [`${HUGGING_FACE_BASE}/encoder.int8.onnx`, `${MODELSCOPE_BASE}/encoder.int8.onnx`]
    },
    {
      name: 'decoder.int8.onnx',
      size: 71664561,
      sha256: 'f3cca9f77bb9d93c8fcbfb63ae617b6b1ee96818df3aa3b151c40658fe38594f',
      urls: [`${HUGGING_FACE_BASE}/decoder.int8.onnx`, `${MODELSCOPE_BASE}/decoder.int8.onnx`]
    },
    {
      name: 'tokens.txt',
      size: 75756,
      sha256: '59aba8873a2ed1e122c25fee421e25f283b63290efbde85c1f01a853d83cb6e6',
      urls: [`${HUGGING_FACE_BASE}/tokens.txt`, `${MODELSCOPE_BASE}/tokens.txt`]
    }
  ]
};

function toNodeReadable(body) {
  if (!body) throw new Error('下载响应中没有文件内容');
  if (typeof body.getReader === 'function') return Readable.fromWeb(body);
  return body;
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

class ModelManager extends EventEmitter {
  constructor({
    modelsRoot,
    fetchImpl,
    manifest = DEFAULT_MODEL_MANIFEST,
    chunkSize = DEFAULT_CHUNK_SIZE,
    rangeThreshold = DEFAULT_RANGE_THRESHOLD,
    rangeConcurrency = DEFAULT_RANGE_CONCURRENCY
  }) {
    super();
    if (!modelsRoot) throw new Error('modelsRoot is required');
    if (typeof fetchImpl !== 'function') throw new Error('fetchImpl is required');

    this.modelsRoot = modelsRoot;
    this.fetchImpl = fetchImpl;
    this.manifest = manifest;
    this.chunkSize = chunkSize;
    this.rangeThreshold = rangeThreshold;
    this.rangeConcurrency = rangeConcurrency;
    this.modelDir = path.join(modelsRoot, manifest.id);
    this.activeDownload = null;
    this.verifiedInProcess = false;
  }

  emitProgress(progress) {
    const completedBytes = Math.min(progress.completedBytes || 0, this.manifest.totalBytes);
    const percent = this.manifest.totalBytes
      ? Math.min(100, Math.round((completedBytes / this.manifest.totalBytes) * 1000) / 10)
      : 0;
    this.emit('progress', {
      totalBytes: this.manifest.totalBytes,
      ...progress,
      completedBytes,
      percent
    });
  }

  async inspectFile(file, verifyHash) {
    const filePath = path.join(this.modelDir, file.name);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile() || stat.size !== file.size) {
        return { valid: false, size: stat.isFile() ? stat.size : 0, reason: 'size' };
      }
      if (verifyHash) {
        const digest = await sha256File(filePath);
        if (digest !== file.sha256) return { valid: false, size: stat.size, reason: 'checksum' };
      }
      return { valid: true, size: stat.size };
    } catch (error) {
      if (error.code === 'ENOENT') return { valid: false, size: 0, reason: 'missing' };
      throw error;
    }
  }

  async getStatus({ verify = false } = {}) {
    const shouldVerify = verify && !this.verifiedInProcess;
    let completedBytes = 0;
    const files = [];

    for (const file of this.manifest.files) {
      const result = await this.inspectFile(file, shouldVerify);
      files.push({ name: file.name, ...result });
      if (result.valid) completedBytes += file.size;
    }

    const ready = files.every(file => file.valid);
    if (ready && shouldVerify) this.verifiedInProcess = true;

    return {
      ready,
      state: ready ? 'ready' : 'missing',
      modelId: this.manifest.id,
      modelDir: this.modelDir,
      completedBytes,
      totalBytes: this.manifest.totalBytes,
      percent: ready ? 100 : Math.round((completedBytes / this.manifest.totalBytes) * 1000) / 10,
      files
    };
  }

  async download() {
    if (this.activeDownload) return this.activeDownload;
    this.activeDownload = this.downloadInternal().finally(() => {
      this.activeDownload = null;
    });
    return this.activeDownload;
  }

  async downloadInternal() {
    await fs.mkdir(this.modelDir, { recursive: true });
    this.verifiedInProcess = false;

    let completedBytes = 0;
    const validFiles = new Set();
    for (const file of this.manifest.files) {
      const result = await this.inspectFile(file, true);
      if (result.valid) {
        validFiles.add(file.name);
        completedBytes += file.size;
      }
    }

    this.emitProgress({
      state: 'downloading',
      completedBytes,
      message: completedBytes ? '继续下载未完成的模型文件' : '正在连接模型下载服务'
    });

    try {
      for (const file of this.manifest.files) {
        if (validFiles.has(file.name)) continue;
        await this.downloadFile(file, completedBytes);
        completedBytes += file.size;
      }

      this.emitProgress({
        state: 'verifying',
        completedBytes: this.manifest.totalBytes,
        message: '正在校验模型完整性'
      });
      const status = await this.getStatus({ verify: true });
      if (!status.ready) throw new Error('模型文件校验未通过，请重试下载');

      await fs.writeFile(
        path.join(this.modelDir, '.yanlian-model.json'),
        JSON.stringify({ id: this.manifest.id, revision: this.manifest.revision, verifiedAt: new Date().toISOString() }, null, 2)
      );

      this.emitProgress({
        state: 'ready',
        completedBytes: this.manifest.totalBytes,
        message: '语音模型已准备完成'
      });
      return status;
    } catch (error) {
      this.emitProgress({
        state: 'error',
        completedBytes,
        message: error.message
      });
      throw error;
    }
  }

  async downloadFile(file, completedBeforeFile) {
    const finalPath = path.join(this.modelDir, file.name);
    const partialPath = `${finalPath}.part`;
    await fs.rm(partialPath, { force: true });
    await fs.rm(finalPath, { force: true });

    const errors = [];
    for (let index = 0; index < file.urls.length; index += 1) {
      const sourceUrl = file.urls[index];
      try {
        await this.downloadFromSource(file, sourceUrl, partialPath, completedBeforeFile, index);
        await fs.rename(partialPath, finalPath);
        return;
      } catch (error) {
        errors.push(error.message);
        await fs.rm(partialPath, { force: true });
      }
    }

    throw new Error(`${file.name} 下载失败：${errors.join('；')}`);
  }

  async downloadFromSource(file, sourceUrl, partialPath, completedBeforeFile, sourceIndex) {
    this.emitProgress({
      state: 'downloading',
      fileName: file.name,
      completedBytes: completedBeforeFile,
      sourceIndex,
      message: sourceIndex === 0 ? `正在下载 ${file.name}` : `正在切换备用下载源：${file.name}`
    });

    if (file.size >= this.rangeThreshold) {
      try {
        await this.downloadInChunks(file, sourceUrl, partialPath, completedBeforeFile, sourceIndex);
        return;
      } catch (error) {
        await fs.rm(partialPath, { force: true });
        if (error.code !== 'RANGE_UNSUPPORTED') throw error;
      }
    }

    await this.downloadSequential(file, sourceUrl, partialPath, completedBeforeFile, sourceIndex);
  }

  async downloadSequential(file, sourceUrl, partialPath, completedBeforeFile, sourceIndex) {
    const response = await this.fetchImpl(sourceUrl, { redirect: 'follow', cache: 'no-store' });
    if (!response.ok) throw new Error(`下载服务返回 HTTP ${response.status}`);

    const handle = await fs.open(partialPath, 'w');
    const hash = createHash('sha256');
    let received = 0;

    try {
      for await (const chunk of toNodeReadable(response.body)) {
        const buffer = Buffer.from(chunk);
        await handle.writeFile(buffer);
        hash.update(buffer);
        received += buffer.length;
        this.emitProgress({
          state: 'downloading',
          fileName: file.name,
          completedBytes: completedBeforeFile + received,
          sourceIndex,
          message: `正在下载 ${file.name}`
        });
      }
    } finally {
      await handle.close();
    }

    if (received !== file.size) {
      throw new Error(`文件大小不正确（${received}/${file.size} 字节）`);
    }

    const digest = hash.digest('hex');
    if (digest !== file.sha256) throw new Error('SHA-256 校验失败');
  }

  async downloadInChunks(file, sourceUrl, partialPath, completedBeforeFile, sourceIndex) {
    const handle = await fs.open(partialPath, 'w');
    await handle.truncate(file.size);
    const controller = new AbortController();
    const chunkCount = Math.ceil(file.size / this.chunkSize);
    let nextChunk = 0;
    let receivedTotal = 0;

    const worker = async () => {
      while (nextChunk < chunkCount) {
        const chunkIndex = nextChunk;
        nextChunk += 1;
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(file.size - 1, start + this.chunkSize - 1);
        const expected = end - start + 1;
        const response = await this.fetchImpl(sourceUrl, {
          redirect: 'follow',
          cache: 'no-store',
          headers: { Range: `bytes=${start}-${end}` },
          signal: controller.signal
        });

        if (response.status === 200) {
          const error = new Error('下载源不支持分段下载');
          error.code = 'RANGE_UNSUPPORTED';
          throw error;
        }
        if (response.status !== 206) throw new Error(`分段下载返回 HTTP ${response.status}`);

        const contentRange = response.headers?.get?.('content-range') || '';
        if (contentRange && !contentRange.startsWith(`bytes ${start}-${end}/`)) {
          throw new Error('下载服务返回了错误的文件分段');
        }

        let chunkReceived = 0;
        for await (const chunk of toNodeReadable(response.body)) {
          const buffer = Buffer.from(chunk);
          if (chunkReceived + buffer.length > expected) throw new Error('文件分段大小超出预期');
          await handle.write(buffer, 0, buffer.length, start + chunkReceived);
          chunkReceived += buffer.length;
          receivedTotal += buffer.length;
          this.emitProgress({
            state: 'downloading',
            fileName: file.name,
            completedBytes: completedBeforeFile + receivedTotal,
            sourceIndex,
            message: `正在下载 ${file.name}`
          });
        }
        if (chunkReceived !== expected) throw new Error(`文件分段不完整（${chunkReceived}/${expected} 字节）`);
      }
    };

    const workers = Array.from({ length: Math.min(this.rangeConcurrency, chunkCount) }, () => worker());
    try {
      await Promise.all(workers);
    } catch (error) {
      controller.abort();
      await Promise.allSettled(workers);
      throw error;
    } finally {
      await handle.close();
    }

    const digest = await sha256File(partialPath);
    if (digest !== file.sha256) throw new Error('SHA-256 校验失败');
  }
}

module.exports = {
  DEFAULT_MODEL_MANIFEST,
  MODEL_ID,
  ModelManager,
  sha256File
};
