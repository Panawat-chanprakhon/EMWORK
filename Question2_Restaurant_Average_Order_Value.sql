-- Question 2: Restaurant Average Order Value and Ranking

-- Assumed tables:
-- categories(category_id, category_name)
-- restaurants(restaurant_id, restaurant_name, category_id)
-- orders(order_id, restaurant_id, total_amount, status, delivered_at)


-- Step 1:
-- Select only delivered orders from the current month.
WITH delivered_orders_this_month AS (
    SELECT
        restaurant_id,
        total_amount
    FROM orders
    WHERE status = 'delivered'
      AND delivered_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND delivered_at < DATE_TRUNC('month', CURRENT_DATE)
          + INTERVAL '1 month'
),


-- Step 2:
-- Calculate the average order value for each restaurant.
--
-- LEFT JOIN is used so restaurants with no delivered orders
-- are not removed from the result.
restaurant_average_order_value AS (
    SELECT
        categories.category_id,
        categories.category_name,
        restaurants.restaurant_id,
        restaurants.restaurant_name,

        AVG(delivered_orders_this_month.total_amount)
            AS average_order_value,

        COUNT(delivered_orders_this_month.restaurant_id)
            AS delivered_order_count

    FROM restaurants

    INNER JOIN categories
        ON restaurants.category_id =
           categories.category_id

    LEFT JOIN delivered_orders_this_month
        ON restaurants.restaurant_id =
           delivered_orders_this_month.restaurant_id

    GROUP BY
        categories.category_id,
        categories.category_name,
        restaurants.restaurant_id,
        restaurants.restaurant_name
),


-- Step 3:
-- Rank restaurants separately inside each category.
restaurant_ranking AS (
    SELECT
        category_id,
        category_name,
        restaurant_id,
        restaurant_name,
        average_order_value,
        delivered_order_count,

        DENSE_RANK() OVER (
            PARTITION BY category_id
            ORDER BY average_order_value DESC NULLS LAST
        ) AS ranking_in_category

    FROM restaurant_average_order_value
)


-- Step 4:
-- Return only the top 3 ranks in each category.
--
-- Restaurants with no delivered orders have NULL
-- average order value, so they are not included
-- in the final ranking.
SELECT
    category_id,
    category_name,
    restaurant_id,
    restaurant_name,
    average_order_value,
    delivered_order_count,
    ranking_in_category

FROM restaurant_ranking

WHERE ranking_in_category <= 3
  AND average_order_value IS NOT NULL

ORDER BY
    category_name,
    ranking_in_category,
    restaurant_name;