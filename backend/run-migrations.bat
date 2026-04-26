@echo off
REM Script para executar migrations do PostgreSQL
REM Certifique-se que PGPASSWORD está configurado antes de rodar

cd /d "C:\Users\chest\OneDrive\Documentos\Projetos de Programação\Sistema Chestão\backend"

echo Executando script SQL...
echo.

REM Digite sua senha do postgres quando solicitado
"C:\Program Files\PostgreSQL\13\bin\psql.exe" -U postgres -d sistema_chestao -f migrations/001-schema-inicial.sql

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo ✓ Script executado com sucesso!
    echo ===================================
) else (
    echo.
    echo ===================================
    echo ✗ Erro ao executar script
    echo ===================================
)

pause
