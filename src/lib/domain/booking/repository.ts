export * from "./entity";
import { Booking } from "./entity";


export interface BookingRepository {
  getBookings(teacherId: string, startDate: string, endDate: string): Promise<Booking[]>;
  getAllBookings(startDate: string, endDate: string): Promise<Booking[]>;
  createBooking(booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">): Promise<Booking>;
  getUnpaidBookingsCount(studentId: string): Promise<number>;
}
