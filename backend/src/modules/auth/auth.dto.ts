import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: '+2250701020304' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Kofi' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Asante' })
    @IsString()
    lastName: string;

    @ApiProperty({ enum: ['passenger', 'driver'] })
    @IsEnum(['passenger', 'driver'])
    role: 'passenger' | 'driver';
}

export class LoginDto {
    @ApiProperty({ example: '+2250701020304' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    password: string;
}

export class SendOtpDto {
    @ApiProperty({ example: '+2250701020304' })
    @IsString()
    phone: string;
}

export class VerifyOtpDto {
    @ApiProperty({ example: '+2250701020304' })
    @IsString()
    phone: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    code: string;
}
