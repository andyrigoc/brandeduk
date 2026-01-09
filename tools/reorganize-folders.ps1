# ============================================================
# FOLDER REORGANIZATION SCRIPT
# Renames folders to English names and cleans up structure
# ============================================================
# 
# INSTRUCTIONS:
# 1. Close VS Code completely
# 2. Open PowerShell as Administrator
# 3. Navigate to this folder: cd "c:\Users\info\Desktop\Versione8.7\tools"
# 4. Run: .\reorganize-folders.ps1
# ============================================================

$projectRoot = "c:\Users\info\Desktop\Versione8.7"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FOLDER REORGANIZATION - brandeduk.com" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Define renames: OldName -> NewName
$renames = @(
    @{ Old = "Assets Customization"; New = "design-assets" },
    @{ Old = "barra prodotti"; New = "product-bar-demo" },
    @{ Old = "design-assets\HI Viz"; New = "design-assets\hi-viz" },
    @{ Old = "design-assets\Hoodie"; New = "design-assets\hoodie" },
    @{ Old = "mobile\test-base-faqs"; New = "mobile\faq-demo" },
    @{ Old = "mobile\3d-social-icon-buttons"; New = "mobile\social-buttons" },
    @{ Old = "mobile\get-in-touch-form"; New = "mobile\contact-form" }
)

foreach ($item in $renames) {
    $oldPath = Join-Path $projectRoot $item.Old
    $newName = Split-Path $item.New -Leaf
    
    if (Test-Path $oldPath) {
        try {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "[OK] " -ForegroundColor Green -NoNewline
            Write-Host "$($item.Old) -> $($item.New)"
        }
        catch {
            Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
            Write-Host "$($item.Old) - $($_.Exception.Message)"
        }
    }
    else {
        Write-Host "[SKIP] " -ForegroundColor Yellow -NoNewline
        Write-Host "$($item.Old) (not found or already renamed)"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  REORGANIZATION COMPLETE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEW STRUCTURE:" -ForegroundColor White
Write-Host ""
Write-Host "  brandedukv15-child/    <- WordPress child theme (READY)" -ForegroundColor Green
Write-Host "  design-assets/         <- Customization design files" -ForegroundColor White
Write-Host "  mobile/                <- Mobile prototypes" -ForegroundColor White
Write-Host "  product-bar-demo/      <- Product bar demo" -ForegroundColor White
Write-Host "  hero/                  <- Hero section assets" -ForegroundColor White
Write-Host "  tools/                 <- Build/export tools" -ForegroundColor White
Write-Host "  dist/                  <- Distribution ZIPs" -ForegroundColor White
Write-Host ""
Write-Host "  *.html files           <- Desktop prototypes" -ForegroundColor DarkGray
Write-Host ""
