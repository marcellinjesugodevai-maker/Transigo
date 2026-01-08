import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Connexion' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto.phone, dto.password);
    }

    @Post('send-otp')
    @HttpCode(200)
    @ApiOperation({ summary: 'Envoyer un code OTP' })
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto.phone);
    }

    @Post('verify-otp')
    @HttpCode(200)
    @ApiOperation({ summary: 'Vérifier le code OTP' })
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto.phone, dto.code);
    }
}
