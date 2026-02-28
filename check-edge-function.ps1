# Edge Function 배포 상태 확인 스크립트

Write-Host "=== Edge Function 배포 상태 확인 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Edge Function 파일 확인
Write-Host "1. Edge Function 파일 확인..." -ForegroundColor Yellow
$functionPath = "supabase\functions\chat-completion\index.ts"
if (Test-Path $functionPath) {
    Write-Host "   ✅ Edge Function 파일 존재: $functionPath" -ForegroundColor Green
    $fileSize = (Get-Item $functionPath).Length
    Write-Host "   파일 크기: $fileSize bytes" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Edge Function 파일 없음: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Supabase CLI 확인
Write-Host "2. Supabase CLI 확인..." -ForegroundColor Yellow
try {
    $cliVersion = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase CLI 설치됨: $cliVersion" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Supabase CLI 미설치" -ForegroundColor Red
        Write-Host "   설치 방법: npm install -g supabase" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Supabase CLI 미설치" -ForegroundColor Red
    Write-Host "   설치 방법: npm install -g supabase" -ForegroundColor Gray
}

Write-Host ""

# 3. .env 파일 확인
Write-Host "3. 환경변수 확인..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "   ✅ .env 파일 존재" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env 파일에 VITE_SUPABASE_URL 없음" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  .env 파일 없음" -ForegroundColor Yellow
}

Write-Host ""

# 4. 배포 상태 확인 안내
Write-Host "4. 배포 상태 확인 방법:" -ForegroundColor Yellow
Write-Host "   - Supabase 대시보드 접속: https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "   - Edge Functions 메뉴 이동" -ForegroundColor Gray
Write-Host "   - 'chat-completion' 함수가 목록에 있는지 확인" -ForegroundColor Gray
Write-Host "   - 상태가 'Active'인지 확인" -ForegroundColor Gray

Write-Host ""
Write-Host "=== 확인 완료 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Supabase 대시보드에서 Edge Function 배포" -ForegroundColor White
Write-Host "2. OPENAI_API_KEY Secret 설정" -ForegroundColor White
Write-Host "3. 브라우저 새로고침 후 테스트" -ForegroundColor White

