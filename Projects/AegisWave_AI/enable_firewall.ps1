Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private
netsh advfirewall firewall add rule name="AegisWave AI Port 5000" dir=in action=allow protocol=TCP localport=5000
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] AegisWave AI Mobile / Wi-Fi Access is Enabled!" -ForegroundColor Green
Write-Host " - Wi-Fi profile set to: Private Network (allows LAN devices)" -ForegroundColor Yellow
Write-Host " - Inbound Firewall Rule: Port 5000 Allowed" -ForegroundColor Yellow
Write-Host " Mobile URL: http://192.168.10.2:5000" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 4
