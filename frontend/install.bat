@echo off
echo Installing Construction Site Manager Frontend...
echo.

echo Step 1: Installing dependencies...
npm install

echo.
echo Step 2: Starting development server...
echo Frontend will be available at: http://localhost:3001
echo Backend API should be running at: http://localhost:3000
echo.
echo Default login credentials:
echo Username: admin
echo Password: admin123
echo.

npm run dev

pause