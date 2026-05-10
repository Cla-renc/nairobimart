$ErrorActionPreference = "Stop"

Write-Host "Configuring MongoDB Replica Set..."
$ConfigPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"

# Check if file is accessible
if (-not (Test-Path $ConfigPath)) {
    Write-Host "Error: Could not find $ConfigPath" -ForegroundColor Red
    exit
}

$ConfigContent = Get-Content $ConfigPath -Raw
if ($ConfigContent -notmatch "replSetName") {
    Add-Content -Path $ConfigPath -Value "`nreplication:`n  replSetName: `"rs0`""
    Write-Host "Added replication config to $ConfigPath" -ForegroundColor Green
} else {
    Write-Host "Replication already configured in $ConfigPath" -ForegroundColor Yellow
}

Write-Host "Restarting MongoDB service..." -ForegroundColor Cyan
Restart-Service MongoDB

Write-Host "Waiting 5 seconds for MongoDB to start..."
Start-Sleep -Seconds 5

Write-Host "Initializing replica set..." -ForegroundColor Cyan
mongosh --eval "rs.initiate()"

Write-Host "Setup complete!" -ForegroundColor Green
