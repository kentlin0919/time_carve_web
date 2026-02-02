
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { SupabaseBookingRepository } from '../src/lib/infrastructure/booking/SupabaseBookingRepository';
import { Database } from '../src/types/database.types';

// Bypass Next.js server-only checks
// @ts-ignore
global.window = undefined;

async function main() {
    console.log('--- Starting Booking Flow Verification ---');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        process.exit(1);
    }

    // Create Admin Client
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Create Teacher
        const teacherEmail = `test_teacher_${Date.now()}@test.com`;
        const password = 'password123';

        console.log(`Creating Teacher: ${teacherEmail}`);
        const { data: teacherUser, error: tError } = await supabase.auth.admin.createUser({
            email: teacherEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: 'Test Teacher', role: 'teacher' }
        });

        if (tError || !teacherUser.user) throw new Error(`Teacher creation failed: ${tError?.message}`);
        const teacherId = teacherUser.user.id;

        // Retry loop for teacher_info
        let tInfoExists = false;
        let tCode = `T${Date.now()}`; // Generate dummy code usually

        for (let i = 0; i < 5; i++) {
            const { data } = await supabase.from('teacher_info').select('id, teacher_code').eq('id', teacherId).single();
            if (data) {
                tInfoExists = true;
                if (data.teacher_code) tCode = data.teacher_code;
                console.log(`Teacher code found: ${tCode}`);
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!tInfoExists) {
            console.log(`Manually creating teacher_info with code ${tCode}...`);
            const { error: tiErr } = await supabase.from('teacher_info').upsert({
                id: teacherId,
                title: 'Test Teacher',
                bio: 'Test Bio',
                teacher_code: tCode
            });
            if (tiErr) {
                console.error('Failed to create teacher_info:', tiErr);
                throw tiErr;
            }
        }

        // 2. Create Student
        const studentEmail = `test_student_${Date.now()}@test.com`;
        console.log(`Creating Student: ${studentEmail}`);
        const { data: studentUser, error: sError } = await supabase.auth.admin.createUser({
            email: studentEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: 'Test Student', role: 'student' }
        });

        if (sError || !studentUser.user) throw new Error(`Student creation failed: ${sError?.message}`);
        const studentId = studentUser.user.id;

        // Retry loop for student_info
        let sInfoExists = false;
        for (let i = 0; i < 5; i++) {
            const { data } = await supabase.from('student_info').select('id').eq('id', studentId).single();
            if (data) { sInfoExists = true; break; }
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!sInfoExists) {
            console.log(`Manually creating student_info linked to teacher ${tCode}...`);
            const { error: insErr } = await supabase.from('student_info').upsert({
                id: studentId,
                teacher_code: tCode
            });
            if (insErr) {
                console.error('Failed to upsert student_info:', insErr);
                throw insErr;
            }
        }

        // 3. Create Course
        console.log('Creating Test Course...');
        const { data: course, error: cError } = await supabase.from('courses').insert({
            teacher_id: teacherId,
            title: 'Test Course 101',
            description: 'Verification Course',
            price: 1000,
            duration_minutes: 60,
            is_active: true
        }).select().single();

        if (cError || !course) throw new Error(`Course creation failed: ${cError?.message}`);
        console.log(`Course created: ${course.id}`);

        // Wait ONE MORE second to be absolutely sure triggers/propagation is done
        await new Promise(r => setTimeout(r, 1000));

        // 4. Create Booking using Repository
        console.log('Creating Booking...');

        // Hack: instantiate repo with this client. 
        const bookingRepo = new SupabaseBookingRepository(supabase as any);

        // Date: Tomorrow
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        const dateStr = tmr.toISOString().split('T')[0]; // YYYY-MM-DD
        const startTime = "09:00";
        const endTime = "10:00";

        const booking = await bookingRepo.createBooking({
            teacherId: teacherId,
            studentId: studentId,
            courseId: course.id,
            bookingDate: dateStr,
            startTime: startTime,
            endTime: endTime,
            notes: "Verification Booking",
            price: 1000
        });

        console.log(`Booking created successfully: ${booking.id}`);
        console.log(`bookingDate: ${booking.bookingDate}`);
        console.log(`startTime: ${booking.startTime}`);
        console.log(`endTime: ${booking.endTime}`);
        console.log(`status: ${booking.status}`);

        // 5. Verification Assertion
        if (booking.startTime !== startTime) {
            throw new Error(`Time Mismatch! Expected ${startTime}, got ${booking.startTime}`);
        }
        if (booking.bookingDate !== dateStr) {
            throw new Error(`Date Mismatch! Expected ${dateStr}, got ${booking.bookingDate}`);
        }

        console.log('✅ VERIFICATION PASSED: Timestamp fix verified.');

        // Cleanup (optional)
        await supabase.auth.admin.deleteUser(teacherId);
        await supabase.auth.admin.deleteUser(studentId);
        console.log('Test users cleanup completed.');

    } catch (err: any) {
        console.error('❌ VERIFICATION FAILED:', err);
        process.exit(1);
    }
}

main();
