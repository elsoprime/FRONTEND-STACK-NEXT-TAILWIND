param(
  [string]$BackendRepoPath
)

$ErrorActionPreference = "Stop"

$frontendRepoPath = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($BackendRepoPath)) {
  $workspaceRoot = Split-Path -Parent $frontendRepoPath
  $BackendRepoPath = Join-Path $workspaceRoot "API-REST-STACK-NODE"
}

$backendOpenApiPath = Join-Path $BackendRepoPath "openapi"
$frontendOpenApiPath = Join-Path $frontendRepoPath "openapi"

if (-not (Test-Path $backendOpenApiPath)) {
  throw "No se encontro OpenAPI en backend: $backendOpenApiPath"
}

if (Test-Path $frontendOpenApiPath) {
  Remove-Item -Recurse -Force $frontendOpenApiPath
}

New-Item -ItemType Directory -Path $frontendOpenApiPath -Force | Out-Null
Copy-Item -Path (Join-Path $backendOpenApiPath "*") -Destination $frontendOpenApiPath -Recurse -Force

Write-Host "OpenAPI sincronizado desde: $backendOpenApiPath"
Write-Host "OpenAPI actualizado en: $frontendOpenApiPath"
