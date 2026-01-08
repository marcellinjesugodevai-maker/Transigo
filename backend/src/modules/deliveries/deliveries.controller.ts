import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeliveriesService } from './deliveries.service';

@ApiTags('Deliveries')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('deliveries')
export class DeliveriesController {
    constructor(private deliveriesService: DeliveriesService) { }

    @Get('calculate-price')
    calculatePrice(@Query('size') size: 'small' | 'medium' | 'large', @Query('distance') distance: number) {
        return { price: this.deliveriesService.calculatePrice(size, distance) };
    }

    @Post()
    async createDelivery(@Req() req: any, @Body() body: any) {
        return this.deliveriesService.createDelivery({ ...body, senderId: req.user.id });
    }

    @Get()
    async getMyDeliveries(@Req() req: any) {
        return this.deliveriesService.getMyDeliveries(req.user.id);
    }
}
