-- Catalog category scope, and immutable financial identity after payment starts.
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "attribute_locale_valid"
 CHECK (locale='*' OR locale ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$');
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_options_object" CHECK (jsonb_typeof("optionsSnapshot")='object');

CREATE FUNCTION assert_attribute_scope(product_id uuid, attribute_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "Product" p JOIN "CategoryAttribute" ca ON ca."categoryId"=p."categoryId" WHERE p.id=product_id AND ca."attributeId"=attribute_id) THEN
  RAISE EXCEPTION 'Attribute is outside product category scope' USING ERRCODE='23514';
 END IF;
END $$;
CREATE FUNCTION guard_attribute_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item record;
BEGIN
 PERFORM pg_advisory_xact_lock(73103102);
 IF TG_TABLE_NAME='ProductAttributeValue' THEN
  PERFORM assert_attribute_scope(NEW."productId",NEW."attributeId");
 ELSIF TG_TABLE_NAME='Product' THEN
  FOR item IN SELECT "attributeId" FROM "ProductAttributeValue" WHERE "productId"=NEW.id LOOP
   IF NOT EXISTS(SELECT 1 FROM "CategoryAttribute" WHERE "categoryId"=NEW."categoryId" AND "attributeId"=item."attributeId") THEN
    RAISE EXCEPTION 'Category change invalidates attribute scope' USING ERRCODE='23514';
   END IF;
  END LOOP;
 ELSE
  IF EXISTS(SELECT 1 FROM "ProductAttributeValue" v JOIN "Product" p ON p.id=v."productId" WHERE p."categoryId"=OLD."categoryId" AND v."attributeId"=OLD."attributeId") THEN
   RAISE EXCEPTION 'Attribute scope is in use' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN coalesce(NEW,OLD);
END $$;
CREATE TRIGGER attribute_scope BEFORE INSERT OR UPDATE ON "ProductAttributeValue" FOR EACH ROW EXECUTE FUNCTION guard_attribute_scope();
CREATE TRIGGER product_category_scope BEFORE UPDATE OF "categoryId" ON "Product" FOR EACH ROW EXECUTE FUNCTION guard_attribute_scope();
CREATE TRIGGER category_attribute_scope BEFORE UPDATE OR DELETE ON "CategoryAttribute" FOR EACH ROW EXECUTE FUNCTION guard_attribute_scope();

CREATE OR REPLACE FUNCTION validate_payment_amount() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected bigint;
BEGIN
 SELECT "totalIrr" INTO expected FROM "Order" WHERE id=NEW."orderId" FOR SHARE;
 IF NOT FOUND OR expected<>NEW."amountIrr" THEN RAISE EXCEPTION 'Payment amount must equal order total' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD."orderId"<>NEW."orderId" OR OLD.provider<>NEW.provider OR OLD."amountIrr"<>NEW."amountIrr" OR OLD."requestHash"<>NEW."requestHash" OR OLD."idempotencyKey"<>NEW."idempotencyKey" OR (OLD."providerReference" IS NOT NULL AND OLD."providerReference" IS DISTINCT FROM NEW."providerReference")) THEN
  RAISE EXCEPTION 'Payment identity is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION freeze_order_financials() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (OLD.currency,OLD."subtotalIrr",OLD."discountIrr",OLD."shippingIrr",OLD."taxIrr",OLD."totalIrr") IS DISTINCT FROM (NEW.currency,NEW."subtotalIrr",NEW."discountIrr",NEW."shippingIrr",NEW."taxIrr",NEW."totalIrr") AND EXISTS(SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=OLD.id) THEN
  RAISE EXCEPTION 'Order financial snapshot is frozen after payment starts' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER order_financial_snapshot BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION freeze_order_financials();
