using System;
using System.IO;
using System.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;


namespace logging_service
{
    class LoggingService
    {
        public void writeToFile(string message)
        {
            using (StreamWriter writer = System.IO.File.AppendText("log.txt"))
            {
                writer.WriteLine(message);
            }
        }
        static void Main(string[] args)
        {
            LoggingService logService = new LoggingService();
            var logging_queue = "logging_queue";
            var exchange = "order_exchange";
            var routingKey = "create_order";
            var factory = new ConnectionFactory() { HostName = "localhost" };
            using (var connection = factory.CreateConnection())
            {
                using (var channel = connection.CreateModel())
                {
                    channel.QueueDeclare(
                        queue: logging_queue,
                        durable: true,
                        exclusive: false,
                        autoDelete: false,
                        arguments: null
                    );
                    channel.ExchangeDeclare(exchange: exchange, type: "direct",durable: true);
                    channel.QueueBind(logging_queue, exchange, routingKey, null);

                    var consumer = new EventingBasicConsumer(channel);
                    consumer.Received += (model, ea) =>
                    {
                        var body = ea.Body;
                        var message = Encoding.UTF8.GetString(body);
                        Console.WriteLine("[x] Received {0}", message);
                        logService.writeToFile("Log: " + message);
                    };
                    channel.BasicConsume(queue: logging_queue, autoAck: true, consumer: consumer);
                    Console.WriteLine("Press 'enter' to exit.");
                    Console.ReadLine();
                }
            }
        }
    }
}
