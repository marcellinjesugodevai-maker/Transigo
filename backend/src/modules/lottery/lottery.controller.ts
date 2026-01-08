import { Controller, Get, Post, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LotteryService } from './lottery.service';

@ApiTags('Lottery')
@Controller('lottery')
export class LotteryController {
    constructor(private lotteryService: LotteryService) { }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('tickets')
    async getTickets(@Req() req: any) {
        return this.lotteryService.getTickets(req.user.id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('play')
    async playLottery(@Req() req: any) {
        return this.lotteryService.playLottery(req.user.id);
    }

    @Get('winners')
    async getWinners(@Query('limit') limit?: number) {
        return this.lotteryService.getWinners(limit);
    }
}
