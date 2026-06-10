Add-Type -AssemblyName System.Drawing

$path = Join-Path $PSScriptRoot "_lime.jpg"
if (-not (Test-Path $path)) {
    Write-Error "Scarica prima tests/_lime.jpg"
    exit 1
}

function Get-HslFromRgb([int]$r, [int]$g, [int]$b) {
    $rn = $r / 255.0
    $gn = $g / 255.0
    $bn = $b / 255.0
    $max = [Math]::Max($rn, [Math]::Max($gn, $bn))
    $min = [Math]::Min($rn, [Math]::Min($gn, $bn))
    $delta = $max - $min
    $l = ($max + $min) / 2.0
    $s = 0.0
    if ($delta -ne 0) {
        $s = $delta / (1.0 - [Math]::Abs(2.0 * $l - 1.0))
    }
    return @{ s = $s * 100.0; l = $l * 100.0 }
}

$bmp = [System.Drawing.Bitmap]::FromFile($path)
$w = $bmp.Width
$h = $bmp.Height
$sumR = 0.0
$sumG = 0.0
$sumB = 0.0
$weightTotal = 0.0
$sample = 24

for ($sy = 0; $sy -lt $sample; $sy++) {
    for ($sx = 0; $sx -lt $sample; $sx++) {
        $x = [int][Math]::Floor(($sx / $sample) * $w)
        $y = [int][Math]::Floor(($sy / $sample) * $h)
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -lt 140) { continue }
        $hsl = Get-HslFromRgb $c.R $c.G $c.B
        if ($hsl.l -lt 6 -or $hsl.l -gt 95) { continue }
        $satWeight = 0.45 + [Math]::Min(1.0, $hsl.s / 100.0)
        $lightWeight = if ($hsl.l -gt 82) { 0.5 } else { 1.0 }
        $weight = $satWeight * $lightWeight
        $sumR += $c.R * $weight
        $sumG += $c.G * $weight
        $sumB += $c.B * $weight
        $weightTotal += $weight
    }
}

$bmp.Dispose()

if ($weightTotal -le 0) {
    Write-Error "Campionamento fallito"
    exit 1
}

$avgR = [int][Math]::Round($sumR / $weightTotal)
$avgG = [int][Math]::Round($sumG / $weightTotal)
$avgB = [int][Math]::Round($sumB / $weightTotal)
$hex = "#{0:x2}{1:x2}{2:x2}" -f $avgR, $avgG, $avgB

$ok = ($avgG -gt 90) -and ($avgG -gt $avgR) -and ($avgG -gt $avgB)

Write-Host "=== Campionamento dietro le quinte (GD002 Lime) ==="
Write-Host "Hex campionato: $hex"
Write-Host "Verde Lime plausibile: $(if ($ok) { 'SI' } else { 'NO' })"
Write-Host "Front utente: left-chest.png (PNG neutro, NON questo JPG)"

if (-not $ok) { exit 1 }
