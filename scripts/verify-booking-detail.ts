
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { SupabaseBookingRepository } from '../src/lib/infrastructure/booking/SupabaseBookingRepository';
import { Database } from '../src/types/database.types';

// Bypass Next.js server-only checks
// @ts-ignore
global.window = undefined;

async function main() {
    console.log('--- Starting Booking Detail Verification ---');

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

        // Ensure teacher_info
        let tCode = `T${Date.now()}`;
        console.log(`Manually creating teacher_info with code ${tCode}...`);
        const { error: tiErr } = await supabase.from('teacher_info').upsert({
            id: teacherId,
            title: 'Sensei',
            bio: 'Test Bio',
            teacher_code: tCode
        });
        if (tiErr) throw tiErr;

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

        // Ensure student_info
        const { error: insErr } = await supabase.from('student_info').upsert({
            id: studentId,
            teacher_code: tCode
        });
        if (insErr) throw insErr;

        // 3. Create Course with location and description
        console.log('Creating Test Course...');
        const { data: course, error: cError } = await supabase.from('courses').insert({
            teacher_id: teacherId,
            title: 'Detail Verif Course',
            description: 'This is a description',
            course_type: 'Private',
            location: 'Taipei - Room 101',
            price: 2000,
            duration_minutes: 60,
            is_active: true
        }).select().single();

        if (cError || !course) throw new Error(`Course creation failed: ${cError?.message}`);

        // 4. Create Booking
        const bookingRepo = new SupabaseBookingRepository(supabase as any);
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        const dateStr = tmr.toISOString().split('T')[0];

        const booking = await bookingRepo.createBooking({
            teacherId: teacherId,
            studentId: studentId,
            courseId: course.id,
            bookingDate: dateStr,
            startTime: "10:00",
            endTime: "11:00",
            notes: "Please be on time",
            price: 2000
        });

        console.log(`Booking created: ${booking.id}`);

        // 5. Verify getBookingById
        console.log('Fetching booking by ID...');
        const fetchedBooking = await bookingRepo.getBookingById(booking.id);

        if (!fetchedBooking) throw new Error('Booking not found');

        console.log('Fetched Booking Details:');
        console.log(`- Course Title: ${fetchedBooking.courseTitle}`);
        console.log(`- Course Description: ${fetchedBooking.courseDescription}`);
        console.log(`- Teacher Title: ${fetchedBooking.teacherTitle}`);
        console.log(`- Location: ${fetchedBooking.location}`);
        console.log(`- Teacher Notes: ${fetchedBooking.teacherNotes}`);

        if (fetchedBooking.courseDescription !== 'This is a description') throw new Error('Description mismatch');
        if (fetchedBooking.teacherTitle !== 'Sensei') throw new Error('Teacher title mismatch');
        if (fetchedBooking.location !== 'Taipei - Room 101') throw new Error('Location mismatch');
        if (fetchedBooking.teacherNotes !== 'Please be on time') throw new Error('Notes mismatch');

        console.log('✅ VERIFICATION PASSED: All details fetched correctly.');

        // Cleanup
        await supabase.auth.admin.deleteUser(teacherId);
        await supabase.auth.admin.deleteUser(studentId);
        console.log('Cleanup done.');

    } catch (err: any) {
        console.error('❌ VERIFICATION FAILED:', err);
        process.exit(1);
    }
}

main();
