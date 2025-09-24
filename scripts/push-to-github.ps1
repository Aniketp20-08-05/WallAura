<#
Simple helper: initialize repo (if needed), add remote, commit and push to GitHub.

Usage:
  - Open PowerShell in the project root: `cd C:\Users\Lenovo\Desktop\WallAura`
  - Run: `.\\scripts\\push-to-github.ps1` and follow prompts.

This script will prompt for the repository URL (e.g. https://github.com/you/WallAura.git).
It will not store or transmit credentials; Git will handle auth (SSH agent or username/password or PAT as configured).
#>

Param(
  [string]$RepoUrl
)

Set-StrictMode -Version Latest
Push-Location (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)\..\

function Exec($cmd){
  Write-Host "> $cmd"
  $p = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-Command","$cmd" -NoNewWindow -Wait -PassThru -WindowStyle Hidden
  return $p.ExitCode
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)){
  Write-Error "git is not installed or not in PATH. Install Git and try again."
  exit 1
}

if (-not (Test-Path .git)){
  Write-Host "Initializing git repository..."
  git init
} else { Write-Host "Git repository already initialized." }

if (-not $RepoUrl){
  $RepoUrl = Read-Host 'Enter GitHub repo url (e.g. https://github.com/you/WallAura.git)'
}

if (-not $RepoUrl){ Write-Error 'No repo url provided; aborting.'; exit 1 }

$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0){
  Write-Host "Remote 'origin' already exists. Updating URL to: $RepoUrl"
  git remote set-url origin $RepoUrl
} else {
  Write-Host "Adding remote origin: $RepoUrl"
  git remote add origin $RepoUrl
}

git add .
try { git commit -m "chore: initial commit for WallAura" } catch { Write-Host "Nothing to commit or commit failed; continuing." }

Write-Host "Creating/updating branch 'main' and pushing to origin..."
git branch -M main
git push -u origin main

if ($LASTEXITCODE -ne 0){
  Write-Error "Push failed. Check your credentials and remote URL, then try again."
  exit 2
}

Write-Host "Push succeeded. Visit your GitHub repository and check Actions -> Build and deploy to GitHub Pages." -ForegroundColor Green

Pop-Location
