# Script to push changes to GitHub
# Run this when you have internet connection

Write-Host "Pushing changes to GitHub..." -ForegroundColor Cyan

# Navigate to repository directory
Set-Location "c:\Users\Anderson\Desktop\brandeduk live catalogue"

# Push to GitHub
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to push. Please check your internet connection." -ForegroundColor Red
    Write-Host "Your changes are safely committed locally." -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
