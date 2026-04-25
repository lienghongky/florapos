import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MasterService } from './master.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Controller for SaaS Master Admin operations.
 * Allows global management of owners, stores, and payments.
 * Restricted to users with the 'master' role.
 */
@ApiTags('master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('master')
@Controller('master')
export class MasterController {
    constructor(private readonly masterService: MasterService) { }

    /**
     * Retrieves global SaaS statistics (total owners, stores, revenue).
     */
    @Get('stats')
    @ApiOperation({ summary: 'Get global SaaS stats' })
    getStats() {
        return this.masterService.getSaaSStats();
    }

    /**
     * Lists all shop owners registered in the system.
     */
    @Get('owners')
    @ApiOperation({ summary: 'List all shop owners' })
    getOwners() {
        return this.masterService.getAllOwners();
    }

    /**
     * Creates a new shop owner account.
     */
    @Post('owners')
    @ApiOperation({ summary: 'Create a new shop owner' })
    createOwner(@Body() ownerData: { email: string, full_name: string, password: string }) {
        return this.masterService.createOwner(ownerData);
    }

    /**
     * Toggles a user's active status (enabling/disabling login access).
     */
    @Patch('users/:id/toggle-active')
    @ApiOperation({ summary: 'Toggle user active status' })
    toggleActive(@Param('id') id: string) {
        return this.masterService.toggleUserActive(id);
    }

    /**
     * Creates a new store for a specific owner.
     */
    @Post('owners/:id/stores')
    @ApiOperation({ summary: 'Create a store for an owner' })
    createStore(@Param('id') id: string, @Body() storeData: { name: string, currency: string }) {
        return this.masterService.createStoreForOwner(id, storeData);
    }

    /**
     * Retrieves all staff members belonging to a specific owner.
     */
    @Get('owners/:id/staff')
    @ApiOperation({ summary: 'Get all staff for an owner' })
    getStaff(@Param('id') id: string) {
        return this.masterService.getOwnerStaff(id);
    }

    /**
     * Lists all stores across the entire SaaS platform.
     */
    @Get('stores')
    @ApiOperation({ summary: 'List all stores globally' })
    getStores() {
        return this.masterService.getAllStores();
    }

    /**
     * Updates store details.
     */
    @Patch('stores/:id')
    @ApiOperation({ summary: 'Update a store details' })
    updateStore(@Param('id') id: string, @Body() updateData: { name?: string, currency?: string }) {
        return this.masterService.updateStore(id, updateData);
    }

    /**
     * Transfers ownership of a store to a different owner.
     */
    @Post('stores/:id/transfer')
    @ApiOperation({ summary: 'Transfer store ownership to another owner' })
    transferOwnership(@Param('id') id: string, @Body() data: { newOwnerId: string }) {
        return this.masterService.transferOwnership(id, data.newOwnerId);
    }

    /**
     * Records a new SaaS subscription or service payment.
     */
    @Post('payments')
    @ApiOperation({ summary: 'Record a new SaaS payment' })
    recordPayment(@Body() data: any) {
        return this.masterService.recordPayment(data);
    }

    /**
     * Retrieves all recorded SaaS payments globally.
     */
    @Get('payments')
    @ApiOperation({ summary: 'Get all SaaS payments globally' })
    getAllPayments() {
        return this.masterService.getAllPayments();
    }

    /**
     * Retrieves all payments associated with a specific owner.
     */
    @Get('owners/:id/payments')
    @ApiOperation({ summary: 'Get payments for a specific owner' })
    getOwnerPayments(@Param('id') id: string) {
        return this.masterService.getOwnerPayments(id);
    }

    /**
     * Resets a user's password.
     */
    @Patch('users/:id/password')
    @ApiOperation({ summary: 'Reset user password' })
    updatePassword(@Param('id') id: string, @Body() data: { password: string }) {
        return this.masterService.updateUserPassword(id, data.password);
    }

    /**
     * Lists all staff members across the entire platform.
     */
    @Get('staff')
    @ApiOperation({ summary: 'List all staff globally' })
    getStaffGlobal() {
        return this.masterService.getAllStaff();
    }

    /**
     * Deletes a user account.
     */
    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete a user account' })
    deleteUser(@Param('id') id: string) {
        return this.masterService.deleteUser(id);
    }
}
