using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR.Transports;
using MongoDB.Bson;
using SignalR.ChatStorage.DTOs;
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

        public void SendChatData(string data)
        {
            Clients.Others.videoChatData(data);
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
                Clients.Group(_id.ToString())?.receiveMessage(message);
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

        public bool UpdateGroup(GroupDTO group)
        {
            var g = group.GetEntity();
            if (chatService.UpdateGroup(g, ConnectionToAccount[Context.ConnectionId].Id))
            {
                foreach (var id in chatService.GetUsersOfGroup(g.Id))
                {
                    Clients.Group(id.ToString())?.updateGroup(g);
                }
                return true;
            }
            return false;
        }

        public Account Update(Account account, string id)
        {
            account.Id = ObjectId.Parse(id);
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
                IdsOfGroupMembers = membersIds.Select(id => ObjectId.Parse(id)).ToList()
            };
            group.IdsOfGroupMembers.Add(ownerId);
            group = chatService.GroupsRepository.Add(group);
            foreach (var _id in group.IdsOfGroupMembers)
            {
                Clients.Group(_id.ToString())?.newGroup(group);
            }
            return true;
        }

        public string Register(Account account)
        {
            Account user;
            string res = chatService.RegisterNewAccount(account, out user);
            if ("OK" == res)
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
            Account user = chatService.Login(login, password);
            user.Password = null;
            user.Login = null;
            user.Connections = new List<Connection>();
            user.Connected = true;
            SetConnectionState(user.Id, true);

            ConnectionToAccount[Context.ConnectionId] = user;
            Groups.Add(Context.ConnectionId, user.Id.ToString());
            Account[] users = chatService.GetUsersExcept(user.Id);

            return new { Users = users, Groups = chatService.GetUserGroups(user.Id) };
        }
        public void Leave()
        {
            Account account;
            if (ConnectionToAccount.TryRemove(Context.ConnectionId, out account))
            {
                SetConnectionState(account.Id, false);
            }
        }

        private void SetConnectionState(ObjectId objectId, bool state) // add thred safe solution
        {
            Account update = chatService.AccountRepository.GetEntity(objectId);
            Connection connection = null;
            if (state)//join
            {
                var agent = HttpContext.Current?.Request.UserAgent;
                var ip = HttpContext.Current?.Request.ServerVariables["REMOTE_ADDR"];
                connection = update.Connections?.FirstOrDefault(c => c.Agent == agent && c.UserIP == ip);
                if (null == connection)
                {
                    connection = new Connection()
                    {
                        UserIP = ip,
                        Agent = agent,
                    };
                    if (update.Connections == null)
                        update.Connections = new List<Connection>();
                    update.Connections.Add(connection);
                }
            }
            else //leave
            {
                connection = update.Connections?.FirstOrDefault(c => c.ConnectionId == Context.ConnectionId);
            }

            connection.Connected = state;
            connection.ConnectionId = Context.ConnectionId;
            update.Connected = update.Connections.Any(c => c.Connected);

            chatService.AccountRepository.Update(update);
            Clients.All.userConnectedStateChanged(objectId, update.Connected);
        }
    }
}