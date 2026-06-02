# SDD-Workflow 实际项目部署和使用指南

## 一、部署流程

### 1.1 安装 Plugin (opencode-sdd-workflow)

**方式 A: 本地安装（推荐用于开发测试）**

```bash
# 在项目根目录
cd E:\workspace\coding\webagent

# 构建 Plugin
cd opencode-sdd-workflow
npm install
npm run build

# 测试 CLI
node bin/sdd.js help
```

**方式 B: 全局安装（推荐用于生产使用）**

```bash
# 发布到 npm（如果需要）
npm publish

# 全局安装
npm install -g opencode-sdd-workflow

# 测试 CLI
sdd help
```

**方式 C: 直接使用（无需安装）**

```bash
# 直接调用本地 Plugin
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js init
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js start user-auth
```

---

### 1.2 配置 opencode.json

**在项目根目录创建 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "./opencode-sdd-workflow/dist/index.js"
  ],
  "skills": {
    "paths": [
      "C:/Users/shangguanjingshi/.config/opencode/skills/sdd-workflow"
    ]
  }
}
```

**或者使用绝对路径：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "E:/workspace/coding/webagent/opencode-sdd-workflow/dist/index.js"
  ],
  "skills": {
    "paths": [
      "C:/Users/shangguanjingshi/.config/opencode/skills/sdd-workflow"
    ]
  }
}
```

**全局配置（~/.config/opencode/opencode.json）：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-sdd-workflow"
  ],
  "skills": {
    "paths": [
      "~/.config/opencode/skills/sdd-workflow"
    ]
  }
}
```

---

### 1.3 重启 opencode

**重要：修改配置后必须重启 opencode**

```bash
# 退出当前 opencode 会话
quit

# 重新启动 opencode
opencode
```

---

## 二、开发流程

### 2.1 使用 CLI 初始化项目

```bash
# 在项目根目录运行
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js init

# 或者如果全局安装
sdd init
```

**生成的目录结构：**

```
E:\workspace\coding\webagent\
├── .sdd/
│   ├── state.json           # 状态持久化
│   └── project.json         # 项目配置
├── CONSTITUTION/
│   ├── core.md              # 核心原则
│   ├── design-rules.md      # 设计规则
│   ├── implementation-rules.md # 实现规则
│   ├── review-rules.md      # 审查规则
│   └── workflow-rules.md    # 工作流规则
├── docs/
│   ├── features/            # 功能文档目录
│   ├── knowledge/           # 知识库
│   ├── modules/             # 模块文档
│   └── collaboration/       # 协作文档
├── PROJECT_STATE.md         # 项目状态聚合
└── AGENTS.md                # AI Agent 上下文
```

---

### 2.2 开始功能开发

```bash
# 开始新功能开发（进入 Phase 0）
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js start user-authentication

# 查看当前状态
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js status --verbose

# 检查 Phase Gate 要求
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js gate 1 check

# 批准 Phase Gate（进入下一阶段）
node E:\workspace\coding\webagent\opencode-sdd-workflow\bin\sdd.js gate 1 approve
```

---

### 2.3 在 opencode 会话中使用

**启动 opencode：**

```bash
cd E:\workspace\coding\webagent
opencode
```

**在对话中调用 Plugin Tools：**

```
用户: "开始开发用户认证功能"

AI 会自动：
1. 调用 sdd_start 工具（参数: feature=user-auth）
2. Plugin 注入 Phase 0 Prompt
3. Plugin 阻止 edit/write/bash 工具
4. AI 只能用 read/glob/grep 进行研究
```

**手动调用 Tool：**

```
用户: "调用 sdd_init 工具初始化项目"
用户: "调用 sdd_start 工具，参数 feature=user-auth"
用户: "调用 sdd_gate 工具，参数 phase=1 action=check"
用户: "调用 sdd_gate 工具，参数 phase=1 action=approve"
用户: "调用 sdd_status 工具查看状态"
```

---

## 三、实际开发流程（Phase 0-6）

### Phase 0: Research & Understanding

**用户操作：**

```bash
# CLI
sdd start user-authentication
```

**Plugin 行为：**

```
✅ 设置 currentPhase = Phase.UNDERSTANDING
✅ 创建 docs/features/user-authentication/findings.md
✅ 创建 docs/features/user-authentication/task_plan.md
✅ 阻止 edit/write/bash 工具
✅ 注入 Phase 0 Prompt 到 system message
```

**AI 行为（自动）：**

```
1. 读取 Skill 文档：
   - phases-reference.md (Phase 0 详细步骤)
   - interface-example.md (接口定义示例)
   
2. 执行研究（只使用 read/glob/grep）：
   - 分析 5+ 相关文件
   - 引用 2+ 外部资料
   - 识别 2+ 约束条件
   - 比较 2+ 方案
   
3. 写入 findings.md (Phase 0 section)
```

**用户验证：**

```bash
# CLI
sdd gate 1 check

# 输出：
✅ Phase 0 section: present
✅ 5+ files analyzed: src/auth.py, src/user.py, ...
✅ 2+ citations: RFC 6749, JWT spec
✅ 2+ constraints: Performance < 500ms, Security bcrypt
✅ 2+ alternatives: Session-based vs JWT-based

