using System.ComponentModel.DataAnnotations;

namespace CarDeal.Api.DTOs;

public record SendMessageRequest(
    [Required] string ReceiverId,
    int? CarId,
    [Required] string Subject,
    [Required] string Body
);

public record MessageResponse(
    int Id,
    string SenderId,
    string SenderName,
    string ReceiverId,
    string ReceiverName,
    int? CarId,
    string Subject,
    string Body,
    bool IsRead,
    DateTime CreatedAt
);

public record InboxThreadResponse(
    string OtherUserId,
    string OtherUserName,
    int? CarId,
    string? CarName,
    string LastMessageSubject,
    string LastMessagePreview,
    DateTime LastMessageAt,
    int UnreadCount
);
