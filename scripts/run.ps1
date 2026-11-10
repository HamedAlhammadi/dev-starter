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

# In Windows PowerShell 5.1, native stderr is treated as an error record when
# ErrorActionPreference is Stop. Redirect java -version stderr to a file first.
$versionFile = [System.IO.Path]::GetTempFileName()
try {
    & java -version 2> $versionFile
    $versionOutput = Get-Content -Raw $versionFile
} finally {
    Remove-Item -Force -ErrorAction SilentlyContinue $versionFile
}

$versionMatch = [regex]::Match($versionOutput, 'version "(?<version>[^"]+)"')
if (-not $versionMatch.Success) {
    Write-Error 'Could not determine the Java version. Install Java 17 or newer and check your PATH.'
    exit 1
}
$versionString = $versionMatch.Groups['version'].Value
if ($versionString -match '^1\.(?<legacyMajor>\d+)') {
    $javaVersion = [int]$Matches['legacyMajor']
} elseif ($versionString -match '^(?<major>\d+)') {
    $javaVersion = [int]$Matches['major']
} else {
    Write-Error "Could not parse Java version '$versionString'. Install Java 17 or newer."
    exit 1
}
if ($javaVersion -lt 17) {
    Write-Error "Java 17 or newer is required (found Java $versionString). Install a JDK 17+ and make sure its bin folder comes first on PATH."
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
