using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CarDeal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalPublishing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalPlatforms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalPlatforms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    PlatformId = table.Column<int>(type: "int", nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApiSecret = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccessToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfigJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformConnections_ExternalPlatforms_PlatformId",
                        column: x => x.PlatformId,
                        principalTable: "ExternalPlatforms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformConnections_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CarPublications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CarId = table.Column<int>(type: "int", nullable: false),
                    PlatformConnectionId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ExternalListingId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExternalUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UnpublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarPublications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CarPublications_Cars_CarId",
                        column: x => x.CarId,
                        principalTable: "Cars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CarPublications_PlatformConnections_PlatformConnectionId",
                        column: x => x.PlatformConnectionId,
                        principalTable: "PlatformConnections",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "ExternalPlatforms",
                columns: new[] { "Id", "Description", "IconUrl", "IsActive", "Name", "Slug" },
                values: new object[,]
                {
                    { 1, "List on Facebook Marketplace", null, true, "Facebook Marketplace", "facebook" },
                    { 2, "Post to Craigslist auto section", null, true, "Craigslist", "craigslist" },
                    { 3, "List on Cars.com", null, true, "Cars.com", "carscom" },
                    { 4, "List on AutoTrader", null, true, "AutoTrader", "autotrader" },
                    { 5, "List on CarGurus", null, true, "CarGurus", "cargurus" },
                    { 6, "List on OfferUp", null, true, "OfferUp", "offerup" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CarPublications_CarId",
                table: "CarPublications",
                column: "CarId");

            migrationBuilder.CreateIndex(
                name: "IX_CarPublications_PlatformConnectionId",
                table: "CarPublications",
                column: "PlatformConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalPlatforms_Slug",
                table: "ExternalPlatforms",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformConnections_PlatformId",
                table: "PlatformConnections",
                column: "PlatformId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformConnections_TenantId",
                table: "PlatformConnections",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CarPublications");

            migrationBuilder.DropTable(
                name: "PlatformConnections");

            migrationBuilder.DropTable(
                name: "ExternalPlatforms");
        }
    }
}
