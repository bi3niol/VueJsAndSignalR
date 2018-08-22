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
    [CollectionName("Groups")]
    public partial class Group : Entity<ObjectId>
    {
        public ObjectId OwnerId { get; set; }
        public string GroupName { get; set; }

        public List<ObjectId> GroupUsers { get; set; }
    }
}
