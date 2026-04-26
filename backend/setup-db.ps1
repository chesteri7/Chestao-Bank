# Script PowerShell para executar migrations com senha
# Este arquivo executa o SQL automaticamente

$PgBin = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
$DbUser = "postgres"
$DbPassword = "8240"
$DbName = "sistema_chestao"
$DbHost = "localhost"
$MigrationFile = Join-Path $PSScriptRoot "migrations\001-schema-inicial.sql"

# Configurar variável de ambiente para a senha
$env:PGPASSWORD = $DbPassword

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Executando Migrations - PostgreSQL    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Banco de dados: $DbName" -ForegroundColor Yellow
Write-Host "Usuário: $DbUser" -ForegroundColor Yellow
Write-Host "Host: $DbHost" -ForegroundColor Yellow
Write-Host ""

try {
    # Executar o script SQL
    & $PgBin -U $DbUser -h $DbHost -d $DbName -f $MigrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  ✓ Sucesso!                            ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "✓ Schema criado com sucesso!" -ForegroundColor Green
        Write-Host "✓ Tabelas: usuarios, clientes, emprestimos, parcelas, historico_pagamentos" -ForegroundColor Green
        Write-Host "✓ Índices e triggers criados" -ForegroundColor Green
        Write-Host "✓ Banco de dados pronto para usar!" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ✗ Erro!                              ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Red
}

# Limpar variável de senha
if ($env:PGPASSWORD) { Remove-Item Env:\PGPASSWORD }

Write-Host ""
Read-Host "Pressione ENTER para fechar"
