param([string]$In, [int]$Step = 1100)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $In))
$base = [System.IO.Path]::ChangeExtension((Resolve-Path $In).Path, $null).TrimEnd('.')
$i = 0
for ($y = 0; $y -lt $img.Height; $y += $Step) {
  $h = [Math]::Min($Step, $img.Height - $y)
  $bmp = New-Object System.Drawing.Bitmap $img.Width, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $img.Width, $h), (New-Object System.Drawing.Rectangle 0, $y, $img.Width, $h), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $bmp.Save("$base-$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $i++
}
$img.Dispose()
"$i slices"