# 批准进入 Phase 1
sdd gate 1 approve
```

---

### Phase 1: Requirements & Design

**Plugin 行为：**

```
✅ 设置 currentPhase = Phase.REQUIREMENTS
✅ 阻止 bash 工具（允许 edit/write）
✅ 注入 Phase 1 Prompt
✅ AI 读取 design-doc-template.md
```

**AI 行为（自动）：**

```
1. 读取 Skill 模板：
   - design-doc-template.md (Total-Part 结构)
   - interface-example.md (8 维接口定义)
   - dependency-example.md (5 维依赖分析)
   
2. 生成设计文档：
   - Part 1: Overall Architecture
   - Part 2: Data Flow (PlantUML)
   - Part 3: Module Decomposition (Mermaid)
   - Part 4: Integration & Verification
   
3. Constitution 合规检查
```

**用户验证：**

```bash
# CLI
sdd gate 2 check

# 批准进入 Phase 2
sdd gate 2 approve
```

---

### Phase 2: Implementation Planning

**AI 行为：**

```
1. 读取 design-doc.md
2. 分解任务（每个任务：input, output, estimate）
3. 定义文件修改范围
4. 写入 task_plan.md
```

**用户验证：**

```bash
sdd gate 3 check
sdd gate 3 approve
```

---

### Phase 3: Module Development

**Plugin 行为：**

```
✅ 允许所有工具
✅ Context Monitor 每 50 次编辑注入上下文
✅ Loop Detection 阻止单文件 20+ 次编辑
```

**AI 行为：**

```
1. 创建 git worktree（可选）
2. 执行任务（subagent-driven-development）
3. 编写代码 + 单元测试
4. Constitution 合规检查
```

**用户验证：**

```bash
sdd gate 4 check
# 要求：所有任务完成，单元测试通过，lint/typecheck 通过
sdd gate 4 approve
```

---

### Phase 4: Integration & Testing

**AI 行为：**

```
1. 运行集成测试
2. 运行 E2E 测试
3. 修复问题
```

**用户验证：**

```bash
sdd gate 5 check
sdd gate 5 approve
```

---

### Phase 5: Code Quality Review

**AI 行为：**

```
1. 生成 architecture_review.md
2. 生成 code_quality_review.md
3. Constitution 合规验证
```

**用户验证：**

```bash
sdd gate 6 check
sdd gate 6 approve
```

---

### Phase 6: Memory Persistence

**AI 行为：**

```
1. 更新 AGENTS.md（上下文恢复）
2. 保存 conversation_memory.json
3. 更新 PROJECT_STATE.md
4. 标记功能完成
```

**用户操作：**

```bash
sdd complete user-authentication
```

---

## 四、实际操作示例

### 示例 1: 完整功能开发

```bash
# 1. 初始化项目
cd E:\workspace\coding\webagent
sdd init

# 2. 开始功能开发
sdd start user-authentication

# 3. 在 opencode 会话中
opencode

# 4. 对话中自然语言
"开始开发用户认证功能"

# AI 自动：
# - 调用 sdd_start
# - 进入 Phase 0
# - 阻止编辑工具
# - 执行研究

# 5. 检查 Phase 0 要求
sdd gate 1 check

# 6. 批准 Phase 0
sdd gate 1 approve

# 7. AI 自动进入 Phase 1
# - 允许编辑工具
# - 生成设计文档

# 8. 循环 Phase 1-6...
sdd gate 2 approve
sdd gate 3 approve
sdd gate 4 approve
sdd gate 5 approve
sdd gate 6 approve

# 9. 完成功能
sdd complete user-authentication

# 10. 查看最终状态
sdd status --verbose
```

---

### 示例 2: 恢复中断的工作流

```bash
# 如果工作流中断（会话崩溃）

# 1. 查看活跃功能
sdd status

# 输出：
Active features:
  - user-authentication (Phase 3: Module Development)

# 2. 恢复功能
sdd resume user-authentication

# Plugin 自动：
# - 加载 .sdd/state.json
# - 恢复 Phase 3 状态
# - 注入 Phase 3 Prompt
# - 加载 conversation_memory.json

# 3. 在 opencode 中继续
opencode

"恢复用户认证功能的开发"

# AI 自动：
# - 读取 findings.md
# - 读取 design-doc.md
# - 读取 task_plan.md
# - 继续执行任务
```

---

### 示例 3: 强制刷新上下文

```bash
# 如果 AI 上下文漂移

# 1. 强制刷新
sdd refresh "AI 开始偏离设计文档"

# Plugin 自动：
# - 注入关键需求
# - 注入设计决策
# - 注入热点文件警告

