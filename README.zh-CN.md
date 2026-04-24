# Open Agents

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=open-agents&repository-name=open-agents&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fopen-agents&demo-title=Open+Agents&demo-description=Open-source+reference+app+for+building+and+running+background+coding+agents+on+Vercel.&demo-url=https%3A%2F%2Fopen-agents.dev%2F&env=POSTGRES_URL%2CBETTER_AUTH_SECRET%2CENCRYPTION_KEY%2CNEXT_PUBLIC_VERCEL_APP_CLIENT_ID%2CVERCEL_APP_CLIENT_SECRET%2CNEXT_PUBLIC_GITHUB_CLIENT_ID%2CGITHUB_CLIENT_SECRET%2CGITHUB_APP_ID%2CGITHUB_APP_PRIVATE_KEY%2CNEXT_PUBLIC_GITHUB_APP_SLUG%2CGITHUB_WEBHOOK_SECRET&envDescription=Neon+can+provide+POSTGRES_URL+automatically.+Generate+BETTER_AUTH_SECRET+and+ENCRYPTION_KEY+yourself%2C+then+add+your+Vercel+OAuth+and+GitHub+App+credentials+for+a+full+deployment.&products=%255B%257B%2522type%2522%253A%2522integration%2522%252C%2522protocol%2522%253A%2522storage%2522%252C%2522productSlug%2522%253A%2522neon%2522%252C%2522integrationSlug%2522%253A%2522neon%2522%257D%252C%257B%2522type%2522%253A%2522integration%2522%252C%2522protocol%2522%253A%2522storage%2522%252C%2522productSlug%2522%253A%2522upstash-kv%2522%252C%2522integrationSlug%2522%253A%2522upstash%2522%257D%255D&skippable-integrations=1)

Open Agents 是一个开源参考应用，用于在 Vercel 上构建和运行后台编码代理。它包含 Web UI、代理运行时、沙箱编排，以及从提示到代码修改所需的 GitHub 集成，而且不需要你的本地电脑一直在线。

这个仓库的目标是被 fork 后按需改造，而不是当成黑盒直接使用。

## 它是什么

Open Agents 是一个三层系统：

```text
Web -> Agent workflow -> Sandbox VM
```

- Web 应用负责认证、会话、聊天和流式 UI。
- Agent 作为 Vercel 上的持久化工作流运行。
- Sandbox 是执行环境，包含文件系统、Shell、Git、开发服务器和预览端口。

### 关键架构决策：agent 不在 sandbox 里面运行

agent 并不运行在 VM 内部。它运行在沙箱外部，并通过文件读取、编辑、搜索和 shell 命令等工具与沙箱交互。

这种拆分是这个项目的核心：

- agent 执行不依赖单次请求生命周期
- sandbox 生命周期可以独立休眠和恢复
- 模型/提供商选择与沙箱实现可以分别演进
- VM 保持为纯执行环境，而不是控制平面

## 当前能力

- 面向聊天的编码代理，支持文件、搜索、shell、task、skill 和 web 工具
- 基于 Workflow SDK 的持久化多步骤执行、流式输出和取消能力
- 通过快照恢复的隔离 Vercel 沙箱
- 沙箱内的仓库克隆和分支开发
- 成功运行后可选自动提交、推送和创建 PR
- 通过只读链接共享会话
- 可选的 ElevenLabs 语音输入

## 运行说明

理解当前实现时，有几个细节很重要：

- 聊天请求会启动一个 workflow run，而不是把 agent 直接在请求内执行。
- 每个 agent 回合都可以跨多个持久化 workflow 步骤继续。
- 活动运行可以通过重新连接到现有 workflow 的流来恢复。
- 沙箱使用 base snapshot，暴露 `3000`、`5173`、`4321` 和 `8000` 端口，并在空闲后进入休眠。
- 自动提交和自动 PR 都受偏好设置驱动，不是始终开启。

## 现在实际需要什么

下面这些要求基于当前 `apps/web` 代码路径，而不是旧的安装脚本。

### 最小运行要求

这些是应用启动并加载服务端状态所需的硬性条件：

```env
POSTGRES_URL=
BETTER_AUTH_SECRET=
```

### 登录并真正使用托管应用所需

一个可用的部署还需要 token 加密以及 Vercel OAuth 登录：

```env
ENCRYPTION_KEY=
NEXT_PUBLIC_VERCEL_APP_CLIENT_ID=
VERCEL_APP_CLIENT_SECRET=
```

如果没有这些，网站可以部署，但 Vercel 登录不会正常工作。

### GitHub 仓库访问、推送和 PR 所需

