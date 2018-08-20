using MongoDB.Bson;
using MongoDB.Driver;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Repos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.Services
{
    public class AccountService
    {
        private IMongoDatabase mongoDB;
        public MessagesRepository MessagesRepository { get; private set; }
        public AccountsRepository AccountRepository { get; private set; }
        public AccountService(string databaseName)
        {
            var client = new MongoClient();
            mongoDB = client.GetDatabase(databaseName);
            MessagesRepository = new MessagesRepository(mongoDB);
            AccountRepository = new AccountsRepository(mongoDB);
        }

        public async Task<Account> GetAccount(ObjectId Id)
        {
            return await AccountRepository.GetEntityAsync(Id);
        }

        public Account Login(string name, string password = null)
        {
            return AccountRepository.GetEntitiesByExpression(a => a.NickName == name).FirstOrDefault();
        }

        public Account RegisterNewAccount(Account account)
        {
            return AccountRepository.Add(account);
        }

        public bool AddMessage(Message message)
        {
            message.MessageSentOn = DateTime.Now;
            if (message.From == default(ObjectId) || message.To == default(ObjectId))
                return false;
            MessagesRepository.Add(message);
            return true;
        }

        public Message AddMessage(ObjectId from, ObjectId to, string content)
        {
            if (from == default(ObjectId) || to == default(ObjectId))
                return null;

            Message message = new Message();

            message.MessageSentOn = DateTime.Now;
            message.From = from;
            message.To = to;
            message.Content = content;

            return MessagesRepository.Add(message);
        }

        public Account[] GetUsersExcept(ObjectId id)
        {
            var res = AccountRepository.GetEntitiesByExpression(a => a.Id != id).ToArray();

            Array.ForEach(res, a => a.Password = null);

            return res;
        }
    }
}
