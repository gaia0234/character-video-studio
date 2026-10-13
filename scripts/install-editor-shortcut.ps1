$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'start-editor-windows.ps1'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Knowledge Anime Editor.lnk'
$powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $launcher
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
if ((Test-Path $shortcutPath) -and
    ($shortcut.TargetPath -ne $powershellPath -or $shortcut.Arguments -ne $arguments)) {
    throw "An unrelated shortcut already exists: $shortcutPath"
}
$shortcut.TargetPath = $powershellPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $env:USERPROFILE
$shortcut.Description = 'Start Knowledge Anime Editor and open the browser'
$shortcut.Save()
Write-Output "Created: $shortcutPath"
