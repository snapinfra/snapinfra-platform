# Start Snapinfra Backend Server
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Starting Snapinfra Backend Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
$backendDir = "C:\Users\Manoj Maheshwar JG\OneDrive\Desktop\Vibe Projects\Snapinfra\backend"
Set-Location $backendDir

Write-Host "📂 Working Directory: $backendDir" -ForegroundColor Yellow
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file NOT found!" -ForegroundColor Red
    Write-Host "  Please create .env file from .env.example" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host ""

# Start the backend
npm run dev
