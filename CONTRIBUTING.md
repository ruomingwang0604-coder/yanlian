# 参与言练开发

言练采用小步迭代方式维护。提交修改前，请先确认本轮只解决一个主要用户问题。

## 开发流程

1. 从 `docs/ROADMAP.md` 选择当前迭代，或先补充新的迭代说明。
2. 在 `docs/iterations/` 创建日期化记录，写明问题、假设和完成标准。
3. 保持改动范围聚焦，不在同一轮混入无关重构。
4. 运行统一项目检查：

```bash
npm run check
```

检查会验证核心 JavaScript 语法、版本一致性、MIT 上游声明、项目文档和 Git diff 格式。

5. 涉及界面时，至少检查一个常用窗口尺寸。
6. 涉及训练流程时，完成一次从输入到报告再到下一轮的闭环测试。
7. 更新 `CHANGELOG.md`。

## 提交建议

推荐每轮使用独立分支：

```bash
git switch -c iteration/short-name
```

提交信息示例：

```text
feat(report): add previous-round comparison
fix(asr): keep final transcript segment
refactor(ui): simplify training status controls
```

## 边界

- 不提交语音模型、压缩包、密钥或本地设置文件。
- 不移除上游 MIT 许可证和版权声明。
- 不将本项目描述为上游作者的官方版本。
