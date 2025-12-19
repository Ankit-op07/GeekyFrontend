import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Google Drive setup
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Folder IDs
const folderIds: { [key: string]: string } = {
    'JS Interview Preparation Kit': process.env.JS_KIT_FOLDER_ID!,
    'Complete Frontend Interview Preparation Kit': process.env.COMPLETE_KIT_FOLDER_ID!,
    'Frontend Interview Experiences Kit': process.env.EXPERIENCES_KIT_FOLDER_ID!,
    'Reactjs Interview Preparation Kit': process.env.REACT_KIT_FOLDER_ID!,
    'Node.js Interview Preparation Kit': process.env.NODEJS_KIT_FOLDER_ID!,
};

async function grantFolderAccess(folderId: string, userEmail: string) {
    try {
        // Public link access
        try {
            await drive.permissions.create({
                fileId: folderId,
                requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
            });
        } catch (e) {
            // Permission might already exist
        }

        // Specific user access
        try {
            await drive.permissions.create({
                fileId: folderId,
                requestBody: { role: 'reader', type: 'user', emailAddress: userEmail },
                sendNotificationEmail: false,
            });
        } catch (e) {
            // User might already have access
        }

        const file = await drive.files.get({
            fileId: folderId,
            fields: 'name,webViewLink',
        });

        return { success: true, folderLink: file.data.webViewLink, folderName: file.data.name };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email, phone, course } = await request.json();

        if (!email || !course) {
            return NextResponse.json({ error: 'Email and course are required' }, { status: 400 });
        }

        const folderId = folderIds[course];
        if (!folderId) {
            return NextResponse.json({ error: 'Invalid course selected' }, { status: 400 });
        }

        // Grant access
        const accessResult = await grantFolderAccess(folderId, email);

        if (!accessResult.success || !accessResult.folderLink) {
            return NextResponse.json({ error: 'Failed to grant access: ' + accessResult.error }, { status: 500 });
        }

        // Send beautiful email (no payment details)
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Access Granted!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Welcome to Geeky Frontend</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: white;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello! 👋
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! You now have access to the <strong>${course}</strong>.
              </p>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center;">
                    <p style="color: white; font-size: 14px; margin: 0 0 15px 0;">Click below to access your materials:</p>
                    <a href="${accessResult.folderLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; color: #667eea; background-color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      📚 Open Course Materials
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                  <strong>💡 Quick Tips:</strong>
                </p>
                <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li>The folder is shared with: <strong>${email}</strong></li>
                  <li>You can also find it in Google Drive → "Shared with me"</li>
                  <li>Bookmark the folder for easy access</li>
                </ul>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 13px; margin: 0;">
                  Direct link: <a href="${accessResult.folderLink}" style="color: #667eea;">${accessResult.folderLink}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px; background-color: #f8f9fa; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Questions? Email us at support@geekyfrontend.com<br>
                © 2025 Geeky Frontend
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 Your Access to ${course} is Ready!`,
            html: emailHtml,
            text: `You now have access to ${course}. Open here: ${accessResult.folderLink}`,
        });

        return NextResponse.json({
            success: true,
            message: `Access granted and email sent to ${email}`
        });

    } catch (error: any) {
        console.error('Admin grant access error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
