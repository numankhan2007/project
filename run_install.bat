@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d d:\ANTIGRAVITY-CODE\project
echo === Node Version ===
node --version
echo === NPM Version ===
npm --version
echo === Installing Dependencies ===
npm install
echo === Done ===
