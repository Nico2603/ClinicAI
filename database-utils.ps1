# Utilidades para Base de Datos Supabase
# =====================================

# Cargar variables de entorno
$env:SUPABASE_DB_PASSWORD = "sAZvq9?+mUNXVay"
$connectionString = "postgresql://postgres:$($env:SUPABASE_DB_PASSWORD)@db.ouinponhxvgjikreuunp.supabase.co:5432/postgres"

Write-Host "🗄️  Utilidades de Base de Datos Supabase" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

function Show-DatabaseInfo {
    Write-Host "📊 Información de la Base de Datos:" -ForegroundColor Cyan
    Write-Host "   Host: db.ouinponhxvgjikreuunp.supabase.co"
    Write-Host "   Puerto: 5432"
    Write-Host "   Base de datos: postgres"
    Write-Host "   Usuario: postgres"
    Write-Host ""
}

function Connect-Database {
    Write-Host "🔌 Conectando a la base de datos..." -ForegroundColor Yellow
    psql $connectionString
}

function Execute-SqlFile {
    param([string]$fileName)
    if (Test-Path $fileName) {
        Write-Host "📄 Ejecutando archivo: $fileName" -ForegroundColor Yellow
        psql $connectionString -f $fileName
        Write-Host "✅ Archivo ejecutado correctamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Archivo no encontrado: $fileName" -ForegroundColor Red
    }
}

function Show-Tables {
    Write-Host "📋 Mostrando tablas de la base de datos..." -ForegroundColor Yellow
    $query = "\dt public.*"
    echo $query | psql $connectionString
}

function Show-Users {
    Write-Host "👥 Mostrando usuarios registrados..." -ForegroundColor Yellow
    $query = "SELECT id, email, name, created_at FROM public.users ORDER BY created_at DESC LIMIT 10;"
    echo $query | psql $connectionString
}

function Show-Notes {
    Write-Host "📝 Mostrando últimas notas..." -ForegroundColor Yellow
    $query = "SELECT n.title, u.email, n.created_at FROM public.notes n JOIN public.users u ON n.user_id = u.id ORDER BY n.created_at DESC LIMIT 5;"
    echo $query | psql $connectionString
}

# Menú principal
Write-Host "Comandos disponibles:"
Write-Host "1. Show-DatabaseInfo  - Mostrar información de conexión"
Write-Host "2. Connect-Database   - Conectar directamente a psql"
Write-Host "3. Execute-SqlFile    - Ejecutar archivo SQL"
Write-Host "4. Show-Tables        - Listar todas las tablas"
Write-Host "5. Show-Users         - Mostrar usuarios registrados"
Write-Host "6. Show-Notes         - Mostrar últimas notas"
Write-Host ""
Write-Host "Ejemplo de uso:"
Write-Host "  . .\database-utils.ps1"
Write-Host "  Show-Tables"
Write-Host "  Execute-SqlFile 'mi-script.sql'"
Write-Host "" 