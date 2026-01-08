import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';

@ApiTags('Rides')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('rides')
export class RidesController {
    constructor(private ridesService: RidesService) { }

    @Get('calculate-price')
    async calculatePrice(
        @Query('distance') distance: number,
        @Query('type') type: 'car' | 'car_ac' | 'moto',
        @Query('student') student?: boolean,
        @Query('shared') shared?: boolean,
    ) {
        const price = await this.ridesService.calculatePrice(distance, type, student, shared);
        return { price };
    }

    @Post('request')
    async requestRide(@Req() req: any, @Body() body: any) {
        return this.ridesService.requestRide({ ...body, passengerId: req.user.id });
    }

    @Patch(':id/accept')
    async acceptRide(@Req() req: any, @Param('id') id: string, @Body() body: { finalPrice: number; commissionRate: number }) {
        return this.ridesService.acceptRide(id, req.user.id, body.finalPrice, body.commissionRate);
    }

    @Patch(':id/start')
    async startRide(@Req() req: any, @Param('id') id: string) {
        return this.ridesService.startRide(id, req.user.id);
    }

    @Patch(':id/complete')
    async completeRide(@Req() req: any, @Param('id') id: string) {
        return this.ridesService.completeRide(id, req.user.id);
    }

    @Patch(':id/cancel')
    async cancelRide(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
        return this.ridesService.cancelRide(id, req.user.id, body.reason);
    }

    @Get('active')
    async getActiveRide(@Req() req: any) {
        return this.ridesService.getActiveRide(req.user.id);
    }

    @Get('history')
    async getHistory(@Req() req: any, @Query('limit') limit?: number) {
        return this.ridesService.getHistory(req.user.id, req.user.role, limit);
    }
}
