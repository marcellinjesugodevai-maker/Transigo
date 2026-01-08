import { Module } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';

@Module({
    providers: [RidesGateway],
    exports: [RidesGateway],
})
export class GatewayModule { }
