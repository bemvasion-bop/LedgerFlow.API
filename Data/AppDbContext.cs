using Microsoft.EntityFrameworkCore;
using LedgerFlow.API.Models;


namespace LedgerFlow.API.Data
{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) 
                    : base(options)

                {
                }

                public DbSet<User> Users {get; set; }
                public DbSet<Role> Roles {get; set; }
                public DbSet<Expense> Expenses {get; set; }
                public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Expense>()
                        .Property(e=> e.Amount)
                        .HasPrecision(18, 2);
        }
    }

}