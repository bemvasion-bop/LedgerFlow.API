@echo off
REM =====================================================
REM Quick Migration Runner for Windows
REM =====================================================
REM This script applies the Notifications + Settings migration
REM using sqlcmd command-line tool
REM =====================================================

echo ========================================
echo SPENDSYNC NOTIFICATIONS MIGRATION
echo ========================================
echo.

REM Check if sqlcmd is available
where sqlcmd >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: sqlcmd not found!
    echo.
    echo Please install SQL Server Command Line Utilities:
    echo https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility
    echo.
    echo OR use SQL Server Management Studio to run the migration manually.
    echo.
    pause
    exit /b 1
)

echo sqlcmd found: OK
echo.

REM Set connection details
set SERVER=localhost
set DATABASE=SpendSyncDB

echo Connection Details:
echo   Server: %SERVER%
echo   Database: %DATABASE%
echo.

REM Prompt for confirmation
set /p CONFIRM="Apply migration? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo Applying migration...
echo ========================================
echo.

REM Run migration
sqlcmd -S %SERVER% -d %DATABASE% -E -i ADD_NOTIFICATIONS_AND_SETTINGS.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo MIGRATION COMPLETED
    echo ========================================
    echo.
    echo Running verification...
    echo.
    sqlcmd -S %SERVER% -d %DATABASE% -E -i VERIFY_NOTIFICATIONS_MIGRATION.sql
    echo.
    echo ========================================
    echo DONE
    echo ========================================
) else (
    echo.
    echo ========================================
    echo MIGRATION FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo You may need to run the migration manually in SSMS.
)

echo.
pause
