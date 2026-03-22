using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarDeal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCarIsShared : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsShared",
                table: "Cars",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsShared",
                table: "Cars");
        }
    }
}
