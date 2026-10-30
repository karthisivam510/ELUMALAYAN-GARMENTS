@echo off
title MUSE ATELIER — Clothing Store Server
cls
echo =======================================================
echo         MUSE ATELIER - PREMIUM CLOTHING STORE
echo =======================================================
echo.
echo Launching server on http://localhost:8000 ...
echo Public Storefront:  http://localhost:8000
echo Private Admin:      http://localhost:8000/admin.html
echo Admin Credentials:  admin / muse2026!
echo.
echo Press Ctrl+C in this terminal window to stop the server.
echo =======================================================
echo.

python server.py 8000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python was not found in PATH or failed to launch.
    echo Opening index.html directly in your default browser...
    start index.html
)
pause
