import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import supabase from '../../config/supabase';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async register(data: { email?: string; phone: string; password: string; firstName: string; lastName: string; role: 'passenger' | 'driver' }): Promise<any> {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                first_name: data.firstName,
                last_name: data.lastName,
                role: data.role,
                is_verified: false,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    async login(phone: string, password: string): Promise<any> {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error || !user) throw new UnauthorizedException('Utilisateur non trouvé');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Mot de passe incorrect');

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    async sendOtp(phone: string): Promise<any> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await supabase.from('otps').upsert({
            phone,
            code: otp,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        });

        // TODO: Send SMS via Twilio or Orange API
        console.log(`OTP for ${phone}: ${otp}`);
        return { message: 'OTP envoyé' };
    }

    async verifyOtp(phone: string, code: string): Promise<any> {
        const { data: otp } = await supabase
            .from('otps')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (!otp) throw new UnauthorizedException('Code invalide ou expiré');

        await supabase.from('users').update({ is_verified: true }).eq('phone', phone);
        await supabase.from('otps').delete().eq('phone', phone);

        const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    private generateToken(user: any) {
        return this.jwtService.sign({ sub: user.id, role: user.role });
    }

    private sanitizeUser(user: any) {
        const { password, ...safe } = user;
        return safe;
    }
}
