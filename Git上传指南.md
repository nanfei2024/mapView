# Git 上传到 GitHub 指南

## 📋 准备工作

### 1. 确认 Git 已安装

打开命令行，检查 Git 是否已安装：

```bash
git --version
```

如果未安装，请访问 [https://git-scm.com/](https://git-scm.com/) 下载安装。

### 2. 配置 Git 用户信息（首次使用）

```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱@example.com"
```

---

## 🚀 方案一：首次上传到 GitHub

### 步骤 1：在 GitHub 创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 填写仓库信息：
   - Repository name: `mapView` 或 `knowledge-graph-system`
   - Description: `书籍知识图谱可视化系统`
   - 选择 `Public` 或 `Private`
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 `Create repository`

### 步骤 2：初始化本地仓库

在项目根目录打开命令行：

```bash
# 进入项目目录
cd c:\Users\admin\Desktop\闾老师任务代码\mapView-main

# 初始化 Git 仓库
git init

# 查看当前状态
git status
```

### 步骤 3：添加 .gitignore 文件

创建 `.gitignore` 文件（如果还没有）：

```bash
# 创建 .gitignore
echo node_modules/ > .gitignore
echo dist/ >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .DS_Store >> .gitignore
```

或者使用我为您准备的完整版本（见下方）。

### 步骤 4：添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或者选择性添加
git add src/
git add docs/
git add package.json
git add README.md
```

### 步骤 5：提交到本地仓库

```bash
git commit -m "feat: 初始提交 - 书籍知识图谱系统

- 添加知识图谱可视化功能
- 添加智能问答系统
- 添加节点编辑功能
- 添加完整的技术文档"
```

### 步骤 6：关联远程仓库

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 验证远程仓库
git remote -v
```

### 步骤 7：推送到 GitHub

```bash
# 推送到 main 分支
git push -u origin main

# 如果是 master 分支
git push -u origin master
```

如果遇到错误，可能需要先拉取：

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 🔄 方案二：更新已有仓库

如果您之前已经上传过，现在要更新：

### 步骤 1：查看修改状态

```bash
cd c:\Users\admin\Desktop\闾老师任务代码\mapView-main
git status
```

### 步骤 2：添加修改的文件

```bash
# 添加所有修改
git add .

# 或者选择性添加
git add src/views/HierarchicalGraphPage.vue
git add src/components/KnowledgeQA.vue
git add docs/
```

### 步骤 3：提交修改

```bash
git commit -m "feat: 添加智能问答和封面显示功能

- 添加 KnowledgeQA 智能问答组件
- 书籍节点显示封面图片
- 添加节点跳转和高亮功能
- 完善技术文档（API、数据库、系统概述）
- 修复图谱初始化问题"
```

### 步骤 4：推送到 GitHub

```bash
git push
```

---

## 📝 推荐的 .gitignore 文件

创建或更新 `.gitignore` 文件：

```gitignore
# 依赖
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# 构建产物
dist/
dist-ssr/
build/
.output/

# 环境变量
.env
.env.local
.env.*.local
.env.production

# 编辑器
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# 操作系统
.DS_Store
Thumbs.db
desktop.ini

# 日志
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# 测试
coverage/
.nyc_output/

# 临时文件
*.tmp
*.temp
.cache/

# 其他
.history/
*.bak
```

---

## 📦 完整的上传流程（推荐）

### 一键执行脚本

创建 `upload.bat` 文件（Windows）：

```batch
@echo off
echo ========================================
echo    Git 上传到 GitHub
echo ========================================
echo.

echo [1/5] 检查 Git 状态...
git status
echo.

echo [2/5] 添加所有文件...
git add .
echo.

echo [3/5] 提交更改...
set /p commit_msg="请输入提交信息: "
git commit -m "%commit_msg%"
echo.

echo [4/5] 推送到 GitHub...
git push
echo.

echo [5/5] 完成！
echo ========================================
pause
```

使用方法：双击 `upload.bat` 文件即可。

---

## 🔧 常见问题解决

### 问题 1：推送被拒绝

```bash
# 错误信息
! [rejected]        main -> main (fetch first)
```

**解决方案**：

```bash
# 先拉取远程更改
git pull origin main --rebase

# 再推送
git push origin main
```

### 问题 2：需要输入用户名密码

GitHub 已不支持密码认证，需要使用 Personal Access Token。

**解决方案**：

1. 访问 GitHub → Settings → Developer settings → Personal access tokens
2. 点击 `Generate new token (classic)`
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 推送时使用 token 作为密码

或者配置 SSH：

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加到 ssh-agent
ssh-add ~/.ssh/id_ed25519

# 复制公钥到 GitHub
cat ~/.ssh/id_ed25519.pub

# 修改远程仓库地址为 SSH
git remote set-url origin git@github.com:你的用户名/你的仓库名.git
```

### 问题 3：文件太大

```bash
# 错误信息
remote: error: File xxx is 100.00 MB; this exceeds GitHub's file size limit
```

**解决方案**：

```bash
# 使用 Git LFS 管理大文件
git lfs install
git lfs track "*.jpg"
git lfs track "*.png"
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

### 问题 4：中文文件名乱码

```bash
# 配置 Git 支持中文
git config --global core.quotepath false
```

---

## 📊 Git 常用命令速查

### 基础操作

```bash
# 查看状态
git status

# 查看修改内容
git diff

# 查看提交历史
git log
git log --oneline

# 查看远程仓库
git remote -v
```

### 分支操作

```bash
# 创建分支
git branch feature-qa

# 切换分支
git checkout feature-qa

# 创建并切换分支
git checkout -b feature-qa

# 合并分支
git merge feature-qa

# 删除分支
git branch -d feature-qa
```

### 撤销操作

```bash
# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存区
git reset HEAD 文件名

# 撤销最后一次提交
git reset --soft HEAD^

# 强制回退到某个版本
git reset --hard commit_id
```

---

## 🎯 推荐的提交信息规范

使用 Conventional Commits 规范：

```
<类型>(<范围>): <简短描述>

<详细描述>

<footer>
```

### 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
git commit -m "feat(graph): 添加节点编辑功能

- 支持右键菜单操作
- 添加节点增删改功能
- 优化节点高亮效果"

git commit -m "fix(qa): 修复问答组件节点跳转问题"

git commit -m "docs: 更新 API 接口文档"
```

---

## 📚 推荐的项目结构

确保以下文件都已提交：

```
✅ src/                      # 源代码
✅ docs/                     # 文档
✅ public/                   # 静态资源
✅ package.json              # 依赖配置
✅ vite.config.ts            # Vite 配置
✅ tsconfig.json             # TypeScript 配置
✅ README.md                 # 项目说明
✅ .gitignore                # Git 忽略文件
❌ node_modules/             # 不要提交
❌ dist/                     # 不要提交
❌ .env                      # 不要提交
```

---

## 🎉 完成后的验证

### 1. 访问 GitHub 仓库

```
https://github.com/你的用户名/你的仓库名
```

### 2. 检查文件是否都已上传

- 源代码文件
- 文档文件
- 配置文件

### 3. 查看提交历史

在 GitHub 仓库页面点击 "Commits" 查看提交记录。

### 4. 测试克隆

```bash
# 在另一个目录测试克隆
cd /tmp
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
npm install
npm run dev
```

---

## 💡 最佳实践

### 1. 经常提交

```bash
# 每完成一个小功能就提交
git add .
git commit -m "feat: 完成某功能"
git push
```

### 2. 写清楚的提交信息

```bash
# 好的提交信息
git commit -m "feat(qa): 添加智能问答功能"

# 不好的提交信息
git commit -m "update"
git commit -m "修改"
```

### 3. 使用分支开发

```bash
# 主分支保持稳定
git checkout -b feature-new-function
# 开发...
git commit -m "feat: 新功能"
git checkout main
git merge feature-new-function
git push
```

### 4. 定期同步

```bash
# 每天开始工作前
git pull origin main

# 每天结束工作后
git push origin main
```

---

## 📞 需要帮助？

如果遇到问题：

1. 查看错误信息
2. 使用 `git status` 检查状态
3. 参考本文档的"常见问题解决"部分
4. 搜索错误信息
5. 联系技术支持

---

## 🔗 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助文档](https://docs.github.com/)
- [Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

祝您上传顺利！🎉
