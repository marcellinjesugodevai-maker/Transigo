Add-Type -AssemblyName System.Drawing
$rootDir = "c:\Users\User\Desktop\TransiGo V01\apps\passenger"

Write-Host "Scanning $rootDir recursively for PNG files..."
Get-ChildItem -Path $rootDir -Filter *.png -Recurse | ForEach-Object {
    $file = $_.FullName
    $bytes = Get-Content $file -Encoding Byte -TotalCount 4
    $header = [BitConverter]::ToString($bytes)
    
    # JPEG header starts with FF-D8
    if ($header.StartsWith("FF-D8")) {
        Write-Host "Fixing invalid PNG (actually JPEG): $file"
        try {
            $img = [System.Drawing.Image]::FromFile($file)
            $tmp = $file + ".tmp.png"
            $img.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            Remove-Item $file
            Rename-Item $tmp $_.Name
            Write-Host "Successfully converted $file"
        } catch {
            Write-Host "Failed to convert $file : $_"
        }
    }
}
Write-Host "Scan completed."
