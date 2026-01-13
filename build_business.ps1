$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$env:EAS_NO_VCS = "1"
Write-Host "--- Démarrage de l'installation des dépendances ---"
cd apps/driver
& "C:\Program Files\nodejs\npm.cmd" install
Write-Host "--- Démarrage du build EAS ---"
& "C:\Users\User\AppData\Roaming\npm\eas.cmd" build --platform android --profile preview --non-interactive