# 2. 在 opencode 中
"调用 sdd_refresh 工具，参数 reason='上下文漂移'"
```

---

## 五、最佳实践

### 5.1 Plugin + Skill 协同使用

**推荐配置：**

```json
{
  "plugin": ["opencode-sdd-workflow"],
  "skills": {
    "paths": ["~/.config/opencode/skills/sdd-workflow"]
  }
}
```

**原因：**
- Plugin 提供强制约束（阻止跳过阶段）
- Skill 提供详细引导（模板、示例）
- 两者协同提供完整工作流

---

### 5.2 使用 CLI vs Tool Commands

| 场景 | 推荐 | 原因 |
|------|------|------|
| **初始化项目** | CLI (`sdd init`) | 快速、独立 |
| **查看状态** | CLI (`sdd status`) | 随时可查看 |
| **Phase Gate 操作** | Tool (`sdd_gate`) | AI 自动调用 |
| **恢复工作流** | CLI (`sdd resume`) | 快速恢复 |
| **上下文刷新** | Tool (`sdd_refresh`) | AI 自动判断 |

---

### 5.3 团队协作

**共享状态：**

```bash
# 团队成员 A 开始功能
sdd start user-authentication
git add .sdd/state.json docs/features/user-authentication/
git commit -m "Start user-authentication feature (Phase 0)"
git push

# 团队成员 B 恢复功能
git pull
sdd resume user-authentication
```

**状态同步：**
- `.sdd/state.json` - Git 提交
- `docs/features/<feature>/` - Git 提交
- `CONSTITUTION/` - Git 提交

---

### 5.4 避免 Common Mistakes

**常见错误：**

| 错误 | 修正 |
|------|------|
| ❌ 在 Phase 0 直接写代码 | ✅ 等待 Phase Gate approve |
| ❌ 跳过 Phase 直接进入下一阶段 | ✅ Plugin 自动阻止 |
| ❌ AI 上下文漂移 | ✅ 定期调用 sdd_refresh |
| ❌ 手动修改 .sdd/state.json | ✅ 只通过 Plugin 修改 |
| ❌ 不查看 Skill 文档 | ✅ AI 自动阅读 phases-reference.md |

---

## 六、故障排查

### 6.1 Plugin 未加载

**症状：**
```
用户: "调用 sdd_start 工具"
AI: "未找到 sdd_start 工具"
```

**解决方案：**
```bash
# 1. 检查 opencode.json
cat opencode.json

# 2. 确认 plugin 路径正确
ls opencode-sdd-workflow/dist/index.js

# 3. 重启 opencode
quit
opencode
```

---

### 6.2 Skill 文档未加载

**症状：**
```
AI: "找不到 phases-reference.md"
```

**解决方案：**
```bash
# 1. 检查 Skill 路径
ls C:/Users/shangguanjingshi/.config/opencode/skills/sdd-workflow/SKILL.md

# 2. 检查 opencode.json skills.paths
cat opencode.json

# 3. 重启 opencode
```

---

### 6.3 Phase Gate 阻止正常操作

**症状：**
```
用户: "编辑文件"
Plugin: "Phase 0 阻止 edit 工具"
```

**解决方案：**
```bash
# 1. 检查当前 Phase
sdd status

# 2. 如果已完成 Phase 要求，批准 Gate
sdd gate 1 approve

# 3. 然后继续编辑
```

---

## 七、进阶使用

### 7.1 自定义 Constitution

**修改 CONSTITUTION/core.md：**

```markdown
# Core Principles

## Project-Specific Rules

1. All authentication code must use bcrypt
2. Database queries must use prepared statements
3. All API endpoints must have rate limiting
```

**AI 自动应用规则：**
- Plugin Constitution Middleware 验证
- AI 读取并遵循规则

---

### 7.2 集成 Nexus Map

```bash
# 生成代码库架构图
nexus-mapper

# Plugin 自动读取 .nexus-map/
# AI 使用 nexus-query 查询依赖关系
```

---

### 7.3 多功能并行开发

```bash
# 功能 A
sdd start user-authentication

# 功能 B（独立）
sdd start payment-integration

# 查看所有活跃功能
sdd status

# 切换功能
sdd resume user-authentication
```

---

## 八、总结

### 部署流程总结

```
1. 构建 Plugin: npm run build
2. 配置 opencode.json: plugin + skills
3. 重启 opencode
4. 初始化项目: sdd init
5. 开始功能开发: sdd start <feature>
```

### 开发流程总结

```
Phase 0: Research (Plugin 阻止编辑，AI 只读研究)
Phase 1: Design (Plugin 阻止 bash，AI 生成设计文档)
Phase 2: Planning (AI 分解任务)
Phase 3: Development (Plugin 监控编辑，AI 编写代码)
Phase 4: Testing (AI 运行测试)
Phase 5: Review (AI 生成审查文档)
Phase 6: Persistence (AI 更新文档，Plugin 标记完成)
```

### 核心优势

```
✅ Plugin 提供强制约束（阻止跳过阶段）
✅ Skill 提供详细引导（模板、示例、文档）
✅ 状态自动持久化（崩溃恢复）
✅ 上下文自动注入（防止漂移）
✅ 团队协作友好（状态共享）
```

---

**开始使用：**

```bash
cd E:\workspace\coding\webagent
node opencode-sdd-workflow/bin/sdd.js init
node opencode-sdd-workflow/bin/sdd.js start my-first-feature
opencode

# 在对话中说："开始开发我的第一个功能"
```