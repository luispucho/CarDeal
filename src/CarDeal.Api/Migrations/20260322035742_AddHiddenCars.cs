using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarDeal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHiddenCars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HiddenCars",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    CarId = table.Column<int>(type: "int", nullable: false),
                    HiddenAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HiddenCars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HiddenCars_Cars_CarId",
                        column: x => x.CarId,
                        principalTable: "Cars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HiddenCars_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HiddenCars_CarId",
                table: "HiddenCars",
                column: "CarId");

            migrationBuilder.CreateIndex(
                name: "IX_HiddenCars_TenantId_CarId",
                table: "HiddenCars",
                columns: new[] { "TenantId", "CarId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HiddenCars");
        }
    }
}
