$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot 'node_modules/next'))) {
  throw 'Dependensi belum terpasang. Jalankan npm install di folder proyek.'
}
if (-not (Test-Path (Join-Path $projectRoot '.env.local'))) {
  throw 'File .env.local belum ada. Salin .env.example dan atur DATABASE_URL.'
}

npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build gagal. Periksa pesan error di atas.' }
npm run start
