import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.10";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
});

Deno.serve(async (req) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    if (!SMTP_USER || !SMTP_PASSWORD) {
        console.error('Missing SMTP credentials');
        return new Response(JSON.stringify({ error: 'Missing SMTP credentials' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const payload = await req.json();

        // 檢查是否來自 Webhook (包含 type, table, record)
        let to = payload.to;
        let subject = payload.subject;
        let html = payload.html;

        // 如果是資料庫 Webhook (trigger) 且打進來時的 table 是 notifications
        if (payload.type === 'INSERT' && payload.table === 'notifications' && payload.record) {
            const notification = payload.record;
            
            // 需要去查 user_email
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { data: user } = await supabase
                .from('user_info')
                .select('email, name')
                .eq('id', notification.user_id)
                .single();

            if (!user?.email) {
                return new Response(JSON.stringify({ error: 'User email not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }

            to = user.email;
            subject = `[系統通知] ${notification.title}`;
            html = `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2>${notification.title}</h2>
                  <p>您好${user.name ? ' ' + user.name : ''}，</p>
                  <p>${notification.content}</p>
                  <hr />
                  <p style="font-size: 12px; color: #666;">TimeCarve 刻時家教平台</p>
                </div>
            `;
        } else {
            // 一般的 REST API 呼叫 (給其他功能用)
            if (!to || !subject || !html) {
                return new Response(JSON.stringify({ error: 'Missing required fields (to, subject, html)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // 寄送 Email (Gmail)
        const info = await transporter.sendMail({
            from: `"TimeCarve System" <${SMTP_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: html
        });

        console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);

        return new Response(
            JSON.stringify({ message: 'Email sent successfully', messageId: info.messageId }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        );

    } catch (error: any) {
        console.error('Email send error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
});
