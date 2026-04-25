
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { StoreUser } from './src/stores/entities/store-user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log("Checking Database Records...");

    const users = await dataSource.getRepository(User).find({
        relations: ['store_roles']
    });

    console.log(`Found ${users.length} Users`);
    users.forEach(u => {
        console.log(`User: ${u.email} (${u.id})`);
        console.log(`  Store Roles: ${JSON.stringify(u.store_roles)}`);
    });

    const storeUsers = await dataSource.getRepository(StoreUser).find();
    console.log(`Total StoreUser Records: ${storeUsers.length}`);
    storeUsers.forEach(su => {
        console.log(`  Record: User=${su.user_id}, Store=${su.store_id}, Role=${su.role}`);
    });

    await app.close();
}

bootstrap();
