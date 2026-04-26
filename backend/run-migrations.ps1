# Script PowerShell para executar migrations
# Salve este arquivo como: run-migrations.ps1

$PgBin = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
$DbHost = "localhost"
$DbUser = "postgres"
$DbName = "sistema_chestao"
$MigrationFile = ".\migrations\001-schema-inicial.sql"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Executando migrations do banco de dados" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Executar migrations
$process = Start-Process -FilePath $PgBin `
    -ArgumentList "-h $DbHost -U $DbUser -d $DbName -f `"$MigrationFile`"" `
    -NoNewWindow `
    -Wait `
    -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "✓ Migrations executadas com sucesso!" -ForegroundColor Green
    Write-Host "✓ Banco de dados pronto para usar!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Erro ao executar migrations" -ForegroundColor Red
    Write-Host "Código de erro: $($process.ExitCode)" -ForegroundColor Red
}

Read-Host "Pressione ENTER para fechar"
