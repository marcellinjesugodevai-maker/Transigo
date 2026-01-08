import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private subscriptionsService: SubscriptionsService) { }

    @Get('plans')
    getPlans() {
        return this.subscriptionsService.getPlans();
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('current')
    async getCurrentSubscription(@Req() req: any) {
        return this.subscriptionsService.getCurrentSubscription(req.user.id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('subscribe')
    async subscribe(@Req() req: any, @Body() body: { planId: string }) {
        return this.subscriptionsService.subscribe(req.user.id, body.planId as any);
    }
}
