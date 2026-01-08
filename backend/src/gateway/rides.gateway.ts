import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface DriverLocation { driverId: string; latitude: number; longitude: number; }
interface RideRequest { rideId: string; passengerId: string; pickup: { lat: number; lng: number; address: string }; dropoff: { lat: number; lng: number; address: string }; price: number; serviceType: string; }

@WebSocketGateway({ cors: { origin: '*' } })
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private connectedUsers = new Map<string, Socket>();
    private driverLocations = new Map<string, DriverLocation>();

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.connectedUsers.forEach((socket, id) => {
            if (socket.id === client.id) this.connectedUsers.delete(id);
        });
    }

    @SubscribeMessage('register')
    handleRegister(@MessageBody() data: { userId: string; role: 'passenger' | 'driver' }, @ConnectedSocket() client: Socket) {
        this.connectedUsers.set(data.userId, client);
        client.join(`${data.role}s`);
        return { event: 'registered', data: { userId: data.userId } };
    }

    @SubscribeMessage('driver:location')
    handleDriverLocation(@MessageBody() data: DriverLocation) {
        this.driverLocations.set(data.driverId, data);
        this.server.to('passengers').emit('drivers:nearby', Array.from(this.driverLocations.values()));
    }

    @SubscribeMessage('driver:online')
    handleDriverOnline(@MessageBody() data: { driverId: string; isOnline: boolean }, @ConnectedSocket() client: Socket) {
        if (data.isOnline) client.join('online-drivers');
        else { client.leave('online-drivers'); this.driverLocations.delete(data.driverId); }
    }

    @SubscribeMessage('ride:request')
    handleRideRequest(@MessageBody() data: RideRequest) {
        this.server.to('online-drivers').emit('ride:new-request', data);
        return { event: 'ride:request-sent', data };
    }

    @SubscribeMessage('ride:accept')
    handleRideAccept(@MessageBody() data: { rideId: string; driverId: string; passengerId: string; price: number }) {
        const passengerSocket = this.connectedUsers.get(data.passengerId);
        if (passengerSocket) passengerSocket.emit('ride:accepted', data);
    }

    @SubscribeMessage('ride:driver-offer')
    handleDriverOffer(@MessageBody() data: { rideId: string; driverId: string; passengerId: string; price: number; eta: number }) {
        const passengerSocket = this.connectedUsers.get(data.passengerId);
        if (passengerSocket) passengerSocket.emit('ride:driver-offer', data);
    }

    @SubscribeMessage('ride:status')
    handleRideStatus(@MessageBody() data: { rideId: string; status: string; passengerId: string; driverId: string }) {
        [data.passengerId, data.driverId].forEach(userId => {
            const socket = this.connectedUsers.get(userId);
            if (socket) socket.emit('ride:status-update', data);
        });
    }

    @SubscribeMessage('ride:cancel')
    handleRideCancel(@MessageBody() data: { rideId: string; passengerId: string; driverId: string; reason: string }) {
        [data.passengerId, data.driverId].forEach(userId => {
            const socket = this.connectedUsers.get(userId);
            if (socket) socket.emit('ride:cancelled', data);
        });
    }
}
