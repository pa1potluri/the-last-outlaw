@echo off
setlocal
cd /d "%~dp0"
python --version >nul 2>&1
if not errorlevel 1 (
  python "%~dp0launch_game.py"
  goto :finished
)
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0launch_game.py"
  goto :finished
)
echo Python 3 is required. Install Python 3, then run this launcher again.
pause
exit /b 1
:finished
if errorlevel 1 pause

