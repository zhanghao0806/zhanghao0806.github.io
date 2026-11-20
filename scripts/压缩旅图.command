#!/bin/zsh
set -eu

project_scripts="/Users/zhanghao/code/personal-homepage/scripts"
photos_dir=${0:a:h}

# 从项目里打开时选择相册，复制到相册后直接使用脚本所在目录。
if [[ "$photos_dir" == "$project_scripts" ]]; then
  photos_dir=$(/usr/bin/osascript <<'APPLESCRIPT'
set albums to (POSIX path of (path to home folder)) & "MyFile/07-旅图/"
try
    set selectedFolder to choose folder with prompt "选择要压缩的文章照片文件夹" default location (POSIX file albums as alias)
    return POSIX path of selectedFolder
on error number -128
    return ""
end try
APPLESCRIPT
  )
  [[ -n "$photos_dir" ]] || exit 0
fi

# Finder 启动的终端也能找到 Homebrew 安装的 Node.js。
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
exec node "$project_scripts/prepare-travel-photos.mjs" "$photos_dir" --numbered
