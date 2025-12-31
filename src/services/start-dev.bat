@echo off
echo ======================================
echo Starting BHIV Integration Environment
echo ======================================
echo.

echo Starting BHIV Core Mock Server...
start /B node scripts/mock_bhiv_server.cjs

echo Starting Frontend Development Server...
echo This will start on http://localhost:5173
echo.
npm run dev

echo.
echo Development environment started!
echo - Mock BHIV Core: http://localhost:3001
echo - Frontend Dev Server: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul