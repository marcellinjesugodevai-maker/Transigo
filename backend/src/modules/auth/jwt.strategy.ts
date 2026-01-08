import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import supabase from '../../config/supabase';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || 'transigo-secret-key',
        });
    }

    async validate(payload: { sub: string; role: string }) {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.sub)
            .single();

        if (!user) throw new UnauthorizedException();
        return user;
    }
}
