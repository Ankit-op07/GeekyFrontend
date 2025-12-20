import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

// Email templates
const EMAIL_TEMPLATES = {
    new_offer: {
        subject: '🎉 Special Offer for You - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">🎉 Special Offer Just for You!</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
                        <a href="https://geekyfrontend.com" style="color: white; text-decoration: none; font-weight: bold; font-size: 18px;">
                            🚀 Check It Out Now
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    new_content: {
        subject: '📚 New Content Added - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">📚 Fresh Content Just Added!</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                        <p style="color: #333; margin: 0; font-weight: 500;">
                            Your access is still active - dive in and explore!
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://geekyfrontend.com" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Access Your Kit
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    announcement: {
        subject: '📢 Important Announcement - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">📢 Announcement</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    custom: {
        subject: '{{SUBJECT}}',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    {{MESSAGE}}
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
};

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            templateType,
            customSubject,
            message,
            filterByKit,
            sendToAll,
            testEmail,
        } = body;

        // Validate required fields
        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Get template
        const template = EMAIL_TEMPLATES[templateType as keyof typeof EMAIL_TEMPLATES] || EMAIL_TEMPLATES.custom;

        // Prepare email content
        let subject = template.subject.replace('{{SUBJECT}}', customSubject || 'Update from Geeky Frontend');
        let htmlContent = template.html.replace('{{MESSAGE}}', message);

        // If test email, send only to test address
        if (testEmail) {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html: htmlContent,
            });

            return NextResponse.json({
                success: true,
                message: `Test email sent to ${testEmail}`,
                sentCount: 1,
            });
        }

        // Connect to database
        await connectToDatabase();

        // Build query for recipients
        const query: Record<string, any> = { status: 'email_sent' }; // Only delivered orders

        if (!sendToAll && filterByKit) {
            query.planName = { $regex: filterByKit, $options: 'i' };
        }

        // Get unique emails
        const orders = await Order.find(query).select('email planName').lean();
        const uniqueEmails = [...new Set(orders.map((o: any) => o.email))];

        if (uniqueEmails.length === 0) {
            return NextResponse.json(
                { error: 'No recipients found matching the criteria' },
                { status: 400 }
            );
        }

        // Send emails
        const transporter = createTransporter();
        let successCount = 0;
        let failedEmails: string[] = [];

        for (const email of uniqueEmails) {
            try {
                await transporter.sendMail({
                    from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                    to: email as string,
                    subject,
                    html: htmlContent,
                });
                successCount++;
                // Small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error: any) {
                console.error(`Failed to send to ${email}:`, error.message);
                failedEmails.push(email as string);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Emails sent successfully`,
            sentCount: successCount,
            failedCount: failedEmails.length,
            failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
            totalRecipients: uniqueEmails.length,
        });
    } catch (error: any) {
        console.error('Error sending bulk emails:', error);
        return NextResponse.json(
            { error: 'Failed to send emails', details: error.message },
            { status: 500 }
        );
    }
}

// GET: Return available templates and recipient counts
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const filterByKit = searchParams.get('filterByKit');

        // Get count by kit type
        const kitCounts = await Order.aggregate([
            { $match: { status: 'email_sent' } },
            {
                $group: {
                    _id: '$planName',
                    count: { $sum: 1 },
                    emails: { $addToSet: '$email' },
                },
            },
            {
                $project: {
                    planName: '$_id',
                    orderCount: '$count',
                    uniqueEmails: { $size: '$emails' },
                    _id: 0,
                },
            },
        ]);

        // Total unique emails
        const allEmails = await Order.distinct('email', { status: 'email_sent' });

        // If filtering by kit, get specific count
        let filteredCount = 0;
        if (filterByKit) {
            const filtered = await Order.distinct('email', {
                status: 'email_sent',
                planName: { $regex: filterByKit, $options: 'i' },
            });
            filteredCount = filtered.length;
        }

        return NextResponse.json({
            templates: Object.keys(EMAIL_TEMPLATES).map((key) => ({
                id: key,
                name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                subject: EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES].subject,
            })),
            kitCounts,
            totalUniqueEmails: allEmails.length,
            filteredCount,
        });
    } catch (error: any) {
        console.error('Error fetching email data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error.message },
            { status: 500 }
        );
    }
}
