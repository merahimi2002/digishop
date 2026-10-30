param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PnpmArguments
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$localNode = Join-Path $projectRoot '.tools\node\node.exe'
$localPnpm = Join-Path $projectRoot '.tools\pnpm\package\pnpm.exe'
if (-not (Test-Path -LiteralPath $localNode) -or -not (Test-Path -LiteralPath $localPnpm)) {
  throw 'Run node scripts/bootstrap-tools.mjs first, or use the pinned Node and pnpm versions installed on your system.'
}
$previousPath = $env:PATH
try {
  $env:PATH = (Split-Path -Parent $localNode) + ';' + (Split-Path -Parent $localPnpm) + ';' + $previousPath
  Push-Location -LiteralPath $projectRoot
  try { & $localPnpm @PnpmArguments; $commandExit = $LASTEXITCODE }
  finally { Pop-Location }
}
finally { $env:PATH = $previousPath }
exit $commandExit
