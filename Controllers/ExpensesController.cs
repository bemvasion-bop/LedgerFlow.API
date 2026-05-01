using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;


namespace LedgerFlow.API.Controllers
{

    [ApiController]
    [Route("api/[Controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExpensesController(AppDbContext context)
        {
            _context = context;
        }

        //GET: api/expenses
        [Authorize]
        [HttpGet]
        public IActionResult GetExpenses()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var roleClaim = User.FindFirst(ClaimTypes.Role);

            if (userIdClaim == null || roleClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim.Value);
            var role = roleClaim.Value;

            // 🔥 ADMIN → GET ALL
            if (role == "Admin" || role == "Finance")
            {
                var allExpenses = _context.Expenses.ToList();
                return Ok(allExpenses);
            }

            // 👤 EMPLOYEE → OWN ONLY
            var expenses = _context.Expenses
                .Where(e => e.UserId == userId)
                .ToList();

            return Ok(expenses);
        }

        //POST: api/expenses
        [Authorize]
        [HttpPost]
        public IActionResult CreateExpense(Expense expense)
        {

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
                return Unauthorized("user not found");

            var userId = int.Parse(userIdClaim.Value);

            expense.UserId = userId;

            _context.Expenses.Add(expense);
            _context.SaveChanges();

            LogAction(userId, "CREATE", "Expense");

            return Ok(expense);
        }


        [HttpPut("{id}")]
        public IActionResult UpdateExpense(int id, Expense updatedExpense)
        {
            var expense = _context.Expenses.FirstOrDefault(e =>e.Id == id);

            if (expense == null)
                return NotFound();

            expense.Amount = updatedExpense.Amount;
            expense.Description = updatedExpense.Description;
            expense.Category = updatedExpense.Category;
            expense.Status = updatedExpense.Status;
            expense.UserId = updatedExpense.UserId;

            _context.SaveChanges();

            return Ok(expense);
        }
        
        [HttpDelete("{id}")]
        public IActionResult DeleteExpense(int id)
        {
            var expense = _context.Expenses.FirstOrDefault(e=> e.Id == id);

            if (expense == null)
                return NotFound();

            _context.Expenses.Remove(expense);
            _context.SaveChanges();

            LogAction(expense.UserId, "DELETE", "Expense");

            return Ok("Deleted Successfully");

        } 

        [Authorize(Roles = "Admin")]
        [HttpPut("approve/{id}")]
        public IActionResult ApproveExpense(int id)
        {
            var expense = _context.Expenses.FirstOrDefault(e => e.Id == id);

            if (expense == null)
                return NotFound("Expense not found");

            // ✅ Update status
            expense.Status = "Approved";

            _context.SaveChanges();

            // ✅ Log action
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null)
            {
                var userId = int.Parse(userIdClaim.Value);
                LogAction(userId, "APPROVE", "Expense");
            }

            return Ok("Expense approved successfully");
        }

        [Authorize]
        [HttpPut("reimburse/{id}")]
        public IActionResult ReimburseExpense(int id)
        {
            var expense = _context.Expenses.FirstOrDefault(e => e.Id == id);

            if (expense == null)
                return NotFound("Expense not found");

            if (expense.Status != "Approved")
                return BadRequest("Only approved expenses can be reimbursed");

            expense.Status = "Reimbursed";

            _context.SaveChanges();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null)
            {
                var userId = int.Parse(userIdClaim.Value);
                LogAction(userId, "REIMBURSE", "Expense");
            }

            return Ok("Expense reimbursed successfully");
        }

        private void LogAction(int userId, string action, string entity)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                Entity = entity,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            _context.SaveChanges();
        }
    }   


}
