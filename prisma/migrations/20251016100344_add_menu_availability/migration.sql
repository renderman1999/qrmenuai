-- AlterTable
ALTER TABLE `allergens` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `categories` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `dishes` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `ingredients` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `menus` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `qr_codes` ADD COLUMN `availability` JSON NULL;

-- AlterTable
ALTER TABLE `restaurants` ADD COLUMN `availability` JSON NULL;
