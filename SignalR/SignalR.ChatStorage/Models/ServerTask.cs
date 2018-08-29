using Common.Model;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.Models
{
    public class ServerTask : Entity<ObjectId>
    {
        public enum TaskType
        {
            UserUpdated,
        }
        public enum TaskStatus
        {
            New,
            Completed
        }
        public TaskStatus Status { get; set; }
        public TaskType Type { get; set; }
        public ObjectId ObjectId { get; set; }
        public override string ToString()
        {
            return $"Task[({Id}) : Type({Type}) : Status({Status}) : ObjectId({ObjectId})]";
        }
    }
}
