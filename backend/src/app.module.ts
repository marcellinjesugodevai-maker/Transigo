import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { RidesModule } from './modules/rides/rides.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LotteryModule } from './modules/lottery/lottery.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        DriversModule,
        RidesModule,
        PaymentsModule,
        LotteryModule,
        SubscriptionsModule,
        DeliveriesModule,
        NotificationsModule,
        GatewayModule,
    ],
})
export class AppModule { }
