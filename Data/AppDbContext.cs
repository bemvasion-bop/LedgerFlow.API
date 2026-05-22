using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using LedgerFlow.API.Models;

namespace LedgerFlow.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // ── Multi-tenant tables ──────────────────────────────────────────────
        public DbSet<Plan>    Plans     { get; set; }
        public DbSet<Company> Companies { get; set; }

        // ── Core tables ──────────────────────────────────────────────────────
        public DbSet<User>       Users       { get; set; }
        public DbSet<Role>       Roles       { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Expense>    Expenses    { get; set; }
        public DbSet<Receipt>    Receipts    { get; set; }
        public DbSet<AuditLog>   AuditLogs   { get; set; }
        public DbSet<Category>   Categories  { get; set; }
        public DbSet<Approval>   Approvals   { get; set; }
        public DbSet<SubscriptionCancellationRequest> SubscriptionCancellationRequests { get; set; }
        public DbSet<SubscriptionRequest> SubscriptionRequests { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SuperAdminSettings> SuperAdminSettings { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Suppress the PendingModelChanges warning so migrations can run
            // while the API process is running (file-lock scenario)
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── Plan ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Plan>()
                .Property(p => p.Name)
                .HasMaxLength(50);

            modelBuilder.Entity<Plan>()
                .Property(p => p.QuarterlyPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Plan>()
                .Property(p => p.YearlyPrice)
                .HasPrecision(18, 2);

            // ── Company ──────────────────────────────────────────────────────
            modelBuilder.Entity<Company>()
                .HasOne(c => c.Plan)
                .WithMany()
                .HasForeignKey(c => c.PlanId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .Property(c => c.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");

            // ── User ─────────────────────────────────────────────────────────
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany()
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany()
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Department)
                .WithMany()
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            // ── Department ───────────────────────────────────────────────────
            modelBuilder.Entity<Department>()
                .HasOne(d => d.Company)
                .WithMany()
                .HasForeignKey(d => d.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Department>()
                .HasIndex(d => d.CompanyId);

            // ── Expense ──────────────────────────────────────────────────────
            modelBuilder.Entity<Expense>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Expense>()
                .HasMany(e => e.Receipts)
                .WithOne(r => r.Expense)
                .HasForeignKey(r => r.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.CategoryRef)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            // CompanyId index for fast tenant filtering
            modelBuilder.Entity<Expense>()
                .HasIndex(e => e.CompanyId);

            // ── AuditLog ─────────────────────────────────────────────────────
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.CompanyId);

            // ── Approval ─────────────────────────────────────────────────────
            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Expense)
                .WithMany()
                .HasForeignKey(a => a.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Approver)
                .WithMany()
                .HasForeignKey(a => a.ApprovedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // ── SubscriptionCancellationRequest ──────────────────────────────
            modelBuilder.Entity<SubscriptionCancellationRequest>()
                .HasOne(s => s.Company)
                .WithMany()
                .HasForeignKey(s => s.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubscriptionCancellationRequest>()
                .HasOne(s => s.RequestedByUser)
                .WithMany()
                .HasForeignKey(s => s.RequestedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubscriptionCancellationRequest>()
                .HasOne(s => s.ReviewedByUser)
                .WithMany()
                .HasForeignKey(s => s.ReviewedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            modelBuilder.Entity<SubscriptionCancellationRequest>()
                .HasIndex(s => s.CompanyId);

            modelBuilder.Entity<SubscriptionCancellationRequest>()
                .HasIndex(s => s.Status);

            // ── SubscriptionRequest ──────────────────────────────────────────
            modelBuilder.Entity<SubscriptionRequest>()
                .HasOne(s => s.Company)
                .WithMany()
                .HasForeignKey(s => s.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubscriptionRequest>()
                .HasOne(s => s.RequestedByUser)
                .WithMany()
                .HasForeignKey(s => s.RequestedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubscriptionRequest>()
                .HasOne(s => s.ReviewedByUser)
                .WithMany()
                .HasForeignKey(s => s.ReviewedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            modelBuilder.Entity<SubscriptionRequest>()
                .HasIndex(s => s.CompanyId);

            modelBuilder.Entity<SubscriptionRequest>()
                .HasIndex(s => s.Status);

            modelBuilder.Entity<SubscriptionRequest>()
                .HasIndex(s => s.RequestedAt);

            // ── Notification ─────────────────────────────────────────────────
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.UserId);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.IsRead);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);

            // ── SuperAdminSettings ───────────────────────────────────────────
            modelBuilder.Entity<SuperAdminSettings>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SuperAdminSettings>()
                .HasIndex(s => s.UserId)
                .IsUnique();
        }
    }
}
