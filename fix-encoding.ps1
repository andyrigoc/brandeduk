# Fix encoding issues in home-pc.html
$file = "home-pc.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Replace malformed UTF-8 sequences with HTML entities
# Right arrow (→) = E2 86 92 in UTF-8, often displayed as â†'
$content = $content.Replace("â†'","&rarr;")

# Em dash (—) = E2 80 94 in UTF-8, often displayed as â€"
$content = $content.Replace("â€"","&mdash;")

# Bullet (•) = E2 80 A2 in UTF-8, often displayed as â€¢
$content = $content.Replace("â€¢","&bull;")

# Registered (®) = C2 AE in UTF-8, often displayed as Â®
$content = $content.Replace("Â®","&reg;")

# Degree (°) = C2 B0 in UTF-8, often displayed as Â°
$content = $content.Replace("Â°","&deg;")

# Write back to file
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText($file, $content, $Utf8NoBomEncoding)

Write-Host "Fixed encoding issues in $file"
