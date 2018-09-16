const http = require('request');
const shortId = require('shortid');

/**
 * @class Order
 * @description Order database management (CRUD) model.
 */
class Order {
    constructor() {

        this.orders = db.collection('orders');

    }

    /**
     * @name list
     * @param params
     * @returns {Promise<any>}
     */
    async list(params) {
        return await new Promise(async (res) => {
            try {

                if (params.page < 1 || params.limit < 1) return res({
                    success: false,
                    error: 'Invalid page and/or limit integer(s).',
                    httpStatus: 400
                });

                const cursor = await this.orders.find({});
                const count = await this.orders.countDocuments();
                let pagination = params.limit * (params.page - 1);

                cursor.limit(params.limit);
                cursor.skip(pagination < count ? pagination : 10 * (params.page - 1));

                const items = await cursor.toArray();
                let ctx = [];

                for (let x in items) {
                    ctx.push({
                        id: items[x].id,
                        distance: items[x].distance,
                        status: items[x].status
                    })
                }

                return res({
                    success: true,
                    payload: ctx,
                    httpStatus: 200,
                    page: params.page,
                    totalPages: Math.ceil(count / params.limit),
                    count: ctx.length,
                    limit: params.limit
                });
            } catch (ex) {

                return res({
                    success: false,
                    error: 'An error occurred while fetching the order lists.',
                    errSys: ex.toString(),
                    httpStatus: 500
                });

            }
        });
    }

    /**
     * @name take
     * @param id
     * @param status
     * @returns {Promise<any>}
     */
    async take(id, status) {
        return await new Promise(async (res) => {
            try {

                const takeOrder = await this.orders.findOne({id});

                if (takeOrder !== null) {
                    if (takeOrder.status === 'UNASSIGN') {

                        const updateOrder = await this.orders.updateOne({
                            id
                        }, {
                            $set: {
                                status: status.toUpperCase()
                            }
                        });

                        if (updateOrder.modifiedCount === 1 && updateOrder.matchedCount === 1) {

                            return res({
                                success: true, status: 'SUCCESS', httpStatus: 200
                            })

                        } else {

                            return res({
                                success: true,
                                error: 'An error occurred while taking the order.',
                                errSys: updateOrder.toString(),
                                httpStatus: 500
                            })

                        }

                    } else {

                        return res({success: false, error: 'ORDER_ALREADY_BEEN_TAKEN', httpStatus: 409})

                    }
                } else {

                    return res({success: false, error: 'Invalid order ID.', httpStatus: 404});

                }
            } catch (ex) {

                return res({
                    success: false,
                    error: 'An error occurred while taking the order.',
                    errSys: ex.toString(),
                    httpStatus: 500
                });

            }
        });
    }

    /**
     * @name place
     * @param origins
     * @param destinations
     * @returns {Promise<any>}
     */
    async place(origins, destinations) {
        return await new Promise(async (res) => {
            try {

                const coord = {
                    or_lat: parseFloat(origins[0]),
                    or_long: parseFloat(origins[1]),
                    dest_lat: parseFloat(destinations[0]),
                    dest_long: parseFloat(destinations[1])
                };

                if (!(coord.or_lat <= 90 && coord.or_lat >= -90) || !(coord.dest_lat <= 90 && coord.dest_lat >= -90)) return res({
                    success: false,
                    error: 'Latitude value is invalid.',
                    httpStatus: 400
                });

                if (!(coord.or_long <= 180 && coord.or_long >= -180) || !(coord.dest_long <= 180 && coord.dest_long >= -180)) return res({
                    success: false,
                    error: 'Longitude value is invalid.',
                    httpStatus: 400
                });

                http(config.api.google.endpoint, {
                    method: 'get',
                    qs: {
                        origins: `${coord.or_lat},${coord.or_long}`,
                        destinations: `${coord.dest_lat},${coord.dest_long}`,
                        key: config.api.google.key
                    }
                }, async (err, response, body) => {

                    if (err) return res({success: false, err, httpStatus: 500});

                    body = JSON.parse(body);

                    if (body.status === 'OK') {

                        const id = shortId.generate();
                        const status = 'UNASSIGN';
                        const distance = body.rows;
                        const address = {
                            origin: body.origin_addresses,
                            destination: body.destination_addresses
                        };

                        await this.orders.insertOne({
                            id,
                            status,
                            address,
                            distance,
                            coordinate: [origins, destinations],
                            date: typeDate(new Date().toISOString())
                        });

                        return res({success: true, id, status, address, distance, httpStatus: 200});

                    } else {

                        return res({
                            success: false,
                            error: body.error_message || 'An error occurred with Google API.',
                            httpStatus: 500
                        });

                    }

                });
            } catch (ex) {

                return res({
                    success: false,
                    error: 'An error occurred while post the order.',
                    errSys: ex.toString(),
                    httpStatus: 500
                });

            }
        });
    }
}

module.exports = new Order;