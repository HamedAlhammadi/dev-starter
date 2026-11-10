param(
    [Parameter(Position = 0)]
    [ValidateRange(1, 65535)]
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source = Join-Path $root 'src\main\java\dev\focusboard\FocusBoardServer.java'
$build = Join-Path $root 'build'
$data = Join-Path $root 'data'

$java = Get-Command java -ErrorAction SilentlyContinue
$javac = Get-Command javac -ErrorAction SilentlyContinue
if (-not $java -or -not $javac) {
    Write-Error 'Java 17 or newer (including the JDK and javac) is required and must be on PATH.'
    exit 1
}

$versionOutput = (& java -version 2>&1 | Out-String)
if ($versionOutput -notmatch 'version "(?<version>\d+)') {
    Write-Error 'Could not determine the Java version.'
    exit 1
}
$javaVersion = [int]$Matches['version']
if ($javaVersion -lt 17) {
    Write-Error "Java 17 or newer is required (found Java $javaVersion)."
    exit 1
}

New-Item -ItemType Directory -Force -Path $build, $data | Out-Null
& javac --release 17 -d $build $source
if ($LASTEXITCODE -ne 0) {
    throw 'Java compilation failed.'
}

Write-Host "FocusBoard is starting at http://127.0.0.1:$Port"
& java "-Dfocusboard.root=$root" -cp $build 'dev.focusboard.FocusBoardServer' "$Port"
exit $LASTEXITCODE
