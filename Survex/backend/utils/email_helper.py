import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

def send_email(to_email, subject, body_html, body_text=None):
    """Send email using SMTP"""
    if not Config.SMTP_USER:
        print("Email not configured, skipping...")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = Config.SMTP_USER
        msg['To'] = to_email
        
        if body_text:
            part1 = MIMEText(body_text, 'plain')
            msg.attach(part1)
        
        part2 = MIMEText(body_html, 'html')
        msg.attach(part2)
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Email send failed: {str(e)}")
        return False

def send_challenge_notification(user_email, user_name, challenge_title):
    """Send notification for new challenge"""
    subject = f"New Challenge Available: {challenge_title}"
    body_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #2E7D32;">New Challenge Alert! 🌿</h2>
            <p>Hi {user_name},</p>
            <p>A new sustainability challenge is now available: <strong>{challenge_title}</strong></p>
            <p>Log in to Windsurf to participate and earn points!</p>
            <p style="color: #666;">Together, let's make our campus greener! 🌍</p>
        </body>
    </html>
    """
    return send_email(user_email, subject, body_html)

def send_verification_result(user_email, user_name, challenge_title, approved, comment=None):
    """Send notification for submission verification"""
    status = "Approved ✅" if approved else "Needs Revision ❌"
    subject = f"Challenge Submission {status}: {challenge_title}"
    
    body_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #2E7D32;">Submission Update 🌿</h2>
            <p>Hi {user_name},</p>
            <p>Your submission for <strong>{challenge_title}</strong> has been <strong>{status}</strong></p>
            {f'<p><strong>Faculty Comment:</strong> {comment}</p>' if comment else ''}
            <p>{'Keep up the great work!' if approved else 'Please review the feedback and try again.'}</p>
        </body>
    </html>
    """
    return send_email(user_email, subject, body_html)
