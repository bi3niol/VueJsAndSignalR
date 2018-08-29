using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Driver;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Repos;

namespace Worker.TaskProcessor.Processors
{
    class UserUpdatedProcessor : BaseProcessor
    {
        public UserUpdatedProcessor(IMongoDatabase database) : base(database)
        {
        }

        protected override ServerTask.TaskType MyTaskType()
        {
            return ServerTask.TaskType.UserUpdated;
        }

        protected override bool RunProcessor(ServerTask task)
        {
            var messageRepo = new MessagesRepository(DataBase);
            var accountRepo = new AccountsRepository(DataBase);

            Account targetAccount = accountRepo.GetEntity(task.ObjectId);
            logger.Info($"Target Account NickName {targetAccount.NickName}");
            List<Message> messages = messageRepo.
                GetEntitiesByExpression(m => m.From == targetAccount.Id
                && m.FromName != targetAccount.NickName).
            ToList();

            logger.Info($"Retrived {messages.Count} to process");
            foreach (var message in messages)
            {
                logger.Info($"Updating Message {message.Id}");
                message.FromName = targetAccount.NickName;
                messageRepo.Update(message);
            }
            return true;
        }
    }
}
