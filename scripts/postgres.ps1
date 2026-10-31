param([ValidateSet('start','stop','status')][string]$Action='start')
$ErrorActionPreference='Stop'
function New-LocalPassword {
 $bytes=New-Object byte[] 24
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
 try { $rng.GetBytes($bytes); return [BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant() } finally { $rng.Dispose() }
}
$projectRoot=Split-Path $PSScriptRoot -Parent
$toolsRoot=Join-Path $projectRoot '.tools/postgres'
$bin=Join-Path $toolsRoot 'package/native/bin'
$data=Join-Path $toolsRoot 'data'
$log=Join-Path $toolsRoot 'server.log'
if (!(Test-Path (Join-Path $bin 'postgres.exe'))) { throw 'Portable PostgreSQL is not installed. See doc/DATABASE.md (or use Docker Compose).' }
if ($Action -eq 'stop') { & (Join-Path $bin 'pg_ctl.exe') -D $data stop -m fast; exit $LASTEXITCODE }
if ($Action -eq 'status') { & (Join-Path $bin 'pg_ctl.exe') -D $data status; exit $LASTEXITCODE }
if (!(Test-Path (Join-Path $data 'PG_VERSION'))) {
  $credentialsPath=Join-Path $projectRoot '.tools/local-db.json'
  if (Test-Path $credentialsPath) { throw 'Credentials exist but cluster is missing; inspect before reinitializing.' }
  $credentials=@{ admin=(New-LocalPassword); owner=(New-LocalPassword); app=(New-LocalPassword) }
  $credentials | ConvertTo-Json | Set-Content -LiteralPath $credentialsPath
  $passwordFile=Join-Path $toolsRoot 'init-password.txt'
  $credentials.admin | Set-Content -LiteralPath $passwordFile -NoNewline
  try { & (Join-Path $bin 'initdb.exe') -D $data -U digishop_admin --pwfile=$passwordFile -A scram-sha-256 --encoding=UTF8 --locale=C; if ($LASTEXITCODE -ne 0) { throw 'initdb failed' } }
  finally { Remove-Item -LiteralPath $passwordFile -Force }
}
& (Join-Path $bin 'pg_ctl.exe') -D $data status *> $null
if ($LASTEXITCODE -eq 0) { Write-Output 'Project PostgreSQL is already running.'; exit 0 }
& (Join-Path $bin 'pg_ctl.exe') -D $data -l $log -o '-h 127.0.0.1 -p 55432' -w start
exit $LASTEXITCODE
