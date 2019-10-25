const amqp = require('amqplib/callback_api');
const db = require('./data/db');
const messageBrokerInfo = {
    exchanges: {
        order: 'order_exchange'
    },
    queues: {
        order_queue: 'order_queue'
    },
    routingKeys: {
        createOrder: 'create_order'
    }
}

const createMessageBrokerConnection = () => new Promise((resolve, reject) => {
    amqp.connect('amqp://localhost', (err, conn) => {
        if (err) { reject(err); }
        resolve(conn);
    });
});

const createChannel = connection => new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
        if (err) { reject(err); }
        resolve(channel);
    });
});

const configureMessageBroker = channel => {
    const { order } = messageBrokerInfo.exchanges;
    const { order_queue } = messageBrokerInfo.queues;
    const { createOrder } = messageBrokerInfo.routingKeys;
    channel.assertExchange(order, 'direct', { durable: true });
    channel.assertQueue(order_queue, { durable: true});
    channel.bindQueue(order_queue, order, createOrder);
};


const mapIncomingItem = async (data) => {
    const { email } = data;
    const { items } = data;
    var sumPrice = items.reduce(function (sum,item) { return sum + (item.unitPrice * item.quantity) }, 0);
    const newOrder = {
        customerEmail: email,
        totalPrice: sumPrice,
        orderDate: new Date()
    };
    const createdOrder = await db.Order.create(newOrder);
    items.map(async x => {
        const newOrderItem = {
            ...x,
            rowPrice: x.quantity * x.unitPrice,
            orderId: createdOrder._id
        };
        await db.OrderItem.create(newOrderItem);
    });
}

(async () => {
    const messageBrokerConnection = await createMessageBrokerConnection();
    const channel = await createChannel(messageBrokerConnection);

    configureMessageBroker(channel);

    const { order_queue } = messageBrokerInfo.queues;
    channel.consume(order_queue, async data => {
        const dataJson = JSON.parse(data.content.toString());
        console.log("printing data");
        await mapIncomingItem(dataJson);
    }, {noAck: true});
})().catch(e => console.error(e));
