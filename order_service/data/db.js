const orderSchema = require('./schema/order');
const orderItemSchema = require('./schema/orderItem');
const mongoose = require('mongoose');
const connectionString = 'mongodb+srv://admin:admin123@cactus-heaven-k2h9t.mongodb.net/cactus-heaven?retryWrites=true&w=majority'
const connection = mongoose.createConnection(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = {
    Order: connection.model('Order', orderSchema),
    OrderItem: connection.model('OrderItem', orderItemSchema)
};