如果你希望用户连接 GitHub、在仓库或组织上安装应用、克隆私有仓库、推送分支或创建 PR，请添加这些 GitHub App 配置：

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
NEXT_PUBLIC_GITHUB_APP_SLUG=
GITHUB_WEBHOOK_SECRET=
```

### 可选项

```env
REDIS_URL=
KV_URL=
VERCEL_PROJECT_PRODUCTION_URL=
NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL=
VERCEL_SANDBOX_BASE_SNAPSHOT_ID=
ELEVENLABS_API_KEY=
```

- `REDIS_URL` / `KV_URL`：可选的 skills 元数据缓存，未配置时回退到内存。
- `VERCEL_PROJECT_PRODUCTION_URL` / `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`：用于元数据和部分回调行为的生产环境规范 URL。
- `VERCEL_SANDBOX_BASE_SNAPSHOT_ID`：覆盖默认的沙箱快照。
- `ELEVENLABS_API_KEY`：语音转写。

## 在 Vercel 上部署你自己的副本

推荐做法：在 Vercel 上以仓库根目录部署这个仓库，然后再逐步加上认证和 GitHub 集成。

1. Fork 这个仓库。
2. 创建一个 PostgreSQL 数据库并复制其连接串。
3. 生成这些密钥：

   ```bash
   openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n'   # BETTER_AUTH_SECRET
   openssl rand -hex 32                                    # ENCRYPTION_KEY
   ```

4. 将仓库导入 Vercel。
5. 在 Vercel 项目设置中至少添加这些环境变量：

   ```env
   POSTGRES_URL=
   BETTER_AUTH_SECRET=
   ENCRYPTION_KEY=
   ```

6. 先部署一次，拿到稳定的 production URL。
7. 创建一个 Vercel OAuth app，并使用这个回调地址：

   ```text
   https://YOUR_DOMAIN/api/auth/callback/vercel
   ```

8. 添加这些环境变量并重新部署：

   ```env
   NEXT_PUBLIC_VERCEL_APP_CLIENT_ID=
   VERCEL_APP_CLIENT_SECRET=
   ```

9. 如果你想要完整的 GitHub 编码代理流程，创建一个 GitHub App，并使用：

   - Homepage URL: `https://YOUR_DOMAIN`
   - Callback URL: `https://YOUR_DOMAIN/api/github/app/callback`
   - Setup URL: `https://YOUR_DOMAIN/api/github/app/callback`

   在 GitHub App 设置中：
   - 启用 "Request user authorization (OAuth) during installation"
   - 使用 GitHub App 的 Client ID 和 Client Secret 作为 `NEXT_PUBLIC_GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`
   - 如果你希望组织安装能正常工作，把应用设为 public

10. 添加 GitHub App 的环境变量并重新部署。
11. 可选地添加 Redis/KV 和规范生产 URL 变量。

## 本地开发

1. 安装依赖：

   ```bash
   bun install
   ```

2. 创建本地环境文件：

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. 在 `apps/web/.env` 中填入必需的值。
4. 启动应用：

   ```bash
   bun run web
   ```

如果你已经关联了 Vercel 项目，也可以通过 `vc env pull` 把环境变量拉到本地，但现在这个流程是刻意手动的，这样你能清楚看到哪些值真正重要。

## OAuth 和集成配置

### Vercel OAuth

创建一个 Vercel OAuth app，并使用这个回调地址：

```text
https://YOUR_DOMAIN/api/auth/callback/vercel
```

本地开发时使用：

```text
http://localhost:3000/api/auth/callback/vercel
```

然后设置：

```env
NEXT_PUBLIC_VERCEL_APP_CLIENT_ID=...
VERCEL_APP_CLIENT_SECRET=...
```

### GitHub App

你不需要单独的 GitHub OAuth app。Open Agents 使用的是 GitHub App 的 user authorization 流程。

创建一个用于基于安装的仓库访问的 GitHub App，并配置：

- Homepage URL: `https://YOUR_DOMAIN`
- Callback URL: `https://YOUR_DOMAIN/api/github/app/callback`
- Setup URL: `https://YOUR_DOMAIN/api/github/app/callback`
- 启用 "Request user authorization (OAuth) during installation"
- 如果你希望组织安装能正常工作，把应用设为 public

本地开发时，将 callback/setup URL 设为 `http://localhost:3000/api/github/app/callback`，Homepage URL 设为 `http://localhost:3000`。

然后设置：

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=...   # GitHub App Client ID
GITHUB_CLIENT_SECRET=...           # GitHub App Client Secret
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
NEXT_PUBLIC_GITHUB_APP_SLUG=...
GITHUB_WEBHOOK_SECRET=...
```

`GITHUB_APP_PRIVATE_KEY` 可以保存为带转义换行的 PEM 内容，也可以保存为 base64 编码的 PEM。

## 常用命令

```bash
bun run web
bun run check
bun run typecheck
bun run ci
bun run sandbox:snapshot-base
```

## 仓库结构

```text
apps/web         Next.js 应用、workflows、auth、聊天 UI
packages/agent   agent 实现、工具、subagents、skills
packages/sandbox 沙箱抽象和 Vercel 沙箱集成
packages/shared  共享工具函数
```
