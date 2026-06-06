@echo off
:: ============================================================
:: RLHF Weekly Retraining - Windows Task Scheduler Setup
:: ============================================================
:: This script registers a Windows Scheduled Task that runs
:: retrain_scheduler.py every Sunday at 2:00 AM automatically.
::
:: HOW TO USE:
::   1. Open Command Prompt as Administrator
::   2. Navigate to this directory
::   3. Run: setup_windows_scheduler.bat
:: ============================================================

echo.
echo  ==========================================
echo   RLHF Auto-Retraining — Windows Setup
echo  ==========================================
echo.

:: Get the directory where this script lives
SET SCRIPT_DIR=%~dp0
SET SCHEDULER_SCRIPT=%SCRIPT_DIR%retrain_scheduler.py

:: Find Python executable
FOR /F "tokens=*" %%i IN ('where python') DO SET PYTHON_EXE=%%i
IF "%PYTHON_EXE%"=="" (
    echo [ERROR] Python not found in PATH. Please install Python or add it to PATH.
    pause
    exit /b 1
)

echo  [INFO] Python found at: %PYTHON_EXE%
echo  [INFO] Scheduler script: %SCHEDULER_SCRIPT%
echo.

:: Delete existing task if it exists (clean re-registration)
SCHTASKS /DELETE /TN "StrayRescue_RLHF_Retraining" /F >NUL 2>&1

:: Create the scheduled task
:: Runs every Sunday at 02:00 AM
SCHTASKS /CREATE ^
    /TN "StrayRescue_RLHF_Retraining" ^
    /TR "\"%PYTHON_EXE%\" \"%SCHEDULER_SCRIPT%\" --min-samples 5" ^
    /SC WEEKLY ^
    /D SUN ^
    /ST 02:00 ^
    /RL HIGHEST ^
    /F

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo  ==========================================
    echo   SUCCESS! Scheduled Task Registered.
    echo  ==========================================
    echo.
    echo   Task Name   : StrayRescue_RLHF_Retraining
    echo   Runs        : Every Sunday at 2:00 AM
    echo   Script      : %SCHEDULER_SCRIPT%
    echo   Min Samples : 5 RLHF corrections needed
    echo.
    echo  To view the task:
    echo    schtasks /query /tn "StrayRescue_RLHF_Retraining"
    echo.
    echo  To run it manually right now:
    echo    schtasks /run /tn "StrayRescue_RLHF_Retraining"
    echo.
    echo  To remove the task:
    echo    schtasks /delete /tn "StrayRescue_RLHF_Retraining" /f
    echo.
) ELSE (
    echo.
    echo  [ERROR] Failed to create scheduled task.
    echo  Please run this script as Administrator!
    echo.
)

pause
