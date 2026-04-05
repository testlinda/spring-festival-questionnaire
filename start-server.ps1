# 春節賀卡系統 - 本地測試伺服器啟動腳本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  春節賀卡系統 - 本地測試伺服器" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在啟動本地伺服器..." -ForegroundColor Green
Write-Host ""
Write-Host "伺服器啟動後，請在瀏覽器訪問：" -ForegroundColor White
Write-Host "  - 首頁:       " -NoNewline; Write-Host "http://localhost:8000/index.html" -ForegroundColor Green
Write-Host "  - 編輯頁:     " -NoNewline; Write-Host "http://localhost:8000/edit.html" -ForegroundColor Green
Write-Host "  - 結果頁:     " -NoNewline; Write-Host "http://localhost:8000/result.html" -ForegroundColor Green
Write-Host "  - 測試頁:     " -NoNewline; Write-Host "http://localhost:8000/test-phase2.html" -ForegroundColor Green
Write-Host "  - 管理後台:   " -NoNewline; Write-Host "http://localhost:8000/admin.html" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 可以停止伺服器" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 嘗試使用 Python 啟動伺服器
try {
    python -m http.server 8000
} catch {
    Write-Host "❌ 找不到 Python，請安裝 Python 3" -ForegroundColor Red
    Write-Host "   下載位置: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或者使用其他方式啟動伺服器：" -ForegroundColor White
    Write-Host "  1. VS Code Live Server 擴充功能" -ForegroundColor Cyan
    Write-Host "  2. Node.js http-server: npm install -g http-server" -ForegroundColor Cyan
    Write-Host ""
    pause
}
