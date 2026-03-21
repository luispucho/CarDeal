using Microsoft.EntityFrameworkCore;
using CarDeal.Api.Data;
using CarDeal.Api.DTOs;
using CarDeal.Api.Models;

namespace CarDeal.Api.Services;

public interface IMessageService
{
    Task<MessageResponse> SendAsync(string senderId, SendMessageRequest request);
    Task<List<InboxThreadResponse>> GetInboxAsync(string userId);
    Task<List<MessageResponse>> GetThreadAsync(string userId, string otherUserId, int? carId);
    Task<bool> MarkAsReadAsync(int messageId, string userId);
    Task<int> GetUnreadCountAsync(string userId);
}

public class MessageService : IMessageService
{
    private readonly AppDbContext _db;

    public MessageService(AppDbContext db) => _db = db;

    public async Task<MessageResponse> SendAsync(string senderId, SendMessageRequest request)
    {
        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            CarId = request.CarId,
            Subject = request.Subject,
            Body = request.Body
        };
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(senderId);
        var receiver = await _db.Users.FindAsync(request.ReceiverId);
        return new MessageResponse(message.Id, message.SenderId, sender?.FullName ?? "", message.ReceiverId, receiver?.FullName ?? "", message.CarId, message.Subject, message.Body, message.IsRead, message.CreatedAt);
    }

    public async Task<List<InboxThreadResponse>> GetInboxAsync(string userId)
    {
        var messages = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Car)
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var threads = messages
            .GroupBy(m => new
            {
                OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId,
                m.CarId
            })
            .Select(g =>
            {
                var last = g.First();
                var otherUser = last.SenderId == userId ? last.Receiver : last.Sender;
                return new InboxThreadResponse(
                    g.Key.OtherUserId,
                    otherUser.FullName,
                    g.Key.CarId,
                    last.Car != null ? $"{last.Car.Year} {last.Car.Make} {last.Car.Model}" : null,
                    last.Subject,
                    last.Body.Length > 100 ? last.Body[..100] + "..." : last.Body,
                    last.CreatedAt,
                    g.Count(m => !m.IsRead && m.ReceiverId == userId)
                );
            })
            .OrderByDescending(t => t.LastMessageAt)
            .ToList();

        return threads;
    }

    public async Task<List<MessageResponse>> GetThreadAsync(string userId, string otherUserId, int? carId)
    {
        var messages = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m =>
                ((m.SenderId == userId && m.ReceiverId == otherUserId) ||
                 (m.SenderId == otherUserId && m.ReceiverId == userId)) &&
                m.CarId == carId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Mark unread messages as read
        var unread = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
        foreach (var m in unread) m.IsRead = true;
        if (unread.Any()) await _db.SaveChangesAsync();

        return messages.Select(m => new MessageResponse(m.Id, m.SenderId, m.Sender.FullName, m.ReceiverId, m.Receiver.FullName, m.CarId, m.Subject, m.Body, m.IsRead, m.CreatedAt)).ToList();
    }

    public async Task<bool> MarkAsReadAsync(int messageId, string userId)
    {
        var message = await _db.Messages.FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == userId);
        if (message == null) return false;
        message.IsRead = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _db.Messages.CountAsync(m => m.ReceiverId == userId && !m.IsRead);
    }
}
