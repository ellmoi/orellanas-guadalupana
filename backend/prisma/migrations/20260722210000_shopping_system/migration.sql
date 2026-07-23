-- Shopping and checkout fields
ALTER TABLE "Product" ADD COLUMN "wholesalePriceInCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN "minimumWholesaleQuantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Order" ADD COLUMN "deliveryType" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "billingData" TEXT;
