import { Controller, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
    constructor(private driversService: DriversService) { }

    @Get('nearby')
    async findNearby(
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('radius') radius?: number,
        @Query('hasAC') hasAC?: boolean,
        @Query('isFemale') isFemale?: boolean,
    ) {
        return this.driversService.findNearby(lat, lng, radius, { hasAC, isFemale });
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('status')
    async setStatus(@Req() req: any, @Body() body: { isOnline: boolean }) {
        return this.driversService.setOnlineStatus(req.user.id, body.isOnline);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('location')
    async updateLocation(@Req() req: any, @Body() body: { latitude: number; longitude: number }) {
        return this.driversService.updateLocation(req.user.id, body.latitude, body.longitude);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('earnings')
    async getEarnings(@Req() req: any, @Query('period') period: 'day' | 'week' | 'month' = 'day') {
        return this.driversService.getEarnings(req.user.id, period);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('level')
    async getLevel(@Req() req: any) {
        return this.driversService.getLevel(req.user.id);
    }
}
