-- AlterTable
ALTER TABLE `orders` ADD COLUMN `estimatedTime` INTEGER NULL,
    ADD COLUMN `kitchenNotes` VARCHAR(191) NULL,
    ADD COLUMN `tableNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `orders_tableNumber_fkey` ON `orders`(`tableNumber`);
