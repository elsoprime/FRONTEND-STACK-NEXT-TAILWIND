param(
  [switch]$KillNodeProcesses
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$targets = @(
  ".next",
  ".turbo",
  "tsconfig.tsbuildinfo"
)

if ($KillNodeProcesses) {
  $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

  if ($nodeProcesses) {
    Write-Host "[dev-clean] Stopping node processes to release file locks..."

    foreach ($process in $nodeProcesses) {
      try {
        Stop-Process -Id $process.Id -Force -ErrorAction Stop
      }
      catch {
        Write-Warning "[dev-clean] Could not stop node process $($process.Id): $($_.Exception.Message)"
      }
    }

    Start-Sleep -Milliseconds 400
  }
}

$failedPaths = @()

Write-Host "[dev-clean] Project root: $projectRoot"

foreach ($target in $targets) {
  $path = Join-Path $projectRoot $target

  if (-not (Test-Path $path)) {
    continue
  }

  Write-Host "[dev-clean] Removing $path"

  try {
    Remove-Item -Recurse -Force -ErrorAction Stop $path
  }
  catch {
    $failedPaths += $path
    Write-Warning "[dev-clean] Could not remove $path. Close running Next.js/node processes and retry. Error: $($_.Exception.Message)"
  }
}

if ($failedPaths.Count -gt 0) {
  Write-Error "[dev-clean] Cleanup incomplete. Locked paths: $($failedPaths -join ', ')"
  exit 1
}

Write-Host "[dev-clean] Cache cleanup complete."
