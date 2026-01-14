import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client with Service Role Key
// This bypasses RLS and allows Auth management
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Delete from Auth (This is the critical step that requires Service Role)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // 2. Delete from Database (Drivers table)
        // Since we have ON DELETE CASCADE usually, deleting Auth might trigger this,
        // but explicit deletion ensures everything is clean.
        const { error: dbError } = await supabaseAdmin
            .from('drivers')
            .delete()
            .eq('id', userId);

        if (dbError) {
            console.error('Error deleting driver record:', dbError);
            // We don't fail here because Auth deletion was successful, effectively banning the user
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
