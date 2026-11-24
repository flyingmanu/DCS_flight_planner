# Etape 0 - reconnaissance LECTURE SEULE. N'ecrit, n'installe, ne modifie rien.
# Usage : powershell -ExecutionPolicy Bypass -File tools\detect_env.ps1 > env_report.txt
$ErrorActionPreference = 'SilentlyContinue'
function Section($t) { "`n=== $t ===" }

Section 'Saved Games'
# Dossier connu "Saved Games" (peut avoir ete deplace par l'utilisateur)
$sg = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders').'{4C5C32FF-BB9D-43b0-B5B4-2D72E54EAAA4}'
if (-not $sg) { $sg = Join-Path $env:USERPROFILE 'Saved Games' }
$sg = [Environment]::ExpandEnvironmentVariables($sg)
"SavedGames = $sg"
$writedirs = Get-ChildItem $sg -Directory | Where-Object Name -like 'DCS*'
foreach ($d in $writedirs) {
  "`n-- $($d.FullName)  (modifie: $($d.LastWriteTime))"
  foreach ($p in 'Scripts\DCS-gRPC\version.lua','Scripts\DCS-gRPC\grpc-mission.lua','Scripts\Hooks\DCS-gRPC.lua',
                 'Mods\Tech\DCS-gRPC','Config\dcs-grpc.lua','Logs\dcs.log','Logs\grpc.log') {
    $f = Join-Path $d.FullName $p
    "{0,-40} {1}" -f $p, (Test-Path $f)
  }
  $v = Join-Path $d.FullName 'Scripts\DCS-gRPC\version.lua'
  if (Test-Path $v) { 'version.lua: ' + (Get-Content $v -Raw).Trim() }
  $c = Join-Path $d.FullName 'Config\dcs-grpc.lua'
  if (Test-Path $c) { 'dcs-grpc.lua (cles seulement, valeurs auth masquees):'; Get-Content $c | ForEach-Object { $_ -replace '(token\s*=\s*)".*?"','$1"***"' } }
  $log = Join-Path $d.FullName 'Logs\dcs.log'
  if (Test-Path $log) { 'dcs.log lignes GRPC (20 dernieres):'; Select-String -Path $log -Pattern 'GRPC' | Select-Object -Last 20 | ForEach-Object Line }
}

Section 'Installation DCS'
$inst = @()
foreach ($k in 'HKCU:\Software\Eagle Dynamics\DCS World','HKCU:\Software\Eagle Dynamics\DCS World OpenBeta') {
  $p = (Get-ItemProperty $k).Path; if ($p) { "$k -> $p"; $inst += $p }
}
$inst += 'C:\Program Files\Eagle Dynamics\DCS World','C:\Program Files\Eagle Dynamics\DCS World OpenBeta'
foreach ($i in ($inst | Select-Object -Unique)) {
  if (-not (Test-Path $i)) { continue }
  "`n-- $i"
  $au = Join-Path $i 'autoupdate.cfg'
  if (Test-Path $au) { Select-String -Path $au -Pattern '"version"|"branch"' | ForEach-Object Line }
  $ms = Join-Path $i 'Scripts\MissionScripting.lua'
  if (Test-Path $ms) {
    "MissionScripting.lua modifie: $((Get-Item $ms).LastWriteTime)"
    Get-Content $ms | Select-String -Pattern 'dofile|sanitizeModule|require|loadlib|package' | ForEach-Object { '  ' + $_.Line.Trim() }
  }
  Get-ChildItem (Join-Path $i 'Mods\aircraft') -Directory | Select-Object -ExpandProperty Name | ForEach-Object { "  module: $_" }
  Get-ChildItem (Join-Path $i 'Mods\terrains') -Directory | Select-Object -ExpandProperty Name | ForEach-Object { "  terrain: $_" }
}

Section 'Outils'
foreach ($t in 'python','py','uv','git') { $c = Get-Command $t; if ($c) { "$t -> $($c.Source)"; & $t --version 2>&1 | Select-Object -First 1 } else { "$t -> absent" } }

Section 'Port 50051 (DCS-gRPC par defaut)'
Get-NetTCPConnection -LocalPort 50051 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize | Out-String
