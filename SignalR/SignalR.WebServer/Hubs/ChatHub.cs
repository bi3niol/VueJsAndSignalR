using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using MongoDB.Bson;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Services;
using SignalR.WebServer.Extentions;
using SignalR.WebServer.Hubs.Models;

namespace SignalR.WebServer.Hubs
{
    [HubName("chatHub")]
    public class ChatHub : Hub
    {
        private static ConcurrentDictionary<string, Account> ConnectionToAccount = new ConcurrentDictionary<string, Account>();
        private static ConcurrentDictionary<ObjectId, string> ObjIdToConnectionId = new ConcurrentDictionary<ObjectId, string>();

        private ChatService _accountService;
        private ChatService chatService
        {
            get
            {
                if (_accountService != null)
                    return _accountService;
                _accountService = new ChatService("SignalRChatDB");
                return _accountService;
            }
        }

        public void Send(string to, string content, bool isGroupMessage = false)
        {
            var id = ObjectId.Parse(to);
            var message = chatService.AddMessage(ConnectionToAccount[Context.ConnectionId].NickName,
                ConnectionToAccount[Context.ConnectionId].Id,
                id,
                content, 
                isGroupMessage);

            foreach (var _id in GetTargetUsers(message))
            {
                var targetConnectionId = "";
                if (ObjIdToConnectionId.TryGetValue(_id, out targetConnectionId))
                    Clients.Client(targetConnectionId)?.receiveMessage(message);
            }
        }

        private IEnumerable<ObjectId> GetTargetUsers(Message message)
        {
            if (message.GroupId == null)
                return new[] { message.From, message.To };
            IEnumerable<ObjectId> usersIds = chatService.GetUsersOfGroup(message.GroupId);
            return usersIds;
        }

        public async Task<Message[]> GetMessagesOfConversation(string partnerId, string lastMessageId, bool isGroupMessage)
        {
            ObjectId accountId = ObjectId.Parse(partnerId),
                messageId = string.IsNullOrEmpty(lastMessageId) ? ObjectId.Empty : ObjectId.Parse(lastMessageId);
            var res = await ConnectionToAccount[Context.ConnectionId].GetMessagesOfConversation(accountId, messageId, chatService, isGroupMessage);
            return res;
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            this.Leave();
            return base.OnDisconnected(stopCalled);
        }

        public Account Update(Account account)
        {
            if (ConnectionToAccount[Context.ConnectionId].Id != account.Id)
                return null;
            account.Connected = true;
            Account user = account;
            Account res = chatService.UpdateUser(account);
            if (ConnectionToAccount.TryGetValue(Context.ConnectionId, out user))
            {
                ConnectionToAccount.TryUpdate(Context.ConnectionId, new Account()
                {
                    Age = res.Age,
                    Id = res.Id,
                    NickName = res.NickName,
                    Connected = true
                }, user);

                ConnectionToAccount.TryGetValue(Context.ConnectionId, out user);
                Clients.Others.userUpdated(user);
            }

            return res;
        }

        public bool CreateGroup(string name, string[] membersIds)
        {
            var ownerId = ConnectionToAccount[Context.ConnectionId].Id;
            Group group = new Group()
            {
                OwnerId = ownerId,
                GroupName = name,
                IdsOfGroupMembers = membersIds.Select(id=>ObjectId.Parse(id)).ToList()
            };
            group.IdsOfGroupMembers.Add(ownerId);
            group = chatService.GroupsRepository.Add(group);
            foreach (var _id in group.IdsOfGroupMembers)
            {
                var targetConnectionId = "";
                if (ObjIdToConnectionId.TryGetValue(_id, out targetConnectionId))
                    Clients.Client(targetConnectionId)?.newGroup(group);
            }
            return true;
        }

        public string Register(Account account)
        {
            Account user;
            string res = chatService.RegisterNewAccount(account, out user);
            if ("OK"==res)
            {
                user.Password = null;
                user.Login = null;
                Clients.Others.newUser(user);
            }
            return res;
        }

        public dynamic Login(string login, string password)
        {
            var user = chatService.Login(login, password);
            return new
            {
                Success = user != null,
                Identity = user
            };
        }

        public dynamic Join(string login, string password)
        {
            Account user=chatService.Login(login, password);
            user.Password = null;
            user.Login = null;
            user.Connected = true;
            SetConnectionState(user.Id, true);

            ConnectionToAccount[Context.ConnectionId] = user;
            ObjIdToConnectionId[user.Id] = Context.ConnectionId;

            Account[] users = chatService.GetUsersExcept(user.Id);

            return new { Users = users, Groups = chatService.GetUserGroups(user.Id) };
        }
        public void Leave()
        {
            Account account;
            if (ConnectionToAccount.TryRemove(Context.ConnectionId, out account))
            {
                SetConnectionState(account.Id, false);
                ObjIdToConnectionId.TryRemove(account.Id, out var t);
            }
        }

        private void SetConnectionState(ObjectId objectId, bool state)
        {
            Account update = chatService.AccountRepository.GetEntity(objectId);
            update.Connected = state;
            chatService.AccountRepository.Update(update);

            Clients.All.userConnectedStateChanged(objectId, state);
        }
    }
}