import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
    @PrimaryColumn()
    key: string;

    @Column({ type: 'text' })
    value: string;

    @UpdateDateColumn()
    updated_at: Date;
}
