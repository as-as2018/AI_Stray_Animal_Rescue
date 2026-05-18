import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import get_settings

logger = logging.getLogger(__name__)

TIER_EMOJI = {
    "CRITICAL": "🔴 CRITICAL",
    "HIGH": "🟠 HIGH",
    "MEDIUM": "🟡 MEDIUM",
    "LOW": "🟢 LOW",
    "MONITOR": "⚪ MONITOR",
}


async def send_ngo_alert(
    ngo_email: str,
    ngo_name: str,
    report_id: str,
    species: str,
    injury_label: str,
    urgency_score: float,
    urgency_tier: str,
    address: str,
    image_url: str,
    dashboard_url: str,
):
    settings = get_settings()
    if not settings.sendgrid_api_key:
        logger.warning(f"[Email] SendGrid key not configured — skipping alert for {report_id}")
        return
    tier_display = TIER_EMOJI.get(urgency_tier, urgency_tier)

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">🐾 Stray Animal Rescue Alert</h1>
        <p style="color: #a0a0c0; margin: 4px 0 0;">New case requires your attention</p>
      </div>
      <div style="padding: 24px;">
        <div style="background: {'#fee2e2' if urgency_tier == 'CRITICAL' else '#fef3c7' if urgency_tier == 'HIGH' else '#f0fdf4'};
                    border-left: 4px solid {'#ef4444' if urgency_tier == 'CRITICAL' else '#f59e0b' if urgency_tier == 'HIGH' else '#22c55e'};
                    padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
          <strong>Priority: {tier_display}</strong> &nbsp;|&nbsp; Urgency Score: <strong>{urgency_score}/100</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #666;">Report ID</td><td style="padding: 8px; font-weight: bold;">{report_id}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding: 8px; color: #666;">Species</td><td style="padding: 8px; font-weight: bold;">{species.capitalize()}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Condition</td><td style="padding: 8px; font-weight: bold;">{injury_label}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding: 8px; color: #666;">Location</td><td style="padding: 8px;">{address or 'See map in dashboard'}</td></tr>
        </table>
        {'<img src="' + image_url + '" style="width:100%;border-radius:8px;margin:16px 0;" alt="Animal photo"/>' if image_url else ''}
        <div style="text-align: center; margin-top: 20px;">
          <a href="{dashboard_url}" style="background: #4f46e5; color: #fff; padding: 12px 32px; border-radius: 8px;
             text-decoration: none; font-weight: bold; display: inline-block;">View Full Report →</a>
        </div>
      </div>
      <div style="background: #f0f0f0; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        Stray Animal Rescue Platform &nbsp;|&nbsp; Automated Alert System
      </div>
    </div>
    """

    message = Mail(
        from_email=settings.from_email,
        to_emails=ngo_email,
        subject=f"[{tier_display}] New Animal Rescue Case — {report_id}",
        html_content=html_content,
    )

    try:
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        sg.send(message)
        logger.info(f"Email alert sent to {ngo_email} for {report_id}")
    except Exception as e:
        logger.error(f"Failed to send email to {ngo_email}: {e}")
