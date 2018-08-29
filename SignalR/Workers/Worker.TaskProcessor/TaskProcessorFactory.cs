using MongoDB.Driver;
using SignalR.ChatStorage.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worker.TaskProcessor.Processors;

namespace Worker.TaskProcessor
{
    static class TaskProcessorFactory
    {
        public static ITaskProcessor GetTaskProcessor(ServerTask.TaskType taskType, IMongoDatabase database)
        {
            ITaskProcessor taskProcessor = null;

            switch (taskType)
            {
                case ServerTask.TaskType.UserUpdated:
                    taskProcessor = new UserUpdatedProcessor(database);
                    break;
                default:
                    throw new Exception("Unknown task Type");
            }

            return taskProcessor;
        }
    }
}
