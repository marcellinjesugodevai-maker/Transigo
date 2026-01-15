Add-Type -AssemblyName System.Drawing
$rootDir = (Get-Location).Path
Write-Host "Starting deep scan of $rootDir..."

# Find all PNG files recursively
$pngFiles = Get-ChildItem -Path $rootDir -Filter *.png -Recurse

foreach ($fileItem in $pngFiles) {
    $file = $fileItem.FullName
    try {
        # Check first 4 bytes for PEG signature
        $bytes = Get-Content $file -Encoding Byte -TotalCount 4
        $header = [BitConverter]::ToString($bytes)
        
        if ($header.StartsWith("FF-D8")) {
            Write-Host "[CRITICAL] Found malformed PNG (JPEG Header): $file"
            
            # Convert to legitimate PNG
            $img = [System.Drawing.Image]::FromFile($file)
            $tmp = $file + ".official.png"
            $img.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            
            # Replace old file
            Remove-Item $file -Force
            Rename-Item $tmp $fileItem.Name
            Write-Host "[SUCCESS] Fixed: $file"
        }
    } catch {
        Write-Host "[ERROR] Could not process $file"
    }
}
Write-Host "Scan complete."
