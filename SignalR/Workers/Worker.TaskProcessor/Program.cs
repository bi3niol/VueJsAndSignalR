using MongoDB.Driver;
using NLog;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Repos;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worker.TaskProcessor
{
    class Program
    {
        private static ILogger logger = NLog.LogManager.GetCurrentClassLogger();
        static void Main(string[] args)
        {
            logger.Info($"TaskProcessor Started...");
            var databaseName = ConfigurationManager.AppSettings["databaseName"];
            var client = new MongoClient();
            var mongoDB = client.GetDatabase(databaseName);
            logger.Info($"Connected to {databaseName}");

            var tasksRepo = new ServerTasksRepository(mongoDB);
            List<ServerTask> tasks = tasksRepo.GetEntitiesByExpression(t => t.Status != ServerTask.TaskStatus.Completed).ToList();
            logger.Info($"Retrived {tasks.Count} to process");
            foreach (var task in tasks)
            {
                try
                {
                    logger.Info($"Process\n{task}");
                    ITaskProcessor processor = TaskProcessorFactory.GetTaskProcessor(task.Type, mongoDB);
                    processor.ProcessTask(task);
                }
                catch(Exception e)
                {
                    logger.Error($"{e}");
                }
            }
            logger.Info($"TaskProcessor Finished...");
        }
    }
}
