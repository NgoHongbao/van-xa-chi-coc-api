param(
  [string]$MongoUri = $env:MONGODB_URI,
  [string]$Database = $(if ($env:MONGODB_DB) { $env:MONGODB_DB } else { "guild_manager" })
)

$ErrorActionPreference = "Stop"

if (-not $MongoUri) {
  Write-Error "Thiếu MONGODB_URI. Ví dụ: `$env:MONGODB_URI='mongodb+srv://USER:PASSWORD@cluster/...'")
  exit 1
}

$ImportDir = Join-Path $PSScriptRoot "import"
$Collections = @(
  @{ Name = "factions"; File = "factions.json" },
  @{ Name = "roles"; File = "roles.json" },
  @{ Name = "members"; File = "members.json" },
  @{ Name = "legions"; File = "legions.json" },
  @{ Name = "parties"; File = "parties.json" },
  @{ Name = "globalNotes"; File = "globalNotes.json" }
)

foreach ($Item in $Collections) {
  $FilePath = Join-Path $ImportDir $Item.File
  Write-Host "Import $($Item.Name) <- $FilePath"
  & mongoimport --uri $MongoUri --db $Database --collection $Item.Name --file $FilePath --jsonArray --drop
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Hoàn tất import MongoDB database '$Database'."
