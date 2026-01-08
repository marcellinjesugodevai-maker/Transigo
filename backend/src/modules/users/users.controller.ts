import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    async getProfile(@Req() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @Patch('me')
    async updateProfile(@Req() req: any, @Body() data: any) {
        return this.usersService.update(req.user.id, data);
    }

    @Get('wallet')
    async getWallet(@Req() req: any) {
        return this.usersService.getWallet(req.user.id);
    }

    @Patch('location')
    async updateLocation(@Req() req: any, @Body() body: { latitude: number; longitude: number }) {
        return this.usersService.updateLocation(req.user.id, body.latitude, body.longitude);
    }
}
