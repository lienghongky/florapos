import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Get('status')
    @ApiOperation({ summary: 'Get current subscription status and limits' })
    @ApiResponse({ status: 200, description: 'Returns plan details and resource usage' })
    async getStatus(@Request() req: any) {
        return this.subscriptionsService.getSubscriptionStatus(req.user.userId);
    }
}
