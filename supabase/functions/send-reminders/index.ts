// Setup type definitions for built-in Supabase runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from "npm:nodemailer@6.9.10";

const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
});

Deno.serve(async (req) => {
    if (!SMTP_USER || !SMTP_PASSWORD) {
        console.error('Missing SMTP credentials');
        return new Response('Internal Server Error: Missing SMTP Check Secrets', { status: 500 });
    }

    try {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select(`
        id,
        start_time,
        end_time,
        student_id,
        teacher_id,
        course:courses(title),
        teacher:teacher_info!inner(
          id,
          enable_email_reminders,
          reminder_minutes
        )
      `)
            .eq('status_id', 2) // Confirmed
            .not('paid_at', 'is', null) // Must be paid
            .eq('reminder_sent', false)
            .gt('start_time', now.toISOString())
            .lt('start_time', next24h.toISOString());

        if (bookingError) throw bookingError;
        if (!bookings || bookings.length === 0) {
            return new Response(JSON.stringify({ message: 'No reminders to send' }), { headers: { 'Content-Type': 'application/json' } });
        }

        let sentCount = 0;

        for (const booking of bookings) {
            const teacherSettings = booking.teacher;
            // @ts-ignore
            if (!teacherSettings?.enable_email_reminders) continue;

            const startTimeDate = new Date(booking.start_time);
            const reminderMinutes = teacherSettings.reminder_minutes || 30;
            const reminderTime = new Date(startTimeDate.getTime() - reminderMinutes * 60 * 1000);

            // Check if it's time to send
            if (now >= reminderTime) {
                // Fetch Emails
                const { data: studentUser } = await supabase.from('user_info').select('email, name').eq('id', booking.student_id).single();
                const { data: teacherUser } = await supabase.from('user_info').select('email, name').eq('id', booking.teacher_id).single();

                if (studentUser?.email && teacherUser?.email) {

                    try {
                        // Send via Nodemailer (Gmail)
                        await transporter.sendMail({
                            from: `"TimeCarve System" <${SMTP_USER}>`,
                            to: `${studentUser.email}, ${teacherUser.email}`,
                            subject: `[課程提醒] ${booking.course?.title || '課程'} 即將開始`,
                            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2>課程提醒</h2>
                  <p>您好，</p>
                  <p>這是一封自動提醒信，您的課程 <strong>${booking.course?.title}</strong> 即將在 <strong>${teacherSettings.reminder_minutes} 分鐘</strong>後開始。</p>
                  <p><strong>時間：</strong> ${new Date(booking.start_time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
                  <hr />
                  <p style="font-size: 12px; color: #666;">TimeCarve 刻時家教平台</p>
                </div>
              `
                        });

                        // Update DB
                        await supabase.from('bookings').update({
                            reminder_sent: true,
                            reminder_sent_at: new Date().toISOString()
                        }).eq('id', booking.id);

                        sentCount++;

                    } catch (mailError) {
                        console.error(`Failed to send email for booking ${booking.id}`, mailError);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ message: `Processed ${bookings.length} candidates, sent ${sentCount} reminders` }),
            { headers: { "Content-Type": "application/json" } },
        );

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
