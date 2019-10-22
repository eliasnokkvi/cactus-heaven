// TODO: Implement the order service
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


const mapIncomingItem = (data) => {
    const { email } = data;
    const { items } = data;
    console.log(items);
    var sumPrice = items.reduce(function(total, arr){
        console.log(arr.unitPrice);
        return total = parseInt(total) + parseInt(arr.unitPrice);
    });
    console.log(sumPrice);
    // const newOrder = {
    //     customerEmail: email,
    //     totalPrice: sumPrice,
    //     orderDate: new Date()
    // };
    // console.log(newOrder);
}

(async () => {
    const messageBrokerConnection = await createMessageBrokerConnection();
    const channel = await createChannel(messageBrokerConnection);

    configureMessageBroker(channel);

    const { order_queue } = messageBrokerInfo.queues;
    channel.consume(order_queue, data => {
        const dataJson = JSON.parse(data.content.toString());
        console.log("printing data");
        mapIncomingItem(dataJson);
    }, {noAck: true});

    //TODO: Setup consumer
})().catch(e => console.error(e));
