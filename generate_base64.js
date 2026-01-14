const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, 'apps/driver/app/onboarding/welcome.png');
const outputPath = path.join(__dirname, 'apps/driver/app/onboarding/welcomeAsset.ts');

try {
    const bitmap = fs.readFileSync(imagePath);
    const base64 = Buffer.from(bitmap).toString('base64');
    const content = `export const WelcomeImage = "data:image/png;base64,${base64}";`;

    fs.writeFileSync(outputPath, content);
    console.log('Successfully generated welcomeAsset.ts');
} catch (e) {
    console.error('Error:', e);
}
