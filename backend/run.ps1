<#
run.ps1 - Helper to activate venv, install requirements if missing, and run uvicorn

Usage (PowerShell):
.\run.ps1

This will:
- Activate .venv if present
- Temporarily relax execution policy for this session if needed
- Install requirements if uvicorn is missing
- Run the server via `python -m uvicorn main:app --reload`
#>

param(
    [int]$Port = 8000
)

Write-Host "Starting backend helper..."

# If .venv exists, try to activate it
$venvPath = Join-Path $PSScriptRoot '.venv'
if (Test-Path $venvPath) {
    Write-Host "Found venv at $venvPath. Activating..."
    # Temporary allow script execution in this session (safe)
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
    } catch {
        Write-Warning "Could not change execution policy: $_"
    }
    $activate = Join-Path $venvPath 'Scripts\Activate.ps1'
    if (Test-Path $activate) {
        . $activate
    } else {
        Write-Warning "Activate script not found at $activate"
    }
} else {
    Write-Host ".venv not found. Running with system Python. Consider creating a venv: python -m venv .venv"
}

# Ensure uvicorn is installed; if not, try to install from requirements
function Ensure-Uvicorn {
    try {
        $uv = python -c "import uvicorn; print('ok')" 2>&1
        if ($uv -match 'ok') { return $true }
    } catch {
        Write-Host "uvicorn not importable. Installing requirements..."
        if (Test-Path (Join-Path $PSScriptRoot 'requirements.txt')) {
            pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
        } else {
            pip install uvicorn[standard]
        }
    }
    return $true
}

Ensure-Uvicorn

Write-Host "Running server on port $Port (use Ctrl+C to stop)"
python -m uvicorn main:app --host 0.0.0.0 --port $Port --reload
