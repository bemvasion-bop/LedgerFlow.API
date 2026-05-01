using MailKit.Net.Smtp;
using MimeKit;


namespace LedgerFlow.API.Services
{

    public class EmailService
    {

            public void SendEmail(String toEmail, string subject, string body)
            {
                var message = new MimeMessage();

                message.From.Add(new MailboxAddress("SpendSync", "latikon43@gmail.com"));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                message.Body = new TextPart("plain")
                {
                    Text = body
                };

                using (var client = new SmtpClient())
                {
                    client.Connect("smtp.gmail.com", 587, false);

                    client.Authenticate("latikon43@gmail.com", "nenc dukd tbtq tlwa");

                    client.Send(message);
                    client.Disconnect(true);                    
                }
            }
    }

}