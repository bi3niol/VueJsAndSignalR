using Common.Model;
using Common.MongoDB.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.Models
{
    [CollectionName("Accounts")]
    public partial class Account : Entity<ObjectId>
    {
        public bool Connected { get; set; }
        public string NickName { get; set; }
        public string Login { get; set; }
        public int Age { get; set; }
        public string Password { get; set; }
        public List<Connection> Connections { get; set; } = new List<Connection>();
    }

    public class Connection
    {
        public string ConnectionId { get; set; }
        public string Agent { get; set; }
        public string UserIP { get; set; }
        public bool Connected { get; set; }
    }
}
