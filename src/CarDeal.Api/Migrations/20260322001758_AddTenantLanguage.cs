using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarDeal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantLanguage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "TenantBrandings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Language",
                table: "TenantBrandings");
        }
    }
}
