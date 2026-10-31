param()
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$destination=Join-Path $projectRoot '.tools/postgres'
if (Test-Path (Join-Path $destination 'package/native/bin/postgres.exe')) { Write-Output 'Portable PostgreSQL already installed.'; exit 0 }
# Transport package is beta-labelled; the payload is the stable PostgreSQL 18.6 server.
# Only the native payload is used. No embedded-postgres JS dependency is installed.
$metadata=Invoke-RestMethod -Uri 'https://registry.npmjs.org/@embedded-postgres/windows-x64/18.6.0-beta.19'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$archive=Join-Path $destination 'payload.tgz'
Invoke-WebRequest -Uri $metadata.dist.tarball -OutFile $archive
$hasher=[Security.Cryptography.SHA512]::Create()
try { $checksum=[Convert]::ToBase64String($hasher.ComputeHash([IO.File]::ReadAllBytes($archive))) } finally { $hasher.Dispose() }
if ('sha512-'+$checksum -ne $metadata.dist.integrity) { throw 'PostgreSQL payload integrity mismatch' }
tar -xzf $archive -C $destination
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL extraction failed' }
& (Join-Path $destination 'package/native/bin/postgres.exe') --version
