# 言练 · 表达训练台

> 本仓库是基于 [fxy2311-youyou/expression-trainer](https://github.com/fxy2311-youyou/expression-trainer) 的独立改进版本，并非原项目的官方发行版。
> 原项目与本项目均依照 MIT License 使用；原作者版权声明保留在 `LICENSE` 中。

一款面向中文演讲与口语表达训练的桌面应用。语音识别和词库分析在本机完成；使用 DeepSeek、OpenAI 等在线 AI 服务时，演讲逐字稿会发送给用户自行配置的服务商，使用 Ollama 时可保持完整本地处理。

## 项目状态

本项目处于持续迭代阶段，当前重点是让评分可解释、反馈有层次，并形成可重复的训练闭环：

> 说一次 → 看懂六维评分 → 看见多个改进机会 → 带着一个建议再试一次 → 重新评估

- [项目定位与产品原则](docs/PROJECT.md)
- [v0.1.0 版本基线](docs/BASELINE.md)
- [迭代路线图](docs/ROADMAP.md)
- [版本变更记录](CHANGELOG.md)
- [开发与迭代规范](CONTRIBUTING.md)
- [仓库与版本维护](docs/REPOSITORY.md)

## 功能

- 🎴 **主题演讲训练**：100 个本地题目随机抽卡，15 分钟手写提纲准备，完成最长 5 分钟演讲
- 🎤 **实时语音识别**：基于 Sherpa-ONNX，完全离线，中文优化
- 📝 **全屏字幕显示**：黑底大字，实时显示你说的每一句话
- 🔍 **词库分析**：自动检测填充词、犹豫词、笼统词，给出精准替代
- 🤖 **AI反馈**：支持 Groq/OpenAI/DeepSeek/Ollama 多后端
- 📊 **六维透明评分**：综合分、雷达图、维度分、评分子项与原话依据逐层展开
- 🧭 **九章可跳转报告**：保留亮点、改进机会、逐句编辑、用词习惯和完整数据，给出一个可立即尝试的建议，但不限制下一轮发现其他问题
- 🔁 **立即再练一次**：带着明确目标直接进入下一轮训练

## 安装

### 普通用户：macOS 测试安装包

“言练”现在拥有独立应用 ID、图标和 DMG 构建流程。公开 Release 发布后，Apple Silicon Mac 用户可以直接下载 `Yanlian-<版本>-mac-arm64.dmg`，将“言练”拖入“应用程序”后启动，不需要安装 Node.js 或运行命令。

当前测试包尚未经过 Apple 签名和公证，首次打开时 macOS 可能提示无法验证开发者。正式公开分发前会继续处理签名、公证和首次启动引导。

安装包不再内置大体积语音模型。首次打开时，“言练”会引导下载约 226 MB 的本地识别文件，显示下载进度并执行 SHA-256 完整性校验；失败后可以重试，已校验文件不会重复下载。

### 开发者：从源码运行

```bash
git clone https://github.com/ruomingwang0604-coder/yanlian.git
cd yanlian
npm install
```

直接启动开发版。如果仓库 `models/` 中没有完整模型，首次打开界面会自动进入模型准备流程：

```bash
npm start
```

也可以提前手动下载 Sherpa-ONNX streaming paraformer 中英双语模型：

```bash
cd models
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2
tar xvf sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2
cd ..
```

模型目录应为：

```text
models/
└── sherpa-onnx-streaming-paraformer-bilingual-zh-en/
    ├── encoder.int8.onnx
    ├── decoder.int8.onnx
    └── tokens.txt
```

构建 Apple Silicon macOS 测试安装包：

```bash
npm run dist:mac
```

构建结果输出到 `dist/`。构建安装包时不需要提前下载模型。

安装版下载的模型保存在当前用户的应用数据目录中，不会写入应用程序本体。也可以通过 `YANLIAN_MODELS_DIR` 环境变量指定自定义模型根目录。

### 配置 AI 后端

启动后点击右上角 ⚙️ 进入设置页面。

| 后端 | 数据处理方式 | 说明 |
|------|--------------|------|
| DeepSeek | 在线 | 逐字稿发送到用户配置的 DeepSeek 服务 |
| OpenAI | 在线 | 逐字稿发送到用户配置的 OpenAI 服务 |
| Ollama | 本地 | 模型安装在本机时可完整本地处理 |
| 自定义兼容接口 | 取决于服务地址 | 由用户自行确认服务的数据政策 |

API Key 保存在当前电脑的 Electron 用户数据目录中，不会提交到本项目仓库。准备阶段输入的演讲提纲不会发送给外部模型。

## 使用说明

### 主题演讲训练

1. 点击 **「抽取演讲话题」**，可从全部题目或指定分类中随机抽题。
2. 接受话题后有 **15 分钟准备时间**，提纲只能手动输入，不能粘贴。
3. 准备完成后开始 **最长 5 分钟演讲**，倒计时结束会自动停止录音。
4. 结束后生成报告，系统会结合公开话题判断逐字稿是否回应任务；准备笔记始终保留在本地。

### 自由录制

1. 点击 **「自由录制」** → 对着麦克风说话。
2. 实时字幕会在屏幕中央显示你说的内容。
3. 左侧面板实时统计填充词、犹豫词和笼统词。
4. 右侧面板持续给出简短的表达反馈。
5. 说完后点击 **「结束训练」**，再生成完整训练报告。

## 字幕颜色含义

| 颜色 | 含义 |
|------|------|
| 🔴 红色波浪下划线 | 填充词（嗯、啊、那个、然后…） |
| 🟠 橙色 | 犹豫词（可能、也许、我觉得…） |
| 🟡 黄色虚线 | 笼统词（有精准替代建议） |
| 🟢 绿色 | 有力表达（好句子！） |

## 技术架构

```
┌─────────────────────────────────────────┐
│ Electron 主进程                          │
│  ├── Sherpa-ONNX (离线语音识别)          │
│  ├── 词库匹配 (emotion-lexicon.json)     │
│  └── AI反馈 (多后端 HTTP API)            │
├─────────────────────────────────────────┤
│ 渲染进程 (Chromium)                      │
│  ├── 全屏字幕显示                        │
│  ├── 实时统计面板                        │
│  └── 分析报告弹窗                        │
└─────────────────────────────────────────┘
```

## 词库说明

`data/emotion-lexicon.json` 基于大连理工情感词库7大类结构，包含：

- **130+ 情绪词**：分类（喜怒哀惧恶惊）+ 强度（1-9）
- **笼统词→精准词映射**：25组高频替代建议
- **填充词表**：24个常见口头禅
- **犹豫词表**：19个弱化表达
- **程度词梯度**：弱→中→强→极 四级
- **画面化描述**：10组「抽象→具象」转换
- **犹豫→直接转换**：8组对照示例

## 开发

```bash
# 开发模式（带DevTools）
npm run dev

# 目录结构
├── main.js              # Electron主进程
├── preload.js           # preload脚本
├── src/
│   ├── index.html       # 主界面
│   ├── settings.html    # 设置页
│   ├── styles.css       # 样式
│   ├── app.js           # 前端逻辑
│   ├── speech-topics.js # 100 个主题演讲题目
│   └── settings.js      # 设置逻辑
├── lib/
│   ├── asr.js           # 语音识别
│   ├── lexicon.js       # 词库匹配
│   ├── ai-feedback.js   # AI反馈
│   └── prompts.js       # Prompt模板
├── data/
│   └── emotion-lexicon.json
└── models/              # Sherpa-ONNX模型（需下载）
```

## 系统要求

- 测试安装包：macOS 12+、Apple Silicon
- 源码运行：macOS / Windows / Linux，Node.js 18+
- 麦克风权限
- （可选）网络连接（用于AI反馈，词库分析可离线）

## License

MIT
