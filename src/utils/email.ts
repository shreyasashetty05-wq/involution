import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Base Layout for the email
const getEmailLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InVolution</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0; }
        .logo { font-size: 28px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px; text-decoration: none; }
        .content { padding: 40px; }
        .title { font-size: 24px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 24px; }
        .greeting { font-size: 16px; color: #334155; margin-bottom: 24px; }
        .text { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .feature-list { list-style-type: none; padding: 0; margin: 0 0 32px 0; }
        .feature-item { font-size: 15px; color: #334155; padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; }
        .feature-item::before { content: "•"; color: #2563EB; font-weight: bold; display: inline-block; width: 1.5em; font-size: 18px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #2563EB; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background-color: #F8FAFC; padding: 32px 40px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        .footer-tagline { font-weight: 600; margin-top: 8px; color: #475569; }
        .role-badge { display: inline-block; background-color: #eff6ff; color: #2563EB; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://involution.in" class="logo">InVolution</a>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p style="margin: 0;">Thank you for choosing InVolution.</p>
            <p class="footer-tagline">Empowering Startups. Connecting Investors. Building Innovation.</p>
        </div>
    </div>
</body>
</html>
`;

const getStartupEmail = (name: string) => {
    const content = `
        <div class="role-badge">Startup Account</div>
        <h1 class="title">Welcome to InVolution – Your Startup is Ready 🚀</h1>
        <p class="greeting">Welcome to InVolution, <strong>${name}</strong>.</p>
        <p class="text">Your KYC has been successfully verified. You now have full access to all Startup features on our platform.</p>
        
        <p style="font-weight: 600; color: #0F172A; margin-bottom: 16px;">You can now:</p>
        <ul class="feature-list">
            <li class="feature-item">Publish your startup</li>
            <li class="feature-item">Receive AI Startup Analysis</li>
            <li class="feature-item">Get Investment Readiness Score</li>
            <li class="feature-item">Showcase your startup publicly</li>
            <li class="feature-item">Connect with verified investors</li>
            <li class="feature-item">Create Deal Rooms</li>
            <li class="feature-item">Schedule meetings</li>
            <li class="feature-item">Negotiate investments</li>
            <li class="feature-item">Generate Smart Agreements</li>
            <li class="feature-item">Receive AI-powered recommendations</li>
        </ul>

        <p class="text" style="font-weight: 500; font-style: italic;">We wish you great success in your fundraising journey.</p>
        
        <div class="btn-container">
            <a href="https://involution.in/startups/dashboard" class="btn">Go to Dashboard</a>
        </div>
    `;
    return getEmailLayout(content);
};

const getInvestorEmail = (name: string) => {
    const content = `
        <div class="role-badge">Investor Account</div>
        <h1 class="title">Welcome to InVolution – Investor Verification Complete 🎉</h1>
        <p class="greeting">Congratulations, <strong>${name}</strong>.</p>
        <p class="text">Your Investor verification has been approved. You now have exclusive access to our premium investment network.</p>
        
        <p style="font-weight: 600; color: #0F172A; margin-bottom: 16px;">You now have access to:</p>
        <ul class="feature-list">
            <li class="feature-item">Discover verified startups</li>
            <li class="feature-item">Explore incubation ideas</li>
            <li class="feature-item">AI-powered startup search</li>
            <li class="feature-item">Compare startups</li>
            <li class="feature-item">Save favourite startups</li>
            <li class="feature-item">Manage your investment portfolio</li>
            <li class="feature-item">Start Deal Rooms</li>
            <li class="feature-item">Schedule meetings</li>
            <li class="feature-item">Negotiate investment terms</li>
            <li class="feature-item">Generate Smart Agreements</li>
        </ul>

        <p class="text" style="font-weight: 500;">Thank you for joining the InVolution investment ecosystem.</p>
        
        <div class="btn-container">
            <a href="https://involution.in/investors/dashboard" class="btn">Go to Dashboard</a>
        </div>
    `;
    return getEmailLayout(content);
};

const getIncubationEmail = (name: string) => {
    const content = `
        <div class="role-badge">Incubation Program</div>
        <h1 class="title">Welcome to InVolution – Your Innovation Journey Begins 💡</h1>
        <p class="greeting">Congratulations, <strong>${name}</strong>.</p>
        <p class="text">Your KYC has been approved. You are now officially part of our Incubation program.</p>
        
        <p style="font-weight: 600; color: #0F172A; margin-bottom: 16px;">You can now:</p>
        <ul class="feature-list">
            <li class="feature-item">Publish your idea</li>
            <li class="feature-item">Receive AI Incubation Analysis</li>
            <li class="feature-item">Get Innovation Readiness Score</li>
            <li class="feature-item">Showcase your project</li>
            <li class="feature-item">Connect with investors</li>
            <li class="feature-item">Receive mentorship opportunities</li>
            <li class="feature-item">Create Deal Rooms</li>
            <li class="feature-item">Schedule meetings</li>
            <li class="feature-item">Negotiate funding</li>
            <li class="feature-item">Grow into a registered startup</li>
        </ul>

        <p class="text" style="font-weight: 500; font-style: italic;">We look forward to supporting your entrepreneurial journey.</p>
        
        <div class="btn-container">
            <a href="https://involution.in/incube/dashboard" class="btn">Go to Dashboard</a>
        </div>
    `;
    return getEmailLayout(content);
};

export const sendRoleBasedWelcomeEmail = async (email: string, name: string, roleType: string) => {
    if (!resend) {
        console.warn("RESEND_API_KEY is not configured. Skipping welcome email to:", email);
        return false;
    }

    try {
        let subject = "Welcome to InVolution";
        let html = "";
        
        const type = roleType.toLowerCase();

        if (type.includes("startup") || type === "startup founder") {
            subject = "Welcome to InVolution – Your Startup is Ready 🚀";
            html = getStartupEmail(name);
        } else if (type.includes("investor") || type.includes("vc") || type.includes("angel")) {
            subject = "Welcome to InVolution – Investor Verification Complete 🎉";
            html = getInvestorEmail(name);
        } else if (type.includes("incube") || type.includes("incubation") || type.includes("student")) {
            subject = "Welcome to InVolution – Your Innovation Journey Begins 💡";
            html = getIncubationEmail(name);
        } else {
            // Default fallback if role is not strictly matched, assuming startup.
            subject = "Welcome to InVolution – Your Startup is Ready 🚀";
            html = getStartupEmail(name);
        }

        const data = await resend.emails.send({
            from: 'InVolution <welcome@involution.in>', // Use an authorized domain. Users might need to change this if they haven't verified involution.in on Resend.
            to: [email],
            subject: subject,
            html: html,
        });

        console.log("Welcome email sent successfully to:", email, data);
        return true;
    } catch (error) {
        console.error("Failed to send welcome email to:", email, error);
        return false;
    }
};
