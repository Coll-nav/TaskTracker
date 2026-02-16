using Microsoft.EntityFrameworkCore;

namespace Tracker.Data;
public class AppDbContext: DbContext
{
    public  AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<SubTask > SubTasks { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<TaskStatusHistory> TaskStatusHistories { get; set; }
    public DbSet<Tag> Tags { get; set; }
}