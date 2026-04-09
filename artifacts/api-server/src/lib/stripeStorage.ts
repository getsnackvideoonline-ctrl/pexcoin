import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export class StripeStorage {
  async listProductsWithPrices() {
    try {
      const result = await db.execute(sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = true
          ORDER BY id
          LIMIT 20
        )
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `);

      const productsMap = new Map<
        string,
        {
          id: string;
          name: string;
          description: string | null;
          prices: Array<{
            id: string;
            unit_amount: number;
            currency: string;
            recurring: unknown;
          }>;
        }
      >();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            prices: [],
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id)!.prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
          });
        }
      }
      return Array.from(productsMap.values());
    } catch {
      return [];
    }
  }

  async getPrice(priceId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }
}

export const stripeStorage = new StripeStorage();
