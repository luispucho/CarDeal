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
    public DbSet<ExternalPlatform> ExternalPlatforms => Set<ExternalPlatform>();
    public DbSet<PlatformConnection> PlatformConnections => Set<PlatformConnection>();
    public DbSet<CarPublication> CarPublications => Set<CarPublication>();
    public DbSet<TenantBranding> TenantBrandings => Set<TenantBranding>();
    public DbSet<Investor> Investors => Set<Investor>();
    public DbSet<InvestorContribution> InvestorContributions => Set<InvestorContribution>();
    public DbSet<CarFunding> CarFundings => Set<CarFunding>();

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
            e.HasOne(t => t.Branding).WithOne(b => b.Tenant)
                .HasForeignKey<TenantBranding>(b => b.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TenantBranding>(e =>
        {
            e.HasIndex(b => b.TenantId).IsUnique();
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

        builder.Entity<ExternalPlatform>(e =>
        {
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasData(
                new ExternalPlatform { Id = 1, Name = "Facebook Marketplace", Slug = "facebook", Description = "List on Facebook Marketplace" },
                new ExternalPlatform { Id = 2, Name = "Craigslist", Slug = "craigslist", Description = "Post to Craigslist auto section" },
                new ExternalPlatform { Id = 3, Name = "Cars.com", Slug = "carscom", Description = "List on Cars.com" },
                new ExternalPlatform { Id = 4, Name = "AutoTrader", Slug = "autotrader", Description = "List on AutoTrader" },
                new ExternalPlatform { Id = 5, Name = "CarGurus", Slug = "cargurus", Description = "List on CarGurus" },
                new ExternalPlatform { Id = 6, Name = "OfferUp", Slug = "offerup", Description = "List on OfferUp" }
            );
        });

        builder.Entity<PlatformConnection>(e =>
        {
            e.HasOne(pc => pc.Tenant).WithMany().HasForeignKey(pc => pc.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pc => pc.Platform).WithMany().HasForeignKey(pc => pc.PlatformId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(pc => pc.TenantId);
        });

        builder.Entity<CarPublication>(e =>
        {
            e.HasOne(cp => cp.Car).WithMany(c => c.Publications).HasForeignKey(cp => cp.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cp => cp.Connection).WithMany().HasForeignKey(cp => cp.PlatformConnectionId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(cp => cp.CarId);
            e.HasIndex(cp => cp.PlatformConnectionId);
        });

        builder.Entity<Investor>(e =>
        {
            e.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => i.TenantId);
        });

        builder.Entity<InvestorContribution>(e =>
        {
            e.HasOne(ic => ic.Investor).WithMany(i => i.Contributions).HasForeignKey(ic => ic.InvestorId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ic => ic.Car).WithMany().HasForeignKey(ic => ic.CarId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(ic => ic.InvestorId);
            e.Property(ic => ic.Amount).HasColumnType("decimal(18,2)");
        });

        builder.Entity<CarFunding>(e =>
        {
            e.HasOne(cf => cf.Car).WithMany(c => c.Fundings).HasForeignKey(cf => cf.CarId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cf => cf.Investor).WithMany(i => i.CarFundings).HasForeignKey(cf => cf.InvestorId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(cf => cf.CarId);
            e.HasIndex(cf => cf.InvestorId);
            e.Property(cf => cf.Amount).HasColumnType("decimal(18,2)");
        });
    }
}
