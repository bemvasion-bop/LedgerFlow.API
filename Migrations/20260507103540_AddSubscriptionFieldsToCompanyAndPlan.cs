using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LedgerFlow.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionFieldsToCompanyAndPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns to Plans table
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Plans",
                type: "datetime2",
                nullable: false,
                defaultValue: DateTime.UtcNow);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Plans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerMonth",
                table: "Plans",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TrialDays",
                table: "Plans",
                type: "int",
                nullable: false,
                defaultValue: 14);

            // Add new columns to Companies table
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Companies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Companies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionExpiresAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionStartedAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionStatus",
                table: "Companies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Trial");

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndsAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Companies",
                type: "datetime2",
                nullable: false,
                defaultValue: DateTime.UtcNow);

            // Update existing Plans with proper values
            migrationBuilder.Sql(@"
                UPDATE Plans 
                SET 
                    Description = CASE 
                        WHEN Name = 'Basic' THEN 'Perfect for small teams getting started'
                        WHEN Name = 'Pro' THEN 'For growing businesses with advanced needs'
                        ELSE 'Standard plan'
                    END,
                    PricePerMonth = CASE 
                        WHEN Name = 'Basic' THEN 29.99
                        WHEN Name = 'Pro' THEN 99.99
                        ELSE 0
                    END,
                    TrialDays = 14,
                    CreatedAt = GETUTCDATE()
                WHERE Description IS NULL;
            ");

            // Update existing Companies with proper values
            migrationBuilder.Sql(@"
                UPDATE Companies 
                SET 
                    SubscriptionStatus = 'Trial',
                    TrialEndsAt = DATEADD(DAY, 14, CreatedAt),
                    UpdatedAt = GETUTCDATE()
                WHERE SubscriptionStatus = '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "PricePerMonth",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "TrialDays",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "SubscriptionExpiresAt",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "SubscriptionStartedAt",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "SubscriptionStatus",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Companies");
        }
    }
}
