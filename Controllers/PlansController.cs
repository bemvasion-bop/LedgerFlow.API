using LedgerFlow.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PlansController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all available subscription plans
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var plans = await _context.Plans.ToListAsync();
            return Ok(plans);
        }

        /// <summary>
        /// Get a specific plan by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var plan = await _context.Plans.FindAsync(id);
            return plan == null ? NotFound() : Ok(plan);
        }
    }
}
