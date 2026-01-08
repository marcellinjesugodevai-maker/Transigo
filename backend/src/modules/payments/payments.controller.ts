import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentsController {
    constructor(private paymentsService: PaymentsService) { }

    @Get('balance')
    async getBalance(@Req() req: any) {
        return this.paymentsService.getBalance(req.user.id);
    }

    @Post('topup')
    async topUp(@Req() req: any, @Body() body: { amount: number; method: 'orange_money' | 'mtn_money' | 'wave' | 'card' }) {
        return this.paymentsService.topUp(req.user.id, body.amount, body.method);
    }

    @Post('withdraw')
    async withdraw(@Req() req: any, @Body() body: { amount: number; phone: string; method: 'orange_money' | 'mtn_money' | 'wave' }) {
        return this.paymentsService.withdraw(req.user.id, body.amount, body.phone, body.method);
    }

    @Get('transactions')
    async getTransactions(@Req() req: any, @Query('limit') limit?: number) {
        return this.paymentsService.getTransactions(req.user.id, limit);
    }
}
