@echo off
REM ============================================
REM VulnScan - One Command Scan & Report
REM Usage: scan.bat example.com quick|deep
REM ============================================
set DOMAIN=%1
set TIER=%2
if "%DOMAIN%"=="" (echo Usage: scan.bat domain.com quick/deep && exit /b 1)
if "%TIER%"=="" set TIER=deep

echo.
echo  ==============================
echo   VulnScan - Scanning %DOMAIN%
echo   Tier: %TIER%
echo  ==============================
echo.

set TOOLS=C:\Users\User\Documents\claude\scanforge\tools
set BACKEND=C:\Users\User\Documents\claude\scanforge\backend

if "%TIER%"=="quick" (
    python "%BACKEND%\report_generator.py" %DOMAIN% --tier quick
) else (
    python "%BACKEND%\report_generator.py" %DOMAIN% --tier deep
)
