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
    [CollectionName("Messages")]
    public partial class Message : Entity<ObjectId>
    {
        public DateTime MessageSentOn { get; set; }
        public string Content { get; set; }

        public ObjectId From { get; set; }
        public ObjectId To { get; set; }
    }
}
