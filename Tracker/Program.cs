using System.Net.NetworkInformation;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Server.HttpSys;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Tracker.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=tasks.db"));

//проверка токена
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    //как именно проверяем токен
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, //нашим ли сервером выпущен
            ValidateAudience = true, //для нашего приложения
            ValidateLifetime = true,  //не просрочен ли токен
            ValidateIssuerSigningKey = true, //проверка на правильность токена
            ValidIssuer = builder.Configuration["Jwt:Issuer"], //кто должен быть указан, как издатель
            ValidAudience = builder.Configuration["Jwt:Audience"], //кто должен быть указан как получатель
            //секретный ключ для проверки из json
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["jwt"];
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization(); //добавили проверку


// Add services to the container.
builder.Services.AddControllersWithViews();
//API

//builder.Services.AddControllers();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Добавь ЭТУ строку - она отключает валидацию навигационных свойств
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});


// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TaskTracker API", Version = "v1" });
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskTracker API v1");
        c.RoutePrefix = "swagger"; // или "" для открытия по корню
    });
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthentication(); //кто ты
app.UseAuthorization(); //что тебе можно

app.MapStaticAssets();

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.UseDefaultFiles();
app.UseStaticFiles();

//создаем первоначальных пользователей (admin)
// если бд пустая они всегда будут, если кого-то добавили то очищаем 
using (var scope = app.Services.CreateScope()) //область для доступа к сервисам
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>(); //получаем доступ к бд

    if (!context.Users.Any())  //если в Users пусто
    {
        context.Users.Add(new User
        {
            Username = "admin",
            Email = "user@gmail.com",
            Password = BCrypt.Net.BCrypt.HashPassword("admin123"),  //хэшируем пароль для хранения в бд
            Role = "admin",
        });
        
        context.SaveChanges();
    }
} 

app.Run();