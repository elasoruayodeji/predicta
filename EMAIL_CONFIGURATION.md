# Email Configuration Guide

This guide explains how to configure email delivery for PREDICTA's authentication system.

---

## Overview

PREDICTA uses Supabase for email delivery. There are two modes:

1. **Development Mode** - Uses Supabase's built-in email service (InBucket)
   - Emails are logged but not actually sent
   - Perfect for testing and development
   - No configuration required

2. **Production Mode** - Uses custom SMTP provider
   - Real emails sent from your domain
   - Professional sender address (e.g., support@predicta.ng)
   - Requires SMTP configuration

---

## Development Mode (Default)

### How It Works

In development, Supabase uses InBucket to capture emails. Emails are not actually sent but are logged and can be viewed in the Supabase Dashboard.

### Viewing Development Emails

**Location:** Supabase Dashboard → Authentication → Users

**Steps:**
1. Sign up with a new account
2. Go to Authentication → Users
3. Find your user
4. Click on the user
5. Check "Email confirmation" status
6. To see the email content:
   - Go to Supabase Dashboard → Logs
   - Filter by "auth" logs
   - Find the email sending log
   - View the email content in the log

**Alternative:** Use Supabase's email preview feature (if available in your plan)

### When to Use Development Mode

- ✅ Local development
- ✅ Testing authentication flows
- ✅ Verifying email templates
- ✅ Debugging email issues
- ✅ Before production deployment

### Limitations

- ❌ Emails not actually sent
- ❌ Cannot test real email delivery
- ❌ Cannot test custom SMTP
- ❌ Not suitable for production

---

## Production Mode (Custom SMTP)

### Why Use Custom SMTP?

- ✅ Send real emails to users
- ✅ Professional sender address (support@predicta.ng)
- ✅ Custom branding in emails
- ✅ Better deliverability
- ✅ Email tracking and analytics
- ✅ Required for production use

### Recommended SMTP Providers

#### 1. SendGrid (Recommended for Startups)

**Pricing:**
- Free tier: 100 emails/day forever
- Paid: $0.01/email after free tier
- Volume discounts available

**Pros:**
- Reliable delivery
- Excellent documentation
- Good free tier
- Easy setup
- Analytics and tracking

**Setup:**
1. Sign up at https://sendgrid.com
2. Verify your domain (predicta.ng)
3. Create API key
4. Get SMTP credentials:
   ```
   Host: smtp.sendgrid.net
   Port: 587 (TLS) or 465 (SSL)
   Username: apikey
   Password: <your-api-key>
   ```
5. Configure in Supabase (see below)

#### 2. Amazon SES (Recommended for Scale)

**Pricing:**
- Free tier: 62,000 emails/month (if sent from EC2)
- Paid: $0.10/1,000 emails
- Cheapest at scale

**Pros:**
- Very cheap at scale
- High deliverability
- AWS integration
- Reliable infrastructure

**Setup:**
1. Sign up for AWS
2. Go to SES console
3. Verify your domain (predicta.ng)
4. Create SMTP credentials
5. Get SMTP settings:
   ```
   Host: email-smtp.<region>.amazonaws.com
   Port: 587 (TLS) or 465 (SSL)
   Username: <your-smtp-username>
   Password: <your-smtp-password>
   ```
6. Configure in Supabase

#### 3. Mailgun (Good for Developers)

**Pricing:**
- Free tier: 5,000 emails/month for 3 months
- Paid: $0.80/1,000 emails

**Pros:**
- Developer-friendly
- Good API
- Email validation
- Tracking and analytics

**Setup:**
1. Sign up at https://mailgun.com
2. Verify your domain
3. Get SMTP credentials:
   ```
   Host: smtp.mailgun.org
   Port: 587 (TLS) or 465 (SSL)
   Username: <your-smtp-username>
   Password: <your-smtp-password>
   ```
4. Configure in Supabase

#### 4. Postmark (Best Deliverability)

**Pricing:**
- Free tier: 100 emails/month
- Paid: $1.25/1,000 emails

