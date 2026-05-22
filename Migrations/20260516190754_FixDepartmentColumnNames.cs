using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LedgerFlow.API.Migrations
{
    /// <inheritdoc />
    public partial class FixDepartmentColumnNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Companies_CompanyId",
                table: "Departments");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Departments",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Departments",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Departments",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Departments",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Departments",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "CompanyId",
                table: "Departments",
                newName: "company_id");

            migrationBuilder.RenameIndex(
                name: "IX_Departments_CompanyId",
                table: "Departments",
                newName: "IX_Departments_company_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Companies_company_id",
                table: "Departments",
                column: "company_id",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Companies_company_id",
                table: "Departments");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Departments",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Departments",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Departments",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Departments",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Departments",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "company_id",
                table: "Departments",
                newName: "CompanyId");

            migrationBuilder.RenameIndex(
                name: "IX_Departments_company_id",
                table: "Departments",
                newName: "IX_Departments_CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Companies_CompanyId",
                table: "Departments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
