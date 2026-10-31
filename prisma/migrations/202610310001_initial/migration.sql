-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttributeKind" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'OPTION');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('FIXED', 'PERCENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(3),
    "refreshTokenExpiresAt" TIMESTAMPTZ(3),
    "scope" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "recipient" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parentId" UUID,
    "code" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "categoryId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("categoryId","locale")
);

-- CreateTable
CREATE TABLE "ProductBrand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,

    CONSTRAINT "ProductBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandTranslation" (
    "brandId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "name" VARCHAR(160) NOT NULL,

    CONSTRAINT "BrandTranslation_pkey" PRIMARY KEY ("brandId","locale")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "brandId" UUID,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "productId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(320),

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("productId","locale")
);

-- CreateTable
CREATE TABLE "ProductSlugHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "kind" "AttributeKind" NOT NULL,
    "unit" VARCHAR(32),

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeTranslation" (
    "attributeId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "name" VARCHAR(160) NOT NULL,

    CONSTRAINT "AttributeTranslation_pkey" PRIMARY KEY ("attributeId","locale")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "categoryId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("categoryId","attributeId")
);

-- CreateTable
CREATE TABLE "AttributeChoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attributeId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,

    CONSTRAINT "AttributeChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoiceTranslation" (
    "choiceId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "label" VARCHAR(160) NOT NULL,

    CONSTRAINT "ChoiceTranslation_pkey" PRIMARY KEY ("choiceId","locale")
);

-- CreateTable
CREATE TABLE "ProductAttributeValue" (
    "productId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "kind" "AttributeKind" NOT NULL,
    "locale" VARCHAR(35) NOT NULL DEFAULT '*',
    "textValue" TEXT,
    "numberValue" DECIMAL(24,6),
    "booleanValue" BOOLEAN,
    "choiceId" UUID,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("productId","attributeId","locale")
);

