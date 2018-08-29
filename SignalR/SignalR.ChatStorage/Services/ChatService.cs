﻿using MongoDB.Bson;
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
    public class ChatService
    {
        private IMongoDatabase mongoDB;
        public MessagesRepository MessagesRepository { get; private set; }
        public AccountsRepository AccountRepository { get; private set; }
        public GroupsRepository GroupsRepository { get; private set; }
        public ServerTasksRepository TasksRepository { get; private set; }

        public ChatService(string databaseName)
        {
            var client = new MongoClient();
            mongoDB = client.GetDatabase(databaseName);
            MessagesRepository = new MessagesRepository(mongoDB);
            AccountRepository = new AccountsRepository(mongoDB);
            GroupsRepository = new GroupsRepository(mongoDB);
            TasksRepository = new ServerTasksRepository(mongoDB);
        }

        public async Task<Account> GetAccount(ObjectId Id)
        {
            return await AccountRepository.GetEntityAsync(Id);
        }

        public Account UpdateUser(Account user)
        {
            var account = AccountRepository.GetEntity(user.Id);

            account.NickName = user.NickName;
            account.Age = user.Age;
            account.Connected = user.Connected;
            if (!string.IsNullOrEmpty(user.Password))
                account.Password = user.Password;

            AccountRepository.Update(account);
            TasksRepository.Add(new ServerTask()
            {
                ObjectId = account.Id,
                Status = ServerTask.TaskStatus.New,
                Type = ServerTask.TaskType.UserUpdated
            });

            return account;
        }

        public Account Login(string name, string password)
        {
            return AccountRepository.GetEntitiesByExpression(a => a.Login == name && a.Password == password).FirstOrDefault();
        }

        public string RegisterNewAccount(Account account, out Account res)
        {
            res = null;
            if (string.IsNullOrEmpty(account.NickName) ||
                string.IsNullOrEmpty(account.Login) ||
                string.IsNullOrEmpty(account.Password))
                return "InvalidModel";

            if (AccountRepository.GetEntitiesByExpression(a => a.Login == account.Login).Any())
                return "UserExists";
            res = AccountRepository.Add(account);
            return "OK";
        }

        public Message AddMessage(Message message)
        {
            message.MessageSentOn = DateTime.Now;
            if (message.From == default(ObjectId) || message.To == default(ObjectId))
                return null;
            return MessagesRepository.Add(message);
        }

        public Message AddMessage(string fromname, ObjectId from, ObjectId to, string content, bool isGroup = false)
        {
            Message message = new Message();

            message.FromName = fromname;
            message.From = from;
            message.GroupId = isGroup ? to : (ObjectId?)null;
            message.To = to;
            message.Content = content;

            return AddMessage(message);
        }

        public IEnumerable<ObjectId> GetUsersOfGroup(ObjectId? groupId)
        {
            return GroupsRepository.GetEntity(groupId.Value)?.IdsOfGroupMembers;
        }

        public IEnumerable<Group> GetUserGroups(ObjectId userId)
        {
            IEnumerable<Group> userGrops = (from g in GroupsRepository.GetAll()
                                            where g.IdsOfGroupMembers.Contains(userId)
                                            select g).ToList();
            return userGrops;
        }

        public Account[] GetUsersExcept(ObjectId id)
        {
            var res = AccountRepository.GetEntitiesByExpression(a => a.Id != id).ToArray();

            Array.ForEach(res, a =>
            {
                a.Password = null;
                a.Login = null;
            });

            return res;
        }
    }
}
