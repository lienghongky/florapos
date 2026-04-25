
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Store } from './src/stores/entities/store.entity';
import { StoreUser, UserRole } from './src/stores/entities/store-user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const storeUserRepo = dataSource.getRepository(StoreUser);
    const userRepo = dataSource.getRepository(User);
    const storeRepo = dataSource.getRepository(Store);

    console.log("Starting Fix Script...");

    // 1. Find User
    const targetEmail = 'owner@florapos.com';
    const user = await userRepo.findOne({ where: { email: targetEmail } });
    if (!user) {
        console.error(`User ${targetEmail} not found!`);
        await app.close();
        return;
    }
    console.log(`Found User: ${user.id}`);

    // 2. Find Store
    const stores = await storeRepo.find();
    if (stores.length === 0) {
        console.error("No stores found in database!");
        await app.close();
        return;
    }
    const targetStore = stores[0];
    console.log(`Found Store: ${targetStore.name} (${targetStore.id})`);

    // 3. Check existing link
    const existingLink = await storeUserRepo.findOne({
        where: { user_id: user.id, store_id: targetStore.id }
    });

    if (existingLink) {
        console.log("Link already exists. No action needed.");
    } else {
        console.log("Link missing. Creating StoreUser record...");
        const newLink = storeUserRepo.create({
            user_id: user.id,
            store_id: targetStore.id,
            role: UserRole.OWNER
        });
        await storeUserRepo.save(newLink);
        console.log("SUCCESS: Linked user to store as OWNER.");
    }

    await app.close();
}

bootstrap();
