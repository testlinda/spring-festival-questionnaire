@echo off
chcp 65001 >nul
echo ========================================
echo   春節賀卡系統 - 本地測試伺服器
echo ========================================
echo.
echo 正在啟動本地伺服器...
echo.
echo 伺服器啟動後，請在瀏覽器訪問：
echo   - 首頁: http://localhost:8000/index.html
echo   - 測試頁: http://localhost:8000/test-phase2.html
echo   - 管理後台: http://localhost:8000/admin.html
echo.
echo 按 Ctrl+C 可以停止伺服器
echo ========================================
echo.

python -m http.server 8000
