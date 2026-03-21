using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.Models;
using System.Security.Claims;

namespace CarDeal.Api.Middleware;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireTierAttribute : Attribute, IAsyncActionFilter
{
    private readonly TenantTier _minimumTier;

    public RequireTierAttribute(TenantTier minimumTier)
    {
        _minimumTier = minimumTier;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // SuperAdmins bypass tier checks
        if (context.HttpContext.User.IsInRole("SuperAdmin"))
        {
            await next();
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<User>>();
        var user = await userManager.FindByIdAsync(userId);

        if (user?.TenantId == null)
        {
            context.Result = new ObjectResult(new { error = "tier_required", requiredTier = _minimumTier.ToString(), message = "You must be part of a dealership to access this feature." })
            { StatusCode = 403 };
            return;
        }

        var tenant = await db.Tenants.FindAsync(user.TenantId);
        if (tenant == null || tenant.Tier < _minimumTier)
        {
            context.Result = new ObjectResult(new {
                error = "tier_required",
                requiredTier = _minimumTier.ToString(),
                currentTier = tenant?.Tier.ToString() ?? "None",
                message = $"This feature requires the {_minimumTier} tier or higher. Your current tier is {tenant?.Tier.ToString() ?? "None"}."
            }) { StatusCode = 403 };
            return;
        }

        await next();
    }
}
