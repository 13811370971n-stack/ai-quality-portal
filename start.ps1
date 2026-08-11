<#
  AI Quality Portal - 启动脚本
  
  使用方式 (在项目根目录运行):
    .\start.ps1              # 启动全部 (后端 + 教练 + 前端)
    .\start.ps1 -backend     # 仅启动 FastAPI 后端
    .\start.ps1 -coach       # 仅启动 AI 教练后端
    .\start.ps1 -frontend    # 仅启动 Next.js 前端
  
  服务端口:
    8001  - FastAPI (工具/方法论 API)
    5000  - Six Sigma Coach (Glean AI)
    3000  - Next.js 前端
#>
param(
    [switch]$backend,
    [switch]$coach,
    [switch]$frontend
)

$NodePath = "C:\Users\elizimi\.nodejs\node-v20.16.0-win-x64"
$env:PATH = "$NodePath;$env:PATH"
$ProjectRoot = $PSScriptRoot

# If no flags set, start all
if (-not $backend -and -not $coach -and -not $frontend) {
    $backend = $true
    $coach = $true
    $frontend = $true
}

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkCyan
Write-Host "   AI Quality Portal - Starting...     " -ForegroundColor White
Write-Host "========================================" -ForegroundColor DarkCyan
Write-Host ""

if ($backend) {
    Write-Host "[Backend] Starting FastAPI on port 8001..." -ForegroundColor Cyan
    $backendProc = Start-Process -FilePath "python" `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8001" `
        -WorkingDirectory "$ProjectRoot\backend" `
        -PassThru
    Write-Host "[Backend] PID: $($backendProc.Id)" -ForegroundColor DarkGray
    Write-Host "[Backend] API:  http://localhost:8001/docs" -ForegroundColor Green
    Write-Host ""
}

if ($coach) {
    Write-Host "[Coach] Starting Six Sigma Coach on port 5000..." -ForegroundColor Cyan
    $coachProc = Start-Process -FilePath "python" `
        -ArgumentList "$ProjectRoot\backend\start_coach.py" `
        -PassThru
    Write-Host "[Coach] PID: $($coachProc.Id)" -ForegroundColor DarkGray
    Write-Host "[Coach] API:  http://localhost:5000/api/health" -ForegroundColor Green
    Write-Host ""
}

if ($frontend) {
    Write-Host "[Frontend] Starting Next.js on port 3000..." -ForegroundColor Cyan
    Write-Host "[Frontend] First compile may take ~60s on this machine" -ForegroundColor Yellow
    $frontendProc = Start-Process -FilePath "$NodePath\npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory "$ProjectRoot\frontend" `
        -PassThru
    Write-Host "[Frontend] PID: $($frontendProc.Id)" -ForegroundColor DarkGray
    Write-Host "[Frontend] URL: http://localhost:3000" -ForegroundColor Green
    Write-Host ""
}

Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host "  Portal:     http://localhost:3000" -ForegroundColor White
Write-Host "  Coach:      http://localhost:3000/coach" -ForegroundColor White
Write-Host "  API Docs:   http://localhost:8001/docs" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor DarkGray

# Keep alive
try { while ($true) { Start-Sleep -Seconds 60 } }
finally {
    if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
    if ($coachProc) { Stop-Process -Id $coachProc.Id -Force -ErrorAction SilentlyContinue }
    if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
}
