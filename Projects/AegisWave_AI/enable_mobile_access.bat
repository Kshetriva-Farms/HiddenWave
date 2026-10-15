@echo off
:: Self-elevate to Administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Running as Administrator
title AegisWave AI - Mobile Access Enabler
color 0b
echo ====================================================================
echo        AegisWave AI - Mobile Phone / Wi-Fi Access Enabler
echo ====================================================================
echo.
echo [1/2] Setting Wi-Fi profile from Public to Private...
powershell -Command "Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private"

echo.
echo [2/2] Allowing Port 5000 in Windows Defender Firewall...
netsh advfirewall firewall add rule name="AegisWave AI Port 5000" dir=in action=allow protocol=TCP localport=5000

echo.
echo ====================================================================
echo  [SUCCESS] Mobile access is now unlocked!
echo.
echo  Your phone can now open:
echo  http://192.168.10.2:5000
echo ====================================================================
echo.
pause
