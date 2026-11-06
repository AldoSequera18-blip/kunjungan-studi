$ErrorActionPreference = 'Stop'
$taskName = 'Kunjungan Studi Web'
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "Tugas '$taskName' dihapus."
