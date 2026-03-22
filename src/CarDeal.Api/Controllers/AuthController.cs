using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<User> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Phone = request.Phone
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, "User");
        return Ok(await GenerateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { error = "Invalid email or password" });

        return Ok(await GenerateAuthResponse(user));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        // Simple refresh: validate the refresh token is a valid user ID
        // In production, use a proper refresh token store
        var principal = GetPrincipalFromExpiredToken(request.RefreshToken);
        if (principal == null)
            return Unauthorized(new { error = "Invalid refresh token" });

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = userId != null ? await _userManager.FindByIdAsync(userId) : null;
        if (user == null)
            return Unauthorized(new { error = "Invalid refresh token" });

        return Ok(await GenerateAuthResponse(user));
    }

    [HttpGet("external/{provider}")]
    public IActionResult ExternalLogin(string provider, [FromQuery] string? returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Auth", new { provider, returnUrl });
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, provider);
    }

    [HttpGet("external/{provider}/callback")]
    public async Task<IActionResult> ExternalLoginCallback(string provider, string? returnUrl = null)
    {
        var info = await HttpContext.AuthenticateAsync(provider);
        if (info?.Principal == null)
            return Redirect($"{GetClientUrl(returnUrl)}/login?error=external_login_failed");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var name = info.Principal.FindFirstValue(ClaimTypes.Name) ?? email ?? "User";

        if (string.IsNullOrEmpty(email))
            return Redirect($"{GetClientUrl(returnUrl)}/login?error=email_not_provided");

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new User
            {
                UserName = email,
                Email = email,
                FullName = name,
                EmailConfirmed = true
            };
            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
                return Redirect($"{GetClientUrl(returnUrl)}/login?error=registration_failed");
            await _userManager.AddToRoleAsync(user, "User");
        }

        var authResponse = await GenerateAuthResponse(user);
        var clientUrl = GetClientUrl(returnUrl);
        return Redirect($"{clientUrl}/login?token={authResponse.Token}&refreshToken={authResponse.RefreshToken}&user={Uri.EscapeDataString(System.Text.Json.JsonSerializer.Serialize(authResponse.User))}");
    }

    private string GetClientUrl(string? returnUrl)
    {
        return _configuration.GetSection("Cors:Origins").Get<string[]>()?.FirstOrDefault()
            ?? returnUrl ?? "http://localhost:5173";
    }

    private async Task<AuthResponse> GenerateAuthResponse(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FullName),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddMinutes(
            int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60"));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: creds
        );

        var refreshToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: new[] { new Claim(ClaimTypes.NameIdentifier, user.Id) },
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        var role = roles.Contains("SuperAdmin") ? "SuperAdmin"
                 : roles.Contains("Admin") ? "Admin" 
                 : "User";

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            new JwtSecurityTokenHandler().WriteToken(refreshToken),
            expiration,
            new UserDto(user.Id, user.Email!, user.FullName, user.Phone, user.ProfilePictureUrl, role, user.TenantId)
        );
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        try
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = false,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!))
            };
            var principal = new JwtSecurityTokenHandler().ValidateToken(token, tokenValidationParameters, out _);
            return principal;
        }
        catch { return null; }
    }
}
