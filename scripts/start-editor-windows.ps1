param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$editorUrl = 'http://127.0.0.1:3210'
$distribution = 'Ubuntu-26.04'
$linuxProject = '/home/gaia2/projects/character-video-studio'

function Test-EditorReady {
    $request = [System.Net.HttpWebRequest]::Create("$editorUrl/api/project")
    $request.Proxy = $null
    $request.Timeout = 2000
    $response = $null
    $reader = $null
    try {
        $response = $request.GetResponse()
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $state = $reader.ReadToEnd() | ConvertFrom-Json
        if (-not $state.revision -or -not $state.project.beats) {
            throw 'Port 3210 is occupied by a different application.'
        }
        return $true
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $_.Exception.Response.Close()
            throw 'Port 3210 is occupied by a different application.'
        }
        return $false
    } finally {
        if ($reader) { $reader.Dispose() }
        if ($response) { $response.Close() }
    }
}

try {
    if (-not (Test-EditorReady)) {
        Write-Host 'Starting Knowledge Anime Editor...'
        $serverCommand = "`$Host.UI.RawUI.WindowTitle = 'Knowledge Anime Editor Server'; & '$env:SystemRoot\System32\wsl.exe' --distribution '$distribution' --cd '$linuxProject' --exec bash -ic 'npm run editor'"
        $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($serverCommand))
        $arguments = "-NoProfile -NoExit -EncodedCommand $encodedCommand"
        $serverProcess = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList $arguments -PassThru
        $deadline = (Get-Date).AddSeconds(120)
        $ready = $false
        while ((Get-Date) -lt $deadline) {
            if (Test-EditorReady) { $ready = $true; break }
            if ($serverProcess.HasExited) { throw 'The editor stopped during startup. Check the server window.' }
            Start-Sleep -Milliseconds 500
        }
        if (-not $ready) { throw 'Startup timed out. Check the server window.' }
    }
    Write-Host "Editor ready: $editorUrl"
    if (-not $NoBrowser) { Start-Process $editorUrl }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Manual start: wsl -d $distribution --cd $linuxProject --exec bash -ic `"npm run editor`""
    if (-not $NoBrowser) { Read-Host 'Press Enter to close' | Out-Null }
    exit 1
}
