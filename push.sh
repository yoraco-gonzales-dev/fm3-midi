#!/usr/bin/env bash
# PUSH only to remote yoraco-gonzales-dev

comment="$1"

if [ "-h" == "$1" ]||[ "--help" == "$1" ]||[ "help" == "$1" ]||[ "-help" == "$1" ]||[ "h" == "$1" ];then
	echo "Git status, add, commit and push at once"
	echo ""
	echo "Usage: push.sh [comment]"
	echo "Options:"
	echo "	comment		Optional commit comment."
	echo "			Default comment is 'update'"
fi

if [ -z "$comment" ];then
	comment="update"
fi

echo "Comment: $comment"
SCRIPT_DIR=$( cd -- "$(dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)
cd "${SCRIPT_DIR}"
git status . ; git add . ; git commit -m "$comment" 

git push --set-upstream origin main
cd -