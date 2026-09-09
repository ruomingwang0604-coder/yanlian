# 仓库与发布维护

## 远程仓库约定

本地仓库将原作者仓库命名为 `upstream`，仅用于查看或同步上游更新。为避免误推送，本机已经禁用 `upstream` 的 push URL。

创建自己的 GitHub 仓库后，将它添加为 `origin`：

```bash
git remote add origin <你的独立仓库地址>
git push -u origin main
```

推荐保持：

- `origin`：言练自己的仓库，可正常推送。
- `upstream`：原始开源项目，只拉取、不推送。

检查远程配置：

```bash
git remote -v
```

## 同步上游更新

不要直接把整个上游分支覆盖到言练。先获取更新，再按需选择具体提交或手动移植：

```bash
git fetch upstream

git log --oneline main..upstream/main
```

如果某个修复值得采用，优先在独立分支处理并重新跑完整检查。

## 版本规则

言练从 `0.1.0` 开始使用语义化版本：

- `0.x.0`：新的训练能力或明显的产品体验迭代。
- `0.x.y`：兼容性的错误修复和小幅优化。
- `1.0.0`：训练闭环、历史记录、发布安装和基本隐私说明达到稳定产品标准后再考虑。

每次准备新版本时：

1. 更新 `package.json` 与 `package-lock.json` 版本。
2. 将 `CHANGELOG.md` 的 Unreleased 内容归入对应版本和日期。
3. 更新 `docs/BASELINE.md` 或新增版本说明。
4. 运行 `npm run check`。
5. 完成一次真实训练闭环检查。
6. 确认后再创建 Git commit 和版本 tag。

## 建议分支

- `main`：始终保持可运行。
- `iteration/<name>`：每一轮产品迭代。
- `fix/<name>`：范围明确的错误修复。

不要长期维护大量分支；验证结束后及时合并或删除。
