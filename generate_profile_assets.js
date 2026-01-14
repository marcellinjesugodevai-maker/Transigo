const fs = require('fs');
const path = require('path');

// Chemins des artefacts validés
const images = {
    DriverImage: "C:/Users/User/.gemini/antigravity/brain/35bf110f-0677-48ae-8b05-1cf9563f762e/profile_driver_v6_1768323564153.png",
    DeliveryImage: "C:/Users/User/.gemini/antigravity/brain/35bf110f-0677-48ae-8b05-1cf9563f762e/profile_delivery_v4_1768323356712.png",
    SellerImage: "C:/Users/User/.gemini/antigravity/brain/35bf110f-0677-48ae-8b05-1cf9563f762e/profile_seller_v6_1768323579214.png"
};

const outputPath = path.join(__dirname, 'apps/driver/app/onboarding/profileAssets.ts');

let fileContent = '';

try {
    for (const [key, imagePath] of Object.entries(images)) {
        if (fs.existsSync(imagePath)) {
            const bitmap = fs.readFileSync(imagePath);
            const base64 = Buffer.from(bitmap).toString('base64');
            fileContent += `export const ${key} = "data:image/png;base64,${base64}";\n`;
            console.log(`Converted ${key}`);
        } else {
            console.error(`File not found: ${imagePath}`);
        }
    }

    fs.writeFileSync(outputPath, fileContent);
    console.log('Successfully generated profileAssets.ts');
} catch (e) {
    console.error('Error:', e);
}
