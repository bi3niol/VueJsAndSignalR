using MongoDB.Driver;
using NLog;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Repos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worker.TaskProcessor.Processors
{
    abstract class BaseProcessor : ITaskProcessor
    {
        protected IMongoDatabase DataBase;
        protected ILogger logger = LogManager.GetCurrentClassLogger();
        protected abstract ServerTask.TaskType MyTaskType();
        protected abstract bool RunProcessor(ServerTask task);

        public BaseProcessor(IMongoDatabase database)
        {
            DataBase = database;
        }
        private void CloseTask(ServerTask task)
        {
            var taskRepo = new ServerTasksRepository(DataBase);
            task.Status = ServerTask.TaskStatus.Completed;
            taskRepo.Update(task);
            logger.Info($"Task Completed successfully!");
        }


        public void ProcessTask(ServerTask task)
        {
            logger.Info($"{this.GetType().Name} started");
            if (MyTaskType() != task.Type)
                throw new Exception("Invalid task for this processor");
            if (RunProcessor(task))
                CloseTask(task);
            else
                logger.Warn($"Something went wrong with:\n{task}");
        }
    }
}
