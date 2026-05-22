# =====================================================
# SPENDSYNC REGISTRATION FIX SCRIPT
# =====================================================
# This script fixes the "Invalid plan selected" error
# by resetting the database and reseeding plans
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPENDSYNC REGISTRATION FIX SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
if (-not (Test-Path "LedgerFlow.API.csproj")) {
    Write-Host "ERROR: Please run this script from the LedgerFlow.API directory" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Checking environment..." -ForegroundColor Yellow
Write-Host "✓ Found LedgerFlow.API.csproj" -ForegroundColor Green
Write-Host ""

# Step 2: Drop database
Write-Host "[2/4] Dropping existing database..." -ForegroundColor Yellow
$dropResult = dotnet ef database drop --force 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database dropped successfully" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Could not drop database (it may not exist)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Apply migrations
Write-Host "[3/4] Applying migrations..." -ForegroundColor Yellow
$migrateResult = dotnet ef database update 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migrations applied successfully" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: Failed to apply migrations" -ForegroundColor Red
    Write-Host $migrateResult
    exit 1
}
Write-Host ""

# Step 4: Build and verify
Write-Host "[4/4] Building project..." -ForegroundColor Yellow
$buildResult = dotnet build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ FIX COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Start the backend:" -ForegroundColor White
Write-Host "   dotnet run" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Watch for these logs:" -ForegroundColor White
Write-Host "   'Seeding SaaS Subscription Plans...'" -ForegroundColor Yellow
Write-Host "   'SaaS Subscription Plans seeded successfully'" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Test registration at:" -ForegroundColor White
Write-Host "   http://localhost:3001/register-company?plan=starter&billing=quarterly" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Test all 4 scenarios:" -ForegroundColor White
Write-Host "   ✓ Starter + Quarterly (₱1,499)" -ForegroundColor Gray
Write-Host "   ✓ Starter + Yearly (₱5,499)" -ForegroundColor Gray
Write-Host "   ✓ Business + Quarterly (₱6,999)" -ForegroundColor Gray
Write-Host "   ✓ Business + Yearly (₱24,999)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Need help? Check REGISTRATION_FIX_FINAL.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
