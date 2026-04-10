#!/bin/bash

# 一键推送脚本
# 自动添加所有更改、提交并推送到GitHub

echo "🚀 开始推送项目到GitHub..."

# 添加所有更改
git add -A

# 检查是否有更改需要提交
if git diff-index --quiet HEAD --; then
    echo "📭 没有更改需要提交"
else
    # 生成提交信息（包含时间和日期）
    COMMIT_MSG="自动提交: $(date '+%Y-%m-%d %H:%M:%S')"

    # 提交更改
    git commit -m "$COMMIT_MSG"

    if [ $? -eq 0 ]; then
        echo "✅ 提交成功: $COMMIT_MSG"
    else
        echo "❌ 提交失败"
        exit 1
    fi
fi

# 推送到远程仓库
echo "📤 正在推送到GitHub..."
git push

if [ $? -eq 0 ]; then
    echo "🎉 推送成功！"
    echo "🔗 仓库地址: https://github.com/Macie18/lawbor"
else
    echo "❌ 推送失败，请检查网络或权限"
    exit 1
fi