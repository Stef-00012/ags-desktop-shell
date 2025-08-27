#!/usr/bin/env zsh

source ~/.zshrc

agsProdPath="$HOME/dots/homes/stef/programs/widgets/ags/config"
currentPath=$(pwd)

cp -r "$currentPath/bar" "$agsProdPath"
cp -r "$currentPath/constants" "$agsProdPath"
cp -r "$currentPath/icons" "$agsProdPath"
cp -r "$currentPath/launcher" "$agsProdPath"
cp -r "$currentPath/notifications" "$agsProdPath"
cp -r "$currentPath/osd" "$agsProdPath"
cp -r "$currentPath/sessionMenu" "$agsProdPath"
cp -r "$currentPath/types" "$agsProdPath"
cp -r "$currentPath/util" "$agsProdPath"
cp -r "$currentPath/app.tsx" "$agsProdPath"
cp -r "$currentPath/style.scss" "$agsProdPath"
cp -r "$currentPath/tsconfig.json" "$agsProdPath"

cd "$HOME/dots" || exit 1
git add .
cd - || exit 1

fr

ags quit -i desktop-shell || echo "ags is not running"
ags run & disown