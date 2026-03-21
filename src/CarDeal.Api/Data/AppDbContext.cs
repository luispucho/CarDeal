using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Models;

namespace CarDeal.Api.Data;

public class AppDbContext : IdentityDbContext<User>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<CarImage> CarImages => Set<CarImage>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Consignment> Consignments => Set<Consignment>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<CarFinancials> CarFinancials => Set<CarFinancials>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<CrmNote> CrmNotes => Set<CrmNote>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Car>(e =>
        {
            e.HasOne(c => c.User).WithMany(u => u.Cars).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => c.UserId);
            e.HasIndex(c => c.Status);
            e.Property(c => c.AskingPrice).HasColumnType("decimal(18,2)");
        });

        builder.Entity<CarImage>(e =>
        {
            e.HasOne(ci => ci.Car).WithMany(c => c.Images).HasForeignKey(ci => ci.CarId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Offer>(e =>
        {
            e.HasOne(o => o.Car).WithMany(c => c.Offers).HasForeignKey(o => o.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(o => o.AdminUser).WithMany().HasForeignKey(o => o.AdminUserId).OnDelete(DeleteBehavior.NoAction);
            e.Property(o => o.Amount).HasColumnType("decimal(18,2)");
        });

        builder.Entity<Consignment>(e =>
        {
            e.HasOne(cn => cn.Car).WithOne(c => c.Consignment).HasForeignKey<Consignment>(cn => cn.CarId).OnDelete(DeleteBehavior.Cascade);
            e.Property(cn => cn.AgreedPrice).HasColumnType("decimal(18,2)");
            e.Property(cn => cn.CommissionPercent).HasColumnType("decimal(5,2)");
        });

        builder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.Receiver).WithMany(u => u.ReceivedMessages).HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.Car).WithMany().HasForeignKey(m => m.CarId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(m => m.ReceiverId);
            e.HasIndex(m => m.SenderId);
        });

        builder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
        });

        builder.Entity<User>(e =>
        {
            e.HasOne(u => u.Tenant).WithMany(t => t.Users).HasForeignKey(u => u.TenantId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(u => u.TenantId);
        });

        builder.Entity<Car>(e2 =>
        {
            e2.HasOne(c => c.Tenant).WithMany(t => t.Cars).HasForeignKey(c => c.TenantId).OnDelete(DeleteBehavior.SetNull);
            e2.HasIndex(c => c.TenantId);
        });

        builder.Entity<SiteSetting>(e =>
        {
            e.HasKey(s => s.Key);
            e.HasData(new SiteSetting { Key = "Language", Value = "en" });
        });

        builder.Entity<CarFinancials>(e =>
        {
            e.HasOne(cf => cf.Car).WithOne(c => c.Financials).HasForeignKey<CarFinancials>(cf => cf.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(cf => cf.CarId).IsUnique();
            e.Property(cf => cf.PurchasePrice).HasColumnType("decimal(18,2)");
            e.Property(cf => cf.SalePrice).HasColumnType("decimal(18,2)");
        });

        builder.Entity<Expense>(e =>
        {
            e.HasOne(ex => ex.Car).WithMany(c => c.Expenses).HasForeignKey(ex => ex.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(ex => ex.CarId);
            e.Property(ex => ex.Amount).HasColumnType("decimal(18,2)");
        });

        builder.Entity<CrmNote>(e =>
        {
            e.HasOne(n => n.Car).WithMany(c => c.CrmNotes).HasForeignKey(n => n.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(n => n.Author).WithMany().HasForeignKey(n => n.AuthorUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(n => n.CarId);
        });
    }
}
