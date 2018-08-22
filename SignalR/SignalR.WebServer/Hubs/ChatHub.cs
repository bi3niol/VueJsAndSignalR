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
        private ChatService AccountService
        {
            get
            {
                if (_accountService != null)
                    return _accountService;
                _accountService = new ChatService("SignalRChatDB");
                return _accountService;
            }
        }

        public void Send(string to, string content)
        {
            var id = ObjectId.Parse(to);
            var message = AccountService.AddMessage(ConnectionToAccount[Context.ConnectionId].Id, id, content);

            Clients.Caller.receiveMessage(message);
            var targetConnectionId = "";
            if (ObjIdToConnectionId.TryGetValue(id, out targetConnectionId))
                Clients.Client(targetConnectionId).receiveMessage(message);
        }

        public async Task<Message[]> GetMessagesOfConversation(string partnerId, string lastMessageId, bool issGroupMessage)
        {
            ObjectId accountId = ObjectId.Parse(partnerId),
                messageId = string.IsNullOrEmpty(lastMessageId) ? ObjectId.Empty : ObjectId.Parse(lastMessageId);
            var res = await ConnectionToAccount[Context.ConnectionId].GetMessagesOfConversation(accountId, messageId, AccountService);
            return res;
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            this.Leave();
            return base.OnDisconnected(stopCalled);
        }

        public Account Update(Account account)
        {
            Account user = account;

            //if (ConnectedUsers.TryGetValue(Context.ConnectionId, out user))
            //{
            //    ConnectedUsers.TryUpdate(Context.ConnectionId, new Account()
            //    {
            //        Age = userData.Age,
            //        Id = Context.ConnectionId,
            //        NickName = userData.NickName
            //    }, user);

            //    ConnectedUsers.TryGetValue(Context.ConnectionId, out user);
            //    Clients.Others.userUpdated(user);
            //}

            return user;
        }

        public dynamic Join(Account userData)
        {
            Account user = AccountService.Login(userData.NickName);
            if (user == null)
            {
                user = AccountService.RegisterNewAccount(userData);
                user.Connected = true;
                Clients.Others.newUser(user);
            }

            user.Password = null;
            user.Connected = true;
            SetConnectionState(user.Id, true);

            ConnectionToAccount[Context.ConnectionId] = user;
            ObjIdToConnectionId[user.Id] = Context.ConnectionId;

            Account[] users = AccountService.GetUsersExcept(user.Id);

            return new { Identity = user, Users = users };
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
            Account update = AccountService.AccountRepository.GetEntity(objectId);
            update.Connected = state;
            AccountService.AccountRepository.Update(update);

            Clients.All.userConnectedStateChanged(objectId, state);
        }
    }
}