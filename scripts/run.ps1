$ErrorActionPreference = 'Stop'
$index = Join-Path $PSScriptRoot '..\web\index.html'
$index = (Resolve-Path $index).Path
Start-Process $index
Write-Host 'FocusBoard opened in your default browser. Your tasks are saved in that browser.'
