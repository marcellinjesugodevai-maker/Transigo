$rootDir = "c:\Users\User\Desktop\TransiGo V01\apps\driver"
$files = Get-ChildItem -Path $rootDir -Filter *.png -Recurse

foreach ($fileItem in $files) {
    $file = $fileItem.FullName
    try {
        $bytes = Get-Content $file -Encoding Byte -TotalCount 4
        $header = [BitConverter]::ToString($bytes)
        $status = if ($header -eq "89-50-4E-47") { "VALID" } else { "INVALID ($header)" }
        Write-Host "[$status] $($fileItem.FullName)"
    } catch {
        Write-Host "[ERROR] $($fileItem.FullName)"
    }
}
