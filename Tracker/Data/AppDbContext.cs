using Microsoft.EntityFrameworkCore;

namespace Tracker.Data;
public class AppDbContext: DbContext
{
    public  AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    
    public DbSet<TaskItem> Tasks { get; set; }
}