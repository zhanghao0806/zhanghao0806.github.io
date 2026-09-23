#!/bin/bash
# Double-click in Finder, or run ./publish.command from a terminal.
set -euo pipefail

# Finder-launched terminals may not include package-manager binaries.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="personal-homepage"
BRANCH="main"
ACTIONS_URL="https://github.com/zhanghao0806/zhanghao0806.github.io/actions/workflows/deploy.yml"
SITE_URL="https://zhanghao0806.github.io/"
LOCK_DIR=""

finish() {
  local result=$?
  trap - EXIT
  if [[ -n "$LOCK_DIR" ]]; then rmdir "$LOCK_DIR" 2>/dev/null || true; fi
  if [[ "$result" -ne 0 ]]; then
    printf '\n发布未完成，请查看上面的错误。修复后可以重新运行；已有本地提交会保留。\n'
  fi
  if [[ -t 0 && -t 1 ]]; then
    printf '\n按回车关闭窗口……'
    read -r _ || true
  fi
  exit "$result"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

fail() { printf '\n错误：%s\n' "$*" >&2; exit 1; }

cd "$PROJECT_DIR"
for tool in git node npm; do
  command -v "$tool" >/dev/null 2>&1 || fail "找不到 $tool，请先安装并确保终端可以运行它。"
done
[[ "$(git rev-parse --show-toplevel)" == "$PROJECT_DIR" ]] || fail '请将脚本放在项目仓库根目录。'
[[ "$(git branch --show-current)" == "$BRANCH" ]] || fail '请先切换到 main 分支再发布。'
git remote get-url "$REMOTE" >/dev/null || fail "找不到远程仓库 $REMOTE。"
[[ -z "$(git ls-files -u)" ]] || fail '请先解决 Git 合并冲突。'
for operation in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
  [[ ! -e "$(git rev-parse --git-path "$operation")" ]] || fail '请先完成正在进行的 Git 合并、变基或挑选提交操作。'
done

publish_lock="$(git rev-parse --git-path publish.lock)"
mkdir "$publish_lock" 2>/dev/null || fail '另一个发布脚本正在运行。如果上次被强制关闭，请确认没有发布任务后删除 .git/publish.lock 目录。'
LOCK_DIR="$publish_lock"

printf '\n[1/4] 检查远程更新……\n'
git fetch "$REMOTE" "$BRANCH"
git merge-base --is-ancestor FETCH_HEAD HEAD || fail "远程 main 有本地尚未包含的提交。请先同步远程改动并解决冲突，再重新发布。"

printf '\n[2/4] 构建并检查网站……\n'
if [[ ! -d node_modules ]]; then npm ci; fi
npm run build

printf '\n[3/4] 提交本地全部改动（遵循 .gitignore）……\n'
git add --all
if ! git diff --cached --quiet; then
  git commit -m "Publish website: $(date '+%Y-%m-%d %H:%M:%S %z')"
else
  printf '没有新的文件改动，继续检查是否存在尚未推送的提交。\n'
fi

printf '\n[4/4] 推送到远程 main……\n'
if [[ "$(git rev-parse HEAD)" == "$(git rev-parse FETCH_HEAD)" ]]; then
  printf '\n本地与远程一致，无需重复发布。\n'
else
  git push "$REMOTE" "HEAD:refs/heads/$BRANCH"
  printf '\n推送成功，GitHub Actions 将自动构建并更新网站。\n'
  printf '线上更新须等待部署任务成功；若失败，请在下面的链接查看日志。\n'
fi
printf '\n部署进度：%s\n网站地址：%s\n' "$ACTIONS_URL" "$SITE_URL"