**Pros:**
- Best deliverability
- Fast delivery
- Great support
- Transactional email focused

**Setup:**
1. Sign up at https://postmarkapp.com
2. Verify your domain
3. Get SMTP credentials:
   ```
   Host: smtp.postmarkapp.com
   Port: 587 (TLS) or 465 (SSL)
   Username: <your-smtp-username>
   Password: <your-smtp-password>
   ```
4. Configure in Supabase

---

## Configuring Custom SMTP in Supabase

### Step-by-Step Guide

**Location:** Supabase Dashboard → Project Settings → SMTP

**Steps:**

1. **Enable Custom SMTP**
   - Toggle "Use custom SMTP" to ON
   - Form will appear

2. **Enter SMTP Credentials**
   ```
   Host: smtp.your-provider.com
   Port: 587
   Username: your-smtp-username
   Password: your-smtp-password
   ```

3. **Configure Sender**
   ```
   Sender email: support@predicta.ng
   Sender name: PREDICTA
   ```

4. **Test Connection**
   - Click "Test connection" button
   - Should show success message
   - If fails, check credentials and try again

5. **Save Configuration**
   - Click "Save" button
   - Configuration is now active

### Verification

**Test Email Delivery:**

1. Sign up with a new account
2. Check your email inbox
3. Should receive verification email from support@predicta.ng
4. Click verification link
5. Email should be verified

**Check Supabase Logs:**

1. Go to Supabase Dashboard → Logs
2. Filter by "auth" logs
3. Look for email sending events
4. Verify emails are being sent successfully

---

## Email Templates

### Default Templates

Supabase provides default email templates for:
- Confirm signup (email verification)
- Reset password
- Magic link (if using)
- Invite user (if using)

### Customizing Templates

**Location:** Supabase Dashboard → Authentication → Email Templates

**Steps:**

