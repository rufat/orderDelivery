Usage
-------------
**Note:** If you're using *Ubuntu*, run the "start.sh" shell script. If not, you have to install the MongoDB, NodeJS and NPM manually.
1. Run MongoDB: `npm run db`
2. Run ExpressJS server: `npm start`
3. Run unit testing: `npm test`

API
-------------
`/order` **[POST]**  
**Description:** Place an order.  
**Body (JSON):**  

    {
        origin: ["<latitude>", "longitude"],
        destination: ["<latitude>", "<longitude>"]
    }
    
`/order/:orderId` **[PUT]**  
**Description:** Take order.  
**Body (JSON):**  

    {
      status: <status>
    }
    
`/orders` **[GET]**  
**Description:** Listing all the orders. Pagination supported.  
**Query:**  

    ?page=<int>&limit=<int>
