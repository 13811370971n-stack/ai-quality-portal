<#
  AI Quality Portal - 启动脚本
  
  使用方式 (在项目根目录运行):
    .\start.ps1           # 启动后端 + 前端
    .\start.ps1 -backend  # 仅启动后端
    .\start.ps1 -frontend # 仅启动前端
  
  前置条件:
    - Python 3.10+ (已安装)
    - pip install -r backend\requirements.txt (首次)
    - npm install (首次，在 frontend 目录)
#>
param(
    [switch]$backend,
    [switch]$frontend
)

$NodePath = "C:\Users\elizimi\.nodejs\node-v20.16.0-win-x64"
$env:PATH = "$NodePath;$env:PATH"
$ProjectRoot = $PSScriptRoot

# If neither flag is set, start both
if (-not $backend -and -not $frontend) {
    $backend = $true
    $frontend = $true
}

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkCyan
Write-Host "   AI Quality Portal - Starting...     " -ForegroundColor White
Write-Host "========================================" -ForegroundColor DarkCyan
Write-Host ""

if ($backend) {
    Write-Host "[Backend] Starting FastAPI..." -ForegroundColor Cyan
    $backendProc = Start-Process -FilePath "python" `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000" `
        -WorkingDirectory "$ProjectRoot\backend" `
        -PassThru
    Write-Host "[Backend] PID: $($backendProc.Id)" -ForegroundColor DarkGray
    Write-Host "[Backend] API:  http://localhost:8000" -ForegroundColor Green
    Write-Host "[Backend] Docs: http://localhost:8000/docs" -ForegroundColor Green
    Write-Host ""
}

if ($frontend) {
    Write-Host "[Frontend] Starting Next.js..." -ForegroundColor Cyan
    Write-Host "[Frontend] First compile may take 1-2 minutes on this machine" -ForegroundColor Yellow
    $frontendProc = Start-Process -FilePath "$NodePath\npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory "$ProjectRoot\frontend" `
        -PassThru
    Write-Host "[Frontend] PID: $($frontendProc.Id)" -ForegroundColor DarkGray
    Write-Host "[Frontend] URL: http://localhost:3000" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Services started. Open browser to http://localhost:3000" -ForegroundColor White
Write-Host "To stop: close this window or run: Get-Process python,node | Stop-Process" -ForegroundColor DarkGray
Write-Host ""

# Keep script alive
if ($backend -or $frontend) {
    Write-Host "Press Ctrl+C to stop all services." -ForegroundColor DarkGray
    try { while ($true) { Start-Sleep -Seconds 60 } }
    finally {
        if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
        if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
}