-- CreateTable
CREATE TABLE "ProductOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,

    CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionTranslation" (
    "optionId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "name" VARCHAR(160) NOT NULL,

    CONSTRAINT "OptionTranslation_pkey" PRIMARY KEY ("optionId","locale")
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "optionId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionValueTranslation" (
    "valueId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "label" VARCHAR(160) NOT NULL,

    CONSTRAINT "OptionValueTranslation_pkey" PRIMARY KEY ("valueId","locale")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "combinationKey" TEXT NOT NULL DEFAULT 'default',
    "priceIrr" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantSelection" (
    "variantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "valueId" UUID NOT NULL,

    CONSTRAINT "VariantSelection_pkey" PRIMARY KEY ("variantId","optionId")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTranslation" (
    "mediaId" UUID NOT NULL,
    "locale" VARCHAR(35) NOT NULL,
    "alt" VARCHAR(300) NOT NULL,

    CONSTRAINT "MediaTranslation_pkey" PRIMARY KEY ("mediaId","locale")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "productId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("productId","mediaId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "variantId" UUID NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "guestTokenHash" VARCHAR(64),
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "cartId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("cartId","variantId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "number" TEXT NOT NULL,
    "userId" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" CHAR(3) NOT NULL DEFAULT 'IRR',
    "subtotalIrr" BIGINT NOT NULL,
    "discountIrr" BIGINT NOT NULL DEFAULT 0,
    "shippingIrr" BIGINT NOT NULL DEFAULT 0,
    "taxIrr" BIGINT NOT NULL DEFAULT 0,
    "totalIrr" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "variantId" UUID,
    "skuSnapshot" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "optionsSnapshot" JSONB NOT NULL DEFAULT '{}',
    "quantity" INTEGER NOT NULL,
    "unitPriceIrr" BIGINT NOT NULL,
    "totalIrr" BIGINT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAddress" (
    "orderId" UUID NOT NULL,
    "recipient" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,

    CONSTRAINT "OrderAddress_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountIrr" BIGINT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "kind" "DiscountKind" NOT NULL,
    "value" BIGINT NOT NULL,
    "usageLimit" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "couponId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "response" JSONB,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("scope","key")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "correlationId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "Verification_expiresAt_idx" ON "Verification"("expiresAt");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_locale_slug_key" ON "CategoryTranslation"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBrand_code_key" ON "ProductBrand"("code");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_createdAt_idx" ON "Product"("categoryId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_locale_slug_key" ON "ProductTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "ProductSlugHistory_productId_idx" ON "ProductSlugHistory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSlugHistory_locale_slug_key" ON "ProductSlugHistory"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_code_key" ON "Attribute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_id_kind_key" ON "Attribute"("id", "kind");

-- CreateIndex
CREATE INDEX "CategoryAttribute_attributeId_idx" ON "CategoryAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeChoice_attributeId_code_key" ON "AttributeChoice"("attributeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeChoice_id_attributeId_key" ON "AttributeChoice"("id", "attributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_numberValue_idx" ON "ProductAttributeValue"("attributeId", "numberValue");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_choiceId_idx" ON "ProductAttributeValue"("attributeId", "choiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOption_productId_code_key" ON "ProductOption"("productId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOption_id_productId_key" ON "ProductOption"("id", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "OptionValue_optionId_code_key" ON "OptionValue"("optionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "OptionValue_id_optionId_key" ON "OptionValue"("id", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_productId_combinationKey_key" ON "Variant"("productId", "combinationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_id_productId_key" ON "Variant"("id", "productId");

-- CreateIndex
CREATE INDEX "VariantSelection_valueId_idx" ON "VariantSelection"("valueId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMedia_productId_position_key" ON "ProductMedia"("productId", "position");

-- CreateIndex
CREATE INDEX "InventoryReservation_status_expiresAt_idx" ON "InventoryReservation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "InventoryReservation_variantId_status_idx" ON "InventoryReservation"("variantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_reference_key" ON "InventoryMovement"("reference");

-- CreateIndex
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_guestTokenHash_key" ON "Cart"("guestTokenHash");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_createdAt_idx" ON "PaymentAttempt"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_provider_providerReference_key" ON "PaymentAttempt"("provider", "providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_userId_key" ON "CouponUsage"("couponId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_orderId_key" ON "CouponUsage"("couponId", "orderId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_availableAt_idx" ON "OutboxEvent"("processedAt", "availableAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandTranslation" ADD CONSTRAINT "BrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSlugHistory" ADD CONSTRAINT "ProductSlugHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeTranslation" ADD CONSTRAINT "AttributeTranslation_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeChoice" ADD CONSTRAINT "AttributeChoice_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoiceTranslation" ADD CONSTRAINT "ChoiceTranslation_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "AttributeChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_kind_fkey" FOREIGN KEY ("attributeId", "kind") REFERENCES "Attribute"("id", "kind") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_choiceId_attributeId_fkey" FOREIGN KEY ("choiceId", "attributeId") REFERENCES "AttributeChoice"("id", "attributeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionTranslation" ADD CONSTRAINT "OptionTranslation_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValue" ADD CONSTRAINT "OptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValueTranslation" ADD CONSTRAINT "OptionValueTranslation_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "OptionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSelection" ADD CONSTRAINT "VariantSelection_variantId_productId_fkey" FOREIGN KEY ("variantId", "productId") REFERENCES "Variant"("id", "productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSelection" ADD CONSTRAINT "VariantSelection_optionId_productId_fkey" FOREIGN KEY ("optionId", "productId") REFERENCES "ProductOption"("id", "productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSelection" ADD CONSTRAINT "VariantSelection_valueId_optionId_fkey" FOREIGN KEY ("valueId", "optionId") REFERENCES "OptionValue"("id", "optionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTranslation" ADD CONSTRAINT "MediaTranslation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- R03 database-enforced invariants (not expressible in Prisma schema).
ALTER TABLE "User" ADD CONSTRAINT "user_email_normalized" CHECK (email = lower(btrim(email)) AND email LIKE '%_@_%._%');
ALTER TABLE "User" ADD CONSTRAINT "user_phone_e164" CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');
ALTER TABLE "Verification" ADD CONSTRAINT "verification_hash_only" CHECK (value ~ '^[a-f0-9]{64}$');
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "categorytranslation_slug" CHECK (length("slug")>0 AND "slug" = lower("slug") AND "slug" !~ '[/?#%[:space:]]');
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "producttranslation_slug" CHECK (length("slug")>0 AND "slug" = lower("slug") AND "slug" !~ '[/?#%[:space:]]');
ALTER TABLE "ProductSlugHistory" ADD CONSTRAINT "productslughistory_slug" CHECK (length("slug")>0 AND "slug" = lower("slug") AND "slug" !~ '[/?#%[:space:]]');
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "categorytranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "producttranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "ProductSlugHistory" ADD CONSTRAINT "productslughistory_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "BrandTranslation" ADD CONSTRAINT "brandtranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "AttributeTranslation" ADD CONSTRAINT "attributetranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "ChoiceTranslation" ADD CONSTRAINT "choicetranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "OptionTranslation" ADD CONSTRAINT "optiontranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "OptionValueTranslation" ADD CONSTRAINT "optionvaluetranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "MediaTranslation" ADD CONSTRAINT "mediatranslation_locale" CHECK (locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "attribute_value_typed" CHECK (num_nonnulls("textValue","numberValue","booleanValue","choiceId")=1 AND ((kind='TEXT' AND "textValue" IS NOT NULL) OR (kind='NUMBER' AND "numberValue" IS NOT NULL AND locale='*') OR (kind='BOOLEAN' AND "booleanValue" IS NOT NULL AND locale='*') OR (kind='OPTION' AND "choiceId" IS NOT NULL AND locale='*')));
ALTER TABLE "Variant" ADD CONSTRAINT "variant_price_nonnegative" CHECK ("priceIrr">=0);
ALTER TABLE "Variant" ADD CONSTRAINT "sku_normalized" CHECK (sku=upper(btrim(sku)) AND length(sku)>0);
ALTER TABLE "Inventory" ADD CONSTRAINT "inventory_valid" CHECK ("onHand">=0 AND reserved>=0 AND reserved<="onHand" AND version>=0);
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "reservation_valid" CHECK (quantity>0 AND "expiresAt">"createdAt");
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "movement_valid" CHECK (delta<>0 AND length(btrim(reason))>0);
ALTER TABLE "Media" ADD CONSTRAINT "media_dimensions_valid" CHECK ("byteSize">0 AND (width IS NULL OR width>0) AND (height IS NULL OR height>0));
ALTER TABLE "ProductMedia" ADD CONSTRAINT "media_position_nonnegative" CHECK (position>=0);
ALTER TABLE "Cart" ADD CONSTRAINT "cart_owner_exactly_one" CHECK (num_nonnulls("userId","guestTokenHash")=1);
ALTER TABLE "Cart" ADD CONSTRAINT "guest_token_hashed" CHECK ("guestTokenHash" IS NULL OR ("guestTokenHash" ~ '^[a-f0-9]{64}$' AND "expiresAt" IS NOT NULL));
ALTER TABLE "CartItem" ADD CONSTRAINT "cart_quantity_positive" CHECK (quantity>0);
ALTER TABLE "Order" ADD CONSTRAINT "order_amounts_valid" CHECK (currency='IRR' AND "subtotalIrr">=0 AND "discountIrr">=0 AND "discountIrr"<="subtotalIrr" AND "shippingIrr">=0 AND "taxIrr">=0 AND "totalIrr"="subtotalIrr"-"discountIrr"+"shippingIrr"+"taxIrr");
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_amount_valid" CHECK (quantity>0 AND "unitPriceIrr">=0 AND "totalIrr"="unitPriceIrr"*quantity);
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "payment_valid" CHECK ("amountIrr">=0 AND "requestHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "Coupon" ADD CONSTRAINT "coupon_valid" CHECK (code=upper(btrim(code)) AND length(code)>0 AND value>0 AND (kind<>'PERCENT' OR value<=100) AND "usageLimit">0 AND "usedCount">=0 AND "usedCount"<="usageLimit");
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "idempotency_request_hash" CHECK ("requestHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "outbox_attempts_nonnegative" CHECK (attempts>=0);
CREATE UNIQUE INDEX "one_successful_payment_per_order" ON "PaymentAttempt"("orderId") WHERE status='SUCCEEDED';
CREATE INDEX "outbox_ready" ON "OutboxEvent"("availableAt") WHERE "processedAt" IS NULL;
CREATE INDEX "product_brand" ON "Product"("brandId");
CREATE INDEX "cart_item_variant" ON "CartItem"("variantId");
CREATE INDEX "coupon_usage_user" ON "CouponUsage"("userId");
CREATE INDEX "coupon_usage_order" ON "CouponUsage"("orderId");

CREATE FUNCTION reject_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Append-only ledger cannot be updated or deleted' USING ERRCODE='55000'; END $$;
CREATE TRIGGER movement_immutable BEFORE UPDATE OR DELETE ON "InventoryMovement" FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();

CREATE FUNCTION reject_category_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(73103101);
 IF NEW."parentId" IS NOT NULL AND EXISTS (
  WITH RECURSIVE ancestors AS (
   SELECT id,"parentId" FROM "Category" WHERE id=NEW."parentId"
   UNION SELECT c.id,c."parentId" FROM "Category" c JOIN ancestors a ON c.id=a."parentId"
  ) SELECT 1 FROM ancestors WHERE id=NEW.id
 ) THEN RAISE EXCEPTION 'Category cycle' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER category_cycle BEFORE INSERT OR UPDATE OF "parentId" ON "Category" FOR EACH ROW EXECUTE FUNCTION reject_category_cycle();

CREATE FUNCTION assert_variant_combination(target uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v record; expected text; selected integer; required integer;
BEGIN
 SELECT * INTO v FROM "Variant" WHERE id=target;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT coalesce(string_agg("optionId"::text||'='||"valueId"::text,',' ORDER BY "optionId"::text),'default'),count(*) INTO expected,selected FROM "VariantSelection" WHERE "variantId"=target;
 SELECT count(*) INTO required FROM "ProductOption" WHERE "productId"=v."productId";
 IF v."combinationKey"<>expected OR selected<>required THEN
  RAISE EXCEPTION 'Variant combination key/selections must be canonical and complete' USING ERRCODE='23514';
 END IF;
END $$;
CREATE FUNCTION validate_variant_combination() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v record;
BEGIN
 IF TG_TABLE_NAME='Variant' THEN
  PERFORM assert_variant_combination(NEW.id);
 ELSIF TG_TABLE_NAME='VariantSelection' THEN
  IF TG_OP<>'INSERT' THEN PERFORM assert_variant_combination(OLD."variantId"); END IF;
  IF TG_OP<>'DELETE' THEN PERFORM assert_variant_combination(NEW."variantId"); END IF;
 ELSE
  FOR v IN SELECT id FROM "Variant" WHERE "productId"=coalesce(NEW."productId",OLD."productId") LOOP PERFORM assert_variant_combination(v.id); END LOOP;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER variant_combination AFTER INSERT OR UPDATE ON "Variant" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_variant_combination();
CREATE CONSTRAINT TRIGGER selection_combination AFTER INSERT OR UPDATE OR DELETE ON "VariantSelection" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_variant_combination();
CREATE CONSTRAINT TRIGGER option_combination AFTER INSERT OR UPDATE OR DELETE ON "ProductOption" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_variant_combination();

CREATE FUNCTION protect_product_slug() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.locale||':'||NEW.slug,0));
 IF TG_TABLE_NAME='ProductTranslation' THEN
  IF EXISTS(SELECT 1 FROM "ProductSlugHistory" WHERE locale=NEW.locale AND slug=NEW.slug AND "productId"<>NEW."productId") THEN RAISE EXCEPTION 'Slug reserved by another product history' USING ERRCODE='23505'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM "ProductTranslation" WHERE locale=NEW.locale AND slug=NEW.slug AND "productId"<>NEW."productId") THEN RAISE EXCEPTION 'Slug belongs to another product' USING ERRCODE='23505'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER product_slug_reserved BEFORE INSERT OR UPDATE ON "ProductTranslation" FOR EACH ROW EXECUTE FUNCTION protect_product_slug();
CREATE TRIGGER historical_slug_reserved BEFORE INSERT OR UPDATE ON "ProductSlugHistory" FOR EACH ROW EXECUTE FUNCTION protect_product_slug();

CREATE FUNCTION validate_payment_amount() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM "Order" WHERE id=NEW."orderId" AND "totalIrr"=NEW."amountIrr") THEN
  RAISE EXCEPTION 'Payment amount must equal order total' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER payment_amount BEFORE INSERT OR UPDATE ON "PaymentAttempt" FOR EACH ROW EXECUTE FUNCTION validate_payment_amount();
