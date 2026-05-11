@echo off
echo ========================================
echo  RhinoMarket - Local Development Setup
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Check your network connection.
    exit /b 1
)

echo [2/5] Setting up SQLite database...
copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy schema file.
    exit /b 1
)

echo [3/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed.
    exit /b 1
)

echo [4/5] Pushing database schema...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Database push failed.
    exit /b 1
)

echo [5/5] Seeding test data...
call npx tsx prisma/seed.ts
if %errorlevel% neq 0 (
    echo ERROR: Seed failed.
    exit /b 1
)

echo.
echo ========================================
echo  Setup complete!
echo.
echo  Run 'npm run dev' to start the server
echo  Visit http://localhost:3000
echo.
echo  Test accounts:
echo    Admin:    admin@rhinomarket.com / admin123456
echo    Designer: designer@example.com / designer123456
echo    Buyer:    buyer@example.com / buyer123456
echo ========================================
pause
