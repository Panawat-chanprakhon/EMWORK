// Question 3: Inventory Race Condition

/*
Problems in the original code:

1. N+1 Query Problem
The original code runs both a SELECT and an UPDATE
for every item in the order.

The new version removes the separate SELECT
and uses one atomic UPDATE for each item.
For a very large order, the updates could be combined
into a bulk query as a further optimization.


2. Race Condition
The original code checks the stock first and updates it later.

Two orders could read the same stock value before either
of them updates it, so both may think the item is available.


3. No Transaction
If one stock update succeeds but another item fails later,
the order may be left with only part of the stock updated.


4. SQL Injection Risk
The original code places values directly inside the SQL string.

The new version uses parameterized queries.
*/


async function placeOrder(orderId, items, database) {
    const databaseConnection =
        await database.connect();

    try {


        /*
        Start a transaction so all stock updates
        and the order creation succeed or fail together.
        */
        await databaseConnection.query("BEGIN");


        for (const item of items) {


            /*
            Atomic Update:

            The database checks the stock and reduces it
            in the same statement.

            This prevents the race condition caused by
            doing SELECT first and UPDATE later.
            */
            const updateResult =
                await databaseConnection.query(
                    `
                    UPDATE menu
                    SET stock = stock - $1
                    WHERE id = $2
                      AND stock >= $1
                    RETURNING id
                    `,
                    [
                        item.qty,
                        item.id
                    ]
                );



            /*
            If no row was updated, either:
            - the menu item does not exist, or
            - there is not enough stock.

            Throwing an error will move execution
            to the ROLLBACK section.
            */
            if (updateResult.rowCount === 0) {
                throw new Error(
                    `Not enough stock for menu item ${item.id}`
                );
            }
        }



        /*
        Create the order only after every stock update
        has completed successfully.
        */
        await databaseConnection.query(
            `
            INSERT INTO orders (
                id,
                status
            )
            VALUES ($1, $2)
            `,
            [
                orderId,
                "confirmed"
            ]
        );



        // Everything succeeded, so save the transaction.
        await databaseConnection.query("COMMIT");

        return {
            orderId,
            status: "confirmed"
        };

    } catch (error) {


        /*
        If any item fails, undo all stock updates
        made earlier in this transaction.
        */
        await databaseConnection.query(
            "ROLLBACK"
        );

        throw error;

    } finally {


        // Always release the database connection.
        databaseConnection.release();
    }
}


module.exports = {
    placeOrder
};