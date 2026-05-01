using System.Text.Json.Serialization;

namespace LedgerFlow.API.Models 
{

    public class Expense
    {
        public int Id {get; set; }
        public int UserId {get; set; }
        public decimal Amount {get; set; }
        public string Description {get; set; }
        public string Category {get; set; }
        public string Status {get; set; }

        [JsonIgnore]
        public User? User {get; set; }
        
     }

}