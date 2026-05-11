@echo off
echo Switching to PostgreSQL schema...
echo.
echo Make sure you have:
echo   1. PostgreSQL running (Docker or local install)
echo   2. Updated DATABASE_URL in .env to PostgreSQL connection string
echo.

copy /Y prisma\schema.prisma prisma\schema.sqlite.prisma.bak
echo Creating PostgreSQL schema from template...

echo generator client {
echo   provider = "prisma-client-js"
echo } > prisma\schema.prisma
echo. >> prisma\schema.prisma
echo datasource db {
echo   provider = "postgresql"
echo   url      = env("DATABASE_URL")
echo } >> prisma\schema.prisma
echo. >> prisma\schema.prisma
type prisma\schema.prisma

echo.
echo Schema file updated to PostgreSQL.
echo Run: npx prisma generate && npx prisma db push
pause
