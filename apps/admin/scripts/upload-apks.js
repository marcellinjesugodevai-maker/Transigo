// Script temporaire pour uploader les APK vers Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://zndgvloyaitopczhjddq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZGd2bG95YWl0b3BjemhqZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTc1MDgsImV4cCI6MjA4MzEzMzUwOH0.KTHGtMaaWW_GhXacarRN40iqlFUp2KPirp_5peHWBls';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAPK(localPath, storagePath) {
    console.log(`Uploading ${localPath} to ${storagePath}...`);

    const fileBuffer = fs.readFileSync(localPath);

    const { data, error } = await supabase.storage
        .from('apks')
        .upload(storagePath, fileBuffer, {
            contentType: 'application/vnd.android.package-archive',
            upsert: true
        });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('apks')
        .getPublicUrl(storagePath);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
}

async function main() {
    // Upload both APKs
    const passengerPath = path.join(__dirname, '..', '..', '..', 'Downloads', 'TRANSI GO  New.apk');
    const businessPath = path.join(__dirname, '..', '..', '..', 'Downloads', 'TRANSI GO BUSINESS New.apk');

    console.log('Passenger APK path:', passengerPath);
    console.log('Business APK path:', businessPath);

    const passengerUrl = await uploadAPK(passengerPath, 'transigo-passenger-v1-1.apk');
    const businessUrl = await uploadAPK(businessPath, 'transigo-business-v1-1.apk');

    console.log('\n=== URLS TO USE IN download/page.tsx ===');
    console.log('Passenger:', passengerUrl);
    console.log('Business:', businessUrl);
}

main().catch(console.error);
