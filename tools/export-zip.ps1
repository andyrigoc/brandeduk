[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  # regular = "senza backup" (stesso set dello screenshot)
  # full    = include tutto il progetto (tranne .git)
  [ValidateSet('auto','regular','full')]
  [string]$Mode = 'auto',

  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$zipPath = Join-Path $env:USERPROFILE ("Desktop\brandeduk.com version {0}.zip" -f $Version)

$statePath = Join-Path $projectRoot '.export-state.json'

function Get-ExportState {
  if (!(Test-Path -LiteralPath $statePath)) {
    return @{ count = 0 }
  }
  try {
    return (Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json)
  } catch {
    # se il file è corrotto/non JSON, ripartiamo da 0
    return @{ count = 0 }
  }
}

function Save-ExportState([int]$count) {
  @{ count = $count; updatedAt = (Get-Date).ToString('s') } |
    ConvertTo-Json |
    Set-Content -LiteralPath $statePath -Encoding UTF8
}

$state = Get-ExportState
$newCount = [int]$state.count + 1

$effectiveMode = $Mode
if ($Mode -eq 'auto') {
  # ogni 10° export: full
  $effectiveMode = if (($newCount % 10) -eq 0) { 'full' } else { 'regular' }
}

# Cartelle sempre escluse (backup / repo metadata)
$alwaysExcludeNames = @(
  '.git',
  '_prototype-original'
)

# Set "senza backup" (coincide con quello che vedi nel tuo screenshot)
$regularFolderNames = @(
  '.github',
  '.vscode',
  'Assets Customization',
  'barra prodotti',
  'brandedukv15-child',
  'dist'
)

$includePaths = @()

if ($effectiveMode -eq 'regular') {
  foreach ($name in $regularFolderNames) {
    $p = Join-Path $projectRoot $name
    if (Test-Path -LiteralPath $p) {
      $includePaths += $p
    }
  }

  $includePaths += (Get-ChildItem -LiteralPath $projectRoot -Filter *.html -File | Select-Object -ExpandProperty FullName)
}

if ($effectiveMode -eq 'full') {
  # tutto il root, escluse cartelle di backup e .git
  $includePaths += (
    Get-ChildItem -LiteralPath $projectRoot -Force |
      Where-Object { $alwaysExcludeNames -notcontains $_.Name } |
      Select-Object -ExpandProperty FullName
  )
}

if ($includePaths.Count -eq 0) {
  throw "Nessun file/cartella da includere. Root: $projectRoot"
}

Write-Host "Export #$newCount ($effectiveMode) -> $zipPath"

if ($DryRun) {
  Write-Host "DRY RUN: non creo lo ZIP. Includerei:" 
  $includePaths | ForEach-Object { Write-Host " - $_" }
  exit 0
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path $includePaths -DestinationPath $zipPath -Force

Save-ExportState -count $newCount

Get-Item -LiteralPath $zipPath | Select-Object FullName, Length, LastWriteTime
