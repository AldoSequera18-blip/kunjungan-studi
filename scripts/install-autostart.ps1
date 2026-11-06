$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$launcher = Join-Path $PSScriptRoot 'start-local.ps1'
$taskName = 'Kunjungan Studi Web'
$powershell = Join-Path $PSHOME 'powershell.exe'
$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`"" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Menjalankan situs Kunjungan Studi setelah login Windows.' -Force | Out-Null
Write-Host "Tugas '$taskName' terpasang. Situs akan berjalan setelah login Windows; buka http://localhost:3000."
Write-Host 'Pastikan komputer tetap menyala dan terhubung internet agar situs/database bisa diakses.'