1. Select template to customize
2. Edit HTML and plain text versions
3. Use template variables:
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .ConfirmationURL }}` - Verification link
   - `{{ .Email }}` - User's email
   - `{{ .Token }}` - Verification token
   - `{{ .TokenHash }}` - Token hash

**Example: Custom Verification Email**

```html
<h1>Welcome to PREDICTA!</h1>
<p>Hi {{ .Email }},</p>
<p>Thank you for signing up for PREDICTA, the Nigerian Stock Market Intelligence Platform.</p>
<p>Click the button below to verify your email address:</p>
<a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't create this account, you can safely ignore this email.</p>
<p>Best regards,<br>The PREDICTA Team</p>
```

**Example: Custom Password Reset Email**

```html
<h1>Reset Your PREDICTA Password</h1>
<p>Hi {{ .Email }},</p>
<p>We received a request to reset your password for your PREDICTA account.</p>
<p>Click the button below to reset your password:</p>
<a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The PREDICTA Team</p>
```

### Template Best Practices

- ✅ Use your brand colors and logo
- ✅ Keep emails simple and clear
- ✅ Include both HTML and plain text versions
- ✅ Test emails on multiple clients (Gmail, Outlook, etc.)
- ✅ Include unsubscribe link (if required)
- ✅ Use professional sender name

---

## Domain Verification

### Why Verify Your Domain?

- ✅ Improves email deliverability
- ✅ Prevents emails going to spam
- ✅ Builds trust with email providers
- ✅ Required by most SMTP providers
- ✅ Professional appearance

### How to Verify Your Domain

**Step 1: Add DNS Records**

Your SMTP provider will give you DNS records to add. Common records:

**SPF Record (Sender Policy Framework):**
```
Type: TXT
Name: predicta.ng
Value: v=spf1 include:sendgrid.net ~all
```

**DKIM Record (DomainKeys Identified Mail):**
```
Type: TXT
Name: s1._domainkey.predicta.ng
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...
```

**DMARC Record (Domain-based Message Authentication):**
```
Type: TXT
Name: _dmarc.predicta.ng
Value: v=DMARC1; p=none; rua=mailto:dmarc@predicta.ng
```

**Step 2: Wait for DNS Propagation**

- DNS changes can take up to 48 hours
- Usually completes within 1-2 hours
- Use DNS lookup tools to verify

**Step 3: Verify in SMTP Provider**

- Go to your SMTP provider's dashboard
- Check domain verification status
- Should show "Verified" once DNS propagates

---

## Email Deliverability Best Practices

### 1. Use a Professional Sender Address

✅ **Good:**
- support@predicta.ng
- noreply@predicta.ng
- hello@predicta.ng

❌ **Bad:**
- predicta@gmail.com
- predicta123@yahoo.com
- Using personal email

### 2. Verify Your Domain

- Add SPF, DKIM, and DMARC records
- Prevents emails going to spam
- Builds trust with email providers

### 3. Use Consistent Sender Information

- Always send from the same address
- Use consistent sender name
- Maintain sender reputation

### 4. Monitor Email Metrics

- Track delivery rates
- Monitor bounce rates
- Watch spam complaints
- Use SMTP provider's analytics

### 5. Follow Email Best Practices

- Don't send too many emails too quickly
- Respect unsubscribe requests
- Use clear subject lines
- Include plain text version
- Test before sending

---

## Troubleshooting Email Issues

### Issue: Emails not received

**Solutions:**
1. Check spam/junk folder
2. Verify SMTP credentials are correct
3. Check domain verification status
4. Verify DNS records are correct
5. Check SMTP provider logs
6. Try resending email

### Issue: Emails going to spam

**Solutions:**
1. Verify your domain (SPF, DKIM, DMARC)
2. Use professional sender address
3. Check email content for spam triggers
4. Build sender reputation over time
5. Ask users to whitelist your domain

### Issue: SMTP connection fails

**Solutions:**
1. Verify SMTP credentials
2. Check host and port are correct
3. Verify firewall allows SMTP traffic
4. Try different port (587 vs 465)
5. Check SMTP provider status

### Issue: Email links don't work

**Solutions:**
1. Check redirect URLs in Supabase
2. Verify site URL is correct
3. Check link hasn't expired
4. Verify email template variables
5. Test link in different browsers

---

## Cost Comparison

### Email Volume Estimates

**Assumptions:**
- 1,000 new users/month
- Each user receives:
  - 1 verification email
  - 0.5 password reset emails (average)
  - 0.1 other emails (notifications)
- Total: ~1,600 emails/month

### Provider Costs (1,600 emails/month)

| Provider | Free Tier | Monthly Cost | Annual Cost |
|----------|-----------|--------------|-------------|
| SendGrid | 3,000 emails | $0 (within free tier) | $0 |
| Mailgun | 0 (after 3 months) | $1.28 | $15.36 |
| Amazon SES | 0 | $0.16 | $1.92 |
| Postmark | 100 emails | $1.88 | $22.50 |

**Recommendation:** Start with SendGrid (free tier), upgrade to Amazon SES at scale.

---

## Summary

### Development Setup
- ✅ No configuration required
- ✅ Emails logged in Supabase
- ✅ Perfect for testing
- ✅ Ready to use immediately

### Production Setup
- ⏳ Choose SMTP provider
- ⏳ Configure custom SMTP in Supabase
- ⏳ Verify your domain
- ⏳ Customize email templates
- ⏳ Test email delivery
- ⏳ Monitor deliverability

### Time Required
- Development: 0 minutes (already configured)
- Production: 30-60 minutes (depending on provider)

### Cost
- Development: $0 (Supabase free tier)
- Production: $0-$25/month (depending on provider and volume)

---

## Next Steps

1. **For Development:**
   - Start testing authentication flows
   - Use Supabase logs to view emails
   - Verify all auth features work

2. **For Production:**
   - Choose SMTP provider (SendGrid recommended)
   - Sign up and verify domain
   - Configure custom SMTP in Supabase
   - Customize email templates
   - Test email delivery
   - Monitor deliverability

---

## Support

- **Supabase SMTP Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Amazon SES Docs:** https://docs.aws.amazon.com/ses/
- **Email Deliverability:** https://sendgrid.com/resources/email-deliverability-guide
