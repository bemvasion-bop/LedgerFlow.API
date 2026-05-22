using Bogus;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace LedgerFlow.API.Services
{
    /// <summary>
    /// Comprehensive database seeding service for SpendSync demo/presentation environment.
    /// Generates realistic demo data for companies, users, expenses, reimbursements, audit logs, and more.
    /// </summary>
    public class DatabaseSeeder
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DatabaseSeeder> _logger;
        private readonly Random _random = new Random(42); // Fixed seed for reproducibility

        // Filipino names for realistic demo data
        private readonly string[] _filipinoFirstNames = new[]
        {
            "Maria", "Jose", "Juan", "Ana", "Pedro", "Rosa", "Miguel", "Carmen", "Luis", "Sofia",
            "Carlos", "Isabel", "Ramon", "Teresa", "Antonio", "Elena", "Francisco", "Luz", "Manuel", "Gloria",
            "Ricardo", "Cristina", "Roberto", "Patricia", "Fernando", "Angela", "Eduardo", "Margarita", "Jorge", "Beatriz",
            "Rafael", "Victoria", "Alejandro", "Catalina", "Diego", "Dolores", "Gabriel", "Rosario", "Javier", "Pilar"
        };

        private readonly string[] _filipinoLastNames = new[]
        {
            "Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Torres", "Lopez", "Gonzales", "Rodriguez",
            "Perez", "Flores", "Rivera", "Ramos", "Castillo", "Aquino", "Fernandez", "Valdez", "Villanueva", "Santiago",
            "Morales", "Diaz", "Hernandez", "Castro", "Navarro", "Gutierrez", "Chavez", "Ortiz", "Romero", "Aguilar",
            "Jimenez", "Vargas", "Salazar", "Medina", "Rojas", "Delgado", "Herrera", "Silva", "Molina", "Campos"
        };

        private readonly string[] _companyNames = new[]
        {
            "NovaCore Solutions Inc.",
            "BrightPath Logistics",
            "Zenith Holdings Corporation",
            "BluePeak Marketing Group",
            "Vertex Digital Systems",
            "GreenField Trading",
            "Apex Manufacturing Corp.",
            "Skyline Construction Group"
        };

        private readonly string[] _expenseCategories = new[]
        {
            "Transportation", "Office Supplies", "Meals", "Fuel", "Software Subscription",
            "Internet", "Utilities", "Client Entertainment", "Travel", "Training & Seminar"
        };

        private readonly string[] _expenseDescriptions = new[]
        {
            "Client dinner at restaurant", "Taxi fare to office", "Office supplies purchase",
            "Hotel booking for business trip", "Internet reimbursement", "Fuel for company vehicle",
            "Software license renewal", "Team lunch meeting", "Conference registration fee",
            "Flight to Manila", "Parking fee", "Office equipment", "Training materials",
            "Client meeting expenses", "Transportation allowance", "Mobile data reimbursement",
            "Printer supplies", "Coffee for team meeting", "Business cards printing",
            "Courier service", "Office furniture", "Computer accessories", "Stationery items",
            "Team building expenses", "Professional development course"
        };

        private readonly string[] _rejectionReasons = new[]
        {
            "No receipt attached", "Duplicate expense", "Invalid amount",
            "Policy violation", "Missing details", "Exceeds budget limit",
            "Not a business expense", "Receipt unclear", "Incorrect category",
            "Requires additional approval"
        };

        private readonly string[] _auditActions = new[]
        {
            "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT",
            "REIMBURSE", "UPLOAD_RECEIPT", "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_COMPLETED"
        };

        public DatabaseSeeder(AppDbContext context, ILogger<DatabaseSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Main seeding method - seeds all demo data
        /// </summary>
        public async Task SeedDemoDataAsync()
        {
            _logger.LogInformation("🌱 Starting comprehensive database seeding for SpendSync demo environment...");

            try
            {
                // Check if already seeded
                if (await _context.Companies.CountAsync() > 1)
                {
                    _logger.LogInformation("⚠️ Database already contains demo data. Skipping seeding.");
                    return;
                }

                // Ensure plans and roles exist
                await EnsurePlansAndRolesAsync();

                // Seed companies
                var companies = await SeedCompaniesAsync();
                _logger.LogInformation($"✅ Seeded {companies.Count} companies");

                // Seed users for each company
                var allUsers = new List<User>();
                foreach (var company in companies)
                {
                    var users = await SeedUsersForCompanyAsync(company);
                    allUsers.AddRange(users);
                }
                _logger.LogInformation($"✅ Seeded {allUsers.Count} users across all companies");

                // Seed expenses
                var expenses = await SeedExpensesAsync(allUsers, companies);
                _logger.LogInformation($"✅ Seeded {expenses.Count} expenses");

                // Seed receipts for some expenses
                await SeedReceiptsAsync(expenses);
                _logger.LogInformation($"✅ Seeded receipts for expenses");

                // Seed approvals
                await SeedApprovalsAsync(expenses, allUsers);
                _logger.LogInformation($"✅ Seeded approval history");

                // Seed audit logs
                await SeedAuditLogsAsync(allUsers, companies);
                _logger.LogInformation($"✅ Seeded audit logs");

                // Seed notifications
                await SeedNotificationsAsync(allUsers);
                _logger.LogInformation($"✅ Seeded notifications");

                _logger.LogInformation("🎉 Database seeding completed successfully!");
                _logger.LogInformation("📊 Demo environment is ready for presentation!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error during database seeding");
                throw;
            }
        }

        private async Task EnsurePlansAndRolesAsync()
        {
            // Ensure plans exist
            if (!await _context.Plans.AnyAsync())
            {
                _context.Plans.AddRange(
                    new Plan
                    {
                        Name = "Starter",
                        MaxUsers = 10,
                        MaxExpensesPerMonth = 100,
                        CanUploadReceipt = true,
                        HasAdvancedReports = false,
                        HasDepartmentAnalytics = false,
                        QuarterlyPrice = 2999.00m,
                        YearlyPrice = 9999.00m
                    },
                    new Plan
                    {
                        Name = "Business",
                        MaxUsers = -1,
                        MaxExpensesPerMonth = -1,
                        CanUploadReceipt = true,
                        HasAdvancedReports = true,
                        HasDepartmentAnalytics = true,
                        QuarterlyPrice = 7999.00m,
                        YearlyPrice = 24999.00m
                    }
                );
                await _context.SaveChangesAsync();
            }

            // Ensure roles exist
            if (!await _context.Roles.AnyAsync())
            {
                _context.Roles.AddRange(
                    new Role { RoleName = "SuperAdmin" },
                    new Role { RoleName = "Admin" },
                    new Role { RoleName = "Finance" },
                    new Role { RoleName = "Employee" },
                    new Role { RoleName = "Audit" }
                );
                await _context.SaveChangesAsync();
            }

            // Ensure categories exist
            if (!await _context.Categories.AnyAsync())
            {
                _context.Categories.AddRange(_expenseCategories.Select(cat => new Category
                {
                    Name = cat,
                    Description = $"{cat} related expenses",
                    CreatedAt = DateTime.UtcNow
                }));
                await _context.SaveChangesAsync();
            }
        }

        private async Task<List<Company>> SeedCompaniesAsync()
        {
            var companies = new List<Company>();
            var starterPlan = await _context.Plans.FirstAsync(p => p.Name == "Starter");
            var businessPlan = await _context.Plans.FirstAsync(p => p.Name == "Business");

            for (int i = 0; i < _companyNames.Length; i++)
            {
                var isStarter = i < 4; // First 4 are Starter, rest are Business
                var plan = isStarter ? starterPlan : businessPlan;

                // Special case: BrightPath Logistics (Starter) - leave at 9 users for testing
                var isBrightPath = _companyNames[i] == "BrightPath Logistics";

                var company = new Company
                {
                    Name = _companyNames[i],
                    Email = $"contact@{_companyNames[i].ToLower().Replace(" ", "").Replace(".", "")}.com",
                    Phone = $"+63{_random.Next(900, 999)}{_random.Next(1000000, 9999999)}",
                    Address = $"{_random.Next(100, 999)} {GetRandomStreet()}, {GetRandomCity()}, Philippines",
                    ContactPerson = GetRandomFullName(),
                    PlanId = plan.Id,
                    BillingCycle = _random.Next(0, 2) == 0 ? "Quarterly" : "Yearly",
                    SubscriptionStatus = "Active",
                    MaxUsers = isStarter ? 10 : -1,
                    SubscriptionStartedAt = DateTime.UtcNow.AddMonths(-_random.Next(1, 12)),
                    SubscriptionExpiresAt = DateTime.UtcNow.AddMonths(_random.Next(3, 12)),
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow.AddMonths(-_random.Next(1, 24)),
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Companies.Add(company);
                companies.Add(company);
            }

            await _context.SaveChangesAsync();

            // Seed departments for Business plan companies
            foreach (var company in companies.Where(c => c.PlanId == businessPlan.Id))
            {
                await SeedDepartmentsForCompanyAsync(company);
            }

            return companies;
        }

        private async Task SeedDepartmentsForCompanyAsync(Company company)
        {
            var departments = new[]
            {
                new Department { Name = "Finance", Description = "Financial operations and accounting", CompanyId = company.Id, IsActive = true },
                new Department { Name = "Human Resources", Description = "HR and employee management", CompanyId = company.Id, IsActive = true },
                new Department { Name = "Operations", Description = "Day-to-day operations", CompanyId = company.Id, IsActive = true },
                new Department { Name = "Marketing", Description = "Marketing and communications", CompanyId = company.Id, IsActive = true },
                new Department { Name = "IT", Description = "Information technology", CompanyId = company.Id, IsActive = true },
                new Department { Name = "Sales", Description = "Sales and business development", CompanyId = company.Id, IsActive = true }
            };

            _context.Departments.AddRange(departments);
            await _context.SaveChangesAsync();
        }

        private async Task<List<User>> SeedUsersForCompanyAsync(Company company)
        {
            var users = new List<User>();
            var plan = await _context.Plans.FindAsync(company.PlanId);
            var isStarter = plan?.Name == "Starter";
            var isBrightPath = company.Name == "BrightPath Logistics";

            // Get roles
            var adminRole = await _context.Roles.FirstAsync(r => r.RoleName == "Admin");
            var employeeRole = await _context.Roles.FirstAsync(r => r.RoleName == "Employee");
            var financeRole = await _context.Roles.FirstAsync(r => r.RoleName == "Finance");
            var auditRole = await _context.Roles.FirstAsync(r => r.RoleName == "Audit");

            // Get departments (if Business plan)
            var departments = await _context.Departments.Where(d => d.CompanyId == company.Id).ToListAsync();

            // Determine user count
            int userCount;
            if (isBrightPath)
            {
                userCount = 9; // Special case: leave at 9 for testing 10th user limit
            }
            else if (isStarter)
            {
                userCount = 10; // Other Starter companies get full 10 users
            }
            else
            {
                userCount = _random.Next(12, 18); // Business companies get 12-18 users
            }

            // Create Admin user
            var admin = CreateUser(company, adminRole, null, "Admin");
            users.Add(admin);

            // Create Finance user (Business plan only)
            if (!isStarter && userCount > 1)
            {
                var finance = CreateUser(company, financeRole, departments.FirstOrDefault(d => d.Name == "Finance"), "Finance");
                users.Add(finance);
            }

            // Create Auditor (Business plan only)
            if (!isStarter && userCount > 2)
            {
                var auditor = CreateUser(company, auditRole, departments.FirstOrDefault(d => d.Name == "Finance"), "Auditor");
                users.Add(auditor);
            }

            // Create remaining employees
            int employeesToCreate = userCount - users.Count;
            for (int i = 0; i < employeesToCreate; i++)
            {
                var department = departments.Any() ? departments[_random.Next(departments.Count)] : null;
                var employee = CreateUser(company, employeeRole, department, "Employee");
                users.Add(employee);
            }

            _context.Users.AddRange(users);
            await _context.SaveChangesAsync();

            return users;
        }

        private User CreateUser(Company company, Role role, Department? department, string roleType)
        {
            var firstName = _filipinoFirstNames[_random.Next(_filipinoFirstNames.Length)];
            var lastName = _filipinoLastNames[_random.Next(_filipinoLastNames.Length)];
            var email = $"{firstName.ToLower()}.{lastName.ToLower()}@{company.Name.ToLower().Replace(" ", "").Replace(".", "")}.com";

            // Ensure unique email
            int suffix = 1;
            var baseEmail = email;
            while (_context.Users.AsEnumerable().Any(u => u.Email == email))
            {
                email = baseEmail.Replace("@", $"{suffix}@");
                suffix++;
            }

            return new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                Phone = $"+63{_random.Next(900, 999)}{_random.Next(1000000, 9999999)}",
                RoleId = role.Id,
                CompanyId = company.Id,
                DepartmentId = department?.Id,
                IsVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-_random.Next(1, 12)),
                UpdatedAt = DateTime.UtcNow
            };
        }

        private async Task<List<Expense>> SeedExpensesAsync(List<User> allUsers, List<Company> companies)
        {
            var expenses = new List<Expense>();
            var categories = await _context.Categories.ToListAsync();
            var employeeRole = await _context.Roles.FirstAsync(r => r.RoleName == "Employee");
            var employees = allUsers.Where(u => u.RoleId == employeeRole.Id).ToList();

            // Generate 100-150 expenses
            int expenseCount = _random.Next(100, 151);

            for (int i = 0; i < expenseCount; i++)
            {
                var employee = employees[_random.Next(employees.Count)];
                var category = categories[_random.Next(categories.Count)];
                var submittedDate = DateTime.UtcNow.AddDays(-_random.Next(1, 90));

                // Determine status (20% Pending, 30% Approved, 15% Rejected, 35% Reimbursed)
                var statusRoll = _random.Next(100);
                string status;
                DateTime? approvedAt = null;
                DateTime? reimbursedAt = null;
                string? rejectionReason = null;

                if (statusRoll < 20)
                {
                    status = "Pending";
                }
                else if (statusRoll < 50)
                {
                    status = "Approved";
                    approvedAt = submittedDate.AddDays(_random.Next(1, 5));
                }
                else if (statusRoll < 65)
                {
                    status = "Rejected";
                    rejectionReason = _rejectionReasons[_random.Next(_rejectionReasons.Length)];
                }
                else
                {
                    status = "Reimbursed";
                    approvedAt = submittedDate.AddDays(_random.Next(1, 5));
                    reimbursedAt = approvedAt.Value.AddDays(_random.Next(1, 7));
                }

                var expense = new Expense
                {
                    UserId = employee.Id,
                    CompanyId = employee.CompanyId,
                    Amount = GenerateRealisticAmount(category.Name),
                    Description = _expenseDescriptions[_random.Next(_expenseDescriptions.Length)],
                    Category = category.Name,
                    CategoryId = category.Id,
                    Status = status,
                    SubmittedAt = submittedDate,
                    ApprovedAt = approvedAt,
                    ReimbursedAt = reimbursedAt,
                    RejectionReason = rejectionReason
                };

                expenses.Add(expense);
            }

            _context.Expenses.AddRange(expenses);
            await _context.SaveChangesAsync();

            return expenses;
        }

        private async Task SeedReceiptsAsync(List<Expense> expenses)
        {
            // Add receipts to 70% of expenses
            var expensesWithReceipts = expenses.OrderBy(x => _random.Next()).Take((int)(expenses.Count * 0.7)).ToList();

            foreach (var expense in expensesWithReceipts)
            {
                var receipt = new Receipt
                {
                    ExpenseId = expense.Id,
                    FileName = $"receipt_{expense.Id}_{_random.Next(1000, 9999)}.pdf",
                    FileUrl = $"/uploads/receipts/receipt_{expense.Id}_{Guid.NewGuid()}.pdf",
                    ContentType = "application/pdf",
                    FileSize = _random.Next(50000, 500000),
                    UploadedAt = expense.SubmittedAt.AddMinutes(_random.Next(1, 60))
                };

                _context.Receipts.Add(receipt);
            }

            await _context.SaveChangesAsync();
        }

        private async Task SeedApprovalsAsync(List<Expense> expenses, List<User> allUsers)
        {
            var approvedOrRejectedExpenses = expenses.Where(e => e.Status == "Approved" || e.Status == "Rejected" || e.Status == "Reimbursed").ToList();

            foreach (var expense in approvedOrRejectedExpenses)
            {
                // Find appropriate approver (Admin or Finance from same company)
                var approver = allUsers.FirstOrDefault(u =>
                    u.CompanyId == expense.CompanyId &&
                    (u.Role?.RoleName == "Admin" || u.Role?.RoleName == "Finance"));

                if (approver != null)
                {
                    var approval = new Approval
                    {
                        ExpenseId = expense.Id,
                        ApprovedBy = approver.Id,
                        Status = expense.Status == "Rejected" ? "Rejected" : "Approved",
                        Remarks = expense.Status == "Rejected" ? expense.RejectionReason : "Approved for reimbursement",
                        CreatedAt = expense.ApprovedAt ?? expense.SubmittedAt.AddDays(1)
                    };

                    _context.Approvals.Add(approval);
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task SeedAuditLogsAsync(List<User> allUsers, List<Company> companies)
        {
            var auditLogs = new List<AuditLog>();

            // Generate 200-300 audit logs
            int logCount = _random.Next(200, 301);

            for (int i = 0; i < logCount; i++)
            {
                var user = allUsers[_random.Next(allUsers.Count)];
                var action = _auditActions[_random.Next(_auditActions.Length)];
                var entity = DetermineEntity(action);

                var auditLog = new AuditLog
                {
                    UserId = user.Id,
                    CompanyId = user.CompanyId,
                    Action = action,
                    Entity = entity,
                    EntityId = _random.Next(1, 100).ToString(),
                    Timestamp = DateTime.UtcNow.AddDays(-_random.Next(1, 90))
                };

                auditLogs.Add(auditLog);
            }

            _context.AuditLogs.AddRange(auditLogs);
            await _context.SaveChangesAsync();
        }

        private async Task SeedNotificationsAsync(List<User> allUsers)
        {
            var notifications = new List<Notification>();

            // Create notifications for admins and some employees
            var adminsAndFinance = allUsers.Where(u => u.Role?.RoleName == "Admin" || u.Role?.RoleName == "Finance").ToList();

            foreach (var user in adminsAndFinance)
            {
                // 3-5 notifications per admin/finance user
                int notifCount = _random.Next(3, 6);

                for (int i = 0; i < notifCount; i++)
                {
                    var isRead = _random.Next(0, 2) == 0;
                    var createdAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30));

                    var notification = new Notification
                    {
                        UserId = user.Id,
                        Title = GetRandomNotificationTitle(),
                        Message = GetRandomNotificationMessage(),
                        Type = GetRandomNotificationType(),
                        IsRead = isRead,
                        ReadAt = isRead ? createdAt.AddHours(_random.Next(1, 48)) : null,
                        CreatedAt = createdAt
                    };

                    notifications.Add(notification);
                }
            }

            // Add some notifications for employees
            var employees = allUsers.Where(u => u.Role?.RoleName == "Employee").Take(20).ToList();
            foreach (var employee in employees)
            {
                var isRead = _random.Next(0, 2) == 0;
                var createdAt = DateTime.UtcNow.AddDays(-_random.Next(1, 15));

                var notification = new Notification
                {
                    UserId = employee.Id,
                    Title = "Expense Status Update",
                    Message = GetEmployeeNotificationMessage(),
                    Type = "ExpenseUpdate",
                    IsRead = isRead,
                    ReadAt = isRead ? createdAt.AddHours(_random.Next(1, 24)) : null,
                    CreatedAt = createdAt
                };

                notifications.Add(notification);
            }

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        // Helper methods
        private decimal GenerateRealisticAmount(string category)
        {
            return category switch
            {
                "Transportation" => _random.Next(50, 500),
                "Office Supplies" => _random.Next(100, 1000),
                "Meals" => _random.Next(200, 800),
                "Fuel" => _random.Next(500, 2000),
                "Software Subscription" => _random.Next(500, 5000),
                "Internet" => _random.Next(1000, 3000),
                "Utilities" => _random.Next(1000, 5000),
                "Client Entertainment" => _random.Next(1000, 5000),
                "Travel" => _random.Next(2000, 15000),
                "Training & Seminar" => _random.Next(3000, 10000),
                _ => _random.Next(100, 1000)
            };
        }

        private string DetermineEntity(string action)
        {
            return action switch
            {
                "LOGIN" or "LOGOUT" => "Auth",
                "CREATE" or "UPDATE" or "DELETE" => "Expense",
                "APPROVE" or "REJECT" => "Expense",
                "REIMBURSE" => "Expense",
                "UPLOAD_RECEIPT" => "Receipt",
                "PASSWORD_RESET_REQUESTED" or "PASSWORD_RESET_COMPLETED" => "User",
                _ => "System"
            };
        }

        private string GetRandomFullName()
        {
            return $"{_filipinoFirstNames[_random.Next(_filipinoFirstNames.Length)]} {_filipinoLastNames[_random.Next(_filipinoLastNames.Length)]}";
        }

        private string GetRandomStreet()
        {
            var streets = new[] { "Ayala Avenue", "Makati Avenue", "EDSA", "Ortigas Avenue", "Bonifacio Drive", "Roxas Boulevard", "Taft Avenue", "España Boulevard" };
            return streets[_random.Next(streets.Length)];
        }

        private string GetRandomCity()
        {
            var cities = new[] { "Makati City", "Manila", "Quezon City", "Pasig City", "Taguig City", "Mandaluyong City", "Pasay City", "Parañaque City" };
            return cities[_random.Next(cities.Length)];
        }

        private string GetRandomNotificationTitle()
        {
            var titles = new[]
            {
                "New Expense Submitted",
                "Expense Approved",
                "Expense Rejected",
                "Reimbursement Processed",
                "Subscription Renewal",
                "System Update",
                "New User Added",
                "Monthly Report Available"
            };
            return titles[_random.Next(titles.Length)];
        }

        private string GetRandomNotificationMessage()
        {
            var messages = new[]
            {
                "A new expense has been submitted and requires your approval.",
                "An expense has been approved and is ready for reimbursement.",
                "An expense has been rejected. Please review the details.",
                "A reimbursement has been processed successfully.",
                "Your subscription will renew in 7 days.",
                "System maintenance scheduled for this weekend.",
                "A new user has been added to your company.",
                "Your monthly expense report is now available."
            };
            return messages[_random.Next(messages.Length)];
        }

        private string GetEmployeeNotificationMessage()
        {
            var messages = new[]
            {
                "Your expense has been approved and will be reimbursed soon.",
                "Your expense has been rejected. Please check the reason and resubmit if needed.",
                "Your reimbursement has been processed and will be credited to your account.",
                "Your expense is pending approval from your manager."
            };
            return messages[_random.Next(messages.Length)];
        }

        private string GetRandomNotificationType()
        {
            var types = new[] { "ExpenseUpdate", "System", "Billing", "Security", "General" };
            return types[_random.Next(types.Length)];
        }
    }
}
