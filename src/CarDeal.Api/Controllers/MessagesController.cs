using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarDeal.Api.DTOs;
using CarDeal.Api.Services;

namespace CarDeal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService) => _messageService = messageService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<InboxThreadResponse>>> GetInbox()
        => Ok(await _messageService.GetInboxAsync(UserId));

    [HttpGet("thread")]
    public async Task<ActionResult<List<MessageResponse>>> GetThread(
        [FromQuery] string otherUserId, [FromQuery] int? carId)
        => Ok(await _messageService.GetThreadAsync(UserId, otherUserId, carId));

    [HttpPost]
    public async Task<ActionResult<MessageResponse>> Send(SendMessageRequest request)
        => Ok(await _messageService.SendAsync(UserId, request));

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _messageService.MarkAsReadAsync(id, UserId);
        return result ? NoContent() : NotFound();
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
        => Ok(await _messageService.GetUnreadCountAsync(UserId));
}
