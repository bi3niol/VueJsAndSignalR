using MongoDB.Bson;
using SignalR.ChatStorage.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.DTOs
{
    public class GroupDTO : EntityDTO<Group>
    {
        public string Id { get; set; }
        public string OwnerId { get; set; }
        public string GroupName { get; set; }
        public List<string> IdsOfGroupMembers { get; set; }

        public override Group GetEntity()
        {
            return new Group()
            {
                Id = ObjectId.Parse(Id),
                OwnerId = ObjectId.Parse(OwnerId),
                GroupName = GroupName,
                IdsOfGroupMembers = IdsOfGroupMembers.Select(e => ObjectId.Parse(e)).ToList()
            };
        }
    }
}
